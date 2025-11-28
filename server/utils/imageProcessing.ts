import sharp from 'sharp';

/**
 * Supported image formats for crop analysis
 */
export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'] as const;

/**
 * Maximum image size in bytes (10MB)
 */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

/**
 * Target size for compressed images (2MB for better API performance)
 */
export const TARGET_COMPRESSED_SIZE = 2 * 1024 * 1024;

/**
 * Result of image validation
 */
export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  size: number;
  format: string;
}

/**
 * Validates an image file for format and size
 * 
 * @param file - Image buffer to validate
 * @param mimeType - MIME type of the image
 * @returns Validation result with error details if invalid
 */
export function validateImage(file: Buffer, mimeType: string): ImageValidationResult {
  const size = file.length;
  
  // Check if format is supported
  if (!SUPPORTED_FORMATS.includes(mimeType as any)) {
    return {
      valid: false,
      error: `Invalid image format. Accepted formats: ${SUPPORTED_FORMATS.join(', ')}`,
      size,
      format: mimeType,
    };
  }
  
  // Check if size is within limits (after compression, so we allow larger initially)
  // We'll compress if needed, so this is just a sanity check for extremely large files
  const maxInitialSize = MAX_IMAGE_SIZE * 5; // 50MB max before compression
  if (size > maxInitialSize) {
    return {
      valid: false,
      error: `Image too large. Maximum size: ${maxInitialSize / (1024 * 1024)}MB`,
      size,
      format: mimeType,
    };
  }
  
  return {
    valid: true,
    size,
    format: mimeType,
  };
}

/**
 * Compresses an image to be under the maximum size while maintaining quality
 * 
 * @param file - Image buffer to compress
 * @param maxSizeBytes - Maximum size in bytes (defaults to MAX_IMAGE_SIZE)
 * @returns Compressed image buffer
 */
export async function compressImage(
  file: Buffer,
  maxSizeBytes: number = MAX_IMAGE_SIZE
): Promise<Buffer> {
  try {
    // If already under size, return as-is
    if (file.length <= maxSizeBytes) {
      return file;
    }
    
    // Get image metadata
    const metadata = await sharp(file).metadata();
    
    // Start with quality 85 and reduce if needed
    let quality = 85;
    let compressed = file;
    
    // Try up to 5 compression attempts with decreasing quality
    for (let attempt = 0; attempt < 5; attempt++) {
      compressed = await sharp(file)
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      
      if (compressed.length <= maxSizeBytes) {
        break;
      }
      
      // Reduce quality for next attempt
      quality -= 15;
      
      // If quality gets too low, also reduce dimensions
      if (quality < 50 && metadata.width && metadata.height) {
        const scale = 0.8;
        compressed = await sharp(file)
          .resize(
            Math.floor(metadata.width * scale),
            Math.floor(metadata.height * scale),
            { fit: 'inside' }
          )
          .jpeg({ quality: 70, mozjpeg: true })
          .toBuffer();
        
        if (compressed.length <= maxSizeBytes) {
          break;
        }
      }
    }
    
    // Final check
    if (compressed.length > maxSizeBytes) {
      throw new Error(
        `Unable to compress image below ${maxSizeBytes / (1024 * 1024)}MB. ` +
        `Final size: ${compressed.length / (1024 * 1024)}MB`
      );
    }
    
    return compressed;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Image compression failed: ${error.message}`);
    }
    throw new Error('Image compression failed: Unknown error');
  }
}

/**
 * Converts an image buffer to base64 string
 * 
 * @param file - Image buffer to convert
 * @returns Base64 encoded string
 */
export function convertToBase64(file: Buffer): string {
  return file.toString('base64');
}

/**
 * Processes an image for Gemini API submission
 * Validates, compresses if needed, and converts to base64
 * 
 * @param file - Image buffer to process
 * @param mimeType - MIME type of the image
 * @returns Object with base64 string and final mime type
 */
export async function processImageForAPI(
  file: Buffer,
  mimeType: string
): Promise<{ base64: string; mimeType: string }> {
  // Validate
  const validation = validateImage(file, mimeType);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  // Always compress to target size for better API performance
  let processedFile = file;
  if (file.length > TARGET_COMPRESSED_SIZE) {
    processedFile = await compressImage(file, TARGET_COMPRESSED_SIZE);
  }
  
  // Convert to base64
  const base64 = convertToBase64(processedFile);
  
  // After compression, format is always JPEG
  const finalMimeType = processedFile === file ? mimeType : 'image/jpeg';
  
  return {
    base64,
    mimeType: finalMimeType,
  };
}
