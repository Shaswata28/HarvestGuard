# Design Document: Local Risk Map

## Overview

The Local Risk Map is an interactive mapping feature that visualizes crop spoilage risk data across a farmer's district. Built with Leaflet.js, the system displays the farmer's own location with actual risk data from the database, alongside mock neighbor farm data to demonstrate regional risk patterns while maintaining complete privacy. All information is presented in Bangla to ensure accessibility for the target user base.

The feature fetches the farmer's actual weather conditions, crop information, and calculated risk level from the database, then generates 10-15 mock data points representing nearby farms with simulated risk levels. The map centers on the farmer's registered district, displays color-coded risk markers (blue for the farmer, green/orange/red for neighbors), and provides actionable Bangla advisories through interactive pop-ups.

## Architecture

### Component Structure

```
LocalRiskMap (React Component)
├── MapContainer (Leaflet wrapper)
│   ├── TileLayer (OpenStreetMap tiles)
│   ├── FarmerMarker (blue pin)
│   └── NeighborMarkers[] (color-coded pins)
│       └── Popup (Bangla advisory)
├── MockDataGenerator (utility)
├── RiskCalculator (utility)
└── BanglaAdvisoryGenerator (utility)
```

### Data Flow

1. Component mounts → Fetch farmer's data from database (district, division, weather, crop info, risk level)
2. Generate mock neighbor data (10-15 points within district) with simulated weather/crop data
3. Calculate risk levels for each neighbor based on mock weather/crop data
4. Render map centered on farmer's district with appropriate zoom
5. Display farmer's location as blue marker with actual risk level from database
6. Display neighbor locations as color-coded markers with mock risk levels
7. On farmer marker tap → Display pop-up with actual advisory from database
8. On neighbor marker tap → Generate and display Bangla advisory from mock data

### Technology Stack

- **Mapping Library**: Leaflet.js (lightweight, mobile-friendly)
- **Map Tiles**: OpenStreetMap (free, no API key required)
- **React Integration**: react-leaflet
- **Styling**: Tailwind CSS for responsive layout
- **Language**: TypeScript for type safety

## Components and Interfaces

### LocalRiskMap Component

**Props:**
```typescript
interface LocalRiskMapProps {
  farmerId: string; // Used to fetch farmer data from database
  language: 'bn'; // Bangla only for this feature
}
```

**State:**
```typescript
interface MapState {
  center: [number, number]; // [latitude, longitude]
  zoom: number;
  farmerData: FarmerData | null; // Actual data from database
  neighborData: NeighborData[]; // Mock data for neighbors
  isLoading: boolean;
  error: string | null;
}
```

### Data Models

**Location:**
```typescript
interface Location {
  lat: number;
  lng: number;
  district: string;
  division: string;
}
```

**FarmerData:**
```typescript
interface FarmerData {
  id: string;
  location: Location;
  riskLevel: 'Low' | 'Medium' | 'High';
  weather: WeatherConditions; // Actual weather from database
  crop: CropInfo; // Actual crop info from database
  advisory: string; // Pre-generated Bangla advisory from database
}
```

**NeighborData:**
```typescript
interface NeighborData {
  id: string; // UUID for React key
  location: Location;
  riskLevel: 'Low' | 'Medium' | 'High';
  mockWeather: WeatherConditions; // Simulated weather
  mockCrop: CropInfo; // Simulated crop info
}
```

**WeatherConditions:**
```typescript
interface WeatherConditions {
  temperature: number; // Celsius
  humidity: number; // Percentage (0-100)
  rainfall: number; // Percentage probability (0-100)
  condition: 'sunny' | 'rainy' | 'cloudy' | 'humid';
}
```

**CropInfo:**
```typescript
interface CropInfo {
  cropType: string; // e.g., "ধান" (rice), "পাট" (jute), "আলু" (potato)
  storageType: 'field' | 'warehouse' | 'home';
  cropStage: 'planted' | 'growing' | 'harvest-ready' | 'harvested';
}
```

**RiskMarkerConfig:**
```typescript
interface RiskMarkerConfig {
  Low: {
    color: string; // '#22c55e' (green)
    icon: string;
  };
  Medium: {
    color: string; // '#f59e0b' (orange)
    icon: string;
  };
  High: {
    color: string; // '#ef4444' (red)
    icon: string;
  };
}
```

### Utility Functions

**MockDataGenerator:**
```typescript
function generateMockNeighborData(
  farmerLocation: Location,
  count: number = 12
): NeighborData[]
```
- Generates 10-15 random coordinates within district boundaries
- Creates realistic mock weather and crop data for each point
- Assigns unique IDs to each neighbor data point
- Ensures coordinates are within reasonable distance from district center

**RiskCalculator:**
```typescript
function calculateRiskLevel(
  weather: WeatherConditions,
  crop: CropInfo
): 'Low' | 'Medium' | 'High'
```
- Evaluates weather conditions (temperature, humidity, rainfall)
- Considers crop vulnerability based on type and stage
- Applies risk scoring algorithm:
  - High rainfall (>70%) + harvest-ready crops = High risk
  - High temperature (>35°C) + field storage = Medium-High risk
  - High humidity (>80%) + harvested crops = Medium-High risk
  - Otherwise = Low risk

**BanglaAdvisoryGenerator:**
```typescript
function generateBanglaAdvisory(
  weather: WeatherConditions,
  crop: CropInfo,
  riskLevel: 'Low' | 'Medium' | 'High'
): string
```
- Generates simple Bangla advisory text based on weather and crop conditions
- Includes specific weather values in Bangla numerals
- Uses arrow symbol (→) to connect conditions with actions
- Prioritizes most urgent threat
- Examples:
  - "আগামী ৩ দিন বৃষ্টি ৮৫% → আজই ধান কাটুন অথবা ঢেকে রাখুন"
  - "তাপমাত্রা ৩৬°C → সকালে বা সন্ধ্যায় সেচ দিন"
  - "আর্দ্রতা ৮৫% → পোকামাকড়ের জন্য ক্ষেত পরীক্ষা করুন"

**DistrictCoordinates:**
```typescript
function getDistrictCenter(district: string, division: string): [number, number]
```
- Returns approximate center coordinates for Bangladesh districts
- Fallback to division center if district not found
- Used for initial map centering

**CoordinateGenerator:**
```typescript
function generateRandomCoordinateInDistrict(
  centerLat: number,
  centerLng: number,
  radiusKm: number = 15
): [number, number]
```
- Generates random coordinates within specified radius of center point
- Ensures coordinates stay within district boundaries
- Uses realistic offset calculations for Bangladesh geography

## Data Models

### Risk Level Calculation Logic

The risk level is determined by evaluating multiple factors:

**High Risk Conditions:**
- Rainfall probability > 70% AND crop stage is 'harvest-ready' or 'harvested'
- Temperature > 38°C AND storage type is 'field'
- Humidity > 85% AND crop stage is 'harvested' AND storage type is 'home'

**Medium Risk Conditions:**
- Rainfall probability 40-70% AND crop stage is 'harvest-ready'
- Temperature 35-38°C AND storage type is 'field'
- Humidity 75-85% AND crop stage is 'harvested'

**Low Risk Conditions:**
- All other combinations
- Crops in 'planted' or 'growing' stages with normal weather

### Map Configuration

**Initial View:**
- Center: District center coordinates
- Zoom level: 11 (shows district and immediate surroundings)
- Max zoom: 18 (street level)
- Min zoom: 8 (division level)

**Marker Styling:**
- Farmer pin: Blue circle marker, radius 10px, distinct border
- Low risk: Green circle marker, radius 8px
- Medium risk: Orange circle marker, radius 8px
- High risk: Red circle marker, radius 8px

**Pop-up Configuration:**
- Max width: 250px
- Auto-pan: true (map adjusts to show full pop-up)
- Close button: true
- Auto-close: false (stays open until user closes)


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property 1: Map centers on district coordinates**
*For any* farmer district and division, when the map initializes, the map center coordinates should match the district center coordinates.
**Validates: Requirements 1.2**

**Property 2: Farmer data loaded from database**
*For any* farmer ID, when the map initializes, the farmer's location, weather, crop info, and risk level should be fetched from the database.
**Validates: Requirements 2.3, 2.4, 2.5**

**Property 3: Neighbor count within range**
*For any* map initialization, the number of generated neighbor data points should be between 10 and 15 inclusive.
**Validates: Requirements 3.1**

**Property 4: All neighbor coordinates within district**
*For any* generated set of neighbor data and any farmer district, all neighbor coordinates should fall within that district's geographic boundaries.
**Validates: Requirements 3.2**

**Property 5: Risk level validity**
*For any* weather conditions and crop information, the calculated risk level should be one of the three valid values: 'Low', 'Medium', or 'High'.
**Validates: Requirements 3.3**

**Property 6: Risk calculation considers all factors**
*For any* weather and crop combination, changing either weather factors (temperature, humidity, rainfall) or crop factors (storage type, crop stage) should potentially affect the calculated risk level.
**Validates: Requirements 3.4, 3.5**

**Property 7: Neighbor data anonymity**
*For any* generated neighbor data point, the data object should not contain fields for personal identifiers, farm names, or farmer names.
**Validates: Requirements 3.6, 8.2, 8.3**

**Property 8: All neighbors have markers**
*For any* set of neighbor data, each neighbor should have a corresponding rendered marker on the map.
**Validates: Requirements 3.7**

**Property 9: Risk level color mapping**
*For any* neighbor marker, the marker color should correctly map to its risk level: green for Low, orange/yellow for Medium, and red for High.
**Validates: Requirements 4.1, 4.2, 4.3**

**Property 10: Pop-up displays on marker interaction**
*For any* neighbor marker, when a user taps or clicks the marker, a pop-up should be displayed.
**Validates: Requirements 5.1**

**Property 11: Advisory content in Bangla**
*For any* generated advisory message, all text content should be in Bangla script (excluding numbers and symbols like → and %).
**Validates: Requirements 5.2, 5.5**

**Property 12: Risk level displayed in Bangla**
*For any* risk level value, the pop-up should display the corresponding Bangla translation ("ঝুঁকি: নিম্ন" for Low, "ঝুঁকি: মাঝারি" for Medium, "ঝুঁকি: উচ্চ" for High).
**Validates: Requirements 5.3**

**Property 13: Advisory contains actionable recommendations**
*For any* weather and crop combination, the generated advisory should include specific actionable recommendations (harvest, irrigate, monitor, cover, etc.).
**Validates: Requirements 5.4**

**Property 14: Mock weather values within realistic ranges**
*For any* generated weather data, temperature should be between 15-45°C, humidity between 0-100%, and rainfall probability between 0-100%.
**Validates: Requirements 5.7**

**Property 15: Weather-appropriate advisory recommendations**
*For any* weather conditions, the advisory should contain appropriate recommendations: harvest/cover for high rain, irrigation for high temperature, pest monitoring for high humidity.
**Validates: Requirements 6.1, 6.2, 6.3**

**Property 16: Bangla numerals in advisories**
*For any* advisory containing numeric values, those values should be formatted using Bangla numerals (০-৯) rather than Western numerals (0-9).
**Validates: Requirements 6.4**

**Property 17: Advisory format with arrow connector**
*For any* generated advisory, it should follow the format of weather condition → action, using the arrow symbol (→) to connect conditions with recommendations.
**Validates: Requirements 6.5**

**Property 18: Threat prioritization in advisories**
*For any* combination of multiple weather threats, the advisory should address the highest severity threat first.
**Validates: Requirements 6.6**

**Property 19: Responsive layout adaptation**
*For any* viewport size, the map component should adapt its layout to fit the screen dimensions without horizontal scrolling.
**Validates: Requirements 7.1**

**Property 20: Client-side data generation**
*For any* map initialization, no network requests should be made to fetch or store neighbor data—all data should be generated and stored client-side only.
**Validates: Requirements 8.1**

**Property 21: Data cleanup on unmount**
*For any* map component instance, when the component unmounts, all neighbor data should be cleared from memory.
**Validates: Requirements 9.4**

**Property 22: Navigation button displays Bangla label**
*For any* navigation state, the Local Risk Map button should display text in Bangla script.
**Validates: Requirements 8.2**

**Property 23: Navigation to map view**
*For any* user interaction with the Local Risk Map button, the application should navigate to the map view.
**Validates: Requirements 8.3**

## Error Handling

### Map Loading Failures

**Scenario:** Leaflet.js fails to load or OpenStreetMap tiles are unavailable
- Display fallback message in Bangla: "মানচিত্র লোড করতে সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন।"
- Log error to console for debugging
- Provide retry button

**Scenario:** District coordinates not found
- Fall back to division-level coordinates
- Use default Bangladesh center coordinates (23.8103°N, 90.4125°E) as last resort
- Log warning about missing district data

### Database Fetch Failures

**Scenario:** Failed to fetch farmer data from database
- Display error message in Bangla: "আপনার তথ্য লোড করতে সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন।"
- Provide retry button
- Log error details for debugging
- Do not render map until farmer data is successfully loaded

**Scenario:** Incomplete farmer data returned from database
- Use fallback values for missing fields (default to Medium risk if risk level missing)
- Log warning about incomplete data
- Continue rendering with available data

### Data Generation Failures

**Scenario:** Mock neighbor data generation produces invalid coordinates
- Validate all coordinates before rendering
- Filter out any coordinates outside Bangladesh boundaries
- Ensure minimum of 10 valid neighbors, regenerate if needed

**Scenario:** Risk calculation produces undefined result
- Default to 'Medium' risk level
- Log warning with input data for debugging
- Continue rendering with fallback value

### Advisory Generation Failures

**Scenario:** Bangla advisory generator fails
- Fall back to simple generic advisory: "আবহাওয়া পরীক্ষা করুন এবং সতর্ক থাকুন"
- Log error with input parameters
- Ensure pop-up still displays with available information

### Mobile Performance Issues

**Scenario:** Map rendering takes longer than 2 seconds
- Display loading spinner with Bangla text: "মানচিত্র লোড হচ্ছে..."
- Implement progressive rendering (farmer marker first, then neighbors)
- Reduce neighbor count to 10 if performance issues persist

### Touch Interaction Failures

**Scenario:** Touch gestures not responding
- Ensure Leaflet touch handlers are enabled
- Add explicit touch event listeners as fallback
- Provide zoom buttons as alternative control method

## Testing Strategy

### Unit Testing

The Local Risk Map feature will use **Vitest** as the testing framework, which is already configured in the project. Unit tests will focus on:

**Utility Function Tests:**
- `MockDataGenerator`: Verify correct count, coordinate ranges, and data structure
- `RiskCalculator`: Test risk level logic with specific weather/crop combinations
- `BanglaAdvisoryGenerator`: Verify Bangla output, format, and content
- `DistrictCoordinates`: Test coordinate lookup for known districts
- `CoordinateGenerator`: Verify coordinates stay within radius

**Component Tests:**
- LocalRiskMap component renders without errors
- Farmer marker displays with correct styling
- Neighbor markers render for all data points
- Pop-ups display correct content on marker click

**Edge Cases:**
- Empty or invalid district names
- Extreme weather values (0%, 100%, very high/low temperatures)
- Boundary coordinates (edge of district)
- Component unmounting during data generation

### Property-Based Testing

The feature will use **fast-check** for property-based testing in TypeScript. Each property-based test will:
- Run a minimum of 100 iterations
- Be tagged with a comment referencing the design document property
- Use the format: `**Feature: local-risk-map, Property {number}: {property_text}**`

**Property Test Coverage:**

Each correctness property listed above will be implemented as a property-based test. Key property tests include:

- **Property 4 (Neighbor coordinates)**: Generate random districts and verify all neighbor coordinates fall within boundaries
- **Property 5 (Risk level validity)**: Generate random weather/crop combinations and verify output is always valid
- **Property 11 (Bangla content)**: Generate random weather/crop data and verify all advisory text is in Bangla
- **Property 16 (Bangla numerals)**: Generate random numeric values and verify they're converted to Bangla numerals
- **Property 20 (Client-side only)**: Monitor network activity during map initialization and verify no requests are made

**Generator Strategy:**

Custom generators will be created for:
- `WeatherConditions`: Random but realistic temperature (15-45), humidity (0-100), rainfall (0-100)
- `CropInfo`: Random crop types from common Bangladesh crops, random storage types and stages
- `Location`: Random coordinates within Bangladesh boundaries
- District/Division pairs: Valid combinations from Bangladesh administrative divisions

**Test Execution:**

Property-based tests will be integrated into the standard test suite and run with:
```bash
npm test
```

Tests will be co-located with source files using `.test.ts` suffix for easy maintenance and discovery.
