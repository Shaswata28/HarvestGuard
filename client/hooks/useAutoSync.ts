import { useEffect, useState } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { syncService } from '@/services/syncService';
import { useToast } from './use-toast';
import { useLanguage } from '@/context/LangContext';

/**
 * Hook to automatically sync pending actions when coming online
 */
export function useAutoSync() {
  const isOnline = useOnlineStatus();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Update pending count
  useEffect(() => {
    const updateCount = () => {
      setPendingCount(syncService.getPendingCount());
    };

    updateCount();
    const interval = setInterval(updateCount, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && syncService.hasPendingActions() && !isSyncing) {
      console.log('[AutoSync] Connection restored, starting sync...');
      
      setIsSyncing(true);
      
      syncService.syncPendingActions()
        .then(({ success, failed }) => {
          if (success > 0) {
            toast({
              title: language === 'bn' ? 'সিঙ্ক সম্পন্ন' : 'Sync Complete',
              description: language === 'bn' 
                ? `${success} টি পরিবর্তন সংরক্ষিত হয়েছে`
                : `${success} changes synced successfully`,
            });
          }
          
          if (failed > 0) {
            toast({
              title: language === 'bn' ? 'সিঙ্ক ত্রুটি' : 'Sync Error',
              description: language === 'bn'
                ? `${failed} টি পরিবর্তন সিঙ্ক করা যায়নি`
                : `${failed} changes failed to sync`,
              variant: 'destructive',
            });
          }
        })
        .catch((error) => {
          console.error('[AutoSync] Sync failed:', error);
          toast({
            title: language === 'bn' ? 'সিঙ্ক ব্যর্থ' : 'Sync Failed',
            description: language === 'bn'
              ? 'পরিবর্তন সিঙ্ক করতে ব্যর্থ'
              : 'Failed to sync changes',
            variant: 'destructive',
          });
        })
        .finally(() => {
          setIsSyncing(false);
        });
    }
  }, [isOnline, isSyncing, language, toast]);

  return {
    isSyncing,
    pendingCount,
    hasPendingChanges: pendingCount > 0,
  };
}

