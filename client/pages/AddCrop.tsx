import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LangContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import { offlineStorageService } from "@/services/offlineStorage";
import type { CreateCropBatchRequest } from "@shared/api";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Sprout, 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Warehouse,
  Tractor,
  Search,
  X,
  History
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { storageTypes, cropTypes } from "@/data/mockData";
import WeightInput from "@/components/WeightInput";
import { strings } from "@/locales/strings";
import { fetchCropHistory, sortCropTypesByHistory, type CropHistory } from "@/utils/cropHistory";

export default function AddCrop() {
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { farmerId, isOnline, farmerData } = useAuth();
  
  // State
  const [step, setStep] = useState<"select_stage" | "form">("select_stage");
  const [stage, setStage] = useState<"growing" | "harvested">("growing");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form Data
  const [cropType, setCropType] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "mon">("kg");
  const [date, setDate] = useState("");
  const [storageType, setStorageType] = useState(""); // e.g., Silo, Jute Bag
  const [searchQuery, setSearchQuery] = useState("");
  
  // Crop History
  const [cropHistory, setCropHistory] = useState<CropHistory | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch crop history when component mounts
  useEffect(() => {
    if (farmerId && isOnline) {
      setIsLoadingHistory(true);
      fetchCropHistory(farmerId)
        .then((history) => {
          setCropHistory(history);
        })
        .catch((error) => {
          console.error('Failed to fetch crop history:', error);
          // Continue without history - not critical
        })
        .finally(() => {
          setIsLoadingHistory(false);
        });
    }
  }, [farmerId, isOnline]);

  const handleStageSelect = (selected: "growing" | "harvested") => {
    setStage(selected);
    setStep("form");
  };

  // Quick Date Helpers
  const setQuickDate = (type: 'today' | 'tomorrow' | 'next_week' | 'yesterday') => {
    const d = new Date();
    if (type === 'tomorrow') d.setDate(d.getDate() + 1);
    if (type === 'yesterday') d.setDate(d.getDate() - 1);
    if (type === 'next_week') d.setDate(d.getDate() + 7);
    setDate(d.toISOString().split('T')[0]);
  };

  // Filter and sort crops based on search query and history
  const filteredCrops = (() => {
    // First, filter by search query
    let filtered = cropTypes.filter(crop => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        crop.label_bn.toLowerCase().includes(query) ||
        crop.label_en.toLowerCase().includes(query)
      );
    });

    // Then, sort by history if available
    if (cropHistory && cropHistory.uniqueCropTypes.length > 0) {
      const cropIds = filtered.map(c => c.id);
      const sortedIds = sortCropTypesByHistory(cropIds, cropHistory);
      filtered = sortedIds.map(id => filtered.find(c => c.id === id)!).filter(Boolean);
    }

    return filtered;
  })();

  // Clear search functionality
  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Crop Type Validation
    if (!cropType) {
      toast({ 
        title: language === "bn" ? "ফসল নির্বাচন করুন" : "Select crop type", 
        variant: "destructive" 
      });
      return;
    }

    // 2. Basic Validation
    if (!weight || !date) {
      toast({ title: language === "bn" ? "ওজন এবং তারিখ দিন" : "Weight and Date required", variant: "destructive" });
      return;
    }

    // 3. Harvesting Specific Validation - Only check storage type now
    if (stage === "harvested") {
      if (!storageType) {
        toast({ title: language === "bn" ? "সংরক্ষণের ধরন নির্বাচন করুন" : "Select storage type", variant: "destructive" });
        return;
      }
    }

    // 3. Check if farmerId is available
    if (!farmerId) {
      toast({ 
        title: language === "bn" ? "লগইন করুন" : "Please login", 
        description: language === "bn" ? "ফসল যোগ করতে লগইন করুন" : "You need to be logged in to add crops",
        variant: "destructive" 
      });
      return;
    }

    // Convert Weight (mon to kg)
    const MON_TO_KG = 40;
    const weightInKg = unit === "mon" ? parseFloat(weight || "0") * MON_TO_KG : parseFloat(weight || "0");

    // Build CreateCropBatchRequest payload
    const cropData: CreateCropBatchRequest = {
      farmerId: farmerId,
      cropType: cropType,
      stage: stage,
    };

    if (stage === "growing") {
      // PRE-HARVEST DATA
      cropData.estimatedWeightKg = weightInKg;
      // Convert date to ISO datetime string
      cropData.expectedHarvestDate = new Date(date).toISOString();
    } else {
      // POST-HARVEST DATA
      cropData.finalWeightKg = weightInKg;
      // Convert date to ISO datetime string
      cropData.actualHarvestDate = new Date(date).toISOString();
      cropData.storageLocation = storageType as 'silo' | 'jute_bag' | 'open_space' | 'tin_shed';
      cropData.storageDivision = farmerData?.division || '';
      cropData.storageDistrict = farmerData?.district || '';
    }

    setIsLoading(true);

    try {
      if (isOnline) {
        // Online: Call backend API
        await apiService.createCropBatch(cropData);
        toast({ 
          title: language === "bn" ? "সফল!" : "Success!", 
          description: language === "bn" ? "ফসল সংরক্ষিত হয়েছে" : "Crop saved successfully"
        });
      } else {
        // Offline: Queue action for later sync
        offlineStorageService.queueAction({
          type: 'create',
          resource: 'crop-batch',
          data: cropData,
        });
        toast({ 
          title: language === "bn" ? "অফলাইনে সংরক্ষিত" : "Saved offline", 
          description: language === "bn" ? "অনলাইন হলে সিঙ্ক হবে" : "Will sync when online"
        });
      }

      // Animation & Redirect
      setIsSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (error) {
      console.error("Error saving crop:", error);
      toast({ 
        title: language === "bn" ? "ত্রুটি" : "Error", 
        description: language === "bn" ? "ফসল সংরক্ষণে সমস্যা হয়েছে" : "Failed to save crop",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- SUCCESS VIEW ---
  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-16 h-16 text-green-600" />
        </motion.div>
        <h2 className="text-3xl font-bold text-green-700 mb-2">
          {stage === "growing" ? t("crop.success_plan") : t("crop.success_store")}
        </h2>
      </div>
    );
  }

  // --- STAGE SELECTION VIEW ---
  if (step === "select_stage") {
    return (
      <div className="pb-10 pt-4 px-1 space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 rounded-full bg-muted/50 hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-primary">{t("crop.title")}</h1>
        </div>

        <div className="grid gap-4 mt-8">
          <SelectionCard 
            icon={<Sprout className="w-8 h-8" />}
            title={language === "bn" ? "ক্ষেতে আছে" : "Growing"}
            desc={language === "bn" ? "সম্ভাব্য ফলন এবং তারিখ সংরক্ষণ করুন" : "Log estimated yield & expected date"}
            color="bg-blue-50 border-blue-200 text-blue-700"
            onClick={() => handleStageSelect("growing")}
          />
          <SelectionCard 
            icon={<Tractor className="w-8 h-8" />}
            title={language === "bn" ? "ঘরে তুলেছি" : "Harvested"}
            desc={language === "bn" ? "প্রকৃত ফলন এবং গুদামের তথ্য দিন" : "Log final weight & storage details"}
            color="bg-green-50 border-green-200 text-green-700"
            onClick={() => handleStageSelect("harvested")}
          />
        </div>
      </div>
    );
  }

  // --- MAIN FORM VIEW ---
  return (
    <div className="pb-24 pt-4 px-1">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setStep("select_stage")} className="rounded-full bg-muted/50">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {stage === "growing" ? (language === "bn" ? "পরিকল্পনা" : "Planning") : (language === "bn" ? "সংরক্ষণ" : "Stocking")}
          </span>
          <h1 className="text-xl font-bold text-foreground">
            {stage === "growing" ? t("crop.stage_growing") : t("crop.stage_harvested")}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-right-8 duration-300">
        
        {/* 1. Crop Type Selection */}
        <div className="space-y-2">
          <Label text={t("crop.crop_type")} icon={<Sprout className="w-4 h-4" />} />
          
          {/* Search Input - Only show if more than 10 crops */}
          {cropTypes.length > 10 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "bn" ? t("crop.search_crop") : strings.en.crop.search_crop}
                className="pl-10 pr-10 h-12 rounded-xl border-2 focus:border-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {filteredCrops.map((crop) => {
              const hasUsedBefore = cropHistory?.uniqueCropTypes.includes(crop.id);
              const usageCount = cropHistory?.cropUsageStats.find(s => s.cropType === crop.id)?.count;
              
              return (
                <button
                  key={crop.id}
                  type="button"
                  onClick={() => setCropType(crop.id)}
                  className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col gap-1 relative ${
                    cropType === crop.id 
                      ? "border-primary bg-primary/5 ring-1 ring-primary" 
                      : hasUsedBefore
                      ? "border-green-200 bg-green-50/50 hover:border-primary/50"
                      : "border-muted bg-white hover:border-primary/50"
                  }`}
                >
                  {hasUsedBefore && (
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <History className="w-3 h-3 text-green-600" />
                      {usageCount && usageCount > 1 && (
                        <span className="text-[10px] font-bold text-green-600">
                          {usageCount}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-2xl">{crop.icon}</div>
                  <div className="font-bold text-sm text-foreground">
                    {language === "bn" ? crop.label_bn : crop.label_en}
                  </div>
                </button>
              );
            })}
          </div>

          {/* No results message */}
          {filteredCrops.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">
                {language === "bn" ? "কোন ফসল পাওয়া যায়নি" : "No crops found"}
              </p>
            </div>
          )}
        </div>

        {/* 2. Weight Input */}
        <WeightInput
          weight={weight}
          setWeight={setWeight}
          unit={unit}
          setUnit={setUnit}
          label={stage === "growing" ? language === "bn" ? "সম্ভাব্য ফলন" : "Estimated Weight" : t("crop.final_weight")}
        />

        {/* 3. Date Input */}
        <div className="space-y-3">
          <Label 
            text={stage === "growing" ? t("crop.exp_date") : t("crop.act_date")} 
            icon={<CalendarIcon className="w-4 h-4" />} 
          />

          {/* Quick Select Buttons */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {stage === "growing" ? (
              <>
                <QuickDateBtn label={t("crop.tomorrow")} onClick={() => setQuickDate('tomorrow')} />
                <QuickDateBtn label={t("crop.next_week")} onClick={() => setQuickDate('next_week')} />
              </>
            ) : (
              <>
                <QuickDateBtn label={t("crop.today")} onClick={() => setQuickDate('today')} />
                <QuickDateBtn label={t("crop.yesterday")} onClick={() => setQuickDate('yesterday')} />
              </>
            )}
          </div>

          <Input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            className="h-14 text-lg rounded-xl border-2 focus:border-primary"
          />
        </div>

        {/* 4. POST-HARVEST ONLY FIELDS */}
        {stage === "harvested" && (
          <div className="space-y-6 pt-4 border-t border-dashed border-gray-200">
            {/* Storage Type (Method) */}
            <div className="space-y-3">
              <Label text={language === "bn" ? "কিভাবে রাখছেন? (পাত্র)" : "Storage Type (Method)"} icon={<Warehouse className="w-4 h-4" />} />
              <div className="grid grid-cols-2 gap-3">
                {storageTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setStorageType(type.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col gap-1 ${
                      storageType === type.id 
                        ? "border-primary bg-primary/5 ring-1 ring-primary" 
                        : "border-muted bg-white hover:border-primary/50"
                    }`}
                  >
                    <div className="text-2xl">{type.icon}</div>
                    <div className="font-bold text-sm text-foreground">
                      {language === "bn" ? type.label_bn : type.label_en}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          size="lg" 
          className="w-full h-14 rounded-2xl text-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 mt-4"
          disabled={isLoading}
        >
          {isLoading 
            ? (language === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving...") 
            : (stage === "growing" ? t("crop.submit_plan") : t("crop.submit_store"))
          }
        </Button>

      </form>
    </div>
  );
}

// Helper Components
function Label({ text, icon }: { text: string, icon: any }) {
  return (
    <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
      {icon} {text}
    </label>
  )
}

function QuickDateBtn({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-bold whitespace-nowrap active:scale-95 transition-transform"
    >
      {label}
    </button>
  )
}

function SelectionCard({ icon, title, desc, color, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-4 p-5 rounded-[1.5rem] bg-white border-2 shadow-sm transition-all text-left group hover:scale-[1.02] ${color.replace('text-', 'border-').replace('bg-', 'hover:bg-')}`}
    >
      <div className={`w-14 h-14 rounded-full flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </button>
  )
}