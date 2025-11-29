/**
 * Bangladesh Location Coordinates Mapping
 * Maps divisions, districts, and upazilas to their geographic coordinates
 */

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface LocationData {
  [division: string]: {
    [district: string]: {
      coordinates: Coordinates;
      upazilas?: {
        [upazila: string]: Coordinates;
      };
    };
  };
}

/**
 * Bangladesh geographic bounds for validation
 */
export const BANGLADESH_BOUNDS = {
  lat: { min: 20.0, max: 27.0 },
  lon: { min: 88.0, max: 93.0 }
};

/**
 * Default location (Dhaka) used as fallback
 */
export const DEFAULT_LOCATION: Coordinates = {
  lat: 23.8103,
  lon: 90.4125
};

/**
 * Comprehensive mapping of Bangladesh administrative divisions to coordinates
 */
export const LOCATION_COORDINATES: LocationData = {
  "Dhaka": {
    "Dhaka": {
      coordinates: { lat: 23.8103, lon: 90.4125 },
      upazilas: {
        "Dhamrai": { lat: 23.9000, lon: 90.1333 },
        "Dohar": { lat: 23.5833, lon: 90.1333 },
        "Keraniganj": { lat: 23.7167, lon: 90.3667 },
        "Nawabganj": { lat: 23.8833, lon: 90.1667 },
        "Savar": { lat: 23.8583, lon: 90.2667 },
        "Dhaka Sadar": { lat: 23.8103, lon: 90.4125 }
      }
    },
    "Gazipur": {
      coordinates: { lat: 23.9999, lon: 90.4203 },
      upazilas: {
        "Gazipur Sadar": { lat: 23.9999, lon: 90.4203 },
        "Kaliakair": { lat: 24.0833, lon: 90.2167 },
        "Kapasia": { lat: 24.1167, lon: 90.6500 },
        "Sreepur": { lat: 24.3167, lon: 90.4500 },
        "Kaliganj": { lat: 24.0333, lon: 90.1167 }
      }
    },
    "Kishoreganj": {
      coordinates: { lat: 24.4260, lon: 90.7760 },
      upazilas: {
        "Austagram": { lat: 24.2667, lon: 91.1250 },
        "Bajitpur": { lat: 24.2167, lon: 90.9500 },
        "Bhairab": { lat: 24.0500, lon: 90.9833 },
        "Hossainpur": { lat: 24.4167, lon: 90.6500 },
        "Itna": { lat: 24.5333, lon: 91.1667 },
        "Karimganj": { lat: 24.4583, lon: 90.8667 },
        "Katiadi": { lat: 24.2500, lon: 90.8000 },
        "Kishoreganj Sadar": { lat: 24.4333, lon: 90.7667 },
        "Kuliarchar": { lat: 24.1500, lon: 90.9000 },
        "Mithamain": { lat: 24.4167, lon: 91.0333 },
        "Nikli": { lat: 24.3333, lon: 90.9500 },
        "Pakundia": { lat: 24.3333, lon: 90.6833 },
        "Tarail": { lat: 24.5667, lon: 90.8667 }
      }
    },
    "Manikganj": {
      coordinates: { lat: 23.8617, lon: 90.0003 },
      upazilas: {
        "Daulatpur": { lat: 23.9667, lon: 89.8333 },
        "Ghior": { lat: 23.8833, lon: 89.9167 },
        "Harirampur": { lat: 23.7333, lon: 89.9667 },
        "Manikganj Sadar": { lat: 23.8617, lon: 90.0003 },
        "Saturia": { lat: 23.9250, lon: 90.0250 },
        "Shibalaya": { lat: 23.8333, lon: 89.8000 },
        "Singair": { lat: 23.8167, lon: 90.1500 }
      }
    },
    "Munshiganj": {
      coordinates: { lat: 23.5422, lon: 90.5305 },
      upazilas: {
        "Gazaria": { lat: 23.5417, lon: 90.6083 },
        "Lohajang": { lat: 23.4667, lon: 90.3500 },
        "Munshiganj Sadar": { lat: 23.5422, lon: 90.5305 },
        "Sirajdikhan": { lat: 23.6167, lon: 90.3833 },
        "Sreenagar": { lat: 23.5333, lon: 90.2833 },
        "Tongibari": { lat: 23.5000, lon: 90.4500 }
      }
    },
    "Narayanganj": {
      coordinates: { lat: 23.6238, lon: 90.4995 },
      upazilas: {
        "Araihazar": { lat: 23.7833, lon: 90.6500 },
        "Bandar": { lat: 23.6000, lon: 90.5167 },
        "Narayanganj Sadar": { lat: 23.6238, lon: 90.4995 },
        "Rupganj": { lat: 23.7833, lon: 90.5000 },
        "Sonargaon": { lat: 23.6500, lon: 90.6000 }
      }
    },
    "Narsingdi": {
      coordinates: { lat: 23.9229, lon: 90.7176 },
      upazilas: {
        "Belabo": { lat: 24.1000, lon: 90.8500 },
        "Monohardi": { lat: 24.1333, lon: 90.7000 },
        "Narsingdi Sadar": { lat: 23.9229, lon: 90.7176 },
        "Palash": { lat: 23.9333, lon: 90.6333 },
        "Raipura": { lat: 23.9667, lon: 90.8667 },
        "Shibpur": { lat: 24.0333, lon: 90.7333 }
      }
    },
    "Rajbari": {
      coordinates: { lat: 23.7574, lon: 89.6444 },
      upazilas: {
        "Baliakandi": { lat: 23.6333, lon: 89.5500 },
        "Goalandaghat": { lat: 23.7333, lon: 89.7500 },
        "Pangsha": { lat: 23.8000, lon: 89.4167 },
        "Kalukhali": { lat: 23.7000, lon: 89.5000 },
        "Rajbari Sadar": { lat: 23.7574, lon: 89.6444 }
      }
    },
    "Shariatpur": {
      coordinates: { lat: 23.2423, lon: 90.4348 },
      upazilas: {
        "Bhedarganj": { lat: 23.2000, lon: 90.3833 },
        "Damudya": { lat: 23.1333, lon: 90.4333 },
        "Gosairhat": { lat: 23.0667, lon: 90.4500 },
        "Naria": { lat: 23.3000, lon: 90.4167 },
        "Shariatpur Sadar": { lat: 23.2423, lon: 90.4348 },
        "Zajira": { lat: 23.3500, lon: 90.3333 }
      }
    },
    "Tangail": {
      coordinates: { lat: 24.2513, lon: 89.9167 },
      upazilas: {
        "Basail": { lat: 24.2167, lon: 90.0500 },
        "Bhuapur": { lat: 24.4667, lon: 89.8667 },
        "Delduar": { lat: 24.1500, lon: 89.9667 },
        "Dhanbari": { lat: 24.6833, lon: 89.9667 },
        "Ghatail": { lat: 24.5000, lon: 89.9833 },
        "Gopalpur": { lat: 24.5500, lon: 89.9167 },
        "Kalihati": { lat: 24.3833, lon: 90.0000 },
        "Madhupur": { lat: 24.6167, lon: 90.0333 },
        "Mirzapur": { lat: 24.1000, lon: 90.1000 },
        "Nagarpur": { lat: 24.0500, lon: 89.8667 },
        "Sakhipur": { lat: 24.3333, lon: 90.1667 },
        "Tangail Sadar": { lat: 24.2513, lon: 89.9167 }
      }
    },
    "Faridpur": {
      coordinates: { lat: 23.6070, lon: 89.8429 },
      upazilas: {
        "Alfadanga": { lat: 23.2833, lon: 89.6833 },
        "Bhanga": { lat: 23.3833, lon: 89.9833 },
        "Boalmari": { lat: 23.3833, lon: 89.6667 },
        "Char Bhadrasan": { lat: 23.5667, lon: 90.0333 },
        "Faridpur Sadar": { lat: 23.6070, lon: 89.8429 },
        "Madhukhali": { lat: 23.5333, lon: 89.6333 },
        "Nagarkanda": { lat: 23.4167, lon: 89.9167 },
        "Sadarpur": { lat: 23.4833, lon: 90.0333 },
        "Saltha": { lat: 23.5167, lon: 89.7833 }
      }
    },
    "Gopalganj": {
      coordinates: { lat: 23.0050, lon: 89.8266 },
      upazilas: {
        "Gopalganj Sadar": { lat: 23.0050, lon: 89.8266 },
        "Kashiani": { lat: 23.2167, lon: 89.7000 },
        "Kotalipara": { lat: 22.9833, lon: 90.0000 },
        "Muksudpur": { lat: 23.3167, lon: 89.8667 },
        "Tungipara": { lat: 22.9000, lon: 89.8833 }
      }
    },
    "Madaripur": {
      coordinates: { lat: 23.1641, lon: 90.1897 },
      upazilas: {
        "Kalkini": { lat: 23.0667, lon: 90.2333 },
        "Madaripur Sadar": { lat: 23.1641, lon: 90.1897 },
        "Rajoir": { lat: 23.2000, lon: 90.0333 },
        "Shibchar": { lat: 23.3500, lon: 90.1667 }
      }
    }
  },
  "Chittagong": {
    "Chittagong": {
      coordinates: { lat: 22.3569, lon: 91.7832 },
      upazilas: {
        "Anwara": { lat: 22.3667, lon: 91.7500 },
        "Banshkhali": { lat: 22.3000, lon: 91.9667 },
        "Boalkhali": { lat: 22.4667, lon: 91.8167 },
        "Chandanaish": { lat: 22.4667, lon: 91.9667 },
        "Fatikchhari": { lat: 22.6833, lon: 91.8000 },
        "Hathazari": { lat: 22.5167, lon: 91.8000 },
        "Lohagara": { lat: 22.4000, lon: 91.7167 },
        "Mirsharai": { lat: 22.7500, lon: 91.4833 },
        "Patiya": { lat: 22.3167, lon: 91.9833 },
        "Rangunia": { lat: 22.6333, lon: 91.9333 },
        "Raozan": { lat: 22.5333, lon: 91.9667 },
        "Sandwip": { lat: 22.4833, lon: 91.4500 },
        "Satkania": { lat: 22.0833, lon: 92.0500 },
        "Sitakunda": { lat: 22.6167, lon: 91.6667 },
        "Karnaphuli": { lat: 22.3100, lon: 91.8200 }
      }
    },
    "Cox's Bazar": {
      coordinates: { lat: 21.4272, lon: 92.0058 },
      upazilas: {
        "Cox's Bazar Sadar": { lat: 21.4272, lon: 92.0058 },
        "Chakaria": { lat: 21.8667, lon: 91.9833 },
        "Kutubdia": { lat: 21.8167, lon: 91.8500 },
        "Maheshkhali": { lat: 21.4667, lon: 91.9833 },
        "Ramu": { lat: 21.3333, lon: 92.1667 },
        "Teknaf": { lat: 20.8667, lon: 92.3000 },
        "Ukhia": { lat: 21.2333, lon: 92.1000 },
        "Pekua": { lat: 21.5333, lon: 91.9833 }
      }
    },
    "Comilla": {
      coordinates: { lat: 23.4607, lon: 91.1809 },
      upazilas: {
        "Barura": { lat: 23.3667, lon: 91.0500 },
        "Brahmanpara": { lat: 23.6167, lon: 91.1000 },
        "Burichang": { lat: 23.5500, lon: 91.1333 },
        "Chandina": { lat: 23.4833, lon: 91.0000 },
        "Chauddagram": { lat: 23.2833, lon: 91.3167 },
        "Comilla Sadar": { lat: 23.4607, lon: 91.1809 },
        "Comilla Sadar Dakshin": { lat: 23.3833, lon: 91.1500 },
        "Daudkandi": { lat: 23.5333, lon: 90.7167 },
        "Debidwar": { lat: 23.6000, lon: 90.9833 },
        "Homna": { lat: 23.6833, lon: 90.7833 },
        "Laksam": { lat: 23.2333, lon: 91.1167 },
        "Lalmai": { lat: 23.3333, lon: 91.1333 },
        "Meghna": { lat: 23.6167, lon: 90.6833 },
        "Monohargonj": { lat: 23.1833, lon: 91.0333 },
        "Muradnagar": { lat: 23.6333, lon: 90.9333 },
        "Nangalkot": { lat: 23.1667, lon: 91.2000 },
        "Titas": { lat: 23.6000, lon: 90.7833 }
      }
    },
    "Feni": {
      coordinates: { lat: 23.0159, lon: 91.3976 },
      upazilas: {
        "Chhagalnaiya": { lat: 23.0333, lon: 91.5167 },
        "Daganbhuiyan": { lat: 22.9333, lon: 91.3000 },
        "Feni Sadar": { lat: 23.0159, lon: 91.3976 },
        "Fulgazi": { lat: 23.1833, lon: 91.4000 },
        "Parshuram": { lat: 23.2167, lon: 91.4333 },
        "Sonagazi": { lat: 22.8500, lon: 91.3667 }
      }
    },
    "Khagrachari": {
      coordinates: { lat: 23.1193, lon: 91.9484 },
      upazilas: {
        "Dighinala": { lat: 23.2667, lon: 92.0500 },
        "Guimara": { lat: 23.0667, lon: 91.9167 },
        "Khagrachari Sadar": { lat: 23.1193, lon: 91.9484 },
        "Lakshmichhari": { lat: 22.7833, lon: 91.9000 },
        "Mahalchhari": { lat: 22.9167, lon: 92.0000 },
        "Manikchhari": { lat: 22.8333, lon: 91.8333 },
        "Matiranga": { lat: 23.0333, lon: 91.8667 },
        "Panchhari": { lat: 23.3167, lon: 91.9500 },
        "Ramgarh": { lat: 22.9667, lon: 91.7000 }
      }
    },
    "Lakshmipur": {
      coordinates: { lat: 22.9447, lon: 90.8282 },
      upazilas: {
        "Kamalnagar": { lat: 22.6833, lon: 90.8333 },
        "Lakshmipur Sadar": { lat: 22.9447, lon: 90.8282 },
        "Raipur": { lat: 23.0333, lon: 90.7667 },
        "Ramganj": { lat: 23.1000, lon: 90.8667 },
        "Ramgati": { lat: 22.6000, lon: 90.9833 }
      }
    },
    "Noakhali": {
      coordinates: { lat: 22.8696, lon: 91.0995 },
      upazilas: {
        "Begumganj": { lat: 22.9500, lon: 91.1000 },
        "Chatkhil": { lat: 23.0500, lon: 90.9667 },
        "Companiganj": { lat: 22.8667, lon: 91.2833 },
        "Hatiya": { lat: 22.3667, lon: 91.1167 },
        "Kabirhat": { lat: 22.8667, lon: 91.2167 },
        "Noakhali Sadar": { lat: 22.8696, lon: 91.0995 },
        "Senbagh": { lat: 22.9833, lon: 91.2333 },
        "Sonaimuri": { lat: 23.0333, lon: 91.1000 },
        "Subarnachar": { lat: 22.6667, lon: 91.1667 }
      }
    },
    "Rangamati": {
      coordinates: { lat: 22.7324, lon: 92.2985 },
      upazilas: {
        "Bagaichhari": { lat: 23.2667, lon: 92.2833 },
        "Barkal": { lat: 22.7333, lon: 92.3667 },
        "Belaichhari": { lat: 22.4667, lon: 92.3667 },
        "Juraichhari": { lat: 22.6667, lon: 92.3833 },
        "Kaptai": { lat: 22.5000, lon: 92.2167 },
        "Kawkhali": { lat: 22.5500, lon: 91.9667 },
        "Langadu": { lat: 22.9500, lon: 92.2500 },
        "Naniarchar": { lat: 22.8500, lon: 92.1167 },
        "Rajasthali": { lat: 22.3667, lon: 92.2167 },
        "Rangamati Sadar": { lat: 22.7324, lon: 92.2985 }
      }
    },
    "Bandarban": {
      coordinates: { lat: 22.1953, lon: 92.2183 },
      upazilas: {
        "Ali Kadam": { lat: 21.6667, lon: 92.3167 },
        "Bandarban Sadar": { lat: 22.1953, lon: 92.2183 },
        "Lama": { lat: 21.7833, lon: 92.2000 },
        "Naikhongchhari": { lat: 21.4167, lon: 92.1833 },
        "Rowangchhari": { lat: 22.1667, lon: 92.3333 },
        "Ruma": { lat: 22.0333, lon: 92.4000 },
        "Thanchi": { lat: 21.7833, lon: 92.4167 }
      }
    },
    "Brahmanbaria": {
      coordinates: { lat: 23.9608, lon: 91.1115 },
      upazilas: {
        "Akhaura": { lat: 23.8833, lon: 91.2167 },
        "Ashuganj": { lat: 24.0333, lon: 91.0167 },
        "Bancharampur": { lat: 23.7833, lon: 90.8167 },
        "Bijoynagar": { lat: 24.0333, lon: 91.2667 },
        "Brahmanbaria Sadar": { lat: 23.9608, lon: 91.1115 },
        "Kasba": { lat: 23.7333, lon: 91.1667 },
        "Nabinagar": { lat: 23.8833, lon: 90.9667 },
        "Nasirnagar": { lat: 24.2000, lon: 91.2000 },
        "Sarail": { lat: 24.1000, lon: 91.1167 }
      }
    },
    "Chandpur": {
      coordinates: { lat: 23.2332, lon: 90.6712 },
      upazilas: {
        "Chandpur Sadar": { lat: 23.2332, lon: 90.6712 },
        "Faridganj": { lat: 23.1167, lon: 90.7500 },
        "Haimchar": { lat: 23.0667, lon: 90.6333 },
        "Haziganj": { lat: 23.2500, lon: 90.8500 },
        "Kachua": { lat: 23.3500, lon: 90.9500 },
        "Matlab Dakshin": { lat: 23.3500, lon: 90.7000 },
        "Matlab Uttar": { lat: 23.4167, lon: 90.6333 },
        "Shahrasti": { lat: 23.2167, lon: 90.9500 }
      }
    }
  },
  "Rajshahi": {
    "Rajshahi": {
      coordinates: { lat: 24.3745, lon: 88.6042 },
      upazilas: {
        "Bagha": { lat: 24.4667, lon: 88.6833 },
        "Bagmara": { lat: 24.0833, lon: 88.7000 },
        "Charghat": { lat: 24.4167, lon: 88.9333 },
        "Durgapur": { lat: 24.3500, lon: 88.8667 },
        "Godagari": { lat: 24.4667, lon: 88.3333 },
        "Mohanpur": { lat: 24.4667, lon: 88.8333 },
        "Paba": { lat: 24.3833, lon: 88.7833 },
        "Puthia": { lat: 24.3667, lon: 88.8333 },
        "Tanore": { lat: 24.5000, lon: 88.5000 },
        "Rajshahi Sadar": { lat: 24.3745, lon: 88.6042 }
      }
    },
    "Bogra": {
      coordinates: { lat: 24.8465, lon: 89.3770 },
      upazilas: {
        "Adamdighi": { lat: 24.8167, lon: 89.0500 },
        "Bogra Sadar": { lat: 24.8465, lon: 89.3770 },
        "Dhunat": { lat: 24.7000, lon: 89.5000 },
        "Dhupchanchia": { lat: 24.8833, lon: 89.1667 },
        "Gabtali": { lat: 24.9000, lon: 89.5000 },
        "Kahaloo": { lat: 24.8000, lon: 89.2667 },
        "Nandigram": { lat: 24.6667, lon: 89.2000 },
        "Sariakandi": { lat: 24.9667, lon: 89.6000 },
        "Shajahanpur": { lat: 24.7833, lon: 89.3833 },
        "Sherpur": { lat: 24.6667, lon: 89.4167 },
        "Shibganj": { lat: 25.0167, lon: 89.3167 },
        "Sonatala": { lat: 25.0000, lon: 89.5000 }
      }
    },
    "Joypurhat": {
      coordinates: { lat: 25.0968, lon: 89.0227 },
      upazilas: {
        "Akkelpur": { lat: 24.9667, lon: 89.0333 },
        "Joypurhat Sadar": { lat: 25.0968, lon: 89.0227 },
        "Kalai": { lat: 25.0667, lon: 89.1833 },
        "Khetlal": { lat: 24.9833, lon: 89.1333 },
        "Panchbibi": { lat: 25.1833, lon: 89.0167 }
      }
    },
    "Naogaon": {
      coordinates: { lat: 24.7936, lon: 88.9318 },
      upazilas: {
        "Atrai": { lat: 24.6167, lon: 89.0000 },
        "Badalgachhi": { lat: 24.9667, lon: 88.9167 },
        "Dhamoirhat": { lat: 25.1333, lon: 88.8500 },
        "Manda": { lat: 24.7667, lon: 88.6667 },
        "Mohadevpur": { lat: 24.9000, lon: 88.7500 },
        "Naogaon Sadar": { lat: 24.7936, lon: 88.9318 },
        "Niamatpur": { lat: 24.8667, lon: 88.5667 },
        "Patnitala": { lat: 25.0500, lon: 88.7333 },
        "Porsha": { lat: 25.0333, lon: 88.4833 },
        "Raninagar": { lat: 24.7167, lon: 89.0000 },
        "Sapahar": { lat: 25.1333, lon: 88.5833 }
      }
    },
    "Natore": {
      coordinates: { lat: 24.4206, lon: 89.0000 },
      upazilas: {
        "Bagatipara": { lat: 24.3333, lon: 88.9333 },
        "Baraigram": { lat: 24.3000, lon: 89.1667 },
        "Gurudaspur": { lat: 24.4667, lon: 89.0500 },
        "Lalpur": { lat: 24.1833, lon: 88.9833 },
        "Naldanga": { lat: 24.4667, lon: 89.0833 },
        "Natore Sadar": { lat: 24.4206, lon: 89.0000 },
        "Singra": { lat: 24.5000, lon: 89.1500 }
      }
    },
    "Chapainawabganj": {
      coordinates: { lat: 24.5965, lon: 88.2775 },
      upazilas: {
        "Bholahat": { lat: 24.9000, lon: 88.2167 },
        "Gomastapur": { lat: 24.7833, lon: 88.2667 },
        "Nachole": { lat: 24.7333, lon: 88.4167 },
        "Nawabganj Sadar": { lat: 24.5965, lon: 88.2775 },
        "Shibganj": { lat: 24.6833, lon: 88.1667 }
      }
    },
    "Pabna": {
      coordinates: { lat: 24.0064, lon: 89.2372 },
      upazilas: {
        "Atgharia": { lat: 24.1333, lon: 89.2500 },
        "Bera": { lat: 24.0667, lon: 89.6167 },
        "Bhangura": { lat: 24.2167, lon: 89.4167 },
        "Chatmohar": { lat: 24.2333, lon: 89.2833 },
        "Faridpur": { lat: 24.1500, lon: 89.4500 },
        "Ishwardi": { lat: 24.1167, lon: 89.0667 },
        "Pabna Sadar": { lat: 24.0064, lon: 89.2372 },
        "Santhia": { lat: 24.0667, lon: 89.5333 },
        "Sujanagar": { lat: 23.9167, lon: 89.4333 }
      }
    },
    "Sirajganj": {
      coordinates: { lat: 24.4533, lon: 89.7006 },
      upazilas: {
        "Belkuchi": { lat: 24.2833, lon: 89.7000 },
        "Chauhali": { lat: 24.2167, lon: 89.7500 },
        "Kamarkhanda": { lat: 24.3667, lon: 89.6500 },
        "Kazipur": { lat: 24.6333, lon: 89.6500 },
        "Raiganj": { lat: 24.5000, lon: 89.5000 },
        "Shahjadpur": { lat: 24.1667, lon: 89.6000 },
        "Sirajganj Sadar": { lat: 24.4533, lon: 89.7006 },
        "Tarash": { lat: 24.4333, lon: 89.3667 },
        "Ullahpara": { lat: 24.3000, lon: 89.5667 }
      }
    }
  },
  "Khulna": {
    "Khulna": {
      coordinates: { lat: 22.8456, lon: 89.5403 },
      upazilas: {
        "Batiaghata": { lat: 22.6833, lon: 89.5333 },
        "Dacope": { lat: 22.5000, lon: 89.5000 },
        "Dumuria": { lat: 22.8167, lon: 89.4333 },
        "Dighalia": { lat: 22.6833, lon: 89.1000 },
        "Koyra": { lat: 22.3333, lon: 89.2667 },
        "Paikgachha": { lat: 22.5667, lon: 89.3167 },
        "Phultala": { lat: 22.8833, lon: 89.5167 },
        "Rupsa": { lat: 22.8333, lon: 89.6167 },
        "Terokhada": { lat: 22.9167, lon: 89.3667 },
        "Khulna Sadar": { lat: 22.8456, lon: 89.5403 }
      }
    },
    "Bagerhat": {
      coordinates: { lat: 22.6602, lon: 89.7895 },
      upazilas: {
        "Bagerhat Sadar": { lat: 22.6602, lon: 89.7895 },
        "Chitalmari": { lat: 22.7833, lon: 89.8667 },
        "Fakirhat": { lat: 22.7833, lon: 89.7000 },
        "Kachua": { lat: 22.6500, lon: 89.8833 },
        "Mollahat": { lat: 22.9167, lon: 89.8000 },
        "Mongla": { lat: 22.4833, lon: 89.6000 },
        "Morrelganj": { lat: 22.4500, lon: 89.8500 },
        "Rampal": { lat: 22.5667, lon: 89.6500 },
        "Sarankhola": { lat: 22.3000, lon: 89.8000 }
      }
    },
    "Chuadanga": {
      coordinates: { lat: 23.6401, lon: 88.8410 },
      upazilas: {
        "Alamdanga": { lat: 23.7500, lon: 88.9500 },
        "Chuadanga Sadar": { lat: 23.6401, lon: 88.8410 },
        "Damurhuda": { lat: 23.6167, lon: 88.7833 },
        "Jibannagar": { lat: 23.4167, lon: 88.8167 }
      }
    },
    "Jessore": {
      coordinates: { lat: 23.1634, lon: 89.2182 },
      upazilas: {
        "Abhaynagar": { lat: 23.0167, lon: 89.4333 },
        "Bagherpara": { lat: 23.2167, lon: 89.3500 },
        "Chaugachha": { lat: 23.2667, lon: 89.0333 },
        "Jhikargachha": { lat: 23.1000, lon: 89.1333 },
        "Keshabpur": { lat: 22.9000, lon: 89.2167 },
        "Jessore Sadar": { lat: 23.1634, lon: 89.2182 },
        "Manirampur": { lat: 23.0167, lon: 89.2333 },
        "Sharsha": { lat: 23.0667, lon: 88.9833 }
      }
    },
    "Jhenaidah": {
      coordinates: { lat: 23.5450, lon: 89.1539 },
      upazilas: {
        "Harinakunda": { lat: 23.6333, lon: 89.0500 },
        "Jhenaidah Sadar": { lat: 23.5450, lon: 89.1539 },
        "Kaliganj": { lat: 23.4167, lon: 89.1333 },
        "Kotchandpur": { lat: 23.4167, lon: 89.0167 },
        "Maheshpur": { lat: 23.3500, lon: 88.9167 },
        "Shailkupa": { lat: 23.6833, lon: 89.2500 }
      }
    },
    "Kushtia": {
      coordinates: { lat: 23.9013, lon: 89.1205 },
      upazilas: {
        "Bheramara": { lat: 24.0167, lon: 89.0000 },
        "Daulatpur": { lat: 24.1333, lon: 88.8667 },
        "Khoksa": { lat: 23.8000, lon: 89.2833 },
        "Kumarkhali": { lat: 23.8667, lon: 89.2500 },
        "Kushtia Sadar": { lat: 23.9013, lon: 89.1205 },
        "Mirpur": { lat: 23.9333, lon: 89.0000 }
      }
    },
    "Magura": {
      coordinates: { lat: 23.4855, lon: 89.4198 },
      upazilas: {
        "Magura Sadar": { lat: 23.4855, lon: 89.4198 },
        "Mohammadpur": { lat: 23.4000, lon: 89.6000 },
        "Shalikha": { lat: 23.3833, lon: 89.3667 },
        "Sreepur": { lat: 23.6000, lon: 89.3833 }
      }
    },
    "Meherpur": {
      coordinates: { lat: 23.7622, lon: 88.6318 },
      upazilas: {
        "Gangni": { lat: 23.8333, lon: 88.7167 },
        "Meherpur Sadar": { lat: 23.7622, lon: 88.6318 },
        "Mujibnagar": { lat: 23.6333, lon: 88.6833 }
      }
    },
    "Narail": {
      coordinates: { lat: 23.1163, lon: 89.5840 },
      upazilas: {
        "Kalia": { lat: 23.0500, lon: 89.6333 },
        "Lohagara": { lat: 23.1833, lon: 89.6500 },
        "Narail Sadar": { lat: 23.1163, lon: 89.5840 }
      }
    },
    "Satkhira": {
      coordinates: { lat: 22.7185, lon: 89.0705 },
      upazilas: {
        "Assasuni": { lat: 22.5500, lon: 89.1833 },
        "Debhata": { lat: 22.5667, lon: 88.9667 },
        "Kalaroa": { lat: 22.8833, lon: 89.0333 },
        "Kaliganj": { lat: 22.4500, lon: 89.0500 },
        "Satkhira Sadar": { lat: 22.7185, lon: 89.0705 },
        "Shyamnagar": { lat: 22.3333, lon: 89.1000 },
        "Tala": { lat: 22.7500, lon: 89.2500 }
      }
    }
  },
  "Barisal": {
    "Barisal": {
      coordinates: { lat: 22.7010, lon: 90.3535 },
      upazilas: {
        "Agailjhara": { lat: 22.8833, lon: 90.2000 },
        "Babuganj": { lat: 22.8333, lon: 90.4167 },
        "Bakerganj": { lat: 22.5667, lon: 90.2167 },
        "Banaripara": { lat: 22.5667, lon: 90.1667 },
        "Gaurnadi": { lat: 22.9667, lon: 90.2167 },
        "Hizla": { lat: 22.5000, lon: 90.7500 },
        "Mehendiganj": { lat: 22.6167, lon: 90.4667 },
        "Muladi": { lat: 22.7500, lon: 90.5000 },
        "Wazirpur": { lat: 22.6000, lon: 90.6667 },
        "Barisal Sadar": { lat: 22.7010, lon: 90.3535 }
      }
    },
    "Barguna": {
      coordinates: { lat: 22.1596, lon: 90.1121 },
      upazilas: {
        "Amtali": { lat: 22.1333, lon: 90.2333 },
        "Bamna": { lat: 22.3000, lon: 90.0000 },
        "Barguna Sadar": { lat: 22.1596, lon: 90.1121 },
        "Betagi": { lat: 22.4167, lon: 90.1667 },
        "Patharghata": { lat: 22.0500, lon: 89.9667 },
        "Taltali": { lat: 21.9167, lon: 90.1667 }
      }
    },
    "Bhola": {
      coordinates: { lat: 22.6859, lon: 90.6482 },
      upazilas: {
        "Bhola Sadar": { lat: 22.6859, lon: 90.6482 },
        "Burhanuddin": { lat: 22.5000, lon: 90.7333 },
        "Char Fasson": { lat: 22.1833, lon: 90.7500 },
        "Daulatkhan": { lat: 22.6167, lon: 90.7667 },
        "Lalmohan": { lat: 22.3333, lon: 90.7333 },
        "Manpura": { lat: 22.3000, lon: 90.9667 },
        "Tazumuddin": { lat: 22.4167, lon: 90.8333 }
      }
    },
    "Jhalokati": {
      coordinates: { lat: 22.6406, lon: 90.1987 },
      upazilas: {
        "Jhalokati Sadar": { lat: 22.6406, lon: 90.1987 },
        "Kathalia": { lat: 22.4167, lon: 90.1167 },
        "Nalchity": { lat: 22.5833, lon: 90.2667 },
        "Rajapur": { lat: 22.5333, lon: 90.1333 }
      }
    },
    "Patuakhali": {
      coordinates: { lat: 22.3596, lon: 90.3298 },
      upazilas: {
        "Bauphal": { lat: 22.4167, lon: 90.5667 },
        "Dashmina": { lat: 22.2833, lon: 90.5833 },
        "Dumki": { lat: 22.4667, lon: 90.3833 },
        "Galachipa": { lat: 22.1667, lon: 90.4167 },
        "Kalapara": { lat: 21.9833, lon: 90.2333 },
        "Mirzaganj": { lat: 22.3667, lon: 90.2333 },
        "Patuakhali Sadar": { lat: 22.3596, lon: 90.3298 },
        "Rangabali": { lat: 21.9167, lon: 90.4500 }
      }
    },
    "Pirojpur": {
      coordinates: { lat: 22.5841, lon: 89.9720 },
      upazilas: {
        "Bhandaria": { lat: 22.4833, lon: 90.0667 },
        "Indurkani": { lat: 22.5333, lon: 89.9167 },
        "Kawkhali": { lat: 22.6167, lon: 90.0500 },
        "Mathbaria": { lat: 22.2833, lon: 89.9667 },
        "Nazirpur": { lat: 22.7500, lon: 89.9500 },
        "Nesarabad": { lat: 22.7333, lon: 90.0833 },
        "Pirojpur Sadar": { lat: 22.5841, lon: 89.9720 }
      }
    }
  },
  "Sylhet": {
    "Sylhet": {
      coordinates: { lat: 24.8949, lon: 91.8687 },
      upazilas: {
        "Balaganj": { lat: 24.7167, lon: 91.6667 },
        "Beanibazar": { lat: 24.6167, lon: 91.9833 },
        "Bishwanath": { lat: 24.6667, lon: 91.7833 },
        "Companiganj": { lat: 24.5833, lon: 91.9833 },
        "Fenchuganj": { lat: 24.6167, lon: 91.8333 },
        "Golapganj": { lat: 24.4167, lon: 91.9667 },
        "Gowainghat": { lat: 25.1333, lon: 92.1833 },
        "Jaintiapur": { lat: 25.1167, lon: 92.1167 },
        "Kanaighat": { lat: 25.0667, lon: 92.2000 },
        "Zakiganj": { lat: 24.8833, lon: 92.3167 },
        "Osmani Nagar": { lat: 24.7167, lon: 91.7500 },
        "South Surma": { lat: 24.8500, lon: 91.8667 },
        "Sylhet Sadar": { lat: 24.8949, lon: 91.8687 }
      }
    },
    "Habiganj": {
      coordinates: { lat: 24.3745, lon: 91.4156 },
      upazilas: {
        "Ajmiriganj": { lat: 24.5500, lon: 91.2500 },
        "Bahubal": { lat: 24.3500, lon: 91.5333 },
        "Baniachang": { lat: 24.5333, lon: 91.3667 },
        "Chunarughat": { lat: 24.2000, lon: 91.5167 },
        "Habiganj Sadar": { lat: 24.3745, lon: 91.4156 },
        "Lakhai": { lat: 24.2833, lon: 91.2167 },
        "Madhabpur": { lat: 24.1000, lon: 91.3000 },
        "Nabiganj": { lat: 24.5667, lon: 91.5167 },
        "Sayestaganj": { lat: 24.2667, lon: 91.4667 }
      }
    },
    "Moulvibazar": {
      coordinates: { lat: 24.4820, lon: 91.7774 },
      upazilas: {
        "Barlekha": { lat: 24.6667, lon: 92.2000 },
        "Juri": { lat: 24.5833, lon: 92.1167 },
        "Kamalganj": { lat: 24.3500, lon: 91.8667 },
        "Kulaura": { lat: 24.5167, lon: 92.0333 },
        "Moulvibazar Sadar": { lat: 24.4820, lon: 91.7774 },
        "Rajnagar": { lat: 24.5333, lon: 91.8667 },
        "Sreemangal": { lat: 24.3000, lon: 91.7333 }
      }
    },
    "Sunamganj": {
      coordinates: { lat: 25.0658, lon: 91.3950 },
      upazilas: {
        "Bishwamvarpur": { lat: 25.0833, lon: 91.3000 },
        "Chhatak": { lat: 24.8500, lon: 91.6667 },
        "Dakshin Sunamganj": { lat: 24.9500, lon: 91.4000 },
        "Derai": { lat: 24.7833, lon: 91.3667 },
        "Dharmapasha": { lat: 24.9000, lon: 91.0833 },
        "Dowarabazar": { lat: 25.0500, lon: 91.5667 },
        "Jagannathpur": { lat: 24.7667, lon: 91.5500 },
        "Jamalganj": { lat: 24.9667, lon: 91.2333 },
        "Madhyanagar": { lat: 25.0667, lon: 91.0333 },
        "Shalla": { lat: 24.7500, lon: 91.2500 },
        "Sunamganj Sadar": { lat: 25.0658, lon: 91.3950 },
        "Tahirpur": { lat: 25.0833, lon: 91.1667 }
      }
    }
  },
  "Rangpur": {
    "Rangpur": {
      coordinates: { lat: 25.7439, lon: 89.2752 },
      upazilas: {
        "Badarganj": { lat: 25.6667, lon: 89.0500 },
        "Gangachara": { lat: 25.8000, lon: 89.2000 },
        "Kaunia": { lat: 25.8333, lon: 89.4333 },
        "Mithapukur": { lat: 25.5333, lon: 89.2667 },
        "Pirgachha": { lat: 25.8667, lon: 89.3667 },
        "Pirganj": { lat: 25.9333, lon: 89.4667 },
        "Taraganj": { lat: 25.7000, lon: 89.1000 },
        "Rangpur Sadar": { lat: 25.7439, lon: 89.2752 }
      }
    },
    "Dinajpur": {
      coordinates: { lat: 25.6217, lon: 88.6354 },
      upazilas: {
        "Birampur": { lat: 25.4000, lon: 88.9333 },
        "Birganj": { lat: 25.8500, lon: 88.6333 },
        "Biral": { lat: 25.6333, lon: 88.5500 },
        "Bochaganj": { lat: 25.8000, lon: 88.4667 },
        "Chirirbandar": { lat: 25.6500, lon: 88.7667 },
        "Phulbari": { lat: 25.5000, lon: 88.9167 },
        "Ghoraghat": { lat: 25.2500, lon: 89.2167 },
        "Hakimpur": { lat: 25.2833, lon: 89.0167 },
        "Kaharole": { lat: 25.7833, lon: 88.6000 },
        "Khansama": { lat: 25.9167, lon: 88.7500 },
        "Dinajpur Sadar": { lat: 25.6217, lon: 88.6354 },
        "Nawabganj": { lat: 25.4167, lon: 89.0833 },
        "Parbatipur": { lat: 25.6500, lon: 88.9167 }
      }
    },
    "Gaibandha": {
      coordinates: { lat: 25.3288, lon: 89.5430 },
      upazilas: {
        "Phulchhari": { lat: 25.1833, lon: 89.6167 },
        "Gaibandha Sadar": { lat: 25.3288, lon: 89.5430 },
        "Gobindaganj": { lat: 25.1333, lon: 89.3833 },
        "Palashbari": { lat: 25.2833, lon: 89.3500 },
        "Sadullapur": { lat: 25.3833, lon: 89.4667 },
        "Sughatta": { lat: 25.0833, lon: 89.6000 },
        "Sundarganj": { lat: 25.5500, lon: 89.5167 }
      }
    },
    "Kurigram": {
      coordinates: { lat: 25.8073, lon: 89.6296 },
      upazilas: {
        "Bhurungamari": { lat: 26.1167, lon: 89.6833 },
        "Char Rajibpur": { lat: 25.4167, lon: 89.8000 },
        "Chilmari": { lat: 25.5667, lon: 89.6833 },
        "Phulbari": { lat: 25.9500, lon: 89.5667 },
        "Kurigram Sadar": { lat: 25.8073, lon: 89.6296 },
        "Nageshwari": { lat: 26.0000, lon: 89.7000 },
        "Rajarhat": { lat: 25.8000, lon: 89.5500 },
        "Raomari": { lat: 25.5667, lon: 89.8333 },
        "Ulipur": { lat: 25.6667, lon: 89.6333 }
      }
    },
    "Lalmonirhat": {
      coordinates: { lat: 25.9923, lon: 89.2847 },
      upazilas: {
        "Aditmari": { lat: 25.9333, lon: 89.3500 },
        "Hatibandha": { lat: 26.1167, lon: 89.1333 },
        "Kaliganj": { lat: 26.0000, lon: 89.2000 },
        "Lalmonirhat Sadar": { lat: 25.9923, lon: 89.2847 },
        "Patgram": { lat: 26.3667, lon: 89.0167 }
      }
    },
    "Nilphamari": {
      coordinates: { lat: 25.9317, lon: 88.8560 },
      upazilas: {
        "Dimla": { lat: 26.1333, lon: 88.9333 },
        "Domar": { lat: 26.1000, lon: 88.8333 },
        "Jaldhaka": { lat: 26.0167, lon: 89.0167 },
        "Kishoreganj": { lat: 25.9000, lon: 89.0333 },
        "Nilphamari Sadar": { lat: 25.9317, lon: 88.8560 },
        "Saidpur": { lat: 25.7667, lon: 88.9000 }
      }
    },
    "Panchagarh": {
      coordinates: { lat: 26.3411, lon: 88.5541 },
      upazilas: {
        "Atwari": { lat: 26.3000, lon: 88.4667 },
        "Boda": { lat: 26.2000, lon: 88.5500 },
        "Debiganj": { lat: 26.1167, lon: 88.7500 },
        "Panchagarh Sadar": { lat: 26.3411, lon: 88.5541 },
        "Tetulia": { lat: 26.4833, lon: 88.3500 }
      }
    },
    "Thakurgaon": {
      coordinates: { lat: 26.0336, lon: 88.4616 },
      upazilas: {
        "Baliadangi": { lat: 26.0667, lon: 88.3000 },
        "Haripur": { lat: 25.8000, lon: 88.1667 },
        "Pirganj": { lat: 25.8500, lon: 88.3500 },
        "Ranisankail": { lat: 25.9167, lon: 88.2500 },
        "Thakurgaon Sadar": { lat: 26.0336, lon: 88.4616 }
      }
    }
  },
  "Mymensingh": {
    "Mymensingh": {
      coordinates: { lat: 24.7471, lon: 90.4203 },
      upazilas: {
        "Bhaluka": { lat: 24.4167, lon: 90.3500 },
        "Dhobaura": { lat: 24.6167, lon: 90.1167 },
        "Fulbaria": { lat: 24.6167, lon: 90.6333 },
        "Gaffargaon": { lat: 24.4333, lon: 90.5667 },
        "Gauripur": { lat: 24.8833, lon: 90.2500 },
        "Haluaghat": { lat: 24.7500, lon: 90.0833 },
        "Ishwarganj": { lat: 24.8167, lon: 90.5000 },
        "Muktagachha": { lat: 24.7667, lon: 90.2667 },
        "Nandail": { lat: 24.5667, lon: 90.7667 },
        "Phulpur": { lat: 24.9333, lon: 90.3500 },
        "Trishal": { lat: 24.5833, lon: 90.4000 },
        "Mymensingh Sadar": { lat: 24.7471, lon: 90.4203 },
        "Tara Khanda": { lat: 24.8500, lon: 90.3500 }
      }
    },
    "Jamalpur": {
      coordinates: { lat: 24.9375, lon: 89.9377 },
      upazilas: {
        "Bakshiganj": { lat: 25.2167, lon: 89.8667 },
        "Dewanganj": { lat: 25.1500, lon: 89.8167 },
        "Islampur": { lat: 25.0833, lon: 89.7667 },
        "Jamalpur Sadar": { lat: 24.9375, lon: 89.9377 },
        "Madarganj": { lat: 24.8833, lon: 89.7500 },
        "Melandaha": { lat: 24.9667, lon: 89.8167 },
        "Sarishabari": { lat: 24.7333, lon: 89.8333 }
      }
    },
    "Netrokona": {
      coordinates: { lat: 24.8103, lon: 90.7275 },
      upazilas: {
        "Atpara": { lat: 24.8000, lon: 90.8667 },
        "Barhatta": { lat: 24.9167, lon: 90.8667 },
        "Durgapur": { lat: 25.1167, lon: 90.6833 },
        "Khaliajuri": { lat: 24.7000, lon: 91.1333 },
        "Kalmakanda": { lat: 25.0833, lon: 90.8833 },
        "Kendua": { lat: 24.6500, lon: 90.8500 },
        "Madan": { lat: 24.6667, lon: 90.9667 },
        "Mohanganj": { lat: 24.8667, lon: 90.9667 },
        "Netrokona Sadar": { lat: 24.8103, lon: 90.7275 },
        "Purbadhala": { lat: 24.9333, lon: 90.6000 }
      }
    },
    "Sherpur": {
      coordinates: { lat: 25.0204, lon: 90.0152 },
      upazilas: {
        "Jhenaigati": { lat: 25.1833, lon: 90.0667 },
        "Nakla": { lat: 24.9667, lon: 90.1833 },
        "Nalitabari": { lat: 25.0833, lon: 90.1667 },
        "Sherpur Sadar": { lat: 25.0204, lon: 90.0152 },
        "Sreebardi": { lat: 25.1333, lon: 89.9000 }
      }
    }
  }
};