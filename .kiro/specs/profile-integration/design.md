# Design Document

## Overview

The Profile Integration feature connects the existing Profile page UI with the MongoDB backend API. The profile page will fetch farmer data and statistics from the `/api/dashboard/farmer/:farmerId` endpoint and display comprehensive information including personal details, farming statistics, earned badges, and account management options. The design leverages the existing DashboardService for aggregated metrics and maintains offline-first capabilities through intelligent caching.

## Architecture

### Component Structure

```
Profile Page (client/pages/Profile.tsx)
    ↓
AuthContext (authentication state)
    ↓
API Service Layer (client/services/api.ts)
    ↓
Dashboard API Endpoint (/api/dashboard/farmer/:farmerId)
    ↓
Dashboard Service (server/services/dashboard.service.ts)
    ↓
MongoDB Repositories (farmers, cropBatches, lossEvents, interventions)
```

### Data Flow

1. **Profile Load**: User navigates to `/profile`
2. **Authentication Check**: AuthContext verifies farmerId exists
3. **Data Fetch**: API call to `/api/dashboard/farmer/:farmerId`
4. **Cache Strategy**: Store response in localStorage with timestamp
5. **Display**: Render profile with farmer data and statistics
6. **Offline Handling**: Use cached data when offline, show staleness indicator

### Integration Points

- **AuthContext**: Provides `farmerId` and `farmerData` for authenticated user
- **Dashboard API**: Returns aggregated metrics including badges
- **Crop Batches API**: Used for CSV export functionality
- **Language Context**: Handles Bangla/English translations and number formatting

## Components and Interfaces

### Profile Page Component

**Location**: `client/pages/Profile.tsx`

**Props**: None (uses context hooks)

**State**:
```typescript
interface ProfileState {
  dashboardData: FarmerDashboardResponse | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;
}
```

**Hooks Used**:
- `useAuth()` - Get farmerId and authentication state
- `useLanguage()` - Get current language and translation function
- `useToast()` - Display notifications
- `useNavigate()` - Handle navigation
- `useOnlineStatus()` - Detect online/offline state

### API Service Extension

**Location**: `client/services/api.ts`

**New Method**:
```typescript
async fetchDashboardData(farmerId: string): Promise<FarmerDashboardResponse>
```

Already exists in the current implementation.

### Cache Service

**Location**: `client/services/cache.ts` (new file)

**Purpose**: Manage localStorage caching with TTL and staleness detection

**Interface**:
```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  farmerId: string;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key: string;
}

class CacheService {
  set<T>(key: string, data: T, farmerId: string): void;
  get<T>(key: string, farmerId: string): CacheEntry<T> | null;
  isStale(entry: CacheEntry<any>, ttl: number): boolean;
  clear(key: string): void;
  clearAll(): void;
}
```

## Data Models

### FarmerDashboardResponse (from shared/api.ts)

```typescript
interface FarmerDashboardResponse {
  farmerId: string;
  totalCrops: number;
  totalWeightKg: number;
  growingCrops: number;
  harvestedCrops: number;
  totalLossWeightKg: number;
  totalLossPercentage: number;
  interventionSuccessRate: number;
  badges: string[];
}
```

### Badge Definitions

```typescript
interface BadgeDefinition {
  id: string;
  name: string;
  nameBn: string;
  description: string;
  descriptionBn: string;
  icon: string;
  color: string;
}

const BADGE_MAP: Record<string, BadgeDefinition> = {
  first_harvest: {
    id: 'first_harvest',
    name: 'First Harvest',
    nameBn: 'প্রথম ফসল',
    description: 'Harvested your first crop',
    descriptionBn: 'প্রথম ফসল তোলা হয়েছে',
    icon: '🌾',
    color: 'amber'
  },
  experienced_farmer: {
    id: 'experienced_farmer',
    name: 'Experienced Farmer',
    nameBn: 'অভিজ্ঞ কৃষক',
    description: 'Managed 10+ crops',
    descriptionBn: '১০+ ফসল পরিচালনা',
    icon: '👨‍🌾',
    color: 'green'
  },
  // ... other badges
};
```

## Correctnes
s Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Before defining the correctness properties, let's identify and eliminate redundancy:

**Redundancy Analysis**:
- Properties 2.1-2.4 all test that dashboard data is correctly displayed. These can be combined into a single comprehensive property about dashboard data rendering.
- Properties 6.3-6.5 all test formatting based on language. These can be combined into a single property about locale-aware formatting.
- Properties 3.2 and 3.3 test badge visual states. These can be combined into a single property about badge rendering based on earned status.

**Consolidated Properties**:

Property 1: Profile data display completeness
*For any* farmer with valid profile data, when the profile page renders, the output SHALL contain the farmer's name, phone number, and registration date
**Validates: Requirements 1.1**

Property 2: Unauthenticated redirect
*For any* authentication state where farmerId is null or undefined, the Profile System SHALL call the navigate function with '/login'
**Validates: Requirements 1.3**

Property 3: Dashboard statistics display
*For any* valid FarmerDashboardResponse, when the profile page renders, the output SHALL contain all statistics (totalCrops, totalWeightKg, growingCrops, harvestedCrops) with their correct values
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 4: Badge list completeness
*For any* array of badge IDs returned from the Dashboard Service, the profile page SHALL render a badge component for each badge ID
**Validates: Requirements 3.1**

Property 5: Badge earned state rendering
*For any* badge, the rendered badge component SHALL have earned styling if the badge is in the earned list, and locked styling if it is not
**Validates: Requirements 3.2, 3.3**

Property 6: Logout clears authentication data
*For any* set of authentication-related localStorage keys, when logout is triggered, all authentication keys SHALL be removed from localStorage
**Validates: Requirements 4.1**

Property 7: CSV export data completeness
*For any* array of crop batches, the generated CSV SHALL contain a row for each batch with all required fields (cropType, stage, weight, dates, storage)
**Validates: Requirements 5.1, 5.2**

Property 8: Locale-aware formatting
*For any* language setting ('bn' or 'en'), all numbers and dates SHALL be formatted using the corresponding locale (bn-BD for Bangla, en-US for English)
**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

## Error Handling

### API Error Scenarios

1. **Network Failure**
   - Display user-friendly error message
   - Provide retry button
   - Fall back to cached data if available
   - Show offline indicator

2. **Invalid Farmer ID**
   - Redirect to login page
   - Clear invalid authentication state
   - Display error toast

3. **Server Error (5xx)**
   - Display generic error message
   - Log error details for debugging
   - Provide retry option
   - Use cached data if available

4. **Unauthorized (401)**
   - Clear authentication state
   - Redirect to login page
   - Display session expired message

### Client-Side Error Scenarios

1. **Missing Farmer Data**
   - Redirect to registration page
   - Display "No profile found" message
   - Provide registration button

2. **Cache Corruption**
   - Clear corrupted cache entry
   - Fetch fresh data from API
   - Log error for monitoring

3. **Export Failure**
   - Display specific error message
   - Provide retry option
   - Log error details

### Error Recovery Strategies

```typescript
interface ErrorRecoveryStrategy {
  useCache: boolean;
  retry: boolean;
  redirect?: string;
  fallbackData?: any;
}

const ERROR_STRATEGIES: Record<string, ErrorRecoveryStrategy> = {
  NetworkError: { useCache: true, retry: true },
  AuthenticationError: { useCache: false, retry: false, redirect: '/login' },
  NotFoundError: { useCache: false, retry: false, redirect: '/register' },
  ServerError: { useCache: true, retry: true },
};
```

## Testing Strategy

### Unit Testing

**Framework**: Vitest with React Testing Library

**Test Files**:
- `client/pages/Profile.test.tsx` - Profile component tests
- `client/services/cache.test.ts` - Cache service tests
- `client/services/api.test.ts` - API service tests (extend existing)

**Unit Test Coverage**:
1. Profile component renders with valid data
2. Loading state displays correctly
3. Error state displays with retry button
4. Logout button triggers logout flow
5. Export button triggers CSV download
6. Language switching updates UI text
7. Cache service stores and retrieves data correctly
8. Cache staleness detection works
9. CSV generation creates valid format
10. Badge rendering shows correct states

### Property-Based Testing

**Framework**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Property Test Files**:
- `client/pages/Profile.pbt.test.tsx` - Property-based tests for Profile component
- `client/services/cache.pbt.test.ts` - Property-based tests for cache service

**Property Tests** (each tagged with design doc reference):

1. **Profile data display completeness** - Generate random farmer data, verify all fields appear in rendered output
2. **Unauthenticated redirect** - Generate various invalid auth states, verify navigation to login
3. **Dashboard statistics display** - Generate random dashboard responses, verify all stats are rendered
4. **Badge list completeness** - Generate random badge arrays, verify all badges are rendered
5. **Badge earned state rendering** - Generate random earned/unearned badge combinations, verify correct styling
6. **Logout clears authentication data** - Set up random auth keys, verify all are cleared on logout
7. **CSV export data completeness** - Generate random crop batch arrays, verify CSV contains all data
8. **Locale-aware formatting** - Generate random numbers and dates, verify correct locale formatting for both languages

### Integration Testing

**Scope**: End-to-end profile page flow with mocked API

**Test Scenarios**:
1. Complete profile load flow (auth → fetch → display)
2. Offline-to-online transition with cache refresh
3. Logout flow with state cleanup
4. Export flow with CSV download
5. Error recovery with retry

### Manual Testing Checklist

1. Profile loads correctly for authenticated user
2. Badges display with correct earned/locked states
3. Statistics match dashboard data
4. Language switching works for all text
5. Bangla numbers display correctly
6. Export downloads valid CSV file
7. Logout clears all data and redirects
8. Offline mode shows cached data
9. Error states display with retry options
10. Loading states appear during data fetch

## Performance Considerations

### Caching Strategy

- **Cache Key**: `harvestguard_profile_${farmerId}`
- **TTL**: 5 minutes (300,000 ms)
- **Staleness Indicator**: Show "Last updated X minutes ago" if cache is older than 2 minutes
- **Cache Invalidation**: Clear on logout, clear on explicit refresh

### Optimization Techniques

1. **Lazy Loading**: Load badge definitions only when needed
2. **Memoization**: Use React.memo for badge components
3. **Debouncing**: Debounce retry button to prevent spam
4. **Batch Updates**: Update all localStorage keys in single operation

### Bundle Size Impact

- **New Dependencies**: None (uses existing libraries)
- **Code Size**: ~5KB for cache service, ~2KB for CSV export logic
- **Total Impact**: Minimal (~7KB gzipped)

## Security Considerations

### Data Protection

1. **Sensitive Data**: Never cache password or session tokens
2. **Farmer ID Validation**: Always validate farmerId format before API calls
3. **XSS Prevention**: Sanitize all user-generated content before display
4. **CSRF Protection**: Use existing CSRF tokens for API requests

### Authentication

1. **Token Expiry**: Check token validity before API calls
2. **Session Management**: Clear all auth data on logout
3. **Unauthorized Access**: Redirect to login if 401 received

### Privacy

1. **Data Minimization**: Only cache necessary profile data
2. **Local Storage**: Clear sensitive data on logout
3. **Export Security**: Only export data for authenticated farmer

## Deployment Considerations

### Backward Compatibility

- Profile page will gracefully fall back to offline storage if API is unavailable
- Existing offline storage data will be migrated on first login
- No breaking changes to existing components

### Migration Strategy

1. **Phase 1**: Deploy backend changes (already complete)
2. **Phase 2**: Update Profile page to use API
3. **Phase 3**: Add cache service
4. **Phase 4**: Implement CSV export with API data
5. **Phase 5**: Remove old offline storage dependencies

### Rollback Plan

- Keep offline storage code as fallback
- Feature flag to toggle between API and offline storage
- Monitor error rates and revert if issues arise

## Dependencies

### Existing Dependencies

- `react` - UI framework
- `react-router-dom` - Navigation
- `framer-motion` - Animations
- `lucide-react` - Icons
- `@/components/ui/*` - UI components
- `@/context/AuthContext` - Authentication
- `@/context/LangContext` - Internationalization
- `@/hooks/use-toast` - Notifications
- `@/hooks/useOnlineStatus` - Network status
- `@/lib/utils` - Utility functions (toBanglaDigits, cn)

### New Dependencies

None - all functionality can be implemented with existing dependencies

## Future Enhancements

1. **Profile Editing**: Allow farmers to update their profile information
2. **Avatar Upload**: Enable profile picture uploads
3. **Achievement Animations**: Add celebratory animations when badges are earned
4. **Social Sharing**: Share achievements on social media
5. **Profile Analytics**: Show farming trends and insights
6. **Offline Sync**: Queue profile updates when offline and sync when online
7. **Push Notifications**: Notify farmers when new badges are earned
8. **Leaderboards**: Show top farmers by region or crop type
