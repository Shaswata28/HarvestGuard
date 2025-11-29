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

      expect(() => new GeminiService()).toThrow('GEMINI_API_KEY is missing in .env');

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

  describe('buildDiseasePrompt', () => {
    it('should build Bengali prompt when language is bn', () => {
      const prompt = (service as any).buildDiseasePrompt('bn');
      expect(prompt).toContain('ফসলের ছবি বিশ্লেষণ করুন');
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('disease');
      expect(prompt).toContain('confidence');
      expect(prompt).toContain('remedy');
    });

    it('should build English prompt when language is en', () => {
      const prompt = (service as any).buildDiseasePrompt('en');
      expect(prompt).toContain('Analyze this crop image');
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('disease');
      expect(prompt).toContain('confidence');
      expect(prompt).toContain('remedy');
    });
  });

  describe('parseDiseaseResponse', () => {
    it('should parse valid JSON response with disease', () => {
      const validResponse = JSON.stringify({
        disease: 'Blast Disease',
        confidence: 85,
        remedy: 'Apply fungicide and improve drainage'
      });

      const result = (service as any).parseDiseaseResponse(validResponse);

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

      const result = (service as any).parseDiseaseResponse(healthyResponse);

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

      const result = (service as any).parseDiseaseResponse(wrappedResponse);

      expect(result.diseases).toHaveLength(0);
      expect(result.overallHealth).toBe('healthy');
    });

    it('should throw GeminiAPIError for invalid JSON', () => {
      const invalidResponse = 'This is not JSON';

      expect(() => (service as any).parseDiseaseResponse(invalidResponse))
        .toThrow(GeminiAPIError);
    });

    it('should handle missing confidence gracefully', () => {
      const incompleteResponse = JSON.stringify({
        disease: 'Brown Spot',
        remedy: 'Apply treatment'
      });

      const result = (service as any).parseDiseaseResponse(incompleteResponse);
      
      expect(result.diseases).toHaveLength(1);
      expect(result.diseases[0].confidence).toBe(50); // Default value
    });

    it('should handle missing remedy gracefully', () => {
      const noRemedyResponse = JSON.stringify({
        disease: 'Blast',
        confidence: 75
      });

      const result = (service as any).parseDiseaseResponse(noRemedyResponse);
      
      expect(result.diseases).toHaveLength(1);
      expect(result.recommendations).toHaveLength(0);
    });
  });

  describe('callWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await (service as any).callWithRetry(mockFn, 3);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = vi.fn()
        .mockRejectedValueOnce(new Error('Attempt 1 failed'))
        .mockRejectedValueOnce(new Error('Attempt 2 failed'))
        .mockResolvedValueOnce('success');

      const result = await (service as any).callWithRetry(mockFn, 3);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw GeminiAPIError after max retries', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Always fails'));

      await expect((service as any).callWithRetry(mockFn, 2))
        .rejects.toThrow(GeminiAPIError);

      expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('buildPestPrompt', () => {
    it('should build Bengali pest prompt when language is bn', () => {
      const prompt = (service as any).buildPestPrompt('bn');
      expect(prompt).toContain('কীটপতঙ্গ আছে কিনা শনাক্ত করুন');
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('pest');
      expect(prompt).toContain('scientificName');
      expect(prompt).toContain('riskLevel');
      expect(prompt).toContain('high|medium|low');
    });

    it('should build English pest prompt when language is en', () => {
      const prompt = (service as any).buildPestPrompt('en');
      expect(prompt).toContain('Identify any pest');
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('pest');
      expect(prompt).toContain('scientificName');
      expect(prompt).toContain('riskLevel');
      expect(prompt).toContain('high|medium|low');
    });
  });

  describe('parsePestResponse', () => {
    it('should parse valid JSON response with pest', () => {
      const validResponse = JSON.stringify({
        pest: 'Brown Planthopper',
        scientificName: 'Nilaparvata lugens',
        confidence: 85,
        riskLevel: 'high',
        remedy: 'Apply insecticide immediately',
        preventive: 'Monitor regularly'
      });

      const result = (service as any).parsePestResponse(validResponse, undefined);

      expect(result.pests).toHaveLength(1);
      expect(result.pests[0].name).toBe('Brown Planthopper');
      expect(result.pests[0].scientificName).toBe('Nilaparvata lugens');
      expect(result.pests[0].confidence).toBe(85);
      expect(result.pests[0].riskLevel).toBe('high');
      expect(result.overallRisk).toBe('high');
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0]).toBe('Apply insecticide immediately');
      expect(result.preventiveMeasures).toHaveLength(1);
      expect(result.preventiveMeasures[0]).toBe('Monitor regularly');
      expect(result.groundingSources).toHaveLength(0);
    });

    it('should parse no pest detected response', () => {
      const noPestResponse = JSON.stringify({
        pest: 'No pests detected',
        scientificName: 'N/A',
        confidence: 95,
        riskLevel: 'low',
        remedy: 'Continue monitoring',
        preventive: 'Maintain good practices'
      });

      const result = (service as any).parsePestResponse(noPestResponse, undefined);

      expect(result.pests).toHaveLength(0);
      expect(result.overallRisk).toBe('low');
      expect(result.recommendations).toHaveLength(1);
    });

    it('should parse JSON wrapped in markdown code blocks', () => {
      const wrappedResponse = '```json\n' + JSON.stringify({
        pest: 'কীটপতঙ্গ নেই',
        scientificName: 'N/A',
        confidence: 90,
        riskLevel: 'low',
        remedy: 'ভালো চর্চা চালিয়ে যান',
        preventive: 'নিয়মিত পর্যবেক্ষণ করুন'
      }) + '\n```';

      const result = (service as any).parsePestResponse(wrappedResponse, undefined);

      expect(result.pests).toHaveLength(0);
      expect(result.overallRisk).toBe('low');
    });

    it('should extract grounding sources from metadata', () => {
      const response = JSON.stringify({
        pest: 'Green Leafhopper',
        scientificName: 'Nephotettix virescens',
        confidence: 80,
        riskLevel: 'medium',
        remedy: 'Apply treatment',
        preventive: 'Monitor'
      });

      const groundingMetadata = {
        groundingChunks: [
          {
            web: {
              uri: 'https://example.com/pest1',
              title: 'Pest Identification Guide',
              snippet: 'Information about green leafhopper'
            }
          },
          {
            web: {
              uri: 'https://example.com/pest2',
              title: 'Rice Pest Management',
              snippet: 'Treatment methods'
            }
          }
        ]
      };

      const result = (service as any).parsePestResponse(response, groundingMetadata);

      expect(result.groundingSources).toHaveLength(2);
      expect(result.groundingSources[0].url).toBe('https://example.com/pest1');
      expect(result.groundingSources[0].title).toBe('Pest Identification Guide');
      expect(result.groundingSources[1].url).toBe('https://example.com/pest2');
    });

    it('should throw GeminiAPIError for invalid JSON', () => {
      const invalidResponse = 'This is not JSON';

      expect(() => (service as any).parsePestResponse(invalidResponse, undefined))
        .toThrow(GeminiAPIError);
    });

    it('should handle missing confidence gracefully', () => {
      const incompleteResponse = JSON.stringify({
        pest: 'Stem Borer',
        scientificName: 'Scirpophaga incertulas',
        riskLevel: 'medium',
        remedy: 'Apply treatment'
      });

      const result = (service as any).parsePestResponse(incompleteResponse, undefined);
      
      expect(result.pests).toHaveLength(1);
      expect(result.pests[0].confidence).toBe(50); // Default value
    });
  });

  describe('normalizeRiskLevel', () => {
    it('should normalize high risk level', () => {
      expect((service as any).normalizeRiskLevel('high')).toBe('high');
      expect((service as any).normalizeRiskLevel('HIGH')).toBe('high');
      expect((service as any).normalizeRiskLevel('উচ্চ')).toBe('high');
    });

    it('should normalize low risk level', () => {
      expect((service as any).normalizeRiskLevel('low')).toBe('low');
      expect((service as any).normalizeRiskLevel('কম')).toBe('low');
    });

    it('should default to medium for unknown values', () => {
      expect((service as any).normalizeRiskLevel('medium')).toBe('medium');
      expect((service as any).normalizeRiskLevel('unknown')).toBe('medium');
      expect((service as any).normalizeRiskLevel(undefined)).toBe('medium');
    });
  });

  describe('extractSources', () => {
    it('should extract sources from grounding metadata', () => {
      const metadata = {
        groundingChunks: [
          {
            web: {
              uri: 'https://example.com/1',
              title: 'Source 1',
              snippet: 'Snippet 1'
            }
          },
          {
            web: {
              uri: 'https://example.com/2',
              title: 'Source 2'
            }
          }
        ]
      };

      const sources = (service as any).extractSources(metadata);

      expect(sources).toHaveLength(2);
      expect(sources[0].url).toBe('https://example.com/1');
      expect(sources[0].title).toBe('Source 1');
      expect(sources[0].snippet).toBe('Snippet 1');
      expect(sources[1].url).toBe('https://example.com/2');
      expect(sources[1].title).toBe('Source 2');
    });

    it('should return empty array when no metadata', () => {
      const sources = (service as any).extractSources(undefined);
      expect(sources).toHaveLength(0);
    });

    it('should filter out chunks without web data', () => {
      const metadata = {
        groundingChunks: [
          {
            web: {
              uri: 'https://example.com/1',
              title: 'Source 1'
            }
          },
          {
            // No web data
          },
          {
            web: {
              uri: '',  // Empty URL
              title: 'Source 2'
            }
          }
        ]
      };

      const sources = (service as any).extractSources(metadata);

      expect(sources).toHaveLength(1);
      expect(sources[0].url).toBe('https://example.com/1');
    });

    it('should handle errors gracefully', () => {
      const invalidMetadata = {
        groundingChunks: 'not an array'
      };

      const sources = (service as any).extractSources(invalidMetadata);
      expect(sources).toHaveLength(0);
    });
  });
});
