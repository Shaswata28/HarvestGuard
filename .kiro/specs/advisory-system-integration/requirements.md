# Requirements Document

## Introduction

The Advisory System provides intelligent, context-aware recommendations to farmers based on weather conditions, crop batch data, and agricultural best practices. The system automatically generates advisories by combining weather forecasts with the farmer's specific crop information (crop type, planting date, growth stage, expected harvest date) to deliver simple, actionable guidance in Bangla that farmers can easily understand and act upon.

## Glossary

- **Advisory System**: The software component responsible for generating, storing, and delivering agricultural recommendations to farmers
- **Advisory**: A recommendation or alert message containing actionable guidance for farmers regarding their crops
- **Farmer**: A registered user of the system who manages crop batches and receives advisories
- **Weather-Based Advisory**: An advisory automatically generated based on weather data analysis
- **Crop Batch**: A specific planting of crops tracked in the system, including crop type, planting date, expected harvest date, and current growth stage
- **Context-Aware Advisory**: An advisory that combines weather forecast data with farmer's crop batch information to provide specific, actionable recommendations
- **Growth Stage**: The current developmental phase of a crop (e.g., seedling, vegetative, flowering, maturity, harvest-ready)
- **Read Status**: A boolean flag indicating whether a farmer has viewed an advisory

## Requirements

### Requirement 1

**User Story:** As a farmer, I want to view advisories relevant to my location and crops, so that I can take appropriate action to protect and optimize my harvest.

#### Acceptance Criteria

1. WHEN a farmer requests their advisories THEN the Advisory System SHALL return all advisories associated with that farmer's ID
2. WHEN displaying advisories THEN the Advisory System SHALL include the advisory content, creation timestamp, and severity level
3. WHEN a farmer has no advisories THEN the Advisory System SHALL return an empty list without errors
4. WHEN advisories are retrieved THEN the Advisory System SHALL order them by creation date with newest first
5. WHERE a farmer ID is provided as a query parameter THEN the Advisory System SHALL filter advisories to only that farmer

### Requirement 2

**User Story:** As the system or administrator, I want to create new advisories for farmers, so that timely recommendations reach those who need them.

#### Acceptance Criteria

1. WHEN creating an advisory THEN the Advisory System SHALL require farmer ID, advisory content, and severity level
2. WHEN an advisory is created THEN the Advisory System SHALL record the creation timestamp
3. WHEN advisory creation succeeds THEN the Advisory System SHALL return the complete advisory object including generated ID
4. IF required fields are missing THEN the Advisory System SHALL reject the creation with a validation error

### Requirement 3

**User Story:** As the system, I want to automatically generate weather-based advisories, so that farmers receive timely warnings about conditions that may affect their crops.

#### Acceptance Criteria

1. WHEN weather data indicates heavy rainfall THEN the Advisory System SHALL generate advisories warning about potential flooding or waterlogging
2. WHEN weather data indicates high temperatures THEN the Advisory System SHALL generate advisories about heat stress and irrigation needs
3. WHEN weather data indicates low temperatures THEN the Advisory System SHALL generate advisories about cold damage risks
4. WHEN weather data indicates strong winds THEN the Advisory System SHALL generate advisories about physical crop damage risks
5. WHEN generating weather-based advisories THEN the Advisory System SHALL target farmers in the affected geographic area
6. WHEN generating advisories THEN the Advisory System SHALL avoid creating duplicate advisories for the same condition and farmer within 24 hours

### Requirement 4

**User Story:** As a farmer, I want advisories to be relevant to my specific crops and growth stages, so that I receive actionable guidance appropriate to my situation.

#### Acceptance Criteria

1. WHEN generating advisories THEN the Advisory System SHALL consider the crop types managed by the farmer
2. WHEN generating advisories THEN the Advisory System SHALL consider the growth stage of active crop batches
3. WHEN a farmer has no active crops THEN the Advisory System SHALL generate only general weather warnings
4. WHEN multiple crop batches exist THEN the Advisory System SHALL generate advisories relevant to all active batches
5. WHEN crop-specific risks are identified THEN the Advisory System SHALL include the affected crop type in the advisory content

### Requirement 6

**User Story:** As a farmer, I want to receive simple Bangla advisories that combine weather forecasts with my crop information, so that I can quickly understand what action to take even if I read slowly.

#### Acceptance Criteria

1. WHEN generating advisories THEN the Advisory System SHALL combine weather forecast data with the farmer's active crop batch information
2. WHEN a farmer has rice crops approaching harvest stage AND heavy rain is forecasted THEN the Advisory System SHALL generate an advisory recommending immediate harvest or protection in simple Bangla
3. WHEN high temperature is forecasted AND a farmer has rice crops in growing stage THEN the Advisory System SHALL generate an advisory recommending irrigation timing in simple Bangla
4. WHEN generating advisories THEN the Advisory System SHALL present the message in simple Bangla language that farmers can understand even when reading slowly
5. WHEN displaying advisories THEN the Advisory System SHALL show the weather condition with probability or severity and specific action in a single clear message format
6. WHEN crop batch data includes expected harvest date THEN the Advisory System SHALL calculate days until harvest to determine urgency of harvest-related advisories
7. WHEN crop batch data includes expected harvest date within 7 days AND weather risks are detected THEN the Advisory System SHALL prioritize harvest-related advisories
8. WHEN multiple weather risks affect the same crop THEN the Advisory System SHALL prioritize the most urgent risk in the advisory message
9. WHEN generating advisories THEN the Advisory System SHALL use the crop type from the farmer's crop batch data to provide crop-specific recommendations

### Requirement 5

**User Story:** As a system administrator, I want the advisory system to handle errors gracefully, so that temporary failures do not disrupt the overall application.

#### Acceptance Criteria

1. IF database connection fails THEN the Advisory System SHALL return an appropriate error response without crashing
2. IF weather data is unavailable THEN the Advisory System SHALL log the issue and continue operating with cached data
3. WHEN validation errors occur THEN the Advisory System SHALL return clear error messages indicating what needs to be corrected
4. IF an unexpected error occurs THEN the Advisory System SHALL log the error details for debugging
5. WHEN errors occur THEN the Advisory System SHALL maintain data consistency and not create partial records
