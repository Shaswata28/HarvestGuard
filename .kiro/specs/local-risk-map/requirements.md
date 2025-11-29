# Requirements Document

## Introduction

The Local Risk Map feature provides farmers with visual awareness of spoilage threats in their community through an interactive, privacy-preserving map interface. The system displays the farmer's own location with actual risk data from the database, alongside color-coded risk indicators for nearby farms (using mock data) within the farmer's district. This enables farmers to understand regional threat patterns while maintaining complete anonymity of neighbor data. The map centers on the farmer's registered location and presents all information in Bangla to ensure accessibility.

## Glossary

- **Local Risk Map**: An interactive map component that displays anonymized risk status indicators for farms within a farmer's district
- **Risk Level**: A categorical assessment of spoilage threat severity with three values: Low, Medium, or High, calculated from weather conditions (temperature, humidity, rainfall) and crop storage factors (storage type, crop stage)
- **District**: An administrative division within Bangladesh used for geographic grouping
- **Division**: A higher-level administrative region in Bangladesh containing multiple districts
- **Risk Marker**: A color-coded pin on the map representing the risk status of a farm location
- **Farmer Pin**: A distinct blue marker indicating the current farmer's own location on the map, displaying actual risk data from the database
- **Neighbor Pin**: An anonymized marker representing another farm's location and risk status, using mock data for demonstration
- **Pop-up**: A tooltip interface element that displays detailed information when a user interacts with a map marker
- **Mock Data**: Simulated farm location and risk data generated client-side for neighbor farms only, used for demonstration purposes while protecting privacy
- **Database Data**: Actual weather conditions, crop information, and risk calculations for the logged-in farmer, retrieved from the backend

## Requirements

### Requirement 1

**User Story:** As a farmer, I want to view an interactive map centered on my district, so that I can see the geographic context of my farming area.

#### Acceptance Criteria

1. WHEN the Local Risk Map loads THEN the system SHALL display a responsive map component using Leaflet.js
2. WHEN the map initializes THEN the system SHALL center the viewport on the farmer's registered Division and District coordinates
3. WHEN the map initializes THEN the system SHALL set an appropriate zoom level to display the District boundaries clearly
4. WHEN a user interacts with the map THEN the system SHALL support touch-friendly panning gestures
5. WHEN a user interacts with the map THEN the system SHALL support touch-friendly zooming gestures

### Requirement 2

**User Story:** As a farmer, I want to see my own location marked distinctly on the map, so that I can orient myself within the regional context and see my actual risk status.

#### Acceptance Criteria

1. WHEN the map displays location markers THEN the system SHALL render the farmer's location with a blue pin marker
2. WHEN the map displays location markers THEN the system SHALL ensure the farmer's pin is visually distinct from neighbor pins
3. WHEN the farmer's location is displayed THEN the system SHALL use the farmer's registered District and Division from the database
4. WHEN the farmer's pin is displayed THEN the system SHALL calculate the farmer's Risk Level using actual weather data and crop information from the database
5. WHEN a user taps the farmer's own pin THEN the system SHALL display a pop-up with the farmer's actual risk level and personalized advisory based on database data

### Requirement 3

**User Story:** As a farmer, I want to see anonymized risk indicators for nearby farms, so that I can understand regional threat patterns without compromising privacy.

#### Acceptance Criteria

1. WHEN the map loads THEN the system SHALL generate between 10 and 15 mock neighbor data points client-side
2. WHEN generating mock neighbor data THEN the system SHALL create coordinates within the farmer's registered District boundaries
3. WHEN generating mock neighbor data THEN the system SHALL assign each data point a Risk Level based on mock weather conditions and crop storage factors
4. WHEN calculating Risk Level THEN the system SHALL consider weather factors including temperature, humidity, and rainfall
5. WHEN calculating Risk Level THEN the system SHALL consider crop factors including storage location and crop stage
6. WHEN generating mock neighbor data THEN the system SHALL exclude any personal identifiers or farm names
7. WHEN displaying neighbor locations THEN the system SHALL render each location as a color-coded marker on the map

### Requirement 4

**User Story:** As a farmer, I want risk markers to use intuitive colors, so that I can quickly assess threat levels across the region.

#### Acceptance Criteria

1. WHEN a neighbor location has a Low Risk Level THEN the system SHALL display a green marker
2. WHEN a neighbor location has a Medium Risk Level THEN the system SHALL display a yellow or orange marker
3. WHEN a neighbor location has a High Risk Level THEN the system SHALL display a red marker
4. WHEN all markers are displayed THEN the system SHALL ensure color choices provide clear visual distinction between risk levels

### Requirement 5

**User Story:** As a farmer, I want to tap on neighbor markers to see simple Bangla advisories based on weather and crop data, so that I can understand what actions to take even if I read slowly.

#### Acceptance Criteria

1. WHEN a user taps a neighbor pin THEN the system SHALL display a pop-up tooltip with advisory information
2. WHEN the pop-up displays THEN the system SHALL show a simple Bangla advisory message combining weather forecast and crop-specific guidance
3. WHEN the pop-up displays THEN the system SHALL show the Current Risk Level in Bangla (e.g., "ঝুঁকি: উচ্চ" for High Risk)
4. WHEN the pop-up displays THEN the system SHALL show actionable advice in simple Bangla (e.g., "আগামী ৩ দিন বৃষ্টি ৮৫% → আজই ধান কাটুন অথবা ঢেকে রাখুন")
5. WHEN the pop-up displays THEN the system SHALL render all text content exclusively in Bangla script
6. WHEN generating advisory messages THEN the system SHALL use simple language that farmers can understand even when reading slowly
7. WHEN generating mock data for pop-ups THEN the system SHALL include realistic mock values for weather conditions and crop types

### Requirement 6

**User Story:** As a farmer, I want to see advisories that combine weather forecasts with crop-specific actions, so that I know exactly what to do to protect my harvest.

#### Acceptance Criteria

1. WHEN weather conditions indicate high rain probability THEN the system SHALL generate advisories recommending immediate harvest or protective covering
2. WHEN weather conditions indicate high temperature THEN the system SHALL generate advisories recommending irrigation timing
3. WHEN weather conditions indicate high humidity THEN the system SHALL generate advisories recommending field monitoring for pests
4. WHEN generating advisories THEN the system SHALL include specific weather values in Bangla numerals (e.g., "৮৫%", "৩৬°C")
5. WHEN generating advisories THEN the system SHALL use the arrow symbol "→" to connect weather conditions with recommended actions
6. WHEN generating advisories THEN the system SHALL prioritize the most urgent weather threat based on severity

### Requirement 7

**User Story:** As a farmer, I want the map to work smoothly on my mobile device, so that I can access risk information while working in the field.

#### Acceptance Criteria

1. WHEN the map renders on mobile devices THEN the system SHALL adapt the layout to fit the screen dimensions
2. WHEN the map renders on mobile devices THEN the system SHALL maintain readable marker sizes and pop-up text
3. WHEN a user interacts with the map on a touch device THEN the system SHALL respond to touch gestures without lag or delay
4. WHEN the map loads THEN the system SHALL optimize performance to render within 2 seconds on standard mobile connections

### Requirement 8

**User Story:** As a farmer, I want to easily access the Local Risk Map from the main navigation, so that I can quickly view regional risk information.

#### Acceptance Criteria

1. WHEN the application displays the main navigation THEN the system SHALL show a button or tab for accessing the Local Risk Map
2. WHEN the navigation button is displayed THEN the system SHALL use a Bangla label (e.g., "ঝুঁকির মানচিত্র" or "এলাকার ঝুঁকি")
3. WHEN a user taps the Local Risk Map button THEN the system SHALL navigate to the map view
4. WHEN the Local Risk Map is active THEN the system SHALL visually indicate the active state in the navigation

### Requirement 9

**User Story:** As a system designer, I want all neighbor data to remain client-side and anonymous, so that farmer privacy is protected while providing community awareness.

#### Acceptance Criteria

1. WHEN mock neighbor data is generated THEN the system SHALL create and store all data exclusively on the client side
2. WHEN neighbor markers are displayed THEN the system SHALL ensure no personal identifiers are included in the data model
3. WHEN neighbor markers are displayed THEN the system SHALL ensure no farm names are included in the data model
4. WHEN the map component unmounts THEN the system SHALL discard all mock neighbor data from memory
