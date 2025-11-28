import { describe, it, expect } from 'vitest';
import { generateAdvisories } from './advisoryGenerator';

describe('Advisory Generator', () => {
  it('should generate heat advisory for high temperature', () => {
    const weather = {
      temperature: 38,
      rainfall: 0,
      humidity: 60,
      windSpeed: 5,
    };

    const advisories = generateAdvisories(weather);
    
    expect(advisories).toHaveLength(1);
    expect(advisories[0].type).toBe('heat');
    expect(advisories[0].severity).toBe('medium');
    expect(advisories[0].title).toBe('High Temperature Alert');
  });

  it('should generate high severity heat advisory for extreme temperature', () => {
    const weather = {
      temperature: 42,
      rainfall: 0,
      humidity: 60,
      windSpeed: 5,
    };

    const advisories = generateAdvisories(weather);
    
    expect(advisories[0].severity).toBe('high');
  });

  it('should generate rainfall advisory for heavy rain', () => {
    const weather = {
      temperature: 30,
      rainfall: 75,
      humidity: 60,
      windSpeed: 5,
    };

    const advisories = generateAdvisories(weather);
    
    expect(advisories).toHaveLength(1);
    expect(advisories[0].type).toBe('rainfall');
    expect(advisories[0].severity).toBe('medium');
  });

  it('should generate high severity rainfall advisory for extreme rain', () => {
    const weather = {
      temperature: 30,
      rainfall: 120,
      humidity: 60,
      windSpeed: 5,
    };

    const advisories = generateAdvisories(weather);
    
    expect(advisories[0].severity).toBe('high');
  });

  it('should generate humidity advisory for high humidity', () => {
    const weather = {
      temperature: 30,
      rainfall: 0,
      humidity: 85,
      windSpeed: 5,
    };

    const advisories = generateAdvisories(weather);
    
    expect(advisories).toHaveLength(1);
    expect(advisories[0].type).toBe('humidity');
    expect(advisories[0].severity).toBe('medium');
  });

  it('should generate wind advisory for strong winds', () => {
    const weather = {
      temperature: 30,
      rainfall: 0,
      humidity: 60,
      windSpeed: 12,
    };

    const advisories = generateAdvisories(weather);
    
    expect(advisories).toHaveLength(1);
    expect(advisories[0].type).toBe('wind');
    expect(advisories[0].severity).toBe('medium');
  });

  it('should generate multiple advisories for multiple conditions', () => {
    const weather = {
      temperature: 38,
      rainfall: 60,
      humidity: 85,
      windSpeed: 12,
    };

    const advisories = generateAdvisories(weather);
    
    expect(advisories).toHaveLength(4);
    expect(advisories.map(a => a.type)).toContain('heat');
    expect(advisories.map(a => a.type)).toContain('rainfall');
    expect(advisories.map(a => a.type)).toContain('humidity');
    expect(advisories.map(a => a.type)).toContain('wind');
  });

  it('should sort advisories by severity (high first)', () => {
    const weather = {
      temperature: 42, // high severity
      rainfall: 60,    // medium severity
      humidity: 85,    // medium severity
      windSpeed: 5,
    };

    const advisories = generateAdvisories(weather);
    
    expect(advisories[0].severity).toBe('high');
    expect(advisories[0].type).toBe('heat');
  });

  it('should return empty array for normal weather', () => {
    const weather = {
      temperature: 30,
      rainfall: 10,
      humidity: 60,
      windSpeed: 5,
    };

    const advisories = generateAdvisories(weather);
    
    expect(advisories).toHaveLength(0);
  });

  it('should include appropriate actions for each advisory type', () => {
    const weather = {
      temperature: 38,
      rainfall: 0,
      humidity: 60,
      windSpeed: 5,
    };

    const advisories = generateAdvisories(weather);
    
    expect(advisories[0].actions).toBeDefined();
    expect(advisories[0].actions.length).toBeGreaterThan(0);
    expect(advisories[0].actions).toContain('Increase irrigation frequency');
  });

  it('should include weather conditions in advisory', () => {
    const weather = {
      temperature: 38,
      rainfall: 0,
      humidity: 60,
      windSpeed: 5,
    };

    const advisories = generateAdvisories(weather);
    
    expect(advisories[0].conditions).toBeDefined();
    expect(advisories[0].conditions.temperature).toBe(38);
  });
});
