import { useEffect } from 'react';
import { CropBatchResponse } from '@shared/api';
import { notificationService } from '@/services/notificationService';

interface CropLike {
  _id?: string;
  id?: string;
  stage: 'growing' | 'harvested';
  expectedHarvestDate?: string;
  cropType: string;
}

interface UseHarvestRemindersOptions {
  crops: CropLike[];
  language: 'bn' | 'en';
  enabled?: boolean;
}

/**
 * Hook to schedule and trigger harvest reminders for crops
 * Checks daily and sends reminders at 7, 3, and 1 day before harvest
 */
export function useHarvestReminders({
  crops,
  language,
  enabled = true,
}: UseHarvestRemindersOptions) {
  useEffect(() => {
    if (!enabled || !crops || crops.length === 0) {
      return;
    }

    // Convert crops to CropBatchResponse format
    const convertedCrops: CropBatchResponse[] = crops.map(crop => ({
      _id: crop._id || crop.id || '',
      farmerId: '',
      cropType: crop.cropType,
      stage: crop.stage,
      expectedHarvestDate: crop.expectedHarvestDate,
      enteredDate: new Date().toISOString(),
    }));

    // Schedule harvest reminders
    notificationService.scheduleHarvestReminders(convertedCrops, language);

    // Set up daily check (every 24 hours)
    const dailyCheckInterval = setInterval(() => {
      notificationService.scheduleHarvestReminders(convertedCrops, language);
    }, 24 * 60 * 60 * 1000);

    return () => {
      clearInterval(dailyCheckInterval);
    };
  }, [crops, language, enabled]);
}
