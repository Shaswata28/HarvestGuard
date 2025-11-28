export interface Farmer {
  id: string;
  name: string;
  phone: string;
  division: string;
  district: string;
  upazila: string;
  registration_date: string;
}

export interface FarmerCropBatch {
  id: string;
  farmer_id: string;
  farmer_name: string;
  crop_type: string;
  weight: number;
  storage_type: string;
  batch_number: string;
  created_at: string;
  status: "active" | "completed";
  loss_percentage?: number;
}

export interface LossEvent {
  id: string;
  farmer_id: string;
  farmer_name: string;
  batch_number: string;
  event_type: string;
  loss_percentage: number;
  loss_weight: number;
  date: string;
  location: string;
}

export interface InterventionRecord {
  id: string;
  farmer_id: string;
  farmer_name: string;
  batch_number: string;
  intervention_type: string;
  success: boolean;
  date: string;
  notes: string;
}

export const mockFarmers: Farmer[] = [
  {
    id: "farmer_001",
    name: "রহিম সাহেব",
    phone: "+88017XXXXX001",
    division: "ঢাকা",
    district: "নারায়ণগঞ্জ",
    upazila: "সোনারগাঁ",
    registration_date: "2024-12-01",
  },
  {
    id: "farmer_002",
    name: "করিম আহমেদ",
    phone: "+88017XXXXX002",
    division: "চট্টগ্রাম",
    district: "কক্সবাজার",
    upazila: "কক্সবাজার সদর",
    registration_date: "2024-12-15",
  },
  {
    id: "farmer_003",
    name: "সালেম সাহেব",
    phone: "+88017XXXXX003",
    division: "সিলেট",
    district: "সুনামগঞ্জ",
    upazila: "সুনামগঞ্জ",
    registration_date: "2025-01-05",
  },
];

export const mockFarmerCropBatches: FarmerCropBatch[] = [
  {
    id: "batch_f001_001",
    farmer_id: "farmer_001",
    farmer_name: "রহিম সাহ���ব",
    crop_type: "ধান",
    weight: 1200,
    storage_type: "জুটের বস্তা",
    batch_number: "#F001-101",
    created_at: "2025-01-10",
    status: "active",
    loss_percentage: 0,
  },
  {
    id: "batch_f001_002",
    farmer_id: "farmer_001",
    farmer_name: "রহিম সাহেব",
    crop_type: "ধান",
    weight: 950,
    storage_type: "সাইলো",
    batch_number: "#F001-102",
    created_at: "2025-01-15",
    status: "active",
    loss_percentage: 0,
  },
  {
    id: "batch_f001_003",
    farmer_id: "farmer_001",
    farmer_name: "রহিম সাহেব",
    crop_type: "ধান",
    weight: 1500,
    storage_type: "ঘরের ভিতর",
    batch_number: "#F001-103",
    created_at: "2025-01-20",
    status: "completed",
    loss_percentage: 2.5,
  },
  {
    id: "batch_f002_001",
    farmer_id: "farmer_002",
    farmer_name: "করিম আহমেদ",
    crop_type: "ধান",
    weight: 1800,
    storage_type: "জুটের বস্তা",
    batch_number: "#F002-101",
    created_at: "2025-01-12",
    status: "active",
    loss_percentage: 0,
  },
  {
    id: "batch_f002_002",
    farmer_id: "farmer_002",
    farmer_name: "করিম আহমেদ",
    crop_type: "ধান",
    weight: 1100,
    storage_type: "সাইলো",
    batch_number: "#F002-102",
    created_at: "2025-01-22",
    status: "completed",
    loss_percentage: 3.2,
  },
  {
    id: "batch_f003_001",
    farmer_id: "farmer_003",
    farmer_name: "সালেম সাহেব",
    crop_type: "ধান",
    weight: 2000,
    storage_type: "খোলা জায়গা",
    batch_number: "#F003-101",
    created_at: "2025-01-25",
    status: "completed",
    loss_percentage: 8.5,
  },
];

export const mockLossEvents: LossEvent[] = [
  {
    id: "loss_001",
    farmer_id: "farmer_001",
    farmer_name: "রহিম সাহেব",
    batch_number: "#F001-103",
    event_type: "বৃষ্টি দ্বারা ক্ষতি",
    loss_percentage: 2.5,
    loss_weight: 37.5,
    date: "2025-01-28",
    location: "সোনারগাঁ, নারায়ণগঞ্জ",
  },
  {
    id: "loss_002",
    farmer_id: "farmer_002",
    farmer_name: "করিম আহমেদ",
    batch_number: "#F002-102",
    event_type: "কীটপতঙ্গ দ্বারা ক্ষতি",
    loss_percentage: 3.2,
    loss_weight: 35.2,
    date: "2025-02-01",
    location: "কক্সবাজার সদর",
  },
  {
    id: "loss_003",
    farmer_id: "farmer_003",
    farmer_name: "সালেম সাহেব",
    batch_number: "#F003-101",
    event_type: "খোলা জায়গায় সংরক্ষণের কারণে ক্ষতি",
    loss_percentage: 8.5,
    loss_weight: 170,
    date: "2025-02-05",
    location: "সুনামগঞ্জ",
  },
  {
    id: "loss_004",
    farmer_id: "farmer_001",
    farmer_name: "রহিম সাহেব",
    batch_number: "#F001-101",
    event_type: "তাপমাত্রা পরিবর্তন",
    loss_percentage: 1.2,
    loss_weight: 14.4,
    date: "2025-02-08",
    location: "সোনারগাঁ, নারায়ণগঞ্জ",
  },
];

export const mockInterventions: InterventionRecord[] = [
  {
    id: "int_001",
    farmer_id: "farmer_001",
    farmer_name: "রহিম সাহেব",
    batch_number: "#F001-103",
    intervention_type: "বৃষ্টির পূর্বাভাসে ফসল ঢেকে রাখা",
    success: true,
    date: "2025-01-28",
    notes: "কৃষক সময়মতো সতর্কতা পেয়ে ফসল সুরক্ষি��� করেছেন",
  },
  {
    id: "int_002",
    farmer_id: "farmer_002",
    farmer_name: "করিম আহমেদ",
    batch_number: "#F002-102",
    intervention_type: "কীটনাশক স্প্রে করা",
    success: true,
    date: "2025-02-01",
    notes: "সঠিক সময়ে হস্তক্ষেপ করে ক্ষতি ৫% থেকে ৩% এ কমানো হয়েছে",
  },
  {
    id: "int_003",
    farmer_id: "farmer_003",
    farmer_name: "সালেম সাহেব",
    batch_number: "#F003-101",
    intervention_type: "সাইলো ব্যবহারের পরামর্শ",
    success: false,
    date: "2025-01-25",
    notes: "কৃষক খোলা জায়গায় সংরক্ষণ অব্যাহত রেখেছেন - সুপারিশ অগ্রাহ্য",
  },
  {
    id: "int_004",
    farmer_id: "farmer_001",
    farmer_name: "রহিম সাহেব",
    batch_number: "#F001-101",
    intervention_type: "তাপমাত্রা নিয়ন্ত্রণ ব্যবস্থা",
    success: true,
    date: "2025-02-08",
    notes: "সেচ দেওয়ার সময় সঠিক করে ক্��তি কমানো হয়েছে",
  },
];

export const getSuccessRate = (): number => {
  const successCount = mockInterventions.filter((i) => i.success).length;
  return (successCount / mockInterventions.length) * 100;
};

export const getTotalLossPercentage = (): number => {
  const totalLoss = mockLossEvents.reduce((sum, event) => sum + event.loss_weight, 0);
  const totalWeight = mockFarmerCropBatches.reduce((sum, batch) => sum + batch.weight, 0);
  return totalWeight > 0 ? (totalLoss / totalWeight) * 100 : 0;
};
