import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiService, GeminiAPIError } from './gemini.service';

describe('GeminiService', () => {
  let service: GeminiService;

  beforeEach(() => {
    // Use a test API key
    service = new GeminiService('test-api-key');
  });

  describe('constructor', () => {
    it('should throw error if API key is not provided', () => {
      // Clear environment variable
      const originalKey = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      expect(() => new GeminiService()).toThrow('GEMINI_API_KEY is not configured');

      // Restore environment variable
      process.env.GEMINI_API_KEY = originalKey;
    });

    it('should use environment variable if no API key provided', () => {
      const originalKey = process.env.GEMINI_API_KEY;
      process.env.GEMINI_API_KEY = 'env-api-key';

      expect(() => new GeminiService()).not.toThrow();

      process.env.GEMINI_API_KEY = originalKey;
    });
  });

  describe('buildPrompt', () => {
    it('should build Bengali prompt when language is bn', () => {
      const prompt = (service as any).buildPrompt('bn');
      expect(prompt).toContain('ধান ফসলের ছবি বিশ্লেষণ করুন');
      expect(prompt).toContain('JSON ফরম্যাটে উত্তর দিন');
      expect(prompt).toContain('disease');
      expect(prompt).toContain('confidence');
      expect(prompt).toContain('remedy');
    });

    it('should build English prompt when language is en', () => {
      const prompt = (service as any).buildPrompt('en');
      expect(prompt).toContain('Analyze this paddy crop image');
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('disease');
      expect(prompt).toContain('confidence');
      expect(prompt).toContain('remedy');
    });
  });

  describe('parseResponse', () => {
    it('should parse valid JSON response with disease', () => {
      const validResponse = JSON.stringify({
        disease: 'Blast Disease',
        confidence: 85,
        remedy: 'Apply fungicide and improve drainage'
      });

      const result = (service as any).parseResponse(validResponse);

      expect(result.diseases).toHaveLength(1);
      expect(result.diseases[0].name).toBe('Blast Disease');
      expect(result.diseases[0].confidence).toBe(85);
      expect(result.overallHealth).toBe('major_issues'); // High confidence = major_issues
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0]).toBe('Apply fungicide and improve drainage');
    });

    it('should parse healthy crop response', () => {
      const healthyResponse = JSON.stringify({
        disease: 'Healthy',
        confidence: 95,
        remedy: 'Continue good practices'
      });

      const result = (service as any).parseResponse(healthyResponse);

      expect(result.diseases).toHaveLength(0);
      expect(result.overallHealth).toBe('healthy');
      expect(result.recommendations).toHaveLength(1);
    });

    it('should parse JSON wrapped in markdown code blocks', () => {
      const wrappedResponse = '```json\n' + JSON.stringify({
        disease: 'সুস্থ ধান',
        confidence: 90,
        remedy: 'ভালো চর্চা চালিয়ে যান'
      }) + '\n```';

      const result = (service as any).parseResponse(wrappedResponse);

      expect(result.diseases).toHaveLength(0);
      expect(result.overallHealth).toBe('healthy');
    });

    it('should throw GeminiAPIError for invalid JSON', () => {
      const invalidResponse = 'This is not JSON';

      expect(() => (service as any).parseResponse(invalidResponse))
        .toThrow(GeminiAPIError);
    });

    it('should handle missing confidence gracefully', () => {
      const incompleteResponse = JSON.stringify({
        disease: 'Brown Spot',
        remedy: 'Apply treatment'
      });

      const result = (service as any).parseResponse(incompleteResponse);
      
      expect(result.diseases).toHaveLength(1);
      expect(result.diseases[0].confidence).toBe(50); // Default value
    });

    it('should handle missing remedy gracefully', () => {
      const noRemedyResponse = JSON.stringify({
        disease: 'Blast',
        confidence: 75
      });

      const result = (service as any).parseResponse(noRemedyResponse);
      
      expect(result.diseases).toHaveLength(1);
      expect(result.recommendations).toHaveLength(0);
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await (service as any).retryWithBackoff(mockFn, 3);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce('success');

      const result = await (service as any).retryWithBackoff(mockFn, 3);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw GeminiAPIError after max retries', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));

      await expect((service as any).retryWithBackoff(mockFn, 2))
        .rejects.toThrow(GeminiAPIError);

      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});
