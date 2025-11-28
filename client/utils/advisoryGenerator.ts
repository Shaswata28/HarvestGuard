import { Advisory } from '@shared/api';

interface WeatherData {
  temperature: number;
  rainfall: number;
  humidity: number;
  windSpeed: number;
}

/**
 * Generates farming advisories based on weather conditions (client-side)
 * Mirrors server-side logic from weather.service.ts
 */
export function generateAdvisories(weather: WeatherData): Advisory[] {
  const advisories: Advisory[] = [];
  
  // Heat advisory (temperature > 35°C)
  if (weather.temperature > 35) {
    advisories.push({
      type: 'heat',
      severity: weather.temperature > 40 ? 'high' : 'medium',
      title: 'High Temperature Alert',
      message: `Temperature is ${weather.temperature.toFixed(1)}°C. Take precautions to protect crops from heat stress.`,
      actions: [
        'Increase irrigation frequency',
        'Apply mulch to retain soil moisture',
        'Consider shade nets for sensitive crops',
        'Monitor crops for signs of heat stress'
      ],
      conditions: {
        temperature: weather.temperature
      }
    });
  }
  
  // Rainfall advisory (rainfall > 50mm or high humidity suggesting rain)
  if (weather.rainfall > 50) {
    advisories.push({
      type: 'rainfall',
      severity: weather.rainfall > 100 ? 'high' : 'medium',
      title: 'Heavy Rainfall Alert',
      message: `Heavy rainfall detected (${weather.rainfall.toFixed(1)}mm). Ensure proper drainage to prevent waterlogging.`,
      actions: [
        'Check and clear drainage channels',
        'Delay harvesting if possible',
        'Protect stored crops from moisture',
        'Monitor for fungal diseases'
      ],
      conditions: {
        rainfall: weather.rainfall
      }
    });
  }
  
  // Humidity advisory (humidity > 80%)
  if (weather.humidity > 80) {
    advisories.push({
      type: 'humidity',
      severity: weather.humidity > 90 ? 'high' : 'medium',
      title: 'High Humidity Alert',
      message: `Humidity is ${weather.humidity}%. High risk of fungal diseases and pest activity.`,
      actions: [
        'Improve air circulation around crops',
        'Apply preventive fungicides if needed',
        'Monitor for signs of disease',
        'Reduce irrigation to avoid excess moisture'
      ],
      conditions: {
        humidity: weather.humidity
      }
    });
  }
  
  // Wind advisory (wind speed > 10 m/s)
  if (weather.windSpeed > 10) {
    advisories.push({
      type: 'wind',
      severity: weather.windSpeed > 15 ? 'high' : 'medium',
      title: 'Strong Wind Alert',
      message: `Wind speed is ${weather.windSpeed.toFixed(1)} m/s. Protect crops from wind damage.`,
      actions: [
        'Stake tall crops for support',
        'Secure loose materials and equipment',
        'Delay spraying operations',
        'Check for physical damage after wind subsides'
      ],
      conditions: {
        windSpeed: weather.windSpeed
      }
    });
  }
  
  // Sort advisories by severity (high first)
  advisories.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
  
  return advisories;
}
