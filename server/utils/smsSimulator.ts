/**
 * SMS Simulator Module
 * 
 * Simulates SMS notifications by logging to the browser console.
 * Used for demonstrating critical alert capabilities without actual SMS integration.
 */

/**
 * Simulates sending an SMS by logging to the console with proper formatting
 * 
 * @param phoneNumber - The farmer's phone number
 * @param message - The complete advisory message in Bangla
 * @param timestamp - The time the alert was generated
 */
export function simulateSMS(
  phoneNumber: string,
  message: string,
  timestamp: Date
): void {
  const formattedTimestamp = timestamp.toISOString();
  
  const smsLog = [
    '═══════════════════════════════════════════════════════════',
    '📱 SMS ALERT',
    '═══════════════════════════════════════════════════════════',
    `To: ${phoneNumber}`,
    `Time: ${formattedTimestamp}`,
    '───────────────────────────────────────────────────────────',
    `Message:`,
    message,
    '═══════════════════════════════════════════════════════════',
  ].join('\n');
  
  console.log(smsLog);
}
