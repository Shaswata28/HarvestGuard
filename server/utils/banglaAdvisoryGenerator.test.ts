import { describe, it, expect } from 'vitest';
import { calculateDaysUntilHarvest, determineMostUrgentRisk, type WeatherRiskData } from './banglaAdvisoryGenerator';

describe('calculateDaysUntilHarvest', () => {
  it('should return null for null date', () => {
    const result = calculateDaysUntilHarvest(null);
    expect(result).toBeNull();
  });

  it('should return null for undefined date', () => {
    const result = calculateDaysUntilHarvest(undefined);
    expect(result).toBeNull();
  });

  it('should return 0 for past date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5); // 5 days ago
    
    const result = calculateDaysUntilHarvest(pastDate);
    expect(result).toBe(0);
  });

  it('should return positive number for future date', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10); // 10 days from now
    
    const result = calculateDaysUntilHarvest(futureDate);
    expect(result).toBe(10);
  });

  it('should return 0 for today', () => {
    const today = new Date();
    
    const result = calculateDaysUntilHarvest(today);
    expect(result).toBe(0);
  });

  it('should handle date strings', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    const result = calculateDaysUntilHarvest(futureDate);
    expect(result).toBe(7);
  });
});

describe('determineMostUrgentRisk', () => {
  it('should return null when no significant risks exist', () => {
    const weather: WeatherRiskData = {
      temperature: 28,
      rainfall: 0,
      humidity: 60,
      windSpeed: 3
    };
    
    const result = determineMostUrgentRisk(weather);
    expect(result).toBeNull();
  });

  it('should identify high severity rain risk', () => {
    const weather: WeatherRiskData = {
      temperature: 30,
      rainfall: 0,
      humidity: 70,
      windSpeed: 5,
      rainChance: 85
    };
    
    const result = determineMostUrgentRisk(weather);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('rain');
    expect(result?.severity).toBe('high');
    expect(result?.value).toBe(85);
  });

  it('should identify high severity heat risk', () => {
    const weather: WeatherRiskData = {
      temperature: 39,
      rainfall: 0,
      humidity: 60,
      windSpeed: 3
    };
    
    const result = determineMostUrgentRisk(weather);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('heat');
    expect(result?.severity).toBe('high');
    expect(result?.value).toBe(39);
  });

  it('should identify high severity wind risk', () => {
    const weather: WeatherRiskData = {
      temperature: 30,
      rainfall: 0,
      humidity: 60,
      windSpeed: 16
    };
    
    const result = determineMostUrgentRisk(weather);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('wind');
    expect(result?.severity).toBe('high');
    expect(result?.value).toBe(16);
  });

  it('should identify high severity humidity risk', () => {
    const weather: WeatherRiskData = {
      temperature: 30,
      rainfall: 0,
      humidity: 92,
      windSpeed: 3
    };
    
    const result = determineMostUrgentRisk(weather);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('humidity');
    expect(result?.severity).toBe('high');
    expect(result?.value).toBe(92);
  });

  it('should prioritize high severity over medium severity', () => {
    const weather: WeatherRiskData = {
      temperature: 36, // medium heat
      rainfall: 0,
      humidity: 92, // high humidity
      windSpeed: 3
    };
    
    const result = determineMostUrgentRisk(weather);
    expect(result).not.toBeNull();
    expect(result?.severity).toBe('high');
    expect(result?.type).toBe('humidity');
  });

  it('should prioritize rain over heat when same severity', () => {
    const weather: WeatherRiskData = {
      temperature: 39, // high heat
      rainfall: 0,
      humidity: 60,
      windSpeed: 3,
      rainChance: 75 // high rain
    };
    
    const result = determineMostUrgentRisk(weather);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('rain');
    expect(result?.severity).toBe('high');
  });

  it('should prioritize heat over wind when same severity', () => {
    const weather: WeatherRiskData = {
      temperature: 38, // high heat
      rainfall: 0,
      humidity: 60,
      windSpeed: 16 // high wind
    };
    
    const result = determineMostUrgentRisk(weather);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('heat');
    expect(result?.severity).toBe('high');
  });

  it('should prioritize wind over humidity when same severity', () => {
    const weather: WeatherRiskData = {
      temperature: 30,
      rainfall: 0,
      humidity: 91, // high humidity
      windSpeed: 15 // high wind
    };
    
    const result = determineMostUrgentRisk(weather);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('wind');
    expect(result?.severity).toBe('high');
  });

  it('should handle medium severity risks', () => {
    const weather: WeatherRiskData = {
      temperature: 36, // medium heat
      rainfall: 0,
      humidity: 60,
      windSpeed: 3
    };
    
    const result = determineMostUrgentRisk(weather);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('heat');
    expect(result?.severity).toBe('medium');
  });

  it('should use rainfall amount when rainChance is not provided', () => {
    const weather: WeatherRiskData = {
      temperature: 30,
      rainfall: 55, // high rainfall
      humidity: 60,
      windSpeed: 3
    };
    
    const result = determineMostUrgentRisk(weather);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('rain');
    expect(result?.severity).toBe('high');
    expect(result?.value).toBe(55);
  });

  it('should handle multiple medium severity risks and prioritize by type', () => {
    const weather: WeatherRiskData = {
      temperature: 36, // medium heat
      rainfall: 0,
      humidity: 82, // medium humidity
      windSpeed: 11 // medium wind
    };
    
    const result = determineMostUrgentRisk(weather);
    expect(result).not.toBeNull();
    expect(result?.severity).toBe('medium');
    expect(result?.type).toBe('heat'); // heat prioritized over wind and humidity
  });

  it('should return single risk when only one exists', () => {
    const weather: WeatherRiskData = {
      temperature: 32, // low heat (still above threshold)
      rainfall: 0,
      humidity: 60,
      windSpeed: 3
    };
    
    const result = determineMostUrgentRisk(weather);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('heat');
    expect(result?.severity).toBe('low');
  });
});
