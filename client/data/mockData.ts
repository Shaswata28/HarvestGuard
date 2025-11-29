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

export interface CropType {
  id: string;              // Unique identifier (e.g., "rice", "wheat")
  label_bn: string;        // Bengali name
  label_en: string;        // English name
  icon: string;            // Emoji or icon representation
  category?: string;       // Optional: "grain", "vegetable", "pulse"
  description_bn?: string; // Optional: Bengali description
  description_en?: string; // Optional: English description
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

export const cropTypes: CropType[] = [
  {
    id: "rice",
    label_bn: "ধান",
    label_en: "Rice/Paddy",
    icon: "🌾",
    category: "grain"
  },
  {
    id: "wheat",
    label_bn: "গম",
    label_en: "Wheat",
    icon: "🌾",
    category: "grain"
  },
  {
    id: "jute",
    label_bn: "পাট",
    label_en: "Jute",
    icon: "🌿",
    category: "fiber"
  },
  {
    id: "potato",
    label_bn: "আলু",
    label_en: "Potato",
    icon: "🥔",
    category: "vegetable"
  },
  {
    id: "tomato",
    label_bn: "টমেটো",
    label_en: "Tomato",
    icon: "🍅",
    category: "vegetable"
  },
  {
    id: "lentil",
    label_bn: "মসুর ডাল",
    label_en: "Lentil",
    icon: "🫘",
    category: "pulse"
  },
  {
    id: "mustard",
    label_bn: "সরিষা",
    label_en: "Mustard",
    icon: "🌻",
    category: "oilseed"
  },
  {
    id: "corn",
    label_bn: "ভুট্টা",
    label_en: "Corn/Maize",
    icon: "🌽",
    category: "grain"
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

/**
 * Get display information for a crop type
 * @param cropTypeId - The crop type identifier (e.g., "rice", "wheat") or legacy value (e.g., "ধান")
 * @param language - The language preference ('bn' for Bengali, 'en' for English)
 * @returns Object containing the localized name and icon for the crop
 */
export function getCropDisplay(cropTypeId: string, language: 'bn' | 'en'): { name: string; icon: string } {
  // Handle legacy Bengali crop names for backward compatibility
  if (cropTypeId === "ধান") {
    return { 
      name: language === 'bn' ? "ধান" : "Rice/Paddy", 
      icon: "🌾" 
    };
  }
  
  // Handle new crop type IDs
  const crop = cropTypes.find(c => c.id === cropTypeId);
  
  // Fallback for unknown crop types
  if (!crop) {
    return { 
      name: cropTypeId, 
      icon: "🌱" 
    };
  }
  
  return {
    name: language === 'bn' ? crop.label_bn : crop.label_en,
    icon: crop.icon
  };
}