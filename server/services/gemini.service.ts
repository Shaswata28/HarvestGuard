// server/src/services/gemini.service.ts
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

export interface GeminiAnalysisRequest {
  imageBase64: string; // pure base64 (no data:image/... prefix)
  mimeType: string;    // e.g., 'image/jpeg'
  language: 'bn' | 'en';
}

export interface DetectedDisease {
  name: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  affectedArea: string;
}

export interface GeminiAnalysisResponse {
  diseases: DetectedDisease[];
  overallHealth: 'healthy' | 'minor_issues' | 'major_issues';
  recommendations: string[];
  preventiveMeasures: string[];
}

export interface PestIdentification {
  name: string;
  scientificName: string;
  confidence: number;
  riskLevel: 'high' | 'medium' | 'low';
  affectedArea: string;
}

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface GeminiPestAnalysisResponse {
  pests: PestIdentification[];
  overallRisk: 'high' | 'medium' | 'low';
  recommendations: string[];
  preventiveMeasures: string[];
  groundingSources: GroundingSource[];
}

export class GeminiAPIError extends Error {
  constructor(
    message: string,
    public readonly retryable = false,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = 'GeminiAPIError';
  }
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private defaultModel: any;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is missing in .env');
    }

    this.genAI = new GoogleGenerativeAI(key);

    // Base model (no grounding) – used for simple disease check
    this.defaultModel = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ],
    });
  }

  // ──────────────────────────────────────────────────────────────
  // 1. Simple Disease Detection (no grounding)
  // ──────────────────────────────────────────────────────────────
  async analyzeImage(request: GeminiAnalysisRequest): Promise<GeminiAnalysisResponse> {
    const prompt = this.buildDiseasePrompt(request.language);
    const imagePart = {
      inlineData: { data: request.imageBase64, mimeType: request.mimeType },
    };

    const result: any = await this.callWithRetry(() =>
      this.defaultModel.generateContent([prompt, imagePart])
    );

    const text = result.response.text();
    return this.parseDiseaseResponse(text);
  }

  // ──────────────────────────────────────────────────────────────
  // 2. Pest Detection WITH Google Search Grounding (Visual RAG)
  // ──────────────────────────────────────────────────────────────
  async analyzePestImage(request: GeminiAnalysisRequest): Promise<GeminiPestAnalysisResponse> {
    const prompt = this.buildPestPrompt(request.language);
    const imagePart = {
      inlineData: { data: request.imageBase64, mimeType: request.mimeType },
    };

    // Use Google Search for grounding (googleSearchRetrieval not supported in 2.5-flash)
    const modelWithSearch = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ],
      tools: [{ googleSearch: {} } as any],
    });

    const result: any = await this.callWithRetry(() =>
      modelWithSearch.generateContent([prompt, imagePart])
    );

    const text = result.response.text();
    const groundingMetadata = result.response.candidates?.[0]?.groundingMetadata;

    return this.parsePestResponse(text, groundingMetadata);
  }

  // ──────────────────────────────────────────────────────────────
  // Prompt Builders
  // ──────────────────────────────────────────────────────────────
  private buildDiseasePrompt(lang: 'bn' | 'en'): string {
    return lang === 'bn'
      ? `এই ফসলের ছবি বিশ্লেষণ করুন। শুধুমাত্র JSON দিন, কোনো অতিরিক্ত টেক্সট নয়:
{
  "disease": "রোগের নাম অথবা 'সুস্থ ফসল'",
  "confidence": 90,
  "remedy": "১-২ বাক্যে চিকিৎসা"
}`
      : `Analyze this crop image. Return ONLY valid JSON:
{
  "disease": "disease name or 'Healthy crop'",
  "confidence": 90,
  "remedy": "treatment in 1-2 sentences"
}`;
  }

  private buildPestPrompt(lang: 'bn' | 'en'): string {
    return lang === 'bn'
      ? `এই ফসলের ছবিতে কীটপতঙ্গ আছে কিনা শনাক্ত করুন। সবচেয়ে সঠিক ও আপডেট তথ্য ব্যবহার করুন। শুধুমাত্র JSON দিন:
{
  "pest": "কীটপতঙ্গের নাম (বাংলা) অথবা 'কোনো কীটপতঙ্গ নেই'",
  "scientificName": "বৈজ্ঞানিক নাম",
  "confidence": 92,
  "riskLevel": "high|medium|low",
  "remedy": "আজই কী করবেন (বাংলায়)",
  "preventive": "ভবিষ্যতে প্রতিরোধের উপায়"
}`
      : `Identify any pest in this crop image using the latest knowledge. Return ONLY JSON:
{
  "pest": "pest name (English) or 'No pest detected'",
  "scientificName": "scientific name",
  "confidence": 92,
  "riskLevel": "high|medium|low",
  "remedy": "immediate action (English)",
  "preventive": "prevention tips"
}`;
  }

  // ──────────────────────────────────────────────────────────────
  // Response Parsers
  // ──────────────────────────────────────────────────────────────
  private parseDiseaseResponse(text: string): GeminiAnalysisResponse {
    const json = this.extractJson(text);
    const name = json.disease?.trim() || 'Unknown';
    const isHealthy = /healthy|সুস্থ|none|নেই/i.test(name);
    const confidence = Number(json.confidence) || 50;

    return {
      diseases: isHealthy
        ? []
        : [{ name, confidence, severity: confidence > 80 ? 'high' : confidence > 60 ? 'medium' : 'low', affectedArea: 'leaves' }],
      overallHealth: isHealthy ? 'healthy' : confidence > 70 ? 'major_issues' : 'minor_issues',
      recommendations: json.remedy ? [json.remedy.trim()] : [],
      preventiveMeasures: [],
    };
  }

  private parsePestResponse(text: string, metadata?: any): GeminiPestAnalysisResponse {
    const json = this.extractJson(text);
    const name = json.pest?.trim() || 'Unknown';
    const noPest = /কোনো|no pest|কীটপতঙ্গ নেই|none/i.test(name);
    const risk = this.normalizeRiskLevel(json.riskLevel);
    const confidence = Number(json.confidence) || 50;

    return {
      pests: noPest
        ? []
        : [{
            name,
            scientificName: json.scientificName || 'N/A',
            confidence,
            riskLevel: risk,
            affectedArea: 'leaves and stems',
          }],
      overallRisk: noPest ? 'low' : risk,
      recommendations: json.remedy ? [json.remedy.trim()] : [],
      preventiveMeasures: json.preventive ? [json.preventive.trim()] : [],
      groundingSources: this.extractSources(metadata),
    };
  }

  private extractJson(text: string): any {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new GeminiAPIError('No JSON found in Gemini response');
    return JSON.parse(match[0]);
  }

  private normalizeRiskLevel(level?: string): 'high' | 'medium' | 'low' {
    if (!level) return 'medium';
    const l = level.toLowerCase();
    if (l.includes('high') || l.includes('উচ্চ') || l.includes('গুরুতর')) return 'high';
    if (l.includes('low') || l.includes('কম')) return 'low';
    return 'medium';
  }

  private extractSources(metadata?: any): GroundingSource[] {
    if (!metadata?.groundingChunks) return [];
    try {
      return metadata.groundingChunks
        .filter((c: any) => c.web)
        .map((c: any) => ({
          title: c.web.title || 'Source',
          url: c.web.uri || '',
          snippet: c.web.snippet,
        }))
        .filter((s: GroundingSource) => s.url);
    } catch (error) {
      console.error('[GeminiService] Error extracting grounding sources:', error);
      return [];
    }
  }

  // ──────────────────────────────────────────────────────────────
  // Retry Logic
  // ──────────────────────────────────────────────────────────────
  private async callWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    let lastError: any;
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        if (i === retries) break;
        const delay = Math.pow(2, i) * 1000;
        console.log(`Gemini call failed, retry ${i + 1}/${retries + 1} in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw new GeminiAPIError(`Failed after ${retries + 1} attempts`, true, lastError);
  }
}