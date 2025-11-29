import { useEffect, useRef } from 'react';
import { Advisory, AdvisoryResponse } from '@shared/api';
import { notificationService } from '@/services/notificationService';

interface UseAdvisoryNotificationsOptions {
  advisories: Advisory[];
  language: 'bn' | 'en';
  enabled?: boolean;
  farmerId?: string;
  farmerPhone?: string;
}

/**
 * Hook to monitor advisories and trigger notifications for new high/medium severity ones
 * Also handles smart alerts from the backend decision engine
 */
export function useAdvisoryNotifications({
  advisories,
  language,
  enabled = true,
  farmerId,
  farmerPhone,
}: UseAdvisoryNotificationsOptions) {
  const previousAdvisoriesRef = useRef<Set<string>>(new Set());
  const previousSmartAlertsRef = useRef<Set<string>>(new Set());

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

  // Fetch and monitor smart alerts from backend
  useEffect(() => {
    if (!enabled || !farmerId || !farmerPhone) {
      return;
    }

    const fetchSmartAlerts = async () => {
      try {
        const response = await fetch(`/api/advisories?farmerId=${farmerId}&source=weather&limit=10`);
        if (!response.ok) return;

        const data = await response.json();
        const smartAlerts: AdvisoryResponse[] = data.advisories || [];

        // Check for new smart alerts
        smartAlerts.forEach((alert) => {
          const alertKey = `smart-${alert._id}`;
          
          if (!previousSmartAlertsRef.current.has(alertKey)) {
            // Trigger smart alert notification
            notificationService.notifySmartAlert(alert, farmerPhone, language);
            previousSmartAlertsRef.current.add(alertKey);
          }
        });
      } catch (error) {
        console.error('[useAdvisoryNotifications] Failed to fetch smart alerts:', error);
      }
    };

    // Fetch immediately
    fetchSmartAlerts();

    // Poll for new smart alerts every 5 minutes
    const interval = setInterval(fetchSmartAlerts, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, farmerId, farmerPhone, language]);

  return {
    notifiedCount: previousAdvisoriesRef.current.size + previousSmartAlertsRef.current.size,
  };
}
