import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import {
  validateImage,
  compressImage,
  convertToBase64,
  processImageForAPI,
  SUPPORTED_FORMATS,
  MAX_IMAGE_SIZE,
} from './imageProcessing';

describe('Image Processing Utilities', () => {
  // Helper to create a test image buffer
  async function createTestImage(
    width: number,
    height: number,
    format: 'jpeg' | 'png' | 'webp' = 'jpeg'
  ): Promise<Buffer> {
    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    })
      .toFormat(format)
      .toBuffer();
  }

  describe('validateImage', () => {
    it('should accept valid JPEG image', async () => {
      const buffer = await createTestImage(100, 100, 'jpeg');
      const result = validateImage(buffer, 'image/jpeg');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.format).toBe('image/jpeg');
    });

    it('should accept valid PNG image', async () => {
      const buffer = await createTestImage(100, 100, 'png');
      const result = validateImage(buffer, 'image/png');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.format).toBe('image/png');
    });

    it('should accept valid WebP image', async () => {
      const buffer = await createTestImage(100, 100, 'webp');
      const result = validateImage(buffer, 'image/webp');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.format).toBe('image/webp');
    });

    it('should reject unsupported format', async () => {
      const buffer = await createTestImage(100, 100);
      const result = validateImage(buffer, 'image/gif');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid image format');
      expect(result.error).toContain(SUPPORTED_FORMATS.join(', '));
    });

    it('should reject extremely large files', async () => {
      // Create a buffer larger than 50MB
      const largeBuffer = Buffer.alloc(51 * 1024 * 1024);
      const result = validateImage(largeBuffer, 'image/jpeg');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Image too large');
    });

    it('should include size in validation result', async () => {
      const buffer = await createTestImage(100, 100);
      const result = validateImage(buffer, 'image/jpeg');

      expect(result.size).toBe(buffer.length);
      expect(result.size).toBeGreaterThan(0);
    });
  });

  describe('compressImage', () => {
    it('should return original buffer if already under size limit', async () => {
      const smallBuffer = await createTestImage(100, 100);
      const compressed = await compressImage(smallBuffer, MAX_IMAGE_SIZE);

      expect(compressed.length).toBeLessThanOrEqual(MAX_IMAGE_SIZE);
    });

    it('should compress large image to under size limit', async () => {
      // Create a large image (high resolution) with high quality to ensure it's over 10MB
      const largeBuffer = await sharp({
        create: {
          width: 5000,
          height: 5000,
          channels: 4,
          background: { r: 255, g: 128, b: 64, alpha: 1 },
        },
      })
        .png({ compressionLevel: 0 }) // No compression to make it large
        .toBuffer();
      
      // Ensure it's actually over the limit
      expect(largeBuffer.length).toBeGreaterThan(MAX_IMAGE_SIZE);

      const compressed = await compressImage(largeBuffer, MAX_IMAGE_SIZE);

      expect(compressed.length).toBeLessThanOrEqual(MAX_IMAGE_SIZE);
      expect(compressed.length).toBeLessThan(largeBuffer.length);
    });

    it('should maintain image dimensions when possible', async () => {
      const buffer = await createTestImage(2000, 2000);
      const compressed = await compressImage(buffer, MAX_IMAGE_SIZE);

      const metadata = await sharp(compressed).metadata();
      expect(metadata.width).toBeDefined();
      expect(metadata.height).toBeDefined();
    });

    it('should throw error if unable to compress below limit', async () => {
      // Create a very large image and set an impossibly small limit
      const largeBuffer = await createTestImage(4000, 4000);
      const tinyLimit = 1000; // 1KB - impossible for this image

      await expect(compressImage(largeBuffer, tinyLimit)).rejects.toThrow(
        'Unable to compress image'
      );
    });
  });

  describe('convertToBase64', () => {
    it('should convert buffer to base64 string', async () => {
      const buffer = await createTestImage(50, 50);
      const base64 = convertToBase64(buffer);

      expect(base64).toBeDefined();
      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(0);
    });

    it('should produce valid base64 that can be decoded', async () => {
      const buffer = await createTestImage(50, 50);
      const base64 = convertToBase64(buffer);

      // Decode and verify it matches original
      const decoded = Buffer.from(base64, 'base64');
      expect(decoded.equals(buffer)).toBe(true);
    });

    it('should handle empty buffer', () => {
      const emptyBuffer = Buffer.alloc(0);
      const base64 = convertToBase64(emptyBuffer);

      expect(base64).toBe('');
    });
  });

  describe('processImageForAPI', () => {
    it('should process valid small image', async () => {
      const buffer = await createTestImage(500, 500, 'jpeg');
      const result = await processImageForAPI(buffer, 'image/jpeg');

      expect(result.base64).toBeDefined();
      expect(result.mimeType).toBe('image/jpeg');
      expect(typeof result.base64).toBe('string');
    });

    it('should compress and process large image', async () => {
      // Create a large image with random noise (compresses poorly)
      const width = 4000;
      const height = 4000;
      const channels = 3;
      const randomData = Buffer.alloc(width * height * channels);
      
      // Fill with random data to make it compress poorly
      for (let i = 0; i < randomData.length; i++) {
        randomData[i] = Math.floor(Math.random() * 256);
      }
      
      const largeBuffer = await sharp(randomData, {
        raw: { width, height, channels },
      })
        .png({ compressionLevel: 0 })
        .toBuffer();
      
      expect(largeBuffer.length).toBeGreaterThan(MAX_IMAGE_SIZE);

      const result = await processImageForAPI(largeBuffer, 'image/png');

      expect(result.base64).toBeDefined();
      expect(result.mimeType).toBe('image/jpeg'); // Compressed to JPEG
      
      // Verify the decoded size is under limit
      const decoded = Buffer.from(result.base64, 'base64');
      expect(decoded.length).toBeLessThanOrEqual(MAX_IMAGE_SIZE);
    });

    it('should reject invalid format', async () => {
      const buffer = await createTestImage(100, 100);

      await expect(
        processImageForAPI(buffer, 'image/gif')
      ).rejects.toThrow('Invalid image format');
    });

    it('should reject extremely large files', async () => {
      const hugeBuffer = Buffer.alloc(51 * 1024 * 1024);

      await expect(
        processImageForAPI(hugeBuffer, 'image/jpeg')
      ).rejects.toThrow('Image too large');
    });

    it('should preserve format for small images', async () => {
      const pngBuffer = await createTestImage(200, 200, 'png');
      const result = await processImageForAPI(pngBuffer, 'image/png');

      expect(result.mimeType).toBe('image/png');
    });

    it('should change format to JPEG after compression', async () => {
      // Create a large PNG with random noise
      const width = 4000;
      const height = 4000;
      const channels = 3;
      const randomData = Buffer.alloc(width * height * channels);
      
      for (let i = 0; i < randomData.length; i++) {
        randomData[i] = Math.floor(Math.random() * 256);
      }
      
      const largePNG = await sharp(randomData, {
        raw: { width, height, channels },
      })
        .png({ compressionLevel: 0 })
        .toBuffer();
      
      expect(largePNG.length).toBeGreaterThan(MAX_IMAGE_SIZE);
      
      const result = await processImageForAPI(largePNG, 'image/png');

      expect(result.mimeType).toBe('image/jpeg');
    });
  });
});
