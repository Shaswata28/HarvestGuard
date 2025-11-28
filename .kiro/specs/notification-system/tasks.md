# Implementation Plan

- [x] 1. Enhance notification service with new features





  - Extend existing `client/services/notificationService.ts` with advisory and harvest reminder support
  - Add notification preferences management
  - Add offline queue management
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1_

- [x] 2. Implement automatic scan notification trigger


  - Update Scanner page to call notification service after scan completes
  - Pass scan result and language to notification service
  - Handle both healthy and disease detection cases
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 3. Implement advisory notification system


  - Create hook to monitor new advisories on Dashboard
  - Trigger notifications for high and medium severity advisories
  - Track which advisories have been notified to prevent duplicates
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 4. Implement harvest reminder system


  - Create scheduler to check crop harvest dates daily
  - Send reminders at 7, 3, and 1 day before expected harvest
  - Skip reminders for already harvested crops
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Add notification click navigation

  - Implement click handlers for all notification types
  - Navigate to health journal for scan notifications
  - Navigate to dashboard for advisory and harvest notifications
  - _Requirements: 1.4, 3.4, 4.5_

- [x] 6. Implement notification preferences UI


  - Add notification settings section to Profile page
  - Create toggles for each notification type
  - Persist preferences to local storage
  - _Requirements: 5.3, 5.4, 5.5_

- [x] 7. Add offline notification support

  - Implement notification queue in local storage
  - Process queued notifications on app startup
  - Sync queue when coming back online
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 8. Test notification system end-to-end





  - Verify scan notifications work after completing a scan
  - Verify advisory notifications appear on dashboard
  - Verify harvest reminders trigger at correct times
  - Verify pending scan reminders work daily
  - Verify notification preferences are respected
  - Verify offline notifications queue and sync correctly
  - _Requirements: All_
