# Design Document

## Overview

The enhanced notification system provides timely, actionable alerts to farmers about crop health, weather conditions, and harvest schedules. The system leverages browser notifications for out-of-app alerts and toast notifications for in-app feedback, with offline support through local storage and service worker integration.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Application                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Notification Components                     │  │
│  │  - Scanner Page (triggers scan notifications)        │  │
│  │  - Dashboard (displays advisories)                   │  │
│  │  - Health Journal (shows pending scans)              │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Enhanced Notification Service                 │  │
│  │  - Permission Management                              │  │
│  │  - Notification Scheduling                            │  │
│  │  - Preference Storage                                 │  │
│  │  - Offline Queue Management                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Notification Channels                    │  │
│  │  - Browser Notifications (Web Notifications API)     │  │
│  │  - Toast Notifications (shadcn/ui)                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                   Local Storage                              │
│  - Notification Preferences                                  │
│  - Scheduled Notifications                                   │
│  - Offline Notification Queue                                │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **Scan Completion Flow**:
   - Scanner page completes analysis → Calls notification service → Displays browser/toast notification
   
2. **Advisory Flow**:
   - Dashboard fetches advisories → Checks for new high-priority items → Triggers notifications
   
3. **Harvest Reminder Flow**:
   - Background scheduler checks crop dates → Identifies upcoming harvests → Sends reminders
   
4. **Pending Scan Reminder Flow**:
   - Daily scheduler runs → Queries pending scans → Sends reminder if count > 0

## Components and Interfaces

### Enhanced Notification Service

```typescript
interface NotificationPreferences {
  scanResults: boolean;
  pendingScans: boolean;
  weatherAdvisories: boolean;
  harvestReminders: boolean;
}

interface ScheduledNotification {
  id: string;
  type: 'scan' | 'advisory' | 'harvest' | 'pending';
  scheduledFor: string; // ISO date
  data: any;
  delivered: boolean;
}

interface NotificationQueue {
  notifications: ScheduledNotification[];
  lastSync: string;
}

class EnhancedNotificationService {
  // Permission management
  requestPermission(): Promise<boolean>;
  hasPermission(): boolean;
  
  // Notification display
  notifyScanComplete(scan: HealthScanResponse, language: 'bn' | 'en'): void;
  notifyAdvisory(advisory: Advisory, language: 'bn' | 'en'): void;
  notifyHarvestReminder(crop: CropBatchResponse, daysUntil: number, language: 'bn' | 'en'): void;
  notifyPendingScans(count: number, language: 'bn' | 'en'): void;
  
  // Scheduling
  scheduleHarvestReminders(crops: CropBatchResponse[]): void;
  scheduleDailyPendingScanCheck(farmerId: string, language: 'bn' | 'en'): void;
  
  // Preferences
  getPreferences(): NotificationPreferences;
  updatePreferences(prefs: Partial<NotificationPreferences>): void;
  
  // Offline support
  queueNotification(notification: ScheduledNotification): void;
  processQueue(): void;
  syncWithServer(): Promise<void>;
}
```

### Notification Scheduler Hook

```typescript
interface UseNotificationSchedulerOptions {
  farmerId: string;
  language: 'bn' | 'en';
  enabled: boolean;
}

function useNotificationScheduler(options: UseNotificationSchedulerOptions): {
  isScheduled: boolean;
  lastCheck: Date | null;
  reschedule: () => void;
}
```

### Advisory Notification Hook

```typescript
interface UseAdvisoryNotificationsOptions {
  advisories: Advisory[];
  language: 'bn' | 'en';
}

function useAdvisoryNotifications(options: UseAdvisoryNotificationsOptions): {
  notifiedAdvisories: Set<string>;
  markAsNotified: (advisoryId: string) => void;
}
```

## Data Models

### Notification Preferences (Local Storage)

```typescript
{
  farmerId: string;
  preferences: {
    scanResults: boolean;
    pendingScans: boolean;
    weatherAdvisories: boolean;
    harvestReminders: boolean;
  };
  updatedAt: string; // ISO date
}
```

### Scheduled Notification (Local Storage)

```typescript
{
  id: string; // UUID
  type: 'scan' | 'advisory' | 'harvest' | 'pending';
  scheduledFor: string; // ISO date
  data: {
    // Type-specific data
    scanId?: string;
    advisoryId?: string;
    cropId?: string;
    message: string;
    title: string;
  };
  delivered: boolean;
  createdAt: string; // ISO date
}
```

### Notification Queue (Local Storage)

```typescript
{
  farmerId: string;
  notifications: ScheduledNotification[];
  lastSync: string; // ISO date
  version: number; // For migration support
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Scan notification delivery

*For any* completed health scan, if notification preferences allow scan notifications, then a notification should be displayed to the user either as a browser notification or toast notification.

**Validates: Requirements 1.1, 1.5**

### Property 2: Notification permission fallback

*For any* notification attempt, if browser notification permission is denied, then the system should display a toast notification with equivalent information.

**Validates: Requirements 1.5, 5.2**

### Property 3: Pending scan reminder scheduling

*For any* farmer with pending scans, if the daily reminder is enabled in preferences, then a reminder notification should be scheduled exactly once per 24-hour period.

**Validates: Requirements 2.1, 2.5**

### Property 4: Advisory notification priority

*For any* high-severity advisory, the notification should be displayed immediately, while medium-severity advisories should be displayed within 5 minutes.

**Validates: Requirements 3.1, 3.2**

### Property 5: Harvest reminder timing

*For any* crop batch with an expected harvest date, reminders should be sent at exactly 7 days, 3 days, and 1 day before the expected date, and no reminders should be sent after the crop is harvested.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 6: Preference persistence

*For any* notification preference change, the updated preferences should be immediately persisted to local storage and applied to all subsequent notification decisions.

**Validates: Requirements 5.5**

### Property 7: Offline notification queuing

*For any* notification triggered while offline, it should be added to the offline queue and processed when the application is next opened, unless it is older than 24 hours.

**Validates: Requirements 6.2, 6.5**

### Property 8: Notification navigation

*For any* notification click event, the application should navigate to the appropriate page based on the notification type (health journal for scans, dashboard for advisories and harvests).

**Validates: Requirements 1.4, 3.4, 4.5**

## Error Handling

### Permission Denied

- **Scenario**: User denies browser notification permission
- **Handling**: Fall back to toast notifications, store preference, show one-time message explaining the limitation
- **Recovery**: Provide settings option to re-request permission

### Notification API Unavailable

- **Scenario**: Browser doesn't support Notification API
- **Handling**: Use toast notifications exclusively, log warning to console
- **Recovery**: None needed, toast notifications are sufficient

### Scheduling Conflicts

- **Scenario**: Multiple notifications scheduled for the same time
- **Handling**: Batch notifications of the same type, display sequentially with 2-second delay
- **Recovery**: None needed, all notifications will be delivered

### Offline Queue Overflow

- **Scenario**: Too many notifications queued offline (>50)
- **Handling**: Keep only the 50 most recent, discard older ones
- **Recovery**: Sync with server when online to check for missed critical notifications

### Invalid Notification Data

- **Scenario**: Notification data is malformed or missing required fields
- **Handling**: Log error, skip notification, don't crash the service
- **Recovery**: None needed, individual notification failure doesn't affect others

## Testing Strategy

### Unit Testing

- Test notification service methods with various input combinations
- Test preference storage and retrieval
- Test offline queue management (add, process, clear)
- Test notification scheduling logic
- Test fallback behavior when permissions are denied

### Property-Based Testing

Property-based tests will use `fast-check` library for TypeScript/JavaScript. Each test will run a minimum of 100 iterations with randomly generated inputs.

- **Property 1**: Test scan notification delivery with random scan results and preference combinations
- **Property 2**: Test permission fallback with random notification types
- **Property 3**: Test pending scan reminder scheduling with random time intervals
- **Property 4**: Test advisory notification priority with random severity levels
- **Property 5**: Test harvest reminder timing with random crop dates
- **Property 6**: Test preference persistence with random preference changes
- **Property 7**: Test offline notification queuing with random online/offline states
- **Property 8**: Test notification navigation with random notification types

### Integration Testing

- Test end-to-end flow from scan completion to notification display
- Test advisory notification flow from dashboard load to notification
- Test harvest reminder flow from crop creation to reminder delivery
- Test offline-to-online sync of queued notifications
- Test notification click navigation to correct pages

### Manual Testing

- Verify browser notifications appear correctly on different browsers
- Verify toast notifications display with correct styling
- Verify notification sounds (if implemented)
- Verify notification persistence across app restarts
- Verify Bengali and English translations

## Implementation Notes

### Browser Notification API

- Use the Web Notifications API for browser notifications
- Request permission on first app load or when user enables notifications
- Handle permission states: 'granted', 'denied', 'default'
- Use notification tags to prevent duplicate notifications

### Scheduling Strategy

- Use `setInterval` for daily reminders (24-hour intervals)
- Use `setTimeout` for one-time scheduled notifications
- Store scheduled notification IDs in local storage for persistence
- Clear intervals/timeouts when component unmounts

### Offline Support

- Store notification queue in local storage with farmerId key
- Process queue on app startup and when coming online
- Sync queue with server to get missed notifications
- Implement exponential backoff for sync retries

### Performance Considerations

- Debounce advisory notifications to prevent spam
- Batch multiple notifications of the same type
- Limit notification history to last 100 notifications
- Clean up old scheduled notifications (>7 days old)

### Accessibility

- Ensure toast notifications are screen-reader friendly
- Provide keyboard navigation for notification actions
- Use ARIA live regions for dynamic notification updates
- Ensure sufficient color contrast for notification UI

### Localization

- Support Bengali and English for all notification text
- Use the language context to determine notification language
- Provide translations for all notification types
- Format dates and numbers according to locale
