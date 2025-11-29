/**
 * Bangla Advisory Generator
 * 
 * Generates simple Bangla advisory messages by combining weather conditions
 * with crop information to provide actionable guidance for farmers.
 * 
 * Message Format: [Weather Condition + Value] → [Specific Action]
 * Example: "আগামী ৩ দিনে বৃষ্টি ৮৫% → আজই ধান কাটুন অথবা ঢেকে রাখুন"
 */

/**
 * Weather condition types that can trigger advisories
 */
export interface WeatherCondition {
  type: 'rain' | 'heat' | 'humidity' | 'wind';
  value: number; // e.g., 85 for 85% rain chance, 36 for 36°C
  severity: 'low' | 'medium' | 'high';
}

/**
 * Crop context information for generating crop-specific advisories
 */
export interface CropContext {
  cropType: string; // e.g., "ধান" (rice/paddy)
  daysUntilHarvest: number | null; // null if no harvest date set
  stage: 'growing' | 'harvested';
}

/**
 * Generated Bangla advisory with message and severity
 */
export interface BanglaAdvisory {
  message: string; // Simple Bangla message in format: [Weather + Value] → [Action]
  severity: 'low' | 'medium' | 'high';
}

/**
 * Generates a simple Bangla advisory by combining weather conditions with crop context
 * 
 * Priority Rules:
 * 1. Harvest-related advisories (when daysUntilHarvest <= 7 AND weather risk)
 * 2. Growing stage advisories (when crop in growing stage AND weather risk)
 * 3. General weather warnings (when no active crops OR no crop-specific risk)
 * 
 * @param weather - The weather condition triggering the advisory
 * @param crop - The crop context for generating crop-specific guidance
 * @returns BanglaAdvisory object or null if no significant advisory needed
 */
export function generateBanglaAdvisory(
  weather: WeatherCondition,
  crop: CropContext
): BanglaAdvisory | null {
  // Harvested crops don't need advisories
  if (crop.stage === 'harvested') {
    return null;
  }

  // Check if harvest is approaching (within 7 days)
  const isHarvestSoon = crop.daysUntilHarvest !== null && crop.daysUntilHarvest <= 7;

  // Generate advisory based on weather type and crop context
  switch (weather.type) {
    case 'rain':
      return generateRainAdvisory(weather, crop, isHarvestSoon);
    
    case 'heat':
      return generateHeatAdvisory(weather, crop, isHarvestSoon);
    
    case 'humidity':
      return generateHumidityAdvisory(weather, crop, isHarvestSoon);
    
    case 'wind':
      return generateWindAdvisory(weather, crop, isHarvestSoon);
    
    default:
      return null;
  }
}

/**
 * Generates rain-related advisory
 */
function generateRainAdvisory(
  weather: WeatherCondition,
  crop: CropContext,
  isHarvestSoon: boolean
): BanglaAdvisory {
  const rainValue = Math.round(weather.value);
  
  // High priority: Harvest soon + rain
  if (isHarvestSoon && weather.severity === 'high') {
    return {
      message: `আগামী ৩ দিনে বৃষ্টি ${rainValue}% → আজই ${crop.cropType} কাটুন অথবা ঢেকে রাখুন`,
      severity: 'high'
    };
  }
  
  if (isHarvestSoon) {
    return {
      message: `বৃষ্টির সম্ভাবনা ${rainValue}% → ${crop.cropType} তাড়াতাড়ি কাটার পরিকল্পনা করুন`,
      severity: 'medium'
    };
  }
  
  // Growing stage + rain
  if (weather.severity === 'high') {
    return {
      message: `আগামীকাল ভারী বৃষ্টি → নালা পরিষ্কার করুন, ${crop.cropType} ক্ষেতে জল জমতে দেবেন না`,
      severity: 'high'
    };
  }
  
  return {
    message: `বৃষ্টির সম্ভাবনা ${rainValue}% → ${crop.cropType} ক্ষেতের নিকাশ ব্যবস্থা পরীক্ষা করুন`,
    severity: 'medium'
  };
}

/**
 * Generates heat-related advisory
 */
function generateHeatAdvisory(
  weather: WeatherCondition,
  crop: CropContext,
  isHarvestSoon: boolean
): BanglaAdvisory {
  const tempValue = Math.round(weather.value);
  
  // High priority: Harvest soon + extreme heat
  if (isHarvestSoon && weather.severity === 'high') {
    return {
      message: `তাপমাত্রা ${tempValue}°C উঠবে → দুপুরে ${crop.cropType} কাটবেন না, সকাল/সন্ধ্যায় কাটুন`,
      severity: 'high'
    };
  }
  
  if (isHarvestSoon) {
    return {
      message: `তাপমাত্রা ${tempValue}°C → ${crop.cropType} কাটার সময় সকাল বা সন্ধ্যা বেছে নিন`,
      severity: 'medium'
    };
  }
  
  // Growing stage + heat
  if (weather.severity === 'high') {
    return {
      message: `তাপমাত্রা ${tempValue}°C উঠবে → বিকেলের দিকে ${crop.cropType} ক্ষেতে সেচ দিন`,
      severity: 'high'
    };
  }
  
  return {
    message: `তাপমাত্রা ${tempValue}°C → ${crop.cropType} ক্ষেতে নিয়মিত সেচ দিন`,
    severity: 'medium'
  };
}

/**
 * Generates humidity-related advisory
 */
function generateHumidityAdvisory(
  weather: WeatherCondition,
  crop: CropContext,
  isHarvestSoon: boolean
): BanglaAdvisory {
  const humidityValue = Math.round(weather.value);
  
  // High priority: Harvest soon + high humidity
  if (isHarvestSoon && weather.severity === 'high') {
    return {
      message: `আর্দ্রতা ${humidityValue}% → ${crop.cropType} কাটার পর দ্রুত শুকান, ছত্রাক রোগ হতে পারে`,
      severity: 'high'
    };
  }
  
  if (isHarvestSoon) {
    return {
      message: `আর্দ্রতা ${humidityValue}% → ${crop.cropType} কাটার পর ভালো করে শুকাতে হবে`,
      severity: 'medium'
    };
  }
  
  // Growing stage + humidity
  if (weather.severity === 'high') {
    return {
      message: `আর্দ্রতা ${humidityValue}% → ${crop.cropType} ক্ষেতে ছত্রাক রোগের জন্য সতর্ক থাকুন`,
      severity: 'high'
    };
  }
  
  return {
    message: `আর্দ্রতা ${humidityValue}% → ${crop.cropType} ক্ষেতে রোগ দেখা দিলে ব্যবস্থা নিন`,
    severity: 'medium'
  };
}

/**
 * Generates wind-related advisory
 */
function generateWindAdvisory(
  weather: WeatherCondition,
  crop: CropContext,
  isHarvestSoon: boolean
): BanglaAdvisory {
  const windValue = Math.round(weather.value);
  
  // High priority: Harvest soon + strong wind
  if (isHarvestSoon && weather.severity === 'high') {
    return {
      message: `ঝড়ো হাওয়া ${windValue} মি/সে → ${crop.cropType} হেলে পড়তে পারে, তাড়াতাড়ি কাটুন`,
      severity: 'high'
    };
  }
  
  if (isHarvestSoon) {
    return {
      message: `বাতাসের গতি ${windValue} মি/সে → ${crop.cropType} ক্ষতি হওয়ার আগে কাটার পরিকল্পনা করুন`,
      severity: 'medium'
    };
  }
  
  // Growing stage + wind
  if (weather.severity === 'high') {
    return {
      message: `ঝড়ো হাওয়া ${windValue} মি/সে → ${crop.cropType} গাছ হেলে পড়তে পারে, সাপোর্ট দিন`,
      severity: 'high'
    };
  }
  
  return {
    message: `বাতাসের গতি ${windValue} মি/সে → ${crop.cropType} ক্ষেতে ক্ষতি হয়েছে কিনা পরীক্ষা করুন`,
    severity: 'medium'
  };
}

/**
 * Calculates the number of days until harvest from the expected harvest date
 * 
 * Edge cases handled:
 * - Null/undefined date: returns null
 * - Past date: returns 0 (harvest overdue)
 * - Future date: returns positive number of days
 * 
 * @param expectedHarvestDate - The expected harvest date for the crop
 * @returns Number of days until harvest, or null if no harvest date provided
 */
export function calculateDaysUntilHarvest(expectedHarvestDate: Date | null | undefined): number | null {
  // Handle null or undefined date
  if (!expectedHarvestDate) {
    return null;
  }

  // Ensure we're working with a Date object
  const harvestDate = expectedHarvestDate instanceof Date 
    ? expectedHarvestDate 
    : new Date(expectedHarvestDate);

  // Check if date is invalid
  if (isNaN(harvestDate.getTime())) {
    return null;
  }

  // Get current date at midnight (start of day) for consistent day calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get harvest date at midnight (start of day)
  const harvest = new Date(harvestDate);
  harvest.setHours(0, 0, 0, 0);

  // Calculate difference in milliseconds
  const diffMs = harvest.getTime() - today.getTime();

  // Convert to days
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // Return 0 for past dates (harvest overdue), otherwise return days until harvest
  return Math.max(0, diffDays);
}

/**
 * Weather data structure for risk analysis
 */
export interface WeatherRiskData {
  temperature: number;        // Celsius
  rainfall: number;           // mm (last hour or forecast)
  humidity: number;           // Percentage
  windSpeed: number;          // m/s
  rainChance?: number;        // Forecast probability (0-100)
}

/**
 * Determines the most urgent weather risk from multiple weather conditions
 * 
 * Priority Rules (highest to lowest):
 * 1. High severity risks (most dangerous to crops)
 * 2. Medium severity risks
 * 3. Low severity risks
 * 
 * Within same severity level, prioritize by crop impact:
 * - Rain (can cause immediate harvest loss)
 * - Heat (affects crop health and harvest timing)
 * - Wind (physical damage)
 * - Humidity (slower-acting disease risk)
 * 
 * @param weather - Weather data containing multiple conditions
 * @returns The most urgent WeatherCondition, or null if no significant risks
 */
export function determineMostUrgentRisk(weather: WeatherRiskData): WeatherCondition | null {
  const risks: WeatherCondition[] = [];

  // Analyze rain risk
  // Use rainChance if available (forecast), otherwise use rainfall amount
  const rainValue = weather.rainChance ?? weather.rainfall;
  if (rainValue > 0) {
    let severity: 'low' | 'medium' | 'high' = 'low';
    
    if (weather.rainChance !== undefined) {
      // Forecast probability-based severity
      if (weather.rainChance >= 70) {
        severity = 'high';
      } else if (weather.rainChance >= 40) {
        severity = 'medium';
      }
    } else {
      // Rainfall amount-based severity
      if (weather.rainfall >= 50) {
        severity = 'high';
      } else if (weather.rainfall >= 20) {
        severity = 'medium';
      }
    }

    if (severity !== 'low' || rainValue >= 10) {
      risks.push({
        type: 'rain',
        value: rainValue,
        severity
      });
    }
  }

  // Analyze heat risk
  if (weather.temperature > 30) {
    let severity: 'low' | 'medium' | 'high' = 'low';
    
    if (weather.temperature >= 38) {
      severity = 'high';
    } else if (weather.temperature >= 35) {
      severity = 'medium';
    }

    risks.push({
      type: 'heat',
      value: weather.temperature,
      severity
    });
  }

  // Analyze wind risk
  if (weather.windSpeed > 5) {
    let severity: 'low' | 'medium' | 'high' = 'low';
    
    if (weather.windSpeed >= 15) {
      severity = 'high';
    } else if (weather.windSpeed >= 10) {
      severity = 'medium';
    }

    risks.push({
      type: 'wind',
      value: weather.windSpeed,
      severity
    });
  }

  // Analyze humidity risk
  if (weather.humidity > 70) {
    let severity: 'low' | 'medium' | 'high' = 'low';
    
    if (weather.humidity >= 90) {
      severity = 'high';
    } else if (weather.humidity >= 80) {
      severity = 'medium';
    }

    risks.push({
      type: 'humidity',
      value: weather.humidity,
      severity
    });
  }

  // If no risks identified, return null
  if (risks.length === 0) {
    return null;
  }

  // Sort risks by priority
  // First by severity (high > medium > low)
  // Then by crop impact (rain > heat > wind > humidity)
  const severityOrder = { high: 3, medium: 2, low: 1 };
  const typeOrder = { rain: 4, heat: 3, wind: 2, humidity: 1 };

  risks.sort((a, b) => {
    // Compare severity first
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }
    
    // If same severity, compare by type priority
    return typeOrder[b.type] - typeOrder[a.type];
  });

  // Return the most urgent risk
  return risks[0];
}
