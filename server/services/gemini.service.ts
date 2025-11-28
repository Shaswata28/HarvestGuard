import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Request structure for Gemini image analysis
 */
export interface GeminiAnalysisRequest {
  imageBase64: string;
  mimeType: string;
  language: 'bn' | 'en';
}

/**
 * Disease detection result from Gemini
 */
export interface DetectedDisease {
  name: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  affectedArea: string;
}

/**
 * Complete analysis response from Gemini
 */
export interface GeminiAnalysisResponse {
  diseases: DetectedDisease[];
  overallHealth: 'healthy' | 'minor_issues' | 'major_issues';
  recommendations: string[];
  preventiveMeasures: string[];
}

/**
 * Custom error for Gemini API failures
 */
export class GeminiAPIError extends Error {
  constructor(
    message: string,
    public readonly retryable: boolean = false,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = 'GeminiAPIError';
  }
}

/**
 * Service for interacting with Google Gemini API for crop image analysis
 */
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    
    console.log('[GeminiService] Initializing with API key:', key ? `${key.substring(0, 10)}...` : 'NOT FOUND');
    console.log('[GeminiService] Environment check:', {
      hasProcessEnv: !!process.env,
      geminiKeyExists: !!process.env.GEMINI_API_KEY,
      geminiKeyLength: process.env.GEMINI_API_KEY?.length,
    });
    
    if (!key) {
      throw new Error('GEMINI_API_KEY is not configured. Please add it to your .env file and restart the server.');
    }

    this.genAI = new GoogleGenerativeAI(key);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  /**
   * Analyze a crop image for diseases and health issues
   * @param request - Image data and analysis parameters
   * @returns Structured analysis results
   */
  async analyzeImage(request: GeminiAnalysisRequest): Promise<GeminiAnalysisResponse> {
    try {
      // Build the prompt based on language
      const prompt = this.buildPrompt(request.language);

      // Prepare image data for Gemini
      const imagePart = {
        inlineData: {
          data: request.imageBase64,
          mimeType: request.mimeType,
        },
      };

      // Call Gemini API with retry logic
      const result = await this.retryWithBackoff(
        async () => {
          const response = await this.model.generateContent([prompt, imagePart]);
          return response;
        },
        3
      );

      // Parse and return the response
      const responseText = result.response.text();
      return this.parseResponse(responseText);
    } catch (error: any) {
      if (error instanceof GeminiAPIError) {
        throw error;
      }
      
      throw new GeminiAPIError(
        `Failed to analyze image: ${error.message}`,
        true,
        error
      );
    }
  }

  /**
   * Build the analysis prompt in the specified language
   * @param language - Target language for the response
   * @returns Formatted prompt string
   */
  private buildPrompt(language: string): string {
    if (language === 'bn') {
      return `ধান ফসলের ছবি বিশ্লেষণ করুন। শুধুমাত্র JSON ফরম্যাটে উত্তর দিন (কোন অতিরিক্ত টেক্সট নয়):
{
  "disease": "রোগের নাম (যেমন: ব্লাস্ট, ব্রাউন স্পট) অথবা 'সুস্থ ধান'",
  "confidence": 85,
  "remedy": "সংক্ষিপ্ত চিকিৎসা পরামর্শ (১-২ বাক্য)"
}`;
    }

    return `Analyze this paddy crop image for diseases. Respond ONLY with JSON (no extra text):
{
  "disease": "specific disease name (e.g., Blast, Brown Spot) or 'Healthy'",
  "confidence": 85,
  "remedy": "brief treatment advice (1-2 sentences)"
}`;
  }

  /**
   * Parse Gemini API response into structured format
   * @param rawResponse - Raw text response from Gemini
   * @returns Parsed analysis response
   */
  private parseResponse(rawResponse: string): GeminiAnalysisResponse {
    try {
      // Extract JSON from response
      let jsonText = rawResponse.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '');
      }

      // Remove any leading/trailing text that's not JSON
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonText);

      // Normalize disease name
      const diseaseName = parsed.disease?.trim() || 'Unknown';
      const isHealthy = 
        diseaseName.toLowerCase().includes('সুস্থ') || 
        diseaseName.toLowerCase().includes('healthy') ||
        diseaseName.toLowerCase() === 'no disease' ||
        diseaseName.toLowerCase() === 'none';
      
      // Determine severity based on confidence
      const confidence = parsed.confidence || 50;
      let severity: 'low' | 'medium' | 'high' = 'medium';
      if (confidence >= 80) severity = 'high';
      else if (confidence < 60) severity = 'low';

      return {
        diseases: isHealthy ? [] : [{
          name: diseaseName,
          confidence,
          severity,
          affectedArea: 'leaves'
        }],
        overallHealth: isHealthy ? 'healthy' : (severity === 'high' ? 'major_issues' : 'minor_issues'),
        recommendations: parsed.remedy ? [parsed.remedy.trim()] : [],
        preventiveMeasures: []
      };
    } catch (error: any) {
      console.error('[GeminiService] Parse error:', error);
      console.error('[GeminiService] Raw response:', rawResponse);
      throw new GeminiAPIError(
        `Failed to parse Gemini response: ${error.message}`,
        false,
        error
      );
    }
  }

  /**
   * Retry a function with exponential backoff
   * @param fn - Function to retry
   * @param maxRetries - Maximum number of retry attempts
   * @returns Result of the function
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Calculate backoff delay: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        
        console.log(`Gemini API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new GeminiAPIError(
      `Failed after ${maxRetries + 1} attempts: ${lastError.message}`,
      false,
      lastError
    );
  }
}
