/**
 * Weather condition translations for Bangla
 */

export const WEATHER_TRANSLATIONS: Record<string, string> = {
  // Clear conditions
  "clear sky": "পরিষ্কার আকাশ",
  "clear": "পরিষ্কার",
  "sunny": "রৌদ্রোজ্জ্বল",
  
  // Clouds
  "few clouds": "হালকা মেঘ",
  "scattered clouds": "বিক্ষিপ্ত মেঘ",
  "broken clouds": "ভাঙা মেঘ",
  "overcast clouds": "ঘন মেঘ",
  "clouds": "মেঘলা",
  "cloudy": "মেঘলা",
  "partly cloudy": "আংশিক মেঘলা",
  
  // Rain
  "light rain": "হালকা বৃষ্টি",
  "moderate rain": "মাঝারি বৃষ্টি",
  "heavy rain": "ভারী বৃষ্টি",
  "very heavy rain": "অতি ভারী বৃষ্টি",
  "extreme rain": "প্রচণ্ড বৃষ্টি",
  "rain": "বৃষ্টি",
  "rainy": "বৃষ্টি",
  "drizzle": "গুঁড়ি গুঁড়ি বৃষ্টি",
  "light intensity drizzle": "হালকা গুঁড়ি বৃষ্টি",
  "heavy intensity drizzle": "ভারী গুঁড়ি বৃষ্টি",
  "shower rain": "বর্ষণ",
  "light intensity shower rain": "হালকা বর্ষণ",
  "heavy intensity shower rain": "ভারী বর্ষণ",
  "ragged shower rain": "অনিয়মিত বর্ষণ",
  
  // Thunderstorm
  "thunderstorm": "বজ্রঝড়",
  "thunderstorm with light rain": "হালকা বৃষ্টি সহ বজ্রঝড়",
  "thunderstorm with rain": "বৃষ্টি সহ বজ্রঝড়",
  "thunderstorm with heavy rain": "ভারী বৃষ্টি সহ বজ্রঝড়",
  "light thunderstorm": "হালকা বজ্রঝড়",
  "heavy thunderstorm": "ভারী বজ্রঝড়",
  "ragged thunderstorm": "অনিয়মিত বজ্রঝড়",
  
  // Snow
  "light snow": "হালকা তুষারপাত",
  "snow": "তুষারপাত",
  "heavy snow": "ভারী তুষারপাত",
  "sleet": "শিলাবৃষ্টি",
  "light shower sleet": "হালকা শিলাবৃষ্টি",
  "shower sleet": "শিলাবৃষ্টি",
  
  // Atmosphere
  "mist": "কুয়াশা",
  "fog": "ঘন কুয়াশা",
  "haze": "ধোঁয়াশা",
  "smoke": "ধোঁয়া",
  "dust": "ধুলো",
  "sand": "বালি",
  "ash": "ছাই",
  "squall": "ঝড়",
  "tornado": "টর্নেডো",
  
  // Additional common descriptions
  "hot": "গরম",
  "warm": "উষ্ণ",
  "cool": "শীতল",
  "cold": "ঠান্ডা",
  "humid": "আর্দ্র",
  "dry": "শুষ্ক",
  "windy": "ঝড়ো",
  "breezy": "মৃদু বাতাস"
};

/**
 * Translate weather condition to Bangla
 * Falls back to English if translation not found
 */
export function translateWeatherCondition(condition: string, language: 'bn' | 'en'): string {
  if (language === 'en') {
    return condition;
  }
  
  const lowerCondition = condition.toLowerCase();
  
  // Try exact match first
  if (WEATHER_TRANSLATIONS[lowerCondition]) {
    return WEATHER_TRANSLATIONS[lowerCondition];
  }
  
  // Try partial matches for compound descriptions
  for (const [english, bangla] of Object.entries(WEATHER_TRANSLATIONS)) {
    if (lowerCondition.includes(english)) {
      return bangla;
    }
  }
  
  // Fallback to original if no translation found
  return condition;
}

/**
 * Get weather icon emoji based on condition
 */
export function getWeatherIcon(condition: string): string {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes('thunder') || lowerCondition.includes('বজ্র')) {
    return '⛈️';
  }
  if (lowerCondition.includes('rain') || lowerCondition.includes('বৃষ্টি') || lowerCondition.includes('drizzle')) {
    return '🌧️';
  }
  if (lowerCondition.includes('snow') || lowerCondition.includes('তুষার')) {
    return '🌨️';
  }
  if (lowerCondition.includes('cloud') || lowerCondition.includes('মেঘ')) {
    return '☁️';
  }
  if (lowerCondition.includes('clear') || lowerCondition.includes('sunny') || lowerCondition.includes('পরিষ্কার')) {
    return '☀️';
  }
  if (lowerCondition.includes('fog') || lowerCondition.includes('mist') || lowerCondition.includes('কুয়াশা')) {
    return '🌫️';
  }
  if (lowerCondition.includes('wind') || lowerCondition.includes('বাতাস')) {
    return '💨';
  }
  
  return '🌤️'; // Default partly cloudy
}
