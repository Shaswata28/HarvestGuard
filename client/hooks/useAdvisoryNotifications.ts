import { useEffect, useRef } from 'react';
import { Advisory } from '@shared/api';
import { notificationService } from '@/services/notificationService';

interface UseAdvisoryNotificationsOptions {
  advisories: Advisory[];
  language: 'bn' | 'en';
  enabled?: boolean;
}

/**
 * Hook to monitor advisories and trigger notifications for new high/medium severity ones
 */
export function useAdvisoryNotifications({
  advisories,
  language,
  enabled = true,
}: UseAdvisoryNotificationsOptions) {
  const previousAdvisoriesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !advisories || advisories.length === 0) {
      return;
    }

    // Check for new advisories
    advisories.forEach((advisory) => {
      const advisoryKey = `${advisory.type}-${advisory.severity}-${advisory.title}`;
      
      // Only notify for high and medium severity
      if (
        (advisory.severity === 'high' || advisory.severity === 'medium') &&
        !previousAdvisoriesRef.current.has(advisoryKey)
      ) {
        // Trigger notification
        notificationService.notifyAdvisory(advisory, language);
        previousAdvisoriesRef.current.add(advisoryKey);
      }
    });
  }, [advisories, language, enabled]);

  return {
    notifiedCount: previousAdvisoriesRef.current.size,
  };
}
