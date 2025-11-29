# Design Document

## Overview

The Smart Alert System is a decision engine that generates contextual, actionable farming advisories by combining weather data, crop information, and risk assessment logic. The system extends the existing advisory infrastructure to produce specific recommendations in Bangla that reference actual crop types, storage conditions, and weather parameters. When critical risk levels are detected, the system simulates SMS notifications via browser console logging.

The design integrates with existing services (WeatherService, CropBatchesRepository, AdvisoryService) and adds a new SmartAlertService that implements the decision engine logic.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Weather Data Source                       │
│              (OpenWeatherMap via WeatherService)             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Smart Alert Service                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Decision Engine Core                       │   │
│  │  • Risk Calculator                                   │   │
│  │  • Advisory Generator                                │   │
│  │  • Message Formatter (Bangla)                        │   │
│  └──────────────────────────────────────────────────────┘   │
└───────┬─────────────────────────────────┬──────────────────┘
        │                                 │
        ▼                                 ▼
┌──────────────────┐            ┌──────────────────────┐
│  Crop Batches    │            │  Advisory Service    │
│  Repository      │            │  (Storage)           │
└──────────────────┘            └──────────────────────┘
                                          │
                                          ▼
                                ┌──────────────────────┐
                                │  SMS Simulator       │
                                │  (Console Logger)    │
                                └──────────────────────┘
```

### Data Flow

1. Weather data is fetched for a farmer's location
2. Smart Alert Service retrieves farmer's crop batches (growing + harvested)
3. Decision Engine evaluates each crop against weather conditions
4. Risk Calculator determines severity level for each crop-weather combination
5. Advisory Generator creates specific Bangla messages with action items
6. Advisories are stored via AdvisoryService
7. Critical alerts trigger SMS simulation in console

## Components and Interfaces

### SmartAlertService

Primary service that orchestrates the decision engine.

```typescript
interface SmartAlertService {
  /**
   * Generates smart alerts for a farmer based on current weather
   */
  generateAlertsForFarmer(
    farmerId: ObjectId,
    weather: WeatherData
  ): Promise<SmartAlert[]>;
  
  /**
   * Evaluates risk level for a specific crop and weather combination
   */
  calculateRiskLevel(
    crop: CropBatch,
    weather: WeatherData
  ): RiskLevel;
  
  /**
   * Generates advisory message in Bangla
   */
  generateAdvisoryMessage(
    crop: CropBatch,
    weather: WeatherData,
    riskLevel: RiskLevel
  ): AdvisoryMessage;
}
```

### RiskCalculator

Evaluates threat levels based on multiple factors.

```typescript
interface RiskCalculator {
  /**
   * Calculates storage risk based on humidity, temperature, and storage type
   */
  calculateStorageRisk(
    crop: CropBatch,
    weather: WeatherData
  ): RiskAssessment;
  
  /**
   * Calculates growing crop risk based on weather patterns
   */
  calculateGrowingRisk(
    crop: CropBatch,
    weather: WeatherData
  ): RiskAssessment;
  
  /**
   * Determines overall risk level from multiple assessments
   */
  determineOverallRisk(
    assessments: RiskAssessment[]
  ): RiskLevel;
}
```

### AdvisoryMessageFormatter

Generates Bangla messages with specific details.

```typescript
interface AdvisoryMessageFormatter {
  /**
   * Formats storage risk advisory in Bangla
   */
  formatStorageAdvisory(
    crop: CropBatch,
    weather: WeatherData,
    risk: RiskAssessment
  ): string;
  
  /**
   * Formats growing crop advisory in Bangla
   */
  formatGrowingAdvisory(
    crop: CropBatch,
    weather: WeatherData,
    risk: RiskAssessment
  ): string;
  
  /**
   * Generates action items based on risk factors
   */
  generateActionItems(
    crop: CropBatch,
    weather: WeatherData,
    risk: RiskAssessment
  ): string[];
}
```

### SMSSimulator

Logs critical alerts to console in SMS format.

```typescript
interface SMSSimulator {
  /**
   * Simulates SMS notification in browser console
   */
  simulateSMS(
    phoneNumber: string,
    message: string,
    timestamp: Date
  ): void;
}
```

## Data Models

### SmartAlert

```typescript
interface SmartAlert {
  farmerId: ObjectId;
  cropId: ObjectId;
  cropType: string;
  stage: 'growing' | 'harvested';
  riskLevel: RiskLevel;
  message: string;
  actions: string[];
  weatherConditions: {
    temperature: number;
    humidity: number;
    rainfall: number;
    windSpeed: number;
  };
  storageInfo?: {
    location: string;
    division: string;
    district: string;
  };
  generatedAt: Date;
}
```

### RiskLevel

```typescript
type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
```

### RiskAssessment

```typescript
interface RiskAssessment {
  level: RiskLevel;
  factors: RiskFactor[];
  score: number; // 0-100
  primaryThreat: string;
}

interface RiskFactor {
  type: 'humidity' | 'temperature' | 'rainfall' | 'wind' | 'storage' | 'harvest_timing';
  severity: number; // 0-100
  description: string;
}
```

### AdvisoryMessage

```typescript
interface AdvisoryMessage {
  message: string; // Full Bangla message
  actions: string[]; // Array of action items in Bangla
  riskLevel: RiskLevel;
}
```

### Risk Thresholds

```typescript
const RISK_THRESHOLDS = {
  humidity: {
    low: 60,
    medium: 70,
    high: 80,
    critical: 90
  },
  temperature: {
    low: 30,
    medium: 35,
    high: 38,
    critical: 42
  },
  rainfall: {
    low: 20,
    medium: 50,
    high: 100,
    critical: 150
  },
  windSpeed: {
    low: 5,
    medium: 10,
    high: 15,
    critical: 20
  }
};

const STORAGE_VULNERABILITY = {
  'open_space': 1.5,  // 50% more vulnerable
  'jute_bag': 1.2,    // 20% more vulnerable
  'tin_shed': 1.1,    // 10% more vulnerable
  'silo': 1.0         // baseline
};
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Acceptance Criteria Testing Prework

1.1 WHEN the system generates an advisory THEN the system SHALL include the specific crop type affected in the message
  Thoughts: This is a rule that should apply to all advisories generated by the system. We can generate random crop batches and weather data, generate advisories, and verify that each advisory message contains the crop type from the input.
  Testable: yes - property

1.2 WHEN the system generates an advisory THEN the system SHALL include specific weather conditions (temperature, humidity, rainfall) in the message
  Thoughts: This applies to all advisories. We can generate random weather data, create advisories, and verify that the message contains the weather parameters.
  Testable: yes - property

1.3 WHEN the system generates an advisory THEN the system SHALL provide at least one concrete action item in Bangla
  Thoughts: This is a universal requirement for all advisories. We can verify that the actions array has length >= 1 for any generated advisory.
  Testable: yes - property

1.4 WHEN the system generates an advisory THEN the system SHALL format the message in clear Bangla text
  Thoughts: This is about message format. We can verify that messages contain Bangla characters (Unicode range check) for all generated advisories.
  Testable: yes - property

1.5 WHEN multiple crops are affected THEN the system SHALL generate separate advisories for each crop type with crop-specific guidance
  Thoughts: This is about the relationship between input crops and output advisories. For any farmer with N crops, we should get N advisories (or fewer if some don't trigger alerts).
  Testable: yes - property

2.1 WHEN humidity exceeds 80% and a farmer has stored crops THEN the system SHALL generate a storage-specific advisory
  Thoughts: This is a specific trigger condition. We can test that for any stored crop with humidity > 80%, an advisory is generated.
  Testable: yes - property

2.2 WHEN the system generates a storage advisory THEN the system SHALL reference the specific storage location type
  Thoughts: For all storage advisories, the message should contain the storage location type from the crop batch.
  Testable: yes - property

2.3 WHEN the system generates a storage advisory THEN the system SHALL include the storage division and district in the message
  Thoughts: For all storage advisories, the message should contain both division and district.
  Testable: yes - property

2.4 WHEN temperature and humidity create mold risk THEN the system SHALL recommend specific ventilation actions
  Thoughts: This is about action content when specific conditions are met. We can verify that when temp + humidity exceed thresholds, the actions include ventilation-related terms.
  Testable: yes - property

2.5 WHEN rainfall is predicted and crops are in open storage THEN the system SHALL recommend immediate protective measures
  Thoughts: This is a conditional requirement. When rainfall > threshold AND storage = 'open_space', actions should include protective measures.
  Testable: yes - property

3.1 WHEN extreme weather conditions are detected THEN the system SHALL generate advisories for all growing stage crops
  Thoughts: For any farmer with growing crops, when weather exceeds thresholds, advisories should be generated for each growing crop.
  Testable: yes - property

3.2 WHEN the system generates a growing crop advisory THEN the system SHALL reference the expected harvest date if within 7 days
  Thoughts: For growing crop advisories where harvest date is within 7 days, the message should mention the harvest date.
  Testable: yes - property

3.3 WHEN heavy rainfall is predicted THEN the system SHALL recommend drainage and harvesting delay actions
  Thoughts: When rainfall exceeds threshold, actions should include drainage or harvest delay terms.
  Testable: yes - property

3.4 WHEN high temperatures threaten crops THEN the system SHALL recommend irrigation and shade measures
  Thoughts: When temperature exceeds threshold, actions should include irrigation or shade-related terms.
  Testable: yes - property

3.5 WHEN strong winds are detected THEN the system SHALL recommend staking and securing actions
  Thoughts: When wind speed exceeds threshold, actions should include staking or securing terms.
  Testable: yes - property

4.1 WHEN the system evaluates conditions THEN the system SHALL calculate a risk level (Low, Medium, High, Critical)
  Thoughts: For any evaluation, the output risk level must be one of the four valid values.
  Testable: yes - property

4.2 WHEN calculating risk level THEN the system SHALL consider weather severity thresholds
  Thoughts: Risk level should increase as weather parameters exceed defined thresholds. This is a monotonicity property.
  Testable: yes - property

4.3 WHEN calculating risk level THEN the system SHALL consider crop vulnerability based on type and stage
  Thoughts: For the same weather, different crop types/stages should potentially yield different risk levels.
  Testable: yes - property

4.4 WHEN calculating risk level THEN the system SHALL consider storage type vulnerability
  Thoughts: For the same weather and crop, different storage types should yield different risk levels (open_space > silo).
  Testable: yes - property

4.5 WHEN multiple risk factors are present THEN the system SHALL use the highest risk level for the advisory
  Thoughts: This is a maximum property. The overall risk should equal the maximum of individual risk factors.
  Testable: yes - property

5.1 WHEN risk level reaches Critical THEN the system SHALL log an SMS simulation to the browser console
  Thoughts: For any advisory with Critical risk, console.log should be called with SMS format.
  Testable: yes - property

5.2 WHEN the system logs an SMS simulation THEN the system SHALL include the farmer's phone number
  Thoughts: All SMS simulations should contain the phone number in the log output.
  Testable: yes - property

5.3 WHEN the system logs an SMS simulation THEN the system SHALL include the complete advisory message in Bangla
  Thoughts: All SMS simulations should contain the full message text.
  Testable: yes - property

5.4 WHEN the system logs an SMS simulation THEN the system SHALL include a timestamp
  Thoughts: All SMS simulations should contain a timestamp in the log.
  Testable: yes - property

5.5 WHEN the system logs an SMS simulation THEN the system SHALL format the log with clear "SMS ALERT" prefix
  Thoughts: All SMS simulation logs should start with "SMS ALERT" prefix.
  Testable: yes - property

6.1 WHEN weather data is fetched for a farmer THEN the system SHALL automatically trigger the decision engine
  Thoughts: This is about integration behavior. We can test that fetching weather calls the smart alert service.
  Testable: yes - example

6.2 WHEN the decision engine runs THEN the system SHALL retrieve all active crop batches for the farmer
  Thoughts: The decision engine should query for all crops (both growing and harvested) for the farmer.
  Testable: yes - property

6.3 WHEN the decision engine runs THEN the system SHALL evaluate both growing and harvested crops
  Thoughts: For any farmer with both crop types, both should be evaluated.
  Testable: yes - property

6.4 WHEN the decision engine generates advisories THEN the system SHALL store them in the advisories collection
  Thoughts: All generated advisories should result in database records.
  Testable: yes - property

6.5 WHEN the decision engine completes THEN the system SHALL return the count of generated advisories
  Thoughts: The return value should equal the number of advisories created.
  Testable: yes - property

7.1 WHEN the system generates an advisory THEN the system SHALL include between 2 and 5 action items
  Thoughts: For all advisories, actions.length should be >= 2 and <= 5.
  Testable: yes - property

7.2 WHEN the system generates action items THEN the system SHALL make each action specific and measurable
  Thoughts: This is about action quality, which is subjective. We can check for minimum length or keyword presence.
  Testable: yes - property

7.3 WHEN the system generates action items THEN the system SHALL prioritize actions by urgency
  Thoughts: This is about ordering. More urgent actions should appear first in the array.
  Testable: yes - property

7.4 WHEN the system generates action items THEN the system SHALL write all actions in Bangla
  Thoughts: All action strings should contain Bangla characters.
  Testable: yes - property

7.5 WHEN storage risks are detected THEN the system SHALL include equipment-specific actions
  Thoughts: Storage risk advisories should include specific equipment terms in Bangla.
  Testable: yes - property

8.1 WHEN evaluating risk THEN the system SHALL use clearly defined threshold constants
  Thoughts: This is about code structure, not runtime behavior.
  Testable: no

8.2 WHEN generating messages THEN the system SHALL use template functions with parameter substitution
  Thoughts: This is about implementation approach, not functional behavior.
  Testable: no

8.3 WHEN adding new crop types THEN the system SHALL support crop-specific vulnerability mappings
  Thoughts: This is about extensibility, not a testable property.
  Testable: no

8.4 WHEN adding new weather patterns THEN the system SHALL support extensible risk evaluation rules
  Thoughts: This is about architecture, not a testable property.
  Testable: no

8.5 WHEN the system generates advisories THEN the system SHALL log decision rationale for debugging
  Thoughts: This is about logging behavior. We can verify that console.log is called with rationale.
  Testable: yes - property

### Property Reflection

After reviewing all testable properties, I've identified the following consolidations:

- Properties 1.1, 1.2, 2.2, 2.3 can be combined into a single comprehensive property about message content completeness
- Properties 3.3, 3.4, 3.5 can be combined into a single property about weather-specific action recommendations
- Properties 5.2, 5.3, 5.4, 5.5 can be combined into a single property about SMS format completeness
- Properties 7.2 and 7.4 can be combined into a single property about action item quality

### Correctness Properties

Property 1: Advisory message completeness
*For any* generated advisory, the message should contain the crop type, at least one weather parameter (temperature, humidity, or rainfall), and for storage advisories, the storage location type, division, and district
**Validates: Requirements 1.1, 1.2, 2.2, 2.3**

Property 2: Minimum action items
*For any* generated advisory, the actions array should contain at least one action item
**Validates: Requirements 1.3**

Property 3: Bangla message format
*For any* generated advisory, the message should contain Bangla Unicode characters (U+0980 to U+09FF range)
**Validates: Requirements 1.4**

Property 4: One advisory per crop
*For any* farmer with N crops that trigger alerts, the system should generate N separate advisories
**Validates: Requirements 1.5**

Property 5: Storage advisory trigger
*For any* harvested crop batch when humidity exceeds 80%, the system should generate at least one advisory
**Validates: Requirements 2.1**

Property 6: Mold risk ventilation actions
*For any* advisory where temperature > 30°C AND humidity > 80%, the actions should include ventilation-related terms (ফ্যান, বায়ুচলাচল, or ventilation)
**Validates: Requirements 2.4**

Property 7: Open storage rainfall protection
*For any* harvested crop in open_space storage when rainfall > 20mm, the actions should include protective measure terms (সুরক্ষা, ঢেকে, or cover)
**Validates: Requirements 2.5**

Property 8: Growing crop advisory generation
*For any* farmer with growing stage crops when any weather parameter exceeds high threshold, at least one advisory should be generated for growing crops
**Validates: Requirements 3.1**

Property 9: Imminent harvest date reference
*For any* growing crop advisory where expected harvest date is within 7 days, the message should reference the harvest timing
**Validates: Requirements 3.2**

Property 10: Weather-specific action recommendations
*For any* advisory, when rainfall > 50mm, actions should include drainage terms; when temperature > 35°C, actions should include irrigation terms; when windSpeed > 10 m/s, actions should include staking terms
**Validates: Requirements 3.3, 3.4, 3.5**

Property 11: Valid risk level
*For any* risk calculation, the output risk level should be exactly one of: 'Low', 'Medium', 'High', or 'Critical'
**Validates: Requirements 4.1**

Property 12: Risk level monotonicity
*For any* two weather conditions where all parameters in condition B are >= condition A, the risk level for B should be >= risk level for A
**Validates: Requirements 4.2**

Property 13: Storage vulnerability impact
*For any* two identical weather and crop conditions with different storage types, open_space should yield risk level >= silo
**Validates: Requirements 4.4**

Property 14: Maximum risk level selection
*For any* advisory with multiple risk factors, the overall risk level should equal the maximum risk level among all factors
**Validates: Requirements 4.5**

Property 15: SMS simulation format completeness
*For any* Critical risk advisory, the console log should contain "SMS ALERT" prefix, farmer phone number, complete message text, and timestamp
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5**

Property 16: All crops evaluated
*For any* farmer, when the decision engine runs, it should retrieve and evaluate all crop batches (both growing and harvested stages)
**Validates: Requirements 6.2, 6.3**

Property 17: Advisory persistence
*For any* generated advisory, a corresponding record should be created in the advisories collection
**Validates: Requirements 6.4**

Property 18: Advisory count accuracy
*For any* decision engine execution, the returned count should equal the number of advisories created
**Validates: Requirements 6.5**

Property 19: Action item count bounds
*For any* generated advisory, the actions array length should be >= 2 and <= 5
**Validates: Requirements 7.1**

Property 20: Bangla action items
*For any* generated advisory, all action items should contain Bangla Unicode characters
**Validates: Requirements 7.4, 7.2**

Property 21: Storage equipment-specific actions
*For any* storage risk advisory, the actions should include equipment-specific terms in Bangla (ফ্যান, শুকানো, or similar)
**Validates: Requirements 7.5**

Property 22: Decision rationale logging
*For any* advisory generation, the system should log the decision rationale including risk factors and scores
**Validates: Requirements 8.5**

## Error Handling

### Validation Errors

- Invalid crop batch data (missing required fields)
- Invalid weather data (out of range values)
- Missing farmer information

### Data Errors

- Farmer has no crop batches (skip alert generation)
- Weather data unavailable (use cached/stale data with warning)
- Database connection failures (retry with exponential backoff)

### Risk Calculation Errors

- Unknown crop type (use default vulnerability)
- Unknown storage type (use default vulnerability)
- Missing weather parameters (skip that risk factor)

### Message Generation Errors

- Template rendering failures (use fallback generic message)
- Missing translation keys (log error, use English fallback)

### Error Response Format

```typescript
interface SmartAlertError {
  code: string;
  message: string;
  details?: {
    farmerId?: string;
    cropId?: string;
    weatherData?: Partial<WeatherData>;
  };
  timestamp: Date;
}
```

## Testing Strategy

### Unit Testing

Unit tests will cover:

- Risk calculation logic with various weather/crop combinations
- Message formatting with different crop types and conditions
- Action item generation for specific risk scenarios
- Threshold evaluation edge cases
- SMS simulation formatting
- Bangla text validation helpers

### Property-Based Testing

The system will use **fast-check** (JavaScript/TypeScript property-based testing library) to verify correctness properties.

Each property-based test will:
- Run a minimum of 100 iterations with randomly generated inputs
- Be tagged with a comment referencing the specific correctness property from this design document
- Use the format: `// Feature: smart-alert-system, Property {number}: {property_text}`

Property-based tests will generate:
- Random weather data within valid ranges
- Random crop batches with various types, stages, and storage conditions
- Random farmer data with different locations
- Edge cases (boundary values for thresholds)

### Integration Testing

Integration tests will verify:
- End-to-end flow from weather fetch to advisory storage
- Database interactions (crop retrieval, advisory creation)
- Service orchestration (WeatherService → SmartAlertService → AdvisoryService)
- Console logging for SMS simulation

### Test Data Generators

```typescript
// Generate random weather data
function generateWeatherData(): WeatherData;

// Generate random crop batch
function generateCropBatch(stage?: 'growing' | 'harvested'): CropBatch;

// Generate random farmer
function generateFarmer(): Farmer;

// Generate weather at specific risk level
function generateWeatherForRisk(level: RiskLevel): WeatherData;
```

### Example Test Cases

```typescript
// Unit test example
test('calculates Critical risk for extreme humidity in open storage', () => {
  const crop = createCropBatch({ 
    stage: 'harvested', 
    storageLocation: 'open_space' 
  });
  const weather = createWeather({ humidity: 95 });
  
  const risk = riskCalculator.calculateStorageRisk(crop, weather);
  
  expect(risk.level).toBe('Critical');
});

// Property test example
// Feature: smart-alert-system, Property 1: Advisory message completeness
test('all advisories contain crop type and weather data', () => {
  fc.assert(
    fc.property(
      fc.record({
        crop: cropBatchArbitrary(),
        weather: weatherDataArbitrary()
      }),
      ({ crop, weather }) => {
        const advisory = generateAdvisory(crop, weather);
        
        return advisory.message.includes(crop.cropType) &&
               (advisory.message.includes(weather.temperature.toString()) ||
                advisory.message.includes(weather.humidity.toString()) ||
                advisory.message.includes(weather.rainfall.toString()));
      }
    ),
    { numRuns: 100 }
  );
});
```

## Implementation Notes

### Bangla Message Templates

Messages will use template strings with parameter substitution:

```typescript
const TEMPLATES = {
  storageHumidity: (crop: string, humidity: number, location: string) =>
    `আগামীকাল আর্দ্রতা ${humidity}% হবে এবং আপনার ${crop} ${location} গুদামে ঝুঁকি রয়েছে।`,
  
  growingRainfall: (crop: string, rainfall: number, days: number) =>
    `আগামী ${days} দিনে ${rainfall}mm বৃষ্টি হবে। আপনার ${crop} ফসল সুরক্ষিত রাখুন।`,
  
  criticalAction: (action: string) =>
    `জরুরি: ${action}`
};
```

### Risk Score Calculation

```typescript
function calculateRiskScore(
  weather: WeatherData,
  crop: CropBatch
): number {
  let score = 0;
  
  // Humidity contribution (0-40 points)
  if (weather.humidity > RISK_THRESHOLDS.humidity.critical) score += 40;
  else if (weather.humidity > RISK_THRESHOLDS.humidity.high) score += 30;
  else if (weather.humidity > RISK_THRESHOLDS.humidity.medium) score += 20;
  else if (weather.humidity > RISK_THRESHOLDS.humidity.low) score += 10;
  
  // Temperature contribution (0-30 points)
  if (weather.temperature > RISK_THRESHOLDS.temperature.critical) score += 30;
  else if (weather.temperature > RISK_THRESHOLDS.temperature.high) score += 20;
  else if (weather.temperature > RISK_THRESHOLDS.temperature.medium) score += 15;
  else if (weather.temperature > RISK_THRESHOLDS.temperature.low) score += 10;
  
  // Rainfall contribution (0-20 points)
  if (weather.rainfall > RISK_THRESHOLDS.rainfall.critical) score += 20;
  else if (weather.rainfall > RISK_THRESHOLDS.rainfall.high) score += 15;
  else if (weather.rainfall > RISK_THRESHOLDS.rainfall.medium) score += 10;
  else if (weather.rainfall > RISK_THRESHOLDS.rainfall.low) score += 5;
  
  // Wind contribution (0-10 points)
  if (weather.windSpeed > RISK_THRESHOLDS.windSpeed.critical) score += 10;
  else if (weather.windSpeed > RISK_THRESHOLDS.windSpeed.high) score += 7;
  else if (weather.windSpeed > RISK_THRESHOLDS.windSpeed.medium) score += 5;
  
  // Apply storage vulnerability multiplier for harvested crops
  if (crop.stage === 'harvested' && crop.storageLocation) {
    score *= STORAGE_VULNERABILITY[crop.storageLocation];
  }
  
  return Math.min(100, Math.round(score));
}

function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}
```

### Integration Point

The Smart Alert Service will be called from the weather advisory generation flow:

```typescript
// In WeatherAdvisoryService or weather route handler
async function generateWeatherAdvisories(farmerId: ObjectId) {
  // Fetch weather
  const weather = await getWeatherForFarmer(farmerId.toString());
  
  // Generate smart alerts (new)
  const smartAlerts = await smartAlertService.generateAlertsForFarmer(
    farmerId,
    weather
  );
  
  // Store as advisories
  for (const alert of smartAlerts) {
    await advisoryService.createFarmerAdvisory({
      farmerId: alert.farmerId,
      source: 'weather',
      message: alert.message,
      actions: alert.actions
    });
    
    // Simulate SMS for critical alerts
    if (alert.riskLevel === 'Critical') {
      smsSimulator.simulateSMS(
        farmer.phone,
        alert.message,
        new Date()
      );
    }
  }
  
  return smartAlerts;
}
```
