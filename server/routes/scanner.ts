import { Router, RequestHandler } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import multer from 'multer';
import { GeminiService } from '../services/gemini.service';
import { HealthScanService } from '../services/healthScan.service';
import { HealthScansRepository } from '../db/repositories/healthScans.repository';
import { getDatabase } from '../db/connection';
import { processImageForAPI, SUPPORTED_FORMATS } from '../utils/imageProcessing';
import { AnalyzeScanResponse } from '@shared/api';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    if (SUPPORTED_FORMATS.includes(file.mimetype as any)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Accepted formats: ${SUPPORTED_FORMATS.join(', ')}`));
    }
  },
});

/**
 * POST /api/scanner/analyze
 * Analyze a crop image using Gemini API
 */
export const handleAnalyzeScan: RequestHandler = async (req, res, next) => {
  try {
    console.log('[Scanner] Received analyze request');
    
    if (!req.file) {
      console.log('[Scanner] No file in request');
      return res.status(400).json({
        error: {
          type: 'ValidationError',
          message: 'No image file provided',
          timestamp: new Date().toISOString(),
        },
      });
    }

    console.log('[Scanner] File received:', {
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    const { farmerId, batchId } = req.body;
    console.log('[Scanner] Request body:', { farmerId, batchId });

    // Validate required fields
    if (!farmerId || !ObjectId.isValid(farmerId)) {
      console.log('[Scanner] Invalid farmer ID');
      return res.status(400).json({
        error: {
          type: 'ValidationError',
          message: 'Valid farmer ID is required',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Validate optional batchId
    if (batchId && !ObjectId.isValid(batchId)) {
      console.log('[Scanner] Invalid batch ID');
      return res.status(400).json({
        error: {
          type: 'ValidationError',
          message: 'Invalid batch ID format',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Process image
    console.log('[Scanner] Processing image...');
    const { base64, mimeType } = await processImageForAPI(
      req.file.buffer,
      req.file.mimetype
    );
    console.log('[Scanner] Image processed, size:', base64.length);

    // Analyze with Gemini
    console.log('[Scanner] Calling Gemini API...');
    const geminiService = new GeminiService();
    const analysis = await geminiService.analyzeImage({
      imageBase64: base64,
      mimeType,
      language: 'bn',
    });
    console.log('[Scanner] Gemini analysis complete:', {
      diseaseCount: analysis.diseases.length,
      overallHealth: analysis.overallHealth,
    });

    // Store in database
    console.log('[Scanner] Storing scan in database...');
    const db = getDatabase();
    const healthScansRepository = new HealthScansRepository(db);
    const healthScanService = new HealthScanService(healthScansRepository);

    // Convert image to data URL for storage
    const imageDataUrl = `data:${mimeType};base64,${base64}`;

    const scan = await healthScanService.recordScan({
      farmerId: new ObjectId(farmerId),
      batchId: batchId ? new ObjectId(batchId) : undefined,
      diseaseLabel: analysis.diseases[0]?.name || 'No disease detected',
      confidence: analysis.diseases[0]?.confidence || 100,
      remedyText: analysis.recommendations.join('\n'),
      imageUrl: imageDataUrl,
    });
    console.log('[Scanner] Scan stored with ID:', scan._id);

    const response: AnalyzeScanResponse = {
      scan: {
        _id: scan._id!.toString(),
        farmerId: scan.farmerId.toString(),
        batchId: scan.batchId?.toString(),
        capturedAt: scan.capturedAt.toISOString(),
        diseaseLabel: scan.diseaseLabel,
        confidence: scan.confidence,
        remedyText: scan.remedyText,
        imageUrl: scan.imageUrl,
        immediateFeedback: scan.immediateFeedback,
        outcome: scan.outcome,
        status: scan.status,
      },
      analysis: {
        diseases: analysis.diseases,
        overallHealth: analysis.overallHealth,
        recommendations: analysis.recommendations,
        preventiveMeasures: analysis.preventiveMeasures,
      },
      message: 'Image analyzed successfully',
    };

    console.log('[Scanner] Sending response');
    res.status(201).json(response);
  } catch (error) {
    console.error('[Scanner] Error:', error);
    if (error instanceof Error) {
      return res.status(500).json({
        error: {
          type: 'ImageProcessingError',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
    next(error);
  }
};

/**
 * Create and configure the scanner router
 */
export function createScannerRouter(): Router {
  const router = Router();

  router.post('/analyze', upload.single('image'), handleAnalyzeScan);

  return router;
}
