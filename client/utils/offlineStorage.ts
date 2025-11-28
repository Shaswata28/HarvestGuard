export interface FarmerData {
  id?: string; // MongoDB _id from backend
  name: string;
  phone: string;
  password: string;
  registeredDate: string;
  division?: string;
  district?: string;
  upazila?: string;
}

export interface CropBatch {
  id: string;
  cropType: string;
  batchNumber?: string;
  enteredDate: string;
  stage: "growing" | "harvested"; 
  estimatedWeight?: number;
  expectedHarvestDate?: string;
  finalWeight?: number;
  actualHarvestDate?: string;
  storageLocation?: "silo" | "jute_bag" | "open_space" | "tin_shed";
  storageDivision?: string;
  storageDistrict?: string;
}

// NEW: Scan Record Interface
export interface ScanRecord {
  id: string;
  date: string;
  disease: string;       // e.g., "Leaf Blast", "Healthy"
  confidence: number;    // e.g., 85
  remedy?: string;       // Suggested action
  immediateFeedback?: "correct" | "incorrect" | "unsure"; // User verifies diagnosis
  outcome?: "recovered" | "same" | "worse"; // User reports results later
}

export interface FarmerProfile {
  farmer: FarmerData | null;
  crops: CropBatch[];
  scans: ScanRecord[]; // Added this array
}

const STORAGE_KEY = "harvestguard_farmer_profile";

export const offlineStorage = {
  getFarmerProfile: (): FarmerProfile => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored
      ? JSON.parse(stored)
      : {
          farmer: null,
          crops: [],
          scans: [], // Initialize empty array
        };
  },

  saveFarmer: (farmer: FarmerData) => {
    const profile = offlineStorage.getFarmerProfile();
    profile.farmer = farmer;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  },

  addCropBatch: (crop: Omit<CropBatch, "id" | "enteredDate">) => {
    const profile = offlineStorage.getFarmerProfile();
    
    const storageDivision = crop.storageDivision || profile.farmer?.division;
    const storageDistrict = crop.storageDistrict || profile.farmer?.district;

    const newCrop: CropBatch = {
      ...crop,
      id: `crop_${Date.now()}`,
      enteredDate: new Date().toISOString(),
      batchNumber: crop.batchNumber || `#${Math.floor(1000 + Math.random() * 9000)}`,
      storageDivision,
      storageDistrict
    };
    
    profile.crops.push(newCrop);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return newCrop;
  },

  // NEW: Add a Scan Record
  addScan: (scan: Omit<ScanRecord, "id">) => {
    const profile = offlineStorage.getFarmerProfile();
    // Ensure scans array exists (for old profiles)
    if (!profile.scans) profile.scans = [];
    
    const newScan: ScanRecord = {
      ...scan,
      id: `scan_${Date.now()}`,
    };
    
    // Add to beginning of list
    profile.scans.unshift(newScan);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return newScan;
  },

  // NEW: Update a Scan (for feedback)
  updateScan: (id: string, updates: Partial<ScanRecord>) => {
    const profile = offlineStorage.getFarmerProfile();
    if (!profile.scans) return;

    profile.scans = profile.scans.map(s => 
      s.id === id ? { ...s, ...updates } : s
    );
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  },

  removeCropBatch: (cropId: string) => {
    const profile = offlineStorage.getFarmerProfile();
    profile.crops = profile.crops.filter((c) => c.id !== cropId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  },

  exportAsCSV: () => {
    const profile = offlineStorage.getFarmerProfile();
    if (!profile.farmer) return "No farmer data";

    let csv = "Stage,Crop,Weight (Kg),Date,Storage,Location\n";
    profile.crops.forEach((crop) => {
      const date = crop.stage === 'growing' ? crop.expectedHarvestDate : crop.actualHarvestDate;
      const weight = crop.stage === 'growing' ? crop.estimatedWeight : crop.finalWeight;
      const storage = crop.storageLocation || "N/A";
      const loc = `${crop.storageDistrict || ''}, ${crop.storageDivision || ''}`;
      csv += `${crop.stage},${crop.cropType},${weight},${date},${storage},"${loc}"\n`;
    });
    return csv;
  },

  downloadCSV: () => {
    const profile = offlineStorage.getFarmerProfile();
    if (!profile.farmer) return;
    const csv = offlineStorage.exportAsCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "crops.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};