/**
 * Tests for SMS Simulator Module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { simulateSMS } from './smsSimulator';

describe('smsSimulator', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('simulateSMS', () => {
    it('should log to console when called', () => {
      const phoneNumber = '+8801712345678';
      const message = 'আপনার ধান ফসল ঝুঁকিতে রয়েছে';
      const timestamp = new Date('2024-01-15T10:30:00Z');

      simulateSMS(phoneNumber, message, timestamp);

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });

    it('should include SMS ALERT prefix in log', () => {
      const phoneNumber = '+8801712345678';
      const message = 'আপনার ধান ফসল ঝুঁকিতে রয়েছে';
      const timestamp = new Date('2024-01-15T10:30:00Z');

      simulateSMS(phoneNumber, message, timestamp);

      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('SMS ALERT');
    });

    it('should include phone number in log', () => {
      const phoneNumber = '+8801712345678';
      const message = 'আপনার ধান ফসল ঝুঁকিতে রয়েছে';
      const timestamp = new Date('2024-01-15T10:30:00Z');

      simulateSMS(phoneNumber, message, timestamp);

      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain(phoneNumber);
    });

    it('should include complete message in log', () => {
      const phoneNumber = '+8801712345678';
      const message = 'আপনার ধান ফসল ঝুঁকিতে রয়েছে। অবিলম্বে ব্যবস্থা নিন।';
      const timestamp = new Date('2024-01-15T10:30:00Z');

      simulateSMS(phoneNumber, message, timestamp);

      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain(message);
    });

    it('should include timestamp in log', () => {
      const phoneNumber = '+8801712345678';
      const message = 'আপনার ধান ফসল ঝুঁকিতে রয়েছে';
      const timestamp = new Date('2024-01-15T10:30:00Z');

      simulateSMS(phoneNumber, message, timestamp);

      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('2024-01-15T10:30:00.000Z');
    });

    it('should format log with all required components', () => {
      const phoneNumber = '+8801712345678';
      const message = 'আপনার ধান ফসল ঝুঁকিতে রয়েছে';
      const timestamp = new Date('2024-01-15T10:30:00Z');

      simulateSMS(phoneNumber, message, timestamp);

      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      
      // Check all required components are present
      expect(loggedMessage).toContain('SMS ALERT');
      expect(loggedMessage).toContain(phoneNumber);
      expect(loggedMessage).toContain(message);
      expect(loggedMessage).toContain('2024-01-15T10:30:00.000Z');
    });

    it('should handle Bangla messages correctly', () => {
      const phoneNumber = '+8801712345678';
      const message = 'জরুরি: আপনার ধান গুদামে আর্দ্রতা ৯০% হবে। ফ্যান চালু করুন।';
      const timestamp = new Date();

      simulateSMS(phoneNumber, message, timestamp);

      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain(message);
    });

    it('should handle different phone number formats', () => {
      const phoneNumbers = [
        '+8801712345678',
        '01712345678',
        '+880-171-2345678'
      ];

      phoneNumbers.forEach(phoneNumber => {
        consoleLogSpy.mockClear();
        simulateSMS(phoneNumber, 'Test message', new Date());
        
        const loggedMessage = consoleLogSpy.mock.calls[0][0];
        expect(loggedMessage).toContain(phoneNumber);
      });
    });

    it('should format timestamp as ISO string', () => {
      const phoneNumber = '+8801712345678';
      const message = 'Test message';
      const timestamp = new Date('2024-03-20T15:45:30.500Z');

      simulateSMS(phoneNumber, message, timestamp);

      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('2024-03-20T15:45:30.500Z');
    });
  });
});
