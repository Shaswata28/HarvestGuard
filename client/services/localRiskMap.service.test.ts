/**
 * Tests for Local Risk Map Service
 * Requirements: 2.3, 2.4, 2.5
 */

import { describe, it, expect } from 'vitest';
import { getRiskMapErrorMessage } from './localRiskMap.service';
import { ApiError } from './api';

describe('getRiskMapErrorMessage', () => {
  it('should return Bangla error message for 404 status', () => {
    const error = new ApiError(404, 'NotFound', 'Farmer not found');
    const message = getRiskMapErrorMessage(error);
    expect(message).toBe('কৃষক তথ্য পাওয়া যায়নি। পরে আবার চেষ্টা করুন।');
  });

  it('should return Bangla error message for 500 status', () => {
    const error = new ApiError(500, 'ServerError', 'Internal server error');
    const message = getRiskMapErrorMessage(error);
    expect(message).toBe('সার্ভার সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন।');
  });

  it('should return generic Bangla error message for other API errors', () => {
    const error = new ApiError(400, 'BadRequest', 'Invalid request');
    const message = getRiskMapErrorMessage(error);
    expect(message).toBe('আপনার তথ্য লোড করতে সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন।');
  });

  it('should return generic Bangla error message for non-API errors', () => {
    const error = new Error('Network error');
    const message = getRiskMapErrorMessage(error);
    expect(message).toBe('আপনার তথ্য লোড করতে সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন।');
  });

  it('should return generic Bangla error message for unknown errors', () => {
    const error = 'Some string error';
    const message = getRiskMapErrorMessage(error);
    expect(message).toBe('আপনার তথ্য লোড করতে সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন।');
  });
});
