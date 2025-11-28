import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { HealthScanResponse, Advisory, CropBatchResponse } from '@shared/api';

// Mock the toast function
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock window and Notification API before importing the service
Object.defineProperty(global, 'window', {
  value: {
    location: {
      href: '',
    },
    setInterval: global.setInterval,
    clearInterval: global.clearInterval,
    setTimeout: global.setTimeout,
    clearTimeout: global.clearTimeout,
  },
  writable: true,
});

Object.defineProperty(global, 'Notification', {
  value: class MockNotification {
    static permission = 'granted';
    static requestPermission = vi.fn().mockResolvedValue('granted');
    
    constructor(public title: string, public options?: any) {}
    close() {}
    onclick: (() => void) | null = null;
  },
  writable: true,
  configurable: true,
});

// Now import the service after mocks are set up
const { notificationService } = await import('./notificationService');

describe('NotificationService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    // Reset Notification mock
    (global.Notification as any).permission = 'granted';
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Permission Management', () => {
    it('should request notification permission', async () => {
      const result = await notificationService.requestPermission();
      expect(result).toBe(true);
      expect(global.Notification.requestPermission).toHaveBeenCalled();
    });

    it('should return true if permission already granted', async () => {
      global.Notification.permission = 'granted';
      const result = await notificationService.requestPermission();
      expect(result).toBe(true);
    });

    it('should check if permission is granted', () => {
      global.Notification.permission = 'granted';
      expect(notificationService.hasPermission()).toBe(true);
    });
  });

  describe('Notification Preferences', () => {
    it('should return default preferences when none are stored', () => {
      const prefs = notificationService.getPreferences();
      expect(prefs).toEqual({
        scanResults: true,
        pendingScans: true,
        weatherAdvisories: true,
        harvestReminders: true,
      });
    });

    it('should update and persist preferences', () => {
      notificationService.updatePreferences({ scanResults: false });
      const prefs = notificationService.getPreferences();
      expect(prefs.scanResults).toBe(false);
      expect(prefs.pendingScans).toBe(true);
    });

    it('should persist preferences to localStorage', () => {
      notificationService.updatePreferences({ weatherAdvisories: false });
      const stored = localStorage.getItem('notification_preferences');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.weatherAdvisories).toBe(false);
    });
  });

  describe('Scan Notifications', () => {
    it('should notify for healthy scan', () => {
      const mockScan: HealthScanResponse = {
        _id: '123',
        farmerId: 'farmer1',
        capturedAt: new Date().toISOString(),
        diseaseLabel: 'Healthy',
        confidence: 95,
        status: 'healthy',
      };

      // Mock Notification constructor
      const mockNotification = vi.fn();
      global.Notification = mockNotification as any;
      global.Notification.permission = 'granted';

      notificationService.notifyScanComplete(mockScan, 'en');
      
      expect(mockNotification).toHaveBeenCalledWith(
        '✅ Healthy Crop',
        expect.objectContaining({
          body: 'Your crop is healthy! Continue good practices.',
          tag: 'health-scan',
        })
      );
    });

    it('should notify for disease detection', () => {
      const mockScan: HealthScanResponse = {
        _id: '123',
        farmerId: 'farmer1',
        capturedAt: new Date().toISOString(),
        diseaseLabel: 'Leaf Blast',
        confidence: 85,
        status: 'pending',
      };

      const mockNotification = vi.fn();
      global.Notification = mockNotification as any;
      global.Notification.permission = 'granted';

      notificationService.notifyScanComplete(mockScan, 'en');
      
      expect(mockNotification).toHaveBeenCalledWith(
        '⚠️ Disease Detected',
        expect.objectContaining({
          body: 'Leaf Blast - Take action immediately',
          tag: 'health-scan',
          requireInteraction: true,
        })
      );
    });

    it('should respect scan notification preferences', () => {
      notificationService.updatePreferences({ scanResults: false });
      
      const mockScan: HealthScanResponse = {
        _id: '123',
        farmerId: 'farmer1',
        capturedAt: new Date().toISOString(),
        diseaseLabel: 'Healthy',
        confidence: 95,
        status: 'healthy',
      };

      const mockNotification = vi.fn();
      global.Notification = mockNotification as any;
      global.Notification.permission = 'granted';

      notificationService.notifyScanComplete(mockScan, 'en');
      
      expect(mockNotification).not.toHaveBeenCalled();
    });
  });

  describe('Advisory Notifications', () => {
    it('should notify for high severity advisory immediately', () => {
      const mockAdvisory: Advisory = {
        type: 'heat',
        severity: 'high',
        title: 'High Temperature Alert',
        message: 'Temperature is 42°C',
        actions: ['Increase irrigation'],
        conditions: { temperature: 42 },
      };

      const mockNotification = vi.fn();
      global.Notification = mockNotification as any;
      global.Notification.permission = 'granted';

      notificationService.notifyAdvisory(mockAdvisory, 'en');
      
      expect(mockNotification).toHaveBeenCalledWith(
        '🚨 High Temperature Alert',
        expect.objectContaining({
          body: 'Temperature is 42°C',
          tag: 'weather-advisory',
          requireInteraction: true,
        })
      );
    });

    it('should delay medium severity advisory by 5 minutes', () => {
      vi.useFakeTimers();
      
      const mockAdvisory: Advisory = {
        type: 'humidity',
        severity: 'medium',
        title: 'High Humidity Alert',
        message: 'Humidity is 85%',
        actions: ['Monitor for pests'],
        conditions: { humidity: 85 },
      };

      const mockNotification = vi.fn();
      global.Notification = mockNotification as any;
      global.Notification.permission = 'granted';

      notificationService.notifyAdvisory(mockAdvisory, 'en');
      
      // Should not be called immediately
      expect(mockNotification).not.toHaveBeenCalled();
      
      // Fast-forward 5 minutes
      vi.advanceTimersByTime(5 * 60 * 1000);
      
      expect(mockNotification).toHaveBeenCalled();
      
      vi.useRealTimers();
    });

    it('should prevent duplicate advisory notifications', () => {
      const mockAdvisory: Advisory = {
        type: 'heat',
        severity: 'high',
        title: 'High Temperature Alert',
        message: 'Temperature is 42°C',
        actions: ['Increase irrigation'],
        conditions: { temperature: 42 },
      };

      const mockNotification = vi.fn();
      global.Notification = mockNotification as any;
      global.Notification.permission = 'granted';

      // First notification
      notificationService.notifyAdvisory(mockAdvisory, 'en');
      expect(mockNotification).toHaveBeenCalledTimes(1);
      
      // Second notification with same advisory
      notificationService.notifyAdvisory(mockAdvisory, 'en');
      expect(mockNotification).toHaveBeenCalledTimes(1); // Should not increase
    });
  });

  describe('Harvest Reminders', () => {
    it('should notify for harvest reminder', () => {
      const mockCrop: CropBatchResponse = {
        _id: 'crop1',
        farmerId: 'farmer1',
        cropType: 'Rice',
        stage: 'growing',
        expectedHarvestDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        enteredDate: new Date().toISOString(),
      };

      const mockNotification = vi.fn();
      global.Notification = mockNotification as any;
      global.Notification.permission = 'granted';

      notificationService.notifyHarvestReminder(mockCrop, 7, 'en');
      
      expect(mockNotification).toHaveBeenCalledWith(
        '🌾 Harvest Reminder',
        expect.objectContaining({
          body: 'Rice - 7 days until harvest',
          tag: 'harvest-reminder',
          requireInteraction: true,
        })
      );
    });

    it('should not notify for already harvested crops', () => {
      const mockCrop: CropBatchResponse = {
        _id: 'crop1',
        farmerId: 'farmer1',
        cropType: 'Rice',
        stage: 'harvested',
        actualHarvestDate: new Date().toISOString(),
        enteredDate: new Date().toISOString(),
      };

      const mockNotification = vi.fn();
      global.Notification = mockNotification as any;
      global.Notification.permission = 'granted';

      notificationService.notifyHarvestReminder(mockCrop, 7, 'en');
      
      expect(mockNotification).not.toHaveBeenCalled();
    });

    it('should schedule reminders at 7, 3, and 1 day before harvest', () => {
      const now = new Date();
      const crops: CropBatchResponse[] = [
        {
          _id: 'crop1',
          farmerId: 'farmer1',
          cropType: 'Rice',
          stage: 'growing',
          expectedHarvestDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          enteredDate: now.toISOString(),
        },
        {
          _id: 'crop2',
          farmerId: 'farmer1',
          cropType: 'Wheat',
          stage: 'growing',
          expectedHarvestDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          enteredDate: now.toISOString(),
        },
      ];

      const mockNotification = vi.fn();
      global.Notification = mockNotification as any;
      global.Notification.permission = 'granted';

      notificationService.scheduleHarvestReminders(crops, 'en');
      
      // Should notify for both crops
      expect(mockNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe('Offline Queue Management', () => {
    it('should queue notification when offline', () => {
      const notification = {
        id: '123',
        type: 'scan' as const,
        scheduledFor: new Date().toISOString(),
        data: {
          title: 'Test',
          message: 'Test message',
        },
        delivered: false,
        createdAt: new Date().toISOString(),
      };

      notificationService.queueNotification(notification, 'farmer1');
      
      const stored = localStorage.getItem('notification_queue_farmer1');
      expect(stored).toBeTruthy();
      const queue = JSON.parse(stored!);
      expect(queue.notifications).toHaveLength(1);
      expect(queue.notifications[0].id).toBe('123');
    });

    it('should process queued notifications', () => {
      const notification = {
        id: '123',
        type: 'scan' as const,
        scheduledFor: new Date().toISOString(),
        data: {
          title: 'Test',
          message: 'Test message',
        },
        delivered: false,
        createdAt: new Date().toISOString(),
      };

      notificationService.queueNotification(notification, 'farmer1');
      
      const mockNotification = vi.fn();
      global.Notification = mockNotification as any;
      global.Notification.permission = 'granted';

      notificationService.processQueue('farmer1');
      
      expect(mockNotification).toHaveBeenCalledWith(
        'Test',
        expect.objectContaining({
          body: 'Test message',
        })
      );
    });

    it('should discard stale notifications older than 24 hours', () => {
      const oldNotification = {
        id: '123',
        type: 'scan' as const,
        scheduledFor: new Date().toISOString(),
        data: {
          title: 'Old Test',
          message: 'Old message',
        },
        delivered: false,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
      };

      notificationService.queueNotification(oldNotification, 'farmer1');
      
      const mockNotification = vi.fn();
      global.Notification = mockNotification as any;
      global.Notification.permission = 'granted';

      notificationService.processQueue('farmer1');
      
      // Should not notify for stale notification
      expect(mockNotification).not.toHaveBeenCalled();
    });

    it('should limit queue size to 50 notifications', () => {
      // Add 60 notifications
      for (let i = 0; i < 60; i++) {
        const notification = {
          id: `notif-${i}`,
          type: 'scan' as const,
          scheduledFor: new Date().toISOString(),
          data: {
            title: `Test ${i}`,
            message: `Message ${i}`,
          },
          delivered: false,
          createdAt: new Date().toISOString(),
        };
        notificationService.queueNotification(notification, 'farmer1');
      }

      const stored = localStorage.getItem('notification_queue_farmer1');
      const queue = JSON.parse(stored!);
      
      // Should only keep the last 50
      expect(queue.notifications).toHaveLength(50);
    });
  });

  describe('Pending Scan Reminders', () => {
    it('should notify about pending scans', () => {
      const mockNotification = vi.fn();
      global.Notification = mockNotification as any;
      global.Notification.permission = 'granted';

      notificationService.notifyPendingScans(3, 'en');
      
      expect(mockNotification).toHaveBeenCalledWith(
        '📋 Pending Scans',
        expect.objectContaining({
          body: 'Update status for 3 scans',
          tag: 'pending-scans',
          requireInteraction: true,
        })
      );
    });

    it('should not notify when count is zero', () => {
      const mockNotification = vi.fn();
      global.Notification = mockNotification as any;
      global.Notification.permission = 'granted';

      notificationService.notifyPendingScans(0, 'en');
      
      expect(mockNotification).not.toHaveBeenCalled();
    });

    it('should respect pending scan preferences', () => {
      notificationService.updatePreferences({ pendingScans: false });
      
      const mockNotification = vi.fn();
      global.Notification = mockNotification as any;
      global.Notification.permission = 'granted';

      notificationService.notifyPendingScans(3, 'en');
      
      expect(mockNotification).not.toHaveBeenCalled();
    });
  });
});
