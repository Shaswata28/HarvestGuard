import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AdvisoryResponse } from '@shared/api';

// Mock localStorage for Node.js test environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length() {
      return Object.keys(store).length;
    },
  };
})();

global.localStorage = localStorageMock as Storage;

// Mock Notification API
class MockNotification {
  static permission: NotificationPermission = 'default';
  title: string;
  options?: NotificationOptions;
  onclick: (() => void) | null = null;

  constructor(title: string, options?: NotificationOptions) {
    this.title = title;
    this.options = options;
  }

  close() {}
  
  static requestPermission(): Promise<NotificationPermission> {
    return Promise.resolve('granted' as NotificationPermission);
  }
}

global.Notification = MockNotification as any;

// Mock window object
global.window = {
  Notification: MockNotification,
  setInterval: global.setInterval,
  clearInterval: global.clearInterval,
  location: { href: '' },
} as any;

describe('NotificationService - Smart Alerts', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let notificationService: any;

  beforeEach(async () => {
    // Spy on console.log to verify SMS simulation
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Clear localStorage
    localStorage.clear();
    
    // Dynamically import to get fresh instance
    const module = await import('./notificationService');
    notificationService = module.notificationService;
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should log Critical smart alerts to console in SMS format', () => {
    const criticalAdvisory: AdvisoryResponse = {
      _id: 'test-123',
      farmerId: 'farmer-456',
      source: 'weather',
      payload: {
        message: 'জরুরি: আপনার ধান ফসল ঝুঁকিতে রয়েছে। অবিলম্বে ব্যবস্থা নিন।',
        actions: ['ফ্যান চালু করুন', 'বায়ুচলাচল বাড়ান'],
      },
      status: 'delivered',
      createdAt: new Date().toISOString(),
    };

    notificationService.notifySmartAlert(criticalAdvisory, '01712345678', 'bn');

    // Verify SMS simulation was logged
    expect(consoleLogSpy).toHaveBeenCalled();
    
    // Check for SMS ALERT prefix
    const calls = consoleLogSpy.mock.calls;
    const smsAlertCall = calls.find(call => 
      call.some(arg => typeof arg === 'string' && arg.includes('SMS ALERT'))
    );
    expect(smsAlertCall).toBeDefined();

    // Verify phone number is included
    const phoneCall = calls.find(call =>
      call.some(arg => typeof arg === 'string' && arg.includes('01712345678'))
    );
    expect(phoneCall).toBeDefined();

    // Verify message is included
    const messageCall = calls.find(call =>
      call.some(arg => typeof arg === 'string' && arg.includes('জরুরি'))
    );
    expect(messageCall).toBeDefined();

    // Verify timestamp is included
    const timestampCall = calls.find(call =>
      call.some(arg => typeof arg === 'string' && (arg.includes('Time:') || arg.includes('Timestamp:')))
    );
    expect(timestampCall).toBeDefined();
  });

  it('should handle Bangla messages correctly in smart alerts', () => {
    const banglaCriticalAdvisory: AdvisoryResponse = {
      _id: 'test-bangla',
      farmerId: 'farmer-789',
      source: 'weather',
      payload: {
        message: 'জরুরি: আগামীকাল আর্দ্রতা ৮৫% হবে এবং আপনার ধান খোলা জায়গা গুদামে ঝুঁকি রয়েছে। অবিলম্বে ব্যবস্থা নিন।',
        actions: ['ঢেকে রাখুন', 'সুরক্ষা ব্যবস্থা নিন'],
      },
      status: 'delivered',
      createdAt: new Date().toISOString(),
    };

    notificationService.notifySmartAlert(banglaCriticalAdvisory, '01798765432', 'bn');

    // Verify Bangla text is logged correctly (should be logged because it's critical)
    const calls = consoleLogSpy.mock.calls;
    const banglaCall = calls.find(call =>
      call.some(arg => typeof arg === 'string' && arg.includes('আর্দ্রতা'))
    );
    expect(banglaCall).toBeDefined();
  });

  it('should not log non-Critical alerts to console as SMS', () => {
    const nonCriticalAdvisory: AdvisoryResponse = {
      _id: 'test-non-critical',
      farmerId: 'farmer-999',
      source: 'weather',
      payload: {
        message: 'আগামীকাল বৃষ্টির সম্ভাবনা রয়েছে। সতর্ক থাকুন।',
        actions: ['পরিকল্পনা করুন'],
      },
      status: 'delivered',
      createdAt: new Date().toISOString(),
    };

    consoleLogSpy.mockClear();
    notificationService.notifySmartAlert(nonCriticalAdvisory, '01712345678', 'bn');

    // Should not have SMS ALERT in console for non-critical
    const calls = consoleLogSpy.mock.calls;
    const smsAlertCall = calls.find(call =>
      call.some(arg => typeof arg === 'string' && arg.includes('SMS ALERT'))
    );
    
    // Non-critical alerts should not trigger SMS simulation
    expect(smsAlertCall).toBeUndefined();
  });

  it('should prevent duplicate notifications for same advisory', () => {
    const advisory: AdvisoryResponse = {
      _id: 'test-duplicate',
      farmerId: 'farmer-111',
      source: 'weather',
      payload: {
        message: 'জরুরি: পরীক্ষা বার্তা',
        actions: ['পদক্ষেপ নিন'],
      },
      status: 'delivered',
      createdAt: new Date().toISOString(),
    };

    // First notification
    notificationService.notifySmartAlert(advisory, '01712345678', 'bn');
    const firstCallCount = consoleLogSpy.mock.calls.length;

    // Second notification with same advisory
    consoleLogSpy.mockClear();
    notificationService.notifySmartAlert(advisory, '01712345678', 'bn');
    const secondCallCount = consoleLogSpy.mock.calls.length;

    // Second call should not log anything (duplicate prevention)
    expect(secondCallCount).toBe(0);
  });

  it('should include all required SMS format components', () => {
    const advisory: AdvisoryResponse = {
      _id: 'test-format',
      farmerId: 'farmer-222',
      source: 'weather',
      payload: {
        message: 'Critical: Test message for format validation',
        actions: ['Take action'],
      },
      status: 'delivered',
      createdAt: new Date().toISOString(),
    };

    notificationService.notifySmartAlert(advisory, '01712345678', 'en');

    const allLogs = consoleLogSpy.mock.calls.map(call => call.join(' ')).join('\n');

    // Verify all required components are present
    expect(allLogs).toContain('SMS ALERT');
    expect(allLogs).toContain('Phone:');
    expect(allLogs).toContain('01712345678');
    expect(allLogs).toContain('Message:');
    expect(allLogs).toContain('Critical: Test message');
    expect(allLogs).toContain('Time:');
  });
});
