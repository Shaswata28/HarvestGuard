export interface WeatherData {
  upazila: string;
  temperature: number;
  feelsLike: number;
  rainChance: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  forecast: DayForecast[];
}

export interface DayForecast {
  day: string;
  highTemp: number;
  lowTemp: number;
  rainChance: number;
  condition: string;
}

// List of upazilas in Bangladesh
export const UPAZILAS = [
  "ঢাকা (Dhaka)",
  "চট্টগ্রাম (Chittagong)",
  "সিলেট (Sylhet)",
  "খুলনা (Khulna)",
  "রাজশাহী (Rajshahi)",
  "বরিশাল (Barisal)",
  "রঙ্গপুর (Rangpur)",
  "ময়মনসিংহ (Mymensingh)",
];

const upazilaWeatherData: Record<string, Partial<WeatherData>> = {
  "ঢাকা (Dhaka)": {
    upazila: "ঢাকা",
    temperature: 32,
    feelsLike: 35,
    rainChance: 45,
    humidity: 72,
    windSpeed: 12,
    condition: "আংশিক মেঘাচ্ছন্ন",
  },
  "চট্টগ্রাম (Chittagong)": {
    upazila: "চট্টগ্রাম",
    temperature: 30,
    feelsLike: 33,
    rainChance: 65,
    humidity: 78,
    windSpeed: 15,
    condition: "বৃষ্টি সম্ভব",
  },
  "সিলেট (Sylhet)": {
    upazila: "সিলেট",
    temperature: 28,
    feelsLike: 31,
    rainChance: 85,
    humidity: 82,
    windSpeed: 18,
    condition: "ভারী বৃষ্টি",
  },
  "খুলনা (Khulna)": {
    upazila: "খুলনা",
    temperature: 34,
    feelsLike: 37,
    rainChance: 30,
    humidity: 68,
    windSpeed: 10,
    condition: "রোদ্দুর",
  },
  "রাজশাহী (Rajshahi)": {
    upazila: "রাজশাহী",
    temperature: 36,
    feelsLike: 38,
    rainChance: 20,
    humidity: 62,
    windSpeed: 8,
    condition: "পরিষ্কার",
  },
  "বরিশাল (Barisal)": {
    upazila: "বরিশাল",
    temperature: 31,
    feelsLike: 34,
    rainChance: 55,
    humidity: 75,
    windSpeed: 14,
    condition: "মেঘাচ্ছন্ন",
  },
  "রঙ্গপুর (Rangpur)": {
    upazila: "রঙ্গপুর",
    temperature: 29,
    feelsLike: 32,
    rainChance: 48,
    humidity: 70,
    windSpeed: 11,
    condition: "আংশিক মেঘাচ্ছন্ন",
  },
  "ময়মনসিংহ (Mymensingh)": {
    upazila: "ময়মনসিংহ",
    temperature: 30,
    feelsLike: 33,
    rainChance: 52,
    humidity: 73,
    windSpeed: 13,
    condition: "মেঘাচ্ছন্ন",
  },
};

export const getWeatherByUpazila = (upazilaName: string): WeatherData => {
  const baseData = upazilaWeatherData[upazilaName] || upazilaWeatherData["ঢাকা (Dhaka)"];

  // Generate 3-day forecast
  const forecast: DayForecast[] = [];
  const days = ["আগামীকাল", "পরের দিন", "তিন দিন পর"];
  const conditions = ["রোদ্দুর", "মেঘাচ্ছন্ন", "বৃষ্টি"];

  for (let i = 0; i < 3; i++) {
    forecast.push({
      day: days[i],
      highTemp: (baseData.temperature || 30) + i,
      lowTemp: (baseData.temperature || 30) - 5 + i,
      rainChance: Math.max(0, Math.min(100, (baseData.rainChance || 50) + (i * 15 - 15))),
      condition: conditions[i],
    });
  }

  return {
    upazila: baseData.upazila || "অজানা",
    temperature: baseData.temperature || 30,
    feelsLike: baseData.feelsLike || 32,
    rainChance: baseData.rainChance || 50,
    humidity: baseData.humidity || 70,
    windSpeed: baseData.windSpeed || 12,
    condition: baseData.condition || "পরিবর্তনশীল",
    forecast,
  };
};

// Get advisory based on weather data
export const getWeatherAdvisory = (weather: WeatherData) => {
  const advisories = [];

  // High rain advisory
  if (weather.rainChance > 80) {
    advisories.push({
      type: "high_rain",
      level: "critical",
      title: "বৃষ্টি সতর্কতা",
      message: `আগামী ৩ দিন বৃষ্টি ${weather.rainChance}% - আজই ধান কাটুন অথবা ঢেকে রাখুন`,
      emoji: "⚠️",
    });
  }
  // Moderate rain advisory
  else if (weather.rainChance > 50) {
    advisories.push({
      type: "moderate_rain",
      level: "warning",
      title: "মধ্যম বৃষ্টির সম্ভাবনা",
      message: `আগামী ৩ দিন বৃষ্টি ${weather.rainChance}% - প্রস্তুত থাকুন`,
      emoji: "⛅",
    });
  }

  // High temperature advisory
  if (weather.temperature > 35) {
    advisories.push({
      type: "high_temp",
      level: "warning",
      title: "উচ্চ তাপমাত্রা",
      message: `তাপমাত্রা ${weather.temperature}°C - বিকেলের দিকে সেচ দিন এবং গাছপালা রক্ষা করুন`,
      emoji: "🌡️",
    });
  }

  // High humidity advisory
  if (weather.humidity > 80) {
    advisories.push({
      type: "high_humidity",
      level: "warning",
      title: "উচ্��� আর্দ্রতা",
      message: `আর্দ্রতা ${weather.humidity}% - ছত্রাক রোগের ঝুঁকি বেশি, সতর্ক থাকুন`,
      emoji: "💧",
    });
  }

  // Safe conditions
  if (advisories.length === 0) {
    advisories.push({
      type: "safe",
      level: "safe",
      title: "নিরাপদ অবস্থা",
      message: "আবহাওয়া নিরাপদ। আপনার ফসল রক্ষা করুন এবং কাজ অব্যাহত রাখুন।",
      emoji: "✅",
    });
  }

  return advisories;
};
