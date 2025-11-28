import { HealthScanResponse, Advisory, CropBatchResponse } from '@shared/api';
import { toast } from '@/hooks/use-toast';

/**
 * Notification preferences stored in local storage
 */
export interface NotificationPreferences {
  scanResults: boolean;
  pendingScans: boolean;
  weatherAdvisories: boolean;
  harvestReminders: boolean;
}

/**
 * Scheduled notification stored in local storage
 */
export interface ScheduledNotification {
  id: string;
  type: 'scan' | 'advisory' | 'harvest' | 'pending';
  scheduledFor: string; // ISO date
  data: {
    scanId?: string;
    advisoryId?: string;
    cropId?: string;
    message: string;
    title: string;
  };
  delivered: boolean;
  createdAt: string; // ISO date
}

/**
 * Notification queue for offline support
 */
export interface NotificationQueue {
  farmerId: string;
  notifications: ScheduledNotification[];
  lastSync: string; // ISO date
  version: number;
}

const PREFERENCES_KEY = 'notification_preferences';
const QUEUE_KEY = 'notification_queue';
const NOTIFIED_ADVISORIES_KEY = 'notified_advisories';
const HARVEST_REMINDERS_KEY = 'harvest_reminders';

/**
 * Enhanced Notification Service
 * Handles browser notifications, toast fallbacks, preferences, and offline support
 */
class NotificationService {
  private permission: NotificationPermission = 'default';
  private dailyReminderInterval: number | null = null;

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('[Notifications] Not supported in this browser');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  /**
   * Check if notification permission is granted
   */
  hasPermission(): boolean {
    return this.permission === 'granted';
  }

  /**
   * Show a notification (browser or toast fallback)
   */
  private showNotification(
    title: string, 
    options?: NotificationOptions & { onClick?: () => void }
  ): void {
    const { onClick, ...notificationOptions } = options || {};

    if (this.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          icon: '/icon.svg',
          badge: '/icon.svg',
          ...notificationOptions,
        });

        if (onClick) {
          notification.onclick = () => {
            onClick();
            notification.close();
          };
        }
      } catch (error) {
        console.error('[Notifications] Failed to show notification:', error);
        // Fallback to toast
        this.showToast(title, notificationOptions.body as string);
      }
    } else {
      // Fallback to toast notification
      this.showToast(title, notificationOptions.body as string);
    }
  }

  /**
   * Show a toast notification as fallback
   */
  private showToast(title: string, description?: string): void {
    toast({
      title,
      description,
    });
  }

  /**
   * Get notification preferences
   */
  getPreferences(): NotificationPreferences {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Default: all enabled
    return {
      scanResults: true,
      pendingScans: true,
      weatherAdvisories: true,
      harvestReminders: true,
    };
  }

  /**
   * Update notification preferences
   */
  updatePreferences(prefs: Partial<NotificationPreferences>): void {
    const current = this.getPreferences();
    const updated = { ...current, ...prefs };
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  }

  /**
   * Notify about scan completion
   */
  notifyScanComplete(scan: HealthScanResponse, language: 'bn' | 'en'): void {
    const prefs = this.getPreferences();
    if (!prefs.scanResults) return;

    const isHealthy = scan.diseaseLabel?.toLowerCase().includes('healthy') || 
                     scan.diseaseLabel?.toLowerCase().includes('সুস্থ');

    if (isHealthy) {
      this.showNotification(
        language === 'bn' ? '✅ সুস্থ ফসল' : '✅ Healthy Crop',
        {
          body: language === 'bn' 
            ? 'আপনার ফসল সুস্থ! ভালো চর্চা চালিয়ে যান।'
            : 'Your crop is healthy! Continue good practices.',
          tag: 'health-scan',
          onClick: () => {
            window.location.href = '/health-journal';
          },
        }
      );
    } else {
      this.showNotification(
        language === 'bn' ? '⚠️ রোগ শনাক্ত' : '⚠️ Disease Detected',
        {
          body: language === 'bn'
            ? `${scan.diseaseLabel} - অবিলম্বে ব্যবস্থা নিন`
            : `${scan.diseaseLabel} - Take action immediately`,
          tag: 'health-scan',
          requireInteraction: true,
          onClick: () => {
            window.location.href = '/health-journal';
          },
        }
      );
    }
  }

  /**
   * Notify about pending scans that need follow-up
   */
  notifyPendingScans(count: number, language: 'bn' | 'en'): void {
    const prefs = this.getPreferences();
    if (!prefs.pendingScans || count === 0) return;

    this.showNotification(
      language === 'bn' ? '📋 অমীমাংসিত স্ক্যান' : '📋 Pending Scans',
      {
        body: language === 'bn'
          ? `${count} টি স্ক্যানের ফলাফল আপডেট করুন`
          : `Update status for ${count} scans`,
        tag: 'pending-scans',
        requireInteraction: true,
        onClick: () => {
          window.location.href = '/health-journal';
        },
      }
    );
  }

  /**
   * Notify about weather advisory
   */
  notifyAdvisory(advisory: Advisory, language: 'bn' | 'en'): void {
    const prefs = this.getPreferences();
    if (!prefs.weatherAdvisories) return;

    // Track notified advisories to prevent duplicates
    const notifiedSet = this.getNotifiedAdvisories();
    const advisoryKey = `${advisory.type}-${advisory.severity}-${advisory.title}`;
    
    if (notifiedSet.has(advisoryKey)) {
      return; // Already notified
    }

    const severityEmoji = advisory.severity === 'high' ? '🚨' : advisory.severity === 'medium' ? '⚠️' : 'ℹ️';
    const title = `${severityEmoji} ${advisory.title}`;

    // Delay for medium severity
    const delay = advisory.severity === 'medium' ? 5 * 60 * 1000 : 0;

    setTimeout(() => {
      this.showNotification(title, {
        body: advisory.message,
        tag: 'weather-advisory',
        requireInteraction: advisory.severity === 'high',
        onClick: () => {
          window.location.href = '/dashboard';
        },
      });

      // Mark as notified
      notifiedSet.add(advisoryKey);
      this.saveNotifiedAdvisories(notifiedSet);
    }, delay);
  }

  /**
   * Notify about harvest reminder
   */
  notifyHarvestReminder(crop: CropBatchResponse, daysUntil: number, language: 'bn' | 'en'): void {
    const prefs = this.getPreferences();
    if (!prefs.harvestReminders) return;

    // Don't remind if already harvested
    if (crop.stage === 'harvested') return;

    const title = language === 'bn' 
      ? `🌾 ফসল কাটার অনুস্মারক`
      : `🌾 Harvest Reminder`;

    const body = language === 'bn'
      ? `${crop.cropType} - ${daysUntil} দিনে ফসল কাটার সময়`
      : `${crop.cropType} - ${daysUntil} days until harvest`;

    this.showNotification(title, {
      body,
      tag: 'harvest-reminder',
      requireInteraction: true,
      onClick: () => {
        window.location.href = '/dashboard';
      },
    });
  }

  /**
   * Schedule harvest reminders for crops
   */
  scheduleHarvestReminders(crops: CropBatchResponse[], language: 'bn' | 'en'): void {
    const now = new Date();
    const reminders = this.getScheduledHarvestReminders();

    crops.forEach(crop => {
      if (crop.stage === 'harvested' || !crop.expectedHarvestDate) return;

      const harvestDate = new Date(crop.expectedHarvestDate);
      const daysUntil = Math.ceil((harvestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Schedule reminders at 7, 3, and 1 day before harvest
      [7, 3, 1].forEach(days => {
        if (daysUntil === days) {
          const reminderKey = `${crop._id}-${days}`;
          if (!reminders.has(reminderKey)) {
            this.notifyHarvestReminder(crop, days, language);
            reminders.add(reminderKey);
          }
        }
      });
    });

    this.saveScheduledHarvestReminders(reminders);
  }

  /**
   * Check for pending scans and send reminder
   */
  async checkAndNotifyPendingScans(farmerId: string, language: 'bn' | 'en'): Promise<void> {
    try {
      const response = await fetch(`/api/health-scans?farmerId=${farmerId}&status=pending`);
      if (!response.ok) return;

      const data = await response.json();
      const pendingScans = (data.scans || []).filter((scan: HealthScanResponse) => {
        const isHealthy = scan.diseaseLabel?.toLowerCase().includes('healthy') || 
                         scan.diseaseLabel?.toLowerCase().includes('সুस्थ');
        return !scan.outcome && !isHealthy;
      });

      if (pendingScans.length > 0) {
        this.notifyPendingScans(pendingScans.length, language);
      }
    } catch (error) {
      console.error('[Notifications] Failed to check pending scans:', error);
    }
  }

  /**
   * Schedule daily reminder for pending scans
   */
  scheduleDailyPendingScanCheck(farmerId: string, language: 'bn' | 'en'): void {
    // Clear existing interval if any
    if (this.dailyReminderInterval) {
      clearInterval(this.dailyReminderInterval);
    }

    // Check immediately
    this.checkAndNotifyPendingScans(farmerId, language);

    // Then check every 24 hours
    this.dailyReminderInterval = window.setInterval(() => {
      this.checkAndNotifyPendingScans(farmerId, language);
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * Queue a notification for offline delivery
   */
  queueNotification(notification: ScheduledNotification, farmerId: string): void {
    const queue = this.getQueue(farmerId);
    queue.notifications.push(notification);
    this.saveQueue(queue);
  }

  /**
   * Process queued notifications
   */
  processQueue(farmerId: string): void {
    const queue = this.getQueue(farmerId);
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter out stale notifications (older than 24 hours)
    const validNotifications = queue.notifications.filter(notif => {
      const createdAt = new Date(notif.createdAt);
      return createdAt > twentyFourHoursAgo && !notif.delivered;
    });

    // Display valid notifications
    validNotifications.forEach(notif => {
      this.showNotification(notif.data.title, {
        body: notif.data.message,
        tag: notif.type,
      });
      notif.delivered = true;
    });

    // Update queue
    queue.notifications = validNotifications;
    queue.lastSync = now.toISOString();
    this.saveQueue(queue);
  }

  /**
   * Sync notification queue with server
   */
  async syncWithServer(farmerId: string): Promise<void> {
    // Process any queued notifications first
    this.processQueue(farmerId);
    
    // In a real implementation, this would sync with the server
    // For now, we just update the lastSync timestamp
    const queue = this.getQueue(farmerId);
    queue.lastSync = new Date().toISOString();
    this.saveQueue(queue);
  }

  /**
   * Get notification queue from local storage
   */
  private getQueue(farmerId: string): NotificationQueue {
    const stored = localStorage.getItem(`${QUEUE_KEY}_${farmerId}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return {
      farmerId,
      notifications: [],
      lastSync: new Date().toISOString(),
      version: 1,
    };
  }

  /**
   * Save notification queue to local storage
   */
  private saveQueue(queue: NotificationQueue): void {
    // Limit queue size to 50 notifications
    if (queue.notifications.length > 50) {
      queue.notifications = queue.notifications.slice(-50);
    }
    localStorage.setItem(`${QUEUE_KEY}_${queue.farmerId}`, JSON.stringify(queue));
  }

  /**
   * Get notified advisories set
   */
  private getNotifiedAdvisories(): Set<string> {
    const stored = localStorage.getItem(NOTIFIED_ADVISORIES_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
    return new Set();
  }

  /**
   * Save notified advisories set
   */
  private saveNotifiedAdvisories(advisories: Set<string>): void {
    localStorage.setItem(NOTIFIED_ADVISORIES_KEY, JSON.stringify(Array.from(advisories)));
  }

  /**
   * Get scheduled harvest reminders set
   */
  private getScheduledHarvestReminders(): Set<string> {
    const stored = localStorage.getItem(HARVEST_REMINDERS_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
    return new Set();
  }

  /**
   * Save scheduled harvest reminders set
   */
  private saveScheduledHarvestReminders(reminders: Set<string>): void {
    localStorage.setItem(HARVEST_REMINDERS_KEY, JSON.stringify(Array.from(reminders)));
  }
}

export const notificationService = new NotificationService();

