import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/context/LangContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { apiService } from "@/services/api";
import { offlineStorageService } from "@/services/offlineStorage";
import type { UpdateCropBatchRequest } from "@shared/api";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  Sprout, 
  ArrowLeft, 
  Calendar as CalendarIcon, 
  Warehouse,
  Loader2
} from "lucide-react";
import { storageTypes } from "@/data/mockData";
import WeightInput from "@/components/WeightInput";

export default function EditCrop() {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { farmerId, isOnline } = useAuth();
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  // Form Data
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState<"kg" | "mon">("kg");
  const [date, setDate] = useState("");
  const [storageType, setStorageType] = useState("");
  const [stage, setStage] = useState<"growing" | "harvested">("growing");

  // Load crop data
  useEffect(() => {
    const loadCropData = async () => {
      if (!id) {
        navigate("/dashboard");
        return;
      }

      // Try to get data from route state first
      const cropData = location.state?.crop;
      
      if (cropData) {
        // Pre-fill from route state
        populateForm(cropData);
        setIsFetching(false);
      } else if (isOnline && farmerId) {
        // Fetch from API
        try {
          const crops = await apiService.fetchCropBatches(farmerId);
          const crop = crops.find(c => c._id === id);
          
          if (crop) {
            populateForm({
              stage: crop.stage,
              estimatedWeight: crop.estimatedWeightKg,
              expectedHarvestDate: crop.expectedHarvestDate,
              finalWeight: crop.finalWeightKg,
              actualHarvestDate: crop.actualHarvestDate,
              storageLocation: crop.storageLocation,
            });
          } else {
            toast({
              title: language === "bn" ? "ফসল পাওয়া যায়নি" : "Crop not found",
              variant: "destructive",
            });
            navigate("/dashboard");
          }
        } catch (error) {
          console.error("Error fetching crop:", error);
          toast({
            title: language === "bn" ? "ত্রুটি" : "Error",
            description: language === "bn" ? "ফসল লোড করতে সমস্যা হয়েছে" : "Failed to load crop",
            variant: "destructive",
          });
          navigate("/dashboard");
        } finally {
          setIsFetching(false);
        }
      } else {
        // Offline - can't fetch
        toast({
          title: language === "bn" ? "অফলাইন" : "Offline",
          description: language === "bn" ? "অনলাইন হয়ে সম্পাদনা করুন" : "Please go online to edit",
          variant: "destructive",
        });
        navigate("/dashboard");
      }
    };

    loadCropData();
  }, [id, farmerId, isOnline, navigate, location.state, language, toast]);

  const populateForm = (cropData: any) => {
    setStage(cropData.stage);
    
    if (cropData.stage === "growing") {
      setWeight(cropData.estimatedWeight?.toString() || "");
      setDate(cropData.expectedHarvestDate?.split('T')[0] || "");
    } else {
      setWeight(cropData.finalWeight?.toString() || "");
      setDate(cropData.actualHarvestDate?.split('T')[0] || "");
      setStorageType(cropData.storageLocation || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!weight || !date) {
      toast({ 
        title: language === "bn" ? "ওজন এবং তারিখ দিন" : "Weight and Date required", 
        variant: "destructive" 
      });
      return;
    }

    if (stage === "harvested" && !storageType) {
      toast({ 
        title: language === "bn" ? "সংরক্ষণের ধরন নির্বাচন করুন" : "Select storage type", 
        variant: "destructive" 
      });
      return;
    }

    if (!id) return;

    const MON_TO_KG = 40;
    const weightInKg = unit === "mon" ? parseFloat(weight || "0") * MON_TO_KG : parseFloat(weight || "0");

    const updateData: UpdateCropBatchRequest = {};

    if (stage === "growing") {
      updateData.estimatedWeightKg = weightInKg;
      // Convert date to ISO datetime string
      updateData.expectedHarvestDate = new Date(date).toISOString();
    } else {
      updateData.finalWeightKg = weightInKg;
      // Convert date to ISO datetime string
      updateData.actualHarvestDate = new Date(date).toISOString();
      updateData.storageLocation = storageType as 'silo' | 'jute_bag' | 'open_space' | 'tin_shed';
    }

    setIsLoading(true);

    try {
      if (isOnline) {
        await apiService.updateCropBatch(id, updateData);
        toast({ 
          title: language === "bn" ? "সফল!" : "Success!", 
          description: language === "bn" ? "ফসল আপডেট হয়েছে" : "Crop updated successfully"
        });
      } else {
        offlineStorageService.queueAction({
          type: 'update',
          resource: 'crop-batch',
          data: { id, ...updateData },
        });
        toast({ 
          title: language === "bn" ? "অফলাইনে সংরক্ষিত" : "Saved offline", 
          description: language === "bn" ? "অনলাইন হলে সিঙ্ক হবে" : "Will sync when online"
        });
      }

      setIsSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2500);
    } catch (error) {
      console.error("Error updating crop:", error);
      toast({ 
        title: language === "bn" ? "ত্রুটি" : "Error", 
        description: language === "bn" ? "ফসল আপডেট করতে সমস্যা হয়েছে" : "Failed to update crop",
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{language === "bn" ? "লোড হচ্ছে..." : "Loading..."}</p>
        </div>
      </div>
    );
  }

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
          {language === "bn" ? "আপডেট সফল!" : "Updated Successfully!"}
        </h2>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-4 px-1">
      <div className="flex items-center gap-3 mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/dashboard")} 
          className="rounded-full bg-muted/50"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {language === "bn" ? "সম্পাদনা" : "Edit"}
          </span>
          <h1 className="text-xl font-bold text-foreground">
            {stage === "growing" ? t("crop.stage_growing") : t("crop.stage_harvested")}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-right-8 duration-300">
        
        <div className="space-y-2">
          <Label text={t("crop.crop_type")} icon={<Sprout className="w-4 h-4" />} />
          <div className="p-4 bg-primary/5 rounded-2xl border-2 border-primary/20 flex items-center gap-3 text-primary">
            <span className="text-2xl">🌾</span>
            <span className="font-bold text-lg">{t("crop.rice")}</span>
          </div>
        </div>

        <WeightInput
          weight={weight}
          setWeight={setWeight}
          unit={unit}
          setUnit={setUnit}
          label={stage === "growing" ? (language === "bn" ? "সম্ভাব্য ফলন" : "Estimated Weight") : t("crop.final_weight")}
        />

        <div className="space-y-3">
          <Label 
            text={stage === "growing" ? t("crop.exp_date") : t("crop.act_date")} 
            icon={<CalendarIcon className="w-4 h-4" />} 
          />
          <Input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            className="h-14 text-lg rounded-xl border-2 focus:border-primary"
          />
        </div>

        {stage === "harvested" && (
          <div className="space-y-6 pt-4 border-t border-dashed border-gray-200">
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
            ? (language === "bn" ? "আপডেট হচ্ছে..." : "Updating...") 
            : (language === "bn" ? "আপডেট করুন" : "Update Crop")
          }
        </Button>

      </form>
    </div>
  );
}

function Label({ text, icon }: { text: string, icon: any }) {
  return (
    <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
      {icon} {text}
    </label>
  )
}
