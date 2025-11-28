// Unified Data Structure to prevent crashes
export interface WeatherData {
  upazila: string;
  temperature: number;
  feelsLike: number;
  rainChance: number; // Changed from rain_prob
  humidity: number;
  windSpeed: number; // Changed from wind_speed
  condition: string;
  forecast?: DayForecast[];
}

export interface DayForecast {
  day: string;
  highTemp: number;
  lowTemp: number;
  rainChance: number;
  condition: string;
}

export interface CropBatch {
  id: string;
  cropType: string; // Changed from crop_type
  weight: number;
  storageLocation: string; // Changed from storage_type
  batchNumber: string; // Changed from batch_number
  harvestDate: string;
  enteredDate: string;
  status: string;
}

// Default Mock Data (Safe Fallback)
export const mockWeatherData: WeatherData = {
  upazila: "ঢাকা (Dhaka)",
  temperature: 32,
  feelsLike: 35,
  rainChance: 45,
  humidity: 78,
  windSpeed: 12,
  condition: "আংশিক মেঘলা", // Partly Cloudy
  forecast: [
    { day: "শনি", highTemp: 33, lowTemp: 26, rainChance: 30, condition: "রৌদ্রোজ্জ্বল" },
    { day: "রবি", highTemp: 31, lowTemp: 25, rainChance: 60, condition: "বৃষ্টি" },
    { day: "সোম", highTemp: 30, lowTemp: 24, rainChance: 80, condition: "বজ্রপাত" },
    { day: "মঙ্গল", highTemp: 32, lowTemp: 25, rainChance: 40, condition: "মেঘলা" },
    { day: "বুধ", highTemp: 34, lowTemp: 26, rainChance: 10, condition: "রৌদ্রোজ্জ্বল" },
  ]
};

export const mockCropBatches: CropBatch[] = [
  {
    id: "batch_001",
    cropType: "ধান",
    weight: 1200,
    storageLocation: "jute_bag",
    batchNumber: "#101",
    harvestDate: "2025-02-10",
    enteredDate: "2025-02-12",
    status: "active",
  },
  {
    id: "batch_002",
    cropType: "ধান",
    weight: 950,
    storageLocation: "silo",
    batchNumber: "#102",
    harvestDate: "2025-02-15",
    enteredDate: "2025-02-16",
    status: "active",
  }
];

export const storageTypes = [
  {
    id: "jute_bag",
    label_bn: "চটের বস্তা",
    label_en: "Jute Bag",
    icon: "🎒",
    description_bn: "স্তূপ করে রাখা",
    description_en: "Stacked bags",
  },
  {
    id: "tin_shed",
    label_bn: "টিনের ঘর/গোলা",
    label_en: "Tin Shed",
    icon: "🏠",
    description_bn: "শুকনো ও নিরাপদ",
    description_en: "Dry storage",
  },
  {
    id: "silo",
    label_bn: "প্লাস্টিক ড্রাম/সাইলো",
    label_en: "Silo/Drum",
    icon: "🛢️",
    description_bn: "আধুনিক সংরক্ষণ",
    description_en: "Modern storage",
  },
  {
    id: "open_space",
    label_bn: "খোলা চাতাল",
    label_en: "Open Area",
    icon: "☀️",
    description_bn: "অস্থায়ী সংরক্ষণ",
    description_en: "Temporary",
  },
];