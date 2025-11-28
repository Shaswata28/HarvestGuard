# Design Document: Scanner Integration

## Overview

The Scanner Integration feature enables farmers to capture images of their paddy crops and receive AI-powered disease detection and treatment recommendations through the Gemini 2.5 Flash API. The system provides a mobile-friendly camera interface, processes images through Google's Gemini vision model configured for Bengali output, and stores results in the existing health journal (HealthScans collection) for long-term tracking and analysis.

The feature integrates seamlessly with the existing agricultural management system, leveraging the current MongoDB schema for HealthScans while adding new server-side components for Gemini API communication and image processing.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Client (React) │
│                 │
│  - Scanner Page │
│  - Camera UI    │
│  - Preview      │
│  - Results View │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────────────────────────────────────┐
│           Server (Express)                      │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  /api/scanner/analyze (POST)             │  │
│  │  - Validates image                       │  │
│  │  - Calls Gemini service                  │  │
│  │  - Stores in HealthScans                 │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Gemini Service                          │  │
│  │  - Image upload to Gemini                │  │
│  │  - Prompt engineering (Bengali)          │  │
│  │  - Response parsing                      │  │
│  │  - Retry logic with backoff              │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │  Image Processing Utilities              │  │
│  │  - Format validation                     │  │
│  │  - Size validation                       │  │
│  │  - Compression (if needed)               │  │
│  └──────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
    ┌────▼─────┐      ┌──────▼────────┐
    │ MongoDB  │      │  Gemini API   │
    │ (Health  │      │  (2.5 Flash)  │
    │  Scans)  │      └───────────────┘
    └──────────┘
```

### Component Interaction Flow

1. **Image Acquisition**: User captures image via camera OR selects from gallery
2. **Client Validation**: Basic format and size checks
3. **Upload**: Image sent to `/api/scanner/analyze` endpoint
4. **Server Processing**: 
   - Validate image format and size
   - Compress if necessary (>10MB)
   - Convert to base64 for Gemini API
5. **Gemini Analysis**:
   - Upload image to Gemini API
   - Send structured prompt in Bengali
   - Receive analysis with diseases, confidence, recommendations
6. **Data Storage**: Parse response and create HealthScan record
7. **Response**: Return structured analysis to client
8. **Display**: Show results with image, detected issues, and recommendations

## Components and Interfaces

### Client Components

#### 1. Scanner Page (`client/pages/Scanner.tsx`)
- Camera interface with capture button
- Gallery upload button for selecting existing images
- Image preview with retake/proceed options
- Crop batch selection dropdown
- Loading state during analysis
- Results display with disease info and recommendations
- Navigation to health journal
- Offline detection and warning

#### 2. Scanner Results Component (`client/components/ScannerResults.tsx`)
- Display analyzed image
- Show detected diseases with confidence levels
- Display recommendations in Bengali
- Action buttons (save notes, view in journal)
- Share/export functionality

### Server Components

#### 1. Scanner Route (`server/routes/scanner.ts`)
```typescript
POST /api/scanner/analyze
- Accepts: multipart/form-data with image file
- Body: { farmerId, batchId?, image: File }
- Returns: HealthScanResponse with analysis
- Validates: image format, size, authentication
```

#### 2. Gemini Service (`server/services/gemini.service.ts`)
```typescript
interface GeminiAnalysisRequest {
  imageBase64: string;
  mimeType: string;
  language: 'bn' | 'en';
}

interface GeminiAnalysisResponse {
  diseases: Array<{
    name: string;
    confidence: number;
    severity: 'low' | 'medium' | 'high';
    affectedArea: string;
  }>;
  overallHealth: 'healthy' | 'minor_issues' | 'major_issues';
  recommendations: string[];
  preventiveMeasures: string[];
}

class GeminiService {
  async analyzeImage(request: GeminiAnalysisRequest): Promise<GeminiAnalysisResponse>
  async uploadImage(imageBase64: string, mimeType: string): Promise<string>
  private buildPrompt(language: string): string
  private parseResponse(rawResponse: any): GeminiAnalysisResponse
  private retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number): Promise<T>
}
```

#### 3. Image Processing Utilities (`server/utils/imageProcessing.ts`)
```typescript
interface ImageValidationResult {
  valid: boolean;
  error?: string;
  size: number;
  format: string;
}

function validateImage(file: Buffer, mimeType: string): ImageValidationResult
function compressImage(file: Buffer, maxSizeBytes: number): Promise<Buffer>
function convertToBase64(file: Buffer): string
```

### Shared Types

```typescript
// Addition to shared/api.ts

export interface AnalyzeScanRequest {
  farmerId: string;
  batchId?: string;
  image: File; // Sent as multipart/form-data
}

export interface AnalyzeScanResponse {
  scan: HealthScanResponse;
  analysis: {
    diseases: Array<{
      name: string;
      confidence: number;
      severity: 'low' | 'medium' | 'high';
      affectedArea: string;
    }>;
    overallHealth: 'healthy' | 'minor_issues' | 'major_issues';
    recommendations: string[];
    preventiveMeasures: string[];
  };
  message: string;
}

export interface ScannerErrorResponse extends ErrorResponse {
  error: {
    type: 'ValidationError' | 'GeminiAPIError' | 'ImageProcessingError' | 'NetworkError';
    message: string;
    details?: {
      geminiError?: string;
      retryAfter?: number;
    };
    timestamp: string;
  };
}
```

## Data Models

### Existing HealthScan Schema (No Changes Required)

The existing `HealthScanSchema` already supports the scanner integration:

```typescript
{
  _id: ObjectId,
  farmerId: ObjectId,           // Links to farmer
  batchId: ObjectId?,           // Optional link to crop batch
  capturedAt: Date,             // Timestamp of scan
  diseaseLabel: string,         // Primary disease detected
  confidence: number,           // 0-100 confidence score
  remedyText: string?,          // Treatment recommendations
  imageUrl: string?,            // URL to stored image
  immediateFeedback: enum?,     // User feedback on accuracy
  outcome: enum?,               // Treatment outcome tracking
  status: enum                  // pending/resolved/healthy
}
```

### Gemini API Integration

The Gemini service will map its response to the HealthScan schema:
- `diseases[0].name` → `diseaseLabel`
- `diseases[0].confidence` → `confidence`
- `recommendations.join('\n')` → `remedyText`
- Uploaded image URL → `imageUrl`
- Default `status` → 'pending'

### Image Storage Strategy

Images will be stored as base64-encoded data URLs in the `imageUrl` field for MVP. Future enhancements could use cloud storage (S3, Cloudinary) with URL references.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 WHEN a farmer accesses the scanner interface THEN the Scanner System SHALL display a camera interface with capture functionality
Thoughts: This is about UI rendering. We can test that the scanner page renders the expected camera interface elements.
Testable: yes - example

1.2 WHEN a farmer captures an image THEN the Scanner System SHALL validate the image format and size before processing
Thoughts: This is a rule that should apply to all images. We can generate random image data with various formats and sizes, and verify that validation correctly accepts/rejects them.
Testable: yes - property

1.3 WHEN an image is validated THEN the Scanner System SHALL display a preview with options to retake or proceed with analysis
Thoughts: This is about UI state after validation. We can test that after validation, the UI contains preview and action buttons.
Testable: yes - example

1.4 WHEN a farmer selects a crop batch for the scan THEN the Scanner System SHALL associate the scan with that specific batch
Thoughts: This is a rule about data relationships. For any scan and batch ID, the created scan record should contain that batch ID.
Testable: yes - property

1.5 WHEN the image file size exceeds 10MB THEN the Scanner System SHALL compress the image while maintaining sufficient quality for analysis
Thoughts: This is about image processing behavior. For any image over 10MB, the output should be smaller while maintaining quality metrics.
Testable: yes - property

2.1 WHEN a farmer submits an image for analysis THEN the Scanner System SHALL send the image to the Gemini API with appropriate prompts for paddy disease detection
Thoughts: This is about API integration. We can test that the Gemini service is called with correct parameters including the image and Bengali language prompt.
Testable: yes - property

2.2 WHEN the Gemini API processes the image THEN the Scanner System SHALL receive structured analysis results including detected anomalies and confidence levels
Thoughts: This is about response parsing. For any valid Gemini response, we should be able to extract diseases and confidence values.
Testable: yes - property

2.3 WHEN the API request fails THEN the Scanner System SHALL retry up to 3 times with exponential backoff before reporting an error
Thoughts: This is about retry logic. We can test that failed requests trigger exactly 3 retries with increasing delays.
Testable: yes - property

2.4 WHEN the analysis completes THEN the Scanner System SHALL parse the AI response into structured data including disease names, severity, and affected areas
Thoughts: This is about data transformation. For any Gemini response, the parsed output should contain all required fields.
Testable: yes - property

2.5 WHEN the Gemini API is unavailable THEN the Scanner System SHALL queue the scan for later processing and notify the farmer
Thoughts: This is about error handling for a specific condition. We can test that API unavailability triggers queuing behavior.
Testable: yes - example

3.1 WHEN anomalies are detected THEN the Scanner System SHALL generate specific treatment recommendations for each identified issue
Thoughts: This is about recommendation generation. For any detected disease, there should be corresponding recommendations.
Testable: yes - property

3.2 WHEN recommendations are generated THEN the Scanner System SHALL include treatment methods, timing, and expected outcomes
Thoughts: This is about recommendation content structure. For any recommendation set, it should contain these specific elements.
Testable: yes - property

3.3 WHEN multiple issues are detected THEN the Scanner System SHALL prioritize recommendations by severity and urgency
Thoughts: This is about ordering logic. For any set of diseases with different severities, recommendations should be ordered correctly.
Testable: yes - property

3.4 WHEN no anomalies are detected THEN the Scanner System SHALL provide preventive care suggestions and confirm healthy crop status
Thoughts: This is about the healthy case. When no diseases are found, the response should indicate healthy status.
Testable: yes - example

3.5 WHEN requesting analysis from Gemini API THEN the Scanner System SHALL configure the API to return responses in Bengali language
Thoughts: This is about API configuration. We can verify that the prompt sent to Gemini specifies Bengali output.
Testable: yes - property

4.1 WHEN a scan analysis completes THEN the Scanner System SHALL create a health scan record in the database with all analysis data
Thoughts: This is about data persistence. For any completed analysis, a corresponding database record should exist.
Testable: yes - property

4.2 WHEN a health scan is created THEN the Scanner System SHALL link it to the associated crop batch and farmer account
Thoughts: This is about referential integrity. For any created scan, the farmerId and batchId should match the request.
Testable: yes - property

4.3 WHEN storing the scan THEN the Scanner System SHALL include the original image, timestamp, detected issues, and recommendations
Thoughts: This is about data completeness. For any stored scan, all required fields should be present.
Testable: yes - property

4.4 WHEN the scan is saved THEN the Scanner System SHALL make it immediately visible in the farmer's health journal
Thoughts: This is about data visibility. After saving, querying the health journal should return the new scan.
Testable: yes - property

4.5 WHEN network connectivity is unavailable THEN the Scanner System SHALL prevent scan submission and inform the farmer that internet connection is required
Thoughts: This is about offline handling. When offline, the submit action should be blocked with an appropriate message.
Testable: yes - example

5.1 WHEN a farmer opens the health journal THEN the Scanner System SHALL display all health scans ordered by date with most recent first
Thoughts: This is about query ordering. For any set of scans, they should be returned in descending date order.
Testable: yes - property

5.2 WHEN displaying scan history THEN the Scanner System SHALL show thumbnail images, scan dates, detected issues, and severity indicators
Thoughts: This is about UI rendering. For any scan list, each item should contain these display elements.
Testable: yes - property

5.3 WHEN a farmer selects a scan THEN the Scanner System SHALL display full details including the original image, all detected anomalies, and recommendations
Thoughts: This is about detail view completeness. For any selected scan, all stored data should be displayed.
Testable: yes - property

5.4 WHEN viewing scan details THEN the Scanner System SHALL allow farmers to add notes about treatments applied
Thoughts: This is about UI functionality. The detail view should have an input mechanism for notes.
Testable: yes - example

5.5 WHEN offline THEN the Scanner System SHALL display cached health journal data from local storage for read-only access
Thoughts: This is about offline data access. When offline, the journal should show cached data.
Testable: yes - example

6.1 WHEN processing scans THEN the Scanner System SHALL track API usage metrics including request count and token consumption
Thoughts: This is about metrics tracking. For any API call, usage counters should be incremented.
Testable: yes - property

6.2 WHEN API usage approaches defined limits THEN the Scanner System SHALL log warnings and notify administrators
Thoughts: This is about threshold monitoring. When usage exceeds a threshold, warnings should be generated.
Testable: yes - property

6.3 WHEN daily limits are exceeded THEN the Scanner System SHALL queue additional scans for the next day and inform farmers
Thoughts: This is about rate limiting. When over limit, scans should be queued rather than rejected.
Testable: yes - example

6.4 WHEN storing API responses THEN the Scanner System SHALL cache results to avoid redundant API calls for the same image
Thoughts: This is about caching behavior. For identical images, the second request should use cached results.
Testable: yes - property

6.5 WHEN an API key is invalid or expired THEN the Scanner System SHALL log the error securely without exposing the key
Thoughts: This is about security. Error logs should not contain the actual API key.
Testable: yes - property

7.1 WHEN invalid image formats are uploaded THEN the Scanner System SHALL reject them with clear error messages specifying accepted formats
Thoughts: This is about validation error messages. For any invalid format, the error should specify what formats are accepted.
Testable: yes - property

7.2 WHEN API errors occur THEN the Scanner System SHALL log detailed error information for debugging while showing user-friendly messages
Thoughts: This is about error handling duality. Errors should be logged with details but displayed simply.
Testable: yes - property

7.3 WHEN network connectivity is lost during upload THEN the Scanner System SHALL preserve the scan attempt and allow retry
Thoughts: This is about upload resilience. Network failures should allow retry without losing data.
Testable: yes - example

7.4 WHEN the Gemini API returns unexpected response formats THEN the Scanner System SHALL handle gracefully and request user to retry
Thoughts: This is about parsing robustness. Unexpected responses should not crash the system.
Testable: yes - property

7.5 WHEN validation fails THEN the Scanner System SHALL maintain application state and allow farmers to correct issues without losing data
Thoughts: This is about state preservation. Validation errors should not clear the form.
Testable: yes - example

### Property Reflection

After reviewing all properties, the following consolidations can be made:

- Properties 4.1, 4.2, 4.3 can be combined into a single comprehensive property about complete scan persistence
- Properties 5.2 and 5.3 can be combined into a property about scan data completeness in display
- Properties 2.2 and 2.4 are redundant - both test response parsing completeness

### Correctness Properties

Property 1: Image validation correctness
*For any* uploaded image file, the validation function should correctly accept valid formats (JPEG, PNG, WebP) under 10MB and reject all others with appropriate error messages
**Validates: Requirements 1.2, 7.1**

Property 2: Image compression preserves quality
*For any* image exceeding 10MB, the compression function should reduce size below 10MB while maintaining visual quality sufficient for disease detection
**Validates: Requirements 1.5**

Property 3: Batch association integrity
*For any* scan request with a batchId, the created HealthScan record should contain that exact batchId
**Validates: Requirements 1.4**

Property 4: Gemini API call structure
*For any* image analysis request, the Gemini service should send a request containing the base64 image, Bengali language specification, and paddy disease detection prompt
**Validates: Requirements 2.1, 3.5**

Property 5: Retry logic correctness
*For any* failed Gemini API request, the system should attempt exactly 3 retries with exponentially increasing delays (1s, 2s, 4s) before returning an error
**Validates: Requirements 2.3**

Property 6: Response parsing completeness
*For any* valid Gemini API response, the parsed result should contain disease names, confidence scores, severity levels, and recommendations
**Validates: Requirements 2.2, 2.4**

Property 7: Recommendation generation completeness
*For any* detected disease, the system should generate recommendations that include treatment methods, timing information, and expected outcomes
**Validates: Requirements 3.1, 3.2**

Property 8: Severity-based prioritization
*For any* set of multiple detected diseases, the recommendations should be ordered with higher severity issues first
**Validates: Requirements 3.3**

Property 9: Complete scan persistence
*For any* completed analysis, the created HealthScan record should contain farmerId, batchId (if provided), image data, timestamp, disease label, confidence, and remedy text
**Validates: Requirements 4.1, 4.2, 4.3**

Property 10: Scan visibility after creation
*For any* newly created scan, querying the health journal for that farmer should return the scan in the results
**Validates: Requirements 4.4**

Property 11: Scan list ordering
*For any* farmer's health journal query, the returned scans should be ordered by capturedAt date in descending order (most recent first)
**Validates: Requirements 5.1**

Property 12: Scan display data completeness
*For any* scan in the health journal, the displayed data should include image, capture date, disease label, confidence, and recommendations
**Validates: Requirements 5.2, 5.3**

Property 13: API usage tracking
*For any* Gemini API call, the usage metrics should increment the request count and token consumption
**Validates: Requirements 6.1**

Property 14: Usage threshold warnings
*For any* API usage that exceeds 80% of daily limits, the system should log a warning message
**Validates: Requirements 6.2**

Property 15: Response caching by image hash
*For any* image that has been analyzed before (same hash), the second analysis should return cached results without calling Gemini API
**Validates: Requirements 6.4**

Property 16: API key security in logs
*For any* error log entry related to Gemini API, the log message should not contain the actual API key value
**Validates: Requirements 6.5**

Property 17: Validation error message clarity
*For any* invalid image upload, the error message should explicitly state the accepted formats and size limits
**Validates: Requirements 7.1**

Property 18: Error logging vs display separation
*For any* API error, the system should log detailed technical information while displaying a simplified user-friendly message to the farmer
**Validates: Requirements 7.2**

Property 19: Unexpected response handling
*For any* Gemini API response that doesn't match the expected schema, the system should return a graceful error without crashing
**Validates: Requirements 7.4**

## Error Handling

### Error Categories

1. **Validation Errors**
   - Invalid image format
   - Image too large (>10MB after compression)
   - Missing required fields
   - Invalid farmerId or batchId

2. **Gemini API Errors**
   - API key invalid/expired
   - Rate limit exceeded
   - Service unavailable
   - Unexpected response format
   - Network timeout

3. **Image Processing Errors**
   - Compression failure
   - Base64 encoding failure
   - Corrupt image data

4. **Database Errors**
   - Failed to create HealthScan record
   - Failed to query health journal
   - Connection issues

### Error Handling Strategy

```typescript
// Centralized error handler
class ScannerError extends Error {
  constructor(
    public type: 'validation' | 'gemini' | 'processing' | 'database',
    public userMessage: string,
    public technicalDetails: string,
    public retryable: boolean = false
  ) {
    super(userMessage);
  }
}

// Error responses include retry guidance
interface ErrorResponse {
  error: {
    type: string;
    message: string;  // User-friendly
    retryable: boolean;
    retryAfter?: number;  // Seconds
  };
  timestamp: string;
}
```

### Retry Logic

- **Gemini API calls**: 3 retries with exponential backoff (1s, 2s, 4s)
- **Database operations**: 2 retries with 500ms delay
- **Image compression**: No retry (fail fast)

### Offline Handling

- Scanner page detects offline state using `navigator.onLine`
- Displays warning banner when offline
- Disables capture/upload buttons
- Health journal switches to read-only mode with cached data

## Testing Strategy

### Unit Testing

Unit tests will cover specific examples and edge cases:

1. **Image Validation Tests**
   - Valid JPEG, PNG, WebP images
   - Invalid formats (GIF, BMP, TIFF)
   - Images at size boundaries (9.9MB, 10MB, 10.1MB)
   - Corrupt image data

2. **Gemini Service Tests**
   - Successful API response parsing
   - Error response handling
   - Retry logic with mocked failures
   - Bengali prompt construction

3. **Image Processing Tests**
   - Compression of oversized images
   - Base64 encoding accuracy
   - Format detection

4. **Integration Tests**
   - End-to-end scan flow with mocked Gemini API
   - Database persistence verification
   - Error propagation through layers

### Property-Based Testing

Property-based tests will verify universal properties across many inputs using a PBT library. We'll use **fast-check** for TypeScript/JavaScript property-based testing.

**Configuration**: Each property test will run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Tagging**: Each property-based test will include a comment tag in this format:
```typescript
// Feature: scanner-integration, Property 1: Image validation correctness
```

Property tests will be implemented for:

1. **Property 1**: Image validation with generated images of various formats and sizes
2. **Property 3**: Batch association with random farmerId and batchId combinations
3. **Property 5**: Retry logic with simulated failures
4. **Property 6**: Response parsing with generated Gemini responses
5. **Property 8**: Severity prioritization with random disease sets
6. **Property 9**: Scan persistence with random analysis data
7. **Property 11**: Scan ordering with random timestamps
8. **Property 13**: Usage tracking with multiple API calls
9. **Property 15**: Cache behavior with duplicate images
10. **Property 16**: API key redaction in logs

### Testing Tools

- **Unit Tests**: Vitest
- **Property-Based Tests**: fast-check
- **API Mocking**: MSW (Mock Service Worker)
- **Database Mocking**: mongodb-memory-server

## Implementation Notes

### Gemini API Integration

The Gemini 2.5 Flash API will be accessed via the official `@google/generative-ai` SDK:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
```

### Bengali Prompt Engineering

The prompt will be structured to ensure Bengali output:

```typescript
const prompt = `
আপনি একজন কৃষি বিশেষজ্ঞ। এই ধান ফসলের ছবি বিশ্লেষণ করুন এবং বাংলায় উত্তর দিন।

নিম্নলিখিত তথ্য প্রদান করুন:
1. সনাক্ত করা রোগ বা সমস্যা (যদি থাকে)
2. প্রতিটি সমস্যার জন্য আত্মবিশ্বাসের স্তর (0-100)
3. তীব্রতা (নিম্ন/মাঝারি/উচ্চ)
4. প্রভাবিত এলাকা
5. চিকিৎসার সুপারিশ
6. প্রতিরোধমূলক ব্যবস্থা

JSON ফরম্যাটে উত্তর দিন।
`;
```

### Image Storage

For MVP, images will be stored as data URLs in MongoDB. Future optimization:
- Move to cloud storage (AWS S3, Cloudinary)
- Store only URLs in database
- Implement image CDN for faster loading

### Performance Considerations

- Image compression before upload reduces bandwidth
- Gemini API response caching reduces costs
- Lazy loading of images in health journal
- Pagination for large scan histories

### Security Considerations

- API key stored in environment variables
- Never exposed to client
- Logged errors sanitized to remove sensitive data
- Image uploads validated for malicious content
- Rate limiting on scanner endpoint to prevent abuse
