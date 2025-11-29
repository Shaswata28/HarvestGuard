import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { offlineStorage, FarmerProfile } from "@/utils/offlineStorage";
import { apiService } from "@/services/api";
import { offlineStorageService } from "@/services/offlineStorage";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AdvisoryCard from "@/components/AdvisoryCard";
import WeatherCard from "@/components/WeatherCard";
import { mockWeatherData } from "@/data/mockData";
import { Plus, Package, Sprout, Leaf, Stethoscope, ArrowRight, WifiOff, RefreshCw, Trash2, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toBanglaDigits } from "@/lib/utils";
import type { CropBatchResponse, HealthScanResponse } from "@shared/api";
import { translateWeatherCondition } from "@/utils/weatherTranslations";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import WeightInput from "@/components/WeightInput";
import { storageTypes } from "@/data/mockData";
import { useAdvisoryNotifications } from "@/hooks/useAdvisoryNotifications";
import { useHarvestReminders } from "@/hooks/useHarvestReminders";

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { farmerId, isAuthenticated, isOnline, farmerData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<FarmerProfile>({ farmer: null, crops: [], scans: [] });
  const [weather, setWeather] = useState(mockWeatherData);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(false);

  // Monitor advisories and trigger notifications
  useAdvisoryNotifications({
    advisories: [], // TODO: Connect to advisory system
    language: language as 'bn' | 'en',
    enabled: isAuthenticated && !!farmerId,
  });

  // Schedule harvest reminders
  useHarvestReminders({
    crops: profile.crops,
    language: language as 'bn' | 'en',
    enabled: isAuthenticated && !!farmerId,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cropToDelete, setCropToDelete] = useState<string | null>(null);
  const [harvestDialogOpen, setHarvestDialogOpen] = useState(false);
  const [cropToHarvest, setCropToHarvest] = useState<any | null>(null);
  const [harvestWeight, setHarvestWeight] = useState("");
  const [harvestUnit, setHarvestUnit] = useState<"kg" | "mon">("kg");
  const [harvestDate, setHarvestDate] = useState("");
  const [harvestStorage, setHarvestStorage] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !farmerId) {
      navigate('/login');
    }
  }, [isAuthenticated, farmerId, navigate]);

  // Edit crop handler
  const handleEditCrop = (crop: any) => {
    navigate(`/edit-crop/${crop.id}`, { state: { crop } });
  };

  // Mark as harvested handler
  const handleMarkAsHarvested = (crop: any) => {
    setCropToHarvest(crop);
    setHarvestWeight("");
    setHarvestDate(new Date().toISOString().split('T')[0]);
    setHarvestStorage("");
    setHarvestDialogOpen(true);
  };

  const confirmHarvest = async () => {
    if (!cropToHarvest || !harvestWeight || !harvestDate || !harvestStorage) {
      toast({
        title: language === "bn" ? "সব তথ্য দিন" : "All fields required",
        variant: "destructive",
      });
      return;
    }

    const MON_TO_KG = 40;
    const weightInKg = harvestUnit === "mon" ? parseFloat(harvestWeight) * MON_TO_KG : parseFloat(harvestWeight);

    try {
      if (isOnline) {
        await apiService.transitionCropStage(cropToHarvest.id, {
          finalWeightKg: weightInKg,
          // Convert date to ISO datetime string
          actualHarvestDate: new Date(harvestDate).toISOString(),
          storageLocation: harvestStorage as 'silo' | 'jute_bag' | 'open_space' | 'tin_shed',
          storageDivision: farmerData?.division || '',
          storageDistrict: farmerData?.district || '',
        });
        toast({
          title: language === "bn" ? "সফল!" : "Success!",
          description: language === "bn" ? "ফসল কাটা হয়েছে হিসেবে চিহ্নিত" : "Crop marked as harvested",
        });
      } else {
        offlineStorageService.queueAction({
          type: 'update',
          resource: 'crop-batch',
          data: {
            id: cropToHarvest.id,
            stage: 'harvested',
            finalWeightKg: weightInKg,
            actualHarvestDate: harvestDate,
            storageLocation: harvestStorage,
            storageDivision: farmerData?.division,
            storageDistrict: farmerData?.district,
          },
        });
        toast({
          title: language === "bn" ? "অফলাইনে সংরক্ষিত" : "Saved offline",
          description: language === "bn" ? "অনলাইন হলে সিঙ্ক হবে" : "Will sync when online",
        });
      }

      // Update UI
      setProfile(prev => ({
        ...prev,
        crops: prev.crops.map(c => 
          c.id === cropToHarvest.id 
            ? { 
                ...c, 
                stage: 'harvested' as const, 
                finalWeight: weightInKg, 
                actualHarvestDate: harvestDate, 
                storageLocation: harvestStorage as 'silo' | 'jute_bag' | 'open_space' | 'tin_shed'
              }
            : c
        ),
      }));

      // Invalidate cache
      if (farmerId) {
        offlineStorageService.invalidateCache(farmerId);
      }
    } catch (error) {
      console.error("Error transitioning crop:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "ফসল আপডেট করতে সমস্যা হয়েছে" : "Failed to update crop",
        variant: "destructive",
      });
    } finally {
      setHarvestDialogOpen(false);
      setCropToHarvest(null);
    }
  };

  // Delete crop handler
  const handleDeleteCrop = async (cropId: string) => {
    setCropToDelete(cropId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCrop = async () => {
    if (!cropToDelete) return;

    try {
      if (isOnline) {
        // Online: Call backend API
        await apiService.deleteCropBatch(cropToDelete);
        toast({
          title: language === "bn" ? "মুছে ফেলা হয়েছে" : "Deleted",
          description: language === "bn" ? "ফসল সফলভাবে মুছে ফেলা হয়েছে" : "Crop deleted successfully",
        });
      } else {
        // Offline: Queue action for later sync
        offlineStorageService.queueAction({
          type: 'delete',
          resource: 'crop-batch',
          data: { id: cropToDelete },
        });
        toast({
          title: language === "bn" ? "অফলাইনে মুছে ফেলা হয়েছে" : "Deleted offline",
          description: language === "bn" ? "অনলাইন হলে সিঙ্ক হবে" : "Will sync when online",
        });
      }

      // Remove from UI
      setProfile(prev => ({
        ...prev,
        crops: prev.crops.filter(c => c.id !== cropToDelete),
      }));

      // Invalidate cache to force refresh on next load
      if (farmerId) {
        offlineStorageService.invalidateCache(farmerId);
      }
    } catch (error) {
      console.error("Error deleting crop:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "ফসল মুছতে সমস্যা হয়েছে" : "Failed to delete crop",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCropToDelete(null);
    }
  };

  // Load dashboard data from backend or cache
  useEffect(() => {
    if (!farmerId) return;

    const loadDashboardData = async () => {
      setIsLoading(true);

      try {
        if (isOnline) {
          // Fetch from API
          const [crops, scans] = await Promise.all([
            apiService.fetchCropBatches(farmerId),
            apiService.fetchHealthScans(farmerId, 10),
          ]);

          // Transform to legacy format
          const transformedCrops = crops.map((c: CropBatchResponse) => ({
            id: c._id,
            cropType: c.cropType,
            batchNumber: c.batchNumber,
            enteredDate: c.enteredDate,
            stage: c.stage,
            estimatedWeight: c.estimatedWeightKg,
            expectedHarvestDate: c.expectedHarvestDate,
            finalWeight: c.finalWeightKg,
            actualHarvestDate: c.actualHarvestDate,
            storageLocation: c.storageLocation,
            storageDivision: c.storageDivision,
            storageDistrict: c.storageDistrict,
          }));

          const transformedScans = scans.map((s: HealthScanResponse) => ({
            id: s._id,
            date: s.capturedAt,
            disease: s.diseaseLabel,
            confidence: s.confidence,
            remedy: s.remedyText,
            immediateFeedback: s.immediateFeedback,
            outcome: s.outcome,
          }));

          // Update profile with backend data
          setProfile({
            farmer: farmerData ? {
              id: farmerData.id,
              name: farmerData.name,
              phone: farmerData.phone,
              password: '',
              registeredDate: farmerData.registeredDate,
              division: farmerData.division,
              district: farmerData.district,
              upazila: farmerData.upazila,
            } : null,
            crops: transformedCrops,
            scans: transformedScans,
          });

          // Cache for offline use
          offlineStorageService.cacheCropBatches(farmerId, crops);
          offlineStorageService.cacheHealthScans(farmerId, scans);

          setShowOfflineIndicator(false);
        } else {
          // Load from cache
          const cachedCrops = offlineStorageService.getCachedCropBatches(farmerId);
          const cachedScans = offlineStorageService.getCachedHealthScans(farmerId);

          if (cachedCrops || cachedScans) {
            const transformedCrops = cachedCrops?.map((c: CropBatchResponse) => ({
              id: c._id,
              cropType: c.cropType,
              batchNumber: c.batchNumber,
              enteredDate: c.enteredDate,
              stage: c.stage,
              estimatedWeight: c.estimatedWeightKg,
              expectedHarvestDate: c.expectedHarvestDate,
              finalWeight: c.finalWeightKg,
              actualHarvestDate: c.actualHarvestDate,
              storageLocation: c.storageLocation,
              storageDivision: c.storageDivision,
              storageDistrict: c.storageDistrict,
            })) || [];

            const transformedScans = cachedScans?.map((s: HealthScanResponse) => ({
              id: s._id,
              date: s.capturedAt,
              disease: s.diseaseLabel,
              confidence: s.confidence,
              remedy: s.remedyText,
              immediateFeedback: s.immediateFeedback,
              outcome: s.outcome,
            })) || [];

            setProfile({
              farmer: farmerData ? {
                id: farmerData.id,
                name: farmerData.name,
                phone: farmerData.phone,
                password: '',
                registeredDate: farmerData.registeredDate,
                division: farmerData.division,
                district: farmerData.district,
                upazila: farmerData.upazila,
              } : null,
              crops: transformedCrops,
              scans: transformedScans,
            });
          } else {
            // Fallback to old offline storage
            setProfile(offlineStorage.getFarmerProfile());
          }

          setShowOfflineIndicator(true);
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
        // Fallback to old offline storage on error
        setProfile(offlineStorage.getFarmerProfile());
        setShowOfflineIndicator(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [farmerId, isOnline, farmerData]);

  // Fetch real weather data
  useEffect(() => {
    const fetchWeather = async () => {
      if (!farmerId || !isOnline) {
        return;
      }
      
      setIsLoadingWeather(true);
      try {
        const weatherRes = await apiService.fetchWeather(farmerId);
        const forecastRes = await apiService.fetchForecast(farmerId);
        
        if (weatherRes.success && weatherRes.data) {
          // Transform forecast data to match expected DayForecast structure
          const forecastArray = forecastRes.success && forecastRes.data && forecastRes.data.daily
            ? forecastRes.data.daily.slice(0, 5).map((day: any) => ({
                day: new Date(day.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'short' }),
                highTemp: Math.round(day.tempMax),
                lowTemp: Math.round(day.tempMin),
                rainChance: Math.round((day.precipitationProbability || 0) * 100),
                condition: translateWeatherCondition(day.weatherDescription, language as 'bn' | 'en')
              }))
            : [];

          // Transform API data to match WeatherData structure
          setWeather({
            temperature: Math.round(weatherRes.data.temperature),
            feelsLike: Math.round(weatherRes.data.feelsLike),
            condition: translateWeatherCondition(weatherRes.data.weatherDescription, language as 'bn' | 'en'),
            humidity: weatherRes.data.humidity,
            rainChance: Math.round(weatherRes.data.rainfall || 0),
            windSpeed: Math.round(weatherRes.data.windSpeed * 3.6),
            upazila: farmerData?.upazila || "Dhaka",
            forecast: forecastArray
          });
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
        // Keep using mock data on error
      } finally {
        setIsLoadingWeather(false);
      }
    };

    fetchWeather();
  }, [farmerId, isOnline, language, farmerData]);

  // Guest State
  if (!profile.farmer) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center px-4 animate-in fade-in duration-700">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-primary/5 border border-primary/10 text-center space-y-6">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-2 relative">
            <div className="absolute inset-0 bg-green-200/50 rounded-full animate-ping opacity-20"></div>
            <Sprout className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-primary">{t("registration.title")}</h2>
            <p className="text-muted-foreground text-lg">
              {language === "bn" ? "সেবা পেতে আপনার তথ্য দিন" : "Enter details to start service"}
            </p>
          </div>
          <Link to="/register" className="block pt-2">
            <Button className="w-full h-16 rounded-2xl text-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
              {t("register_now")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const farmerName = profile.farmer.name || (language === "bn" ? "প্রিয় কৃষক" : "Dear Farmer");
  
  // Calculate pending issues count
  const pendingCount = profile.scans?.filter(
    s => !s.outcome && s.disease !== "Healthy" && s.disease !== "সুস্থ ধান"
  ).length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 pt-2 px-1 animate-in fade-in duration-500">
      
      {/* Offline Indicator */}
      {showOfflineIndicator && (
        <Alert className="mx-2 bg-amber-50 border-amber-200">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{language === "bn" ? "অফলাইন ডেটা দেখাচ্ছে" : "Viewing offline data"}</span>
            <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {language === "bn" ? "পুনরায় চেষ্টা করুন" : "Retry"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* HEADER: GREETING */}
      <div className="flex items-center justify-between px-2 pt-2">
       <div>
         <h1 className="text-2xl font-bold text-primary/80">
           {language === "bn" ? "স্বাগতম," : "Welcome,"}
           <span className="text-3xl text-foreground font-extrabold"> {farmerName}</span>
         </h1>
       </div>
      </div>

      {/* SECTION: Weather */}
      <section>
        <WeatherCard weather={weather} />
      </section>

      {/* NEW SECTION: Health Journal Summary Card */}
      <section>
        <div className="flex items-center gap-2 px-2 mb-3 opacity-80">
          <div className="h-2 w-2 bg-rose-500 rounded-full" />
          <h2 className="font-bold text-lg text-foreground">
             {language === "bn" ? "ফসলের স্বাস্থ্য" : "Crop Health"}
          </h2>
        </div>

        <div className="bg-white rounded-[1.5rem] p-5 border border-rose-100 shadow-sm relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full -mr-4 -mt-4 opacity-50" />
            
            <div className="flex items-start gap-4 relative z-10">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 shrink-0">
                    <Stethoscope className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900 leading-tight mb-1">
                        {language === "bn" ? "স্বাস্থ্য খাতা" : "Health Journal"}
                    </h3>
                    
                    {pendingCount > 0 ? (
                        <p className="text-sm text-rose-600 font-medium">
                            {language === "bn" 
                                ? `${toBanglaDigits(pendingCount)}টি ফসলের যত্ন প্রয়োজন` 
                                : `${pendingCount} crops need attention`
                            }
                        </p>
                    ) : (
                        <p className="text-sm text-green-600 font-medium">
                            {language === "bn" ? "সব ফসল সুস্থ আছে" : "All crops look healthy"}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-5">
                <Link to="/health-journal">
                    <Button className="w-full h-12 rounded-xl bg-gray-900 text-white hover:bg-gray-800 font-bold shadow-md shadow-gray-200">
                        {language === "bn" ? "রিপোর্ট দেখুন" : "View Full Report"} 
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </Link>
            </div>
        </div>
      </section>

      {/* SECTION: Advisory */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-2 opacity-80">
          <div className="h-2 w-2 bg-amber-500 rounded-full" />
          <h2 className="font-bold text-lg text-foreground">{language === "bn" ? "জরুরি পরামর্শ" : "Urgent Advice"}</h2>
        </div>
        <AdvisoryCard weatherData={weather} />
      </section>

      {/* SECTION: Inventory */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="font-bold text-2xl text-foreground flex items-center gap-2">
            <Leaf className="w-6 h-6 text-primary fill-primary/20" />
            {t("dashboard.inventory_title")}
          </h2>
        </div>

        {profile.crops.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-8 text-center border-2 border-dashed border-gray-200/80 shadow-sm flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-1">
              <Package className="w-10 h-10" />
            </div>
            <p className="text-gray-500 font-medium text-base max-w-[200px] mx-auto">
              {t("dashboard.no_crops_message")}
            </p>
            <Link to="/add-crop" className="w-full max-w-xs mt-1">
              <Button size="lg" className="rounded-2xl w-full font-bold text-lg shadow-lg shadow-primary/20 animate-pulse-glow h-14 bg-primary text-white">
                <Plus className="w-6 h-6 mr-2" />
                {t("dashboard.add_crop_button")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {profile.crops.map((crop) => (
              <CropCard 
                key={crop.id} 
                crop={crop} 
                language={language} 
                t={t}
                onEdit={handleEditCrop}
                onDelete={handleDeleteCrop}
                onMarkHarvested={handleMarkAsHarvested}
              />
            ))}
            <div className="pt-2">
              <Link to="/add-crop">
                <Button variant="outline" className="w-full rounded-2xl h-14 border-dashed border-2 text-lg font-medium text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <Plus className="w-5 h-5 mr-2" /> {t("dashboard.add_crop_button")}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "bn" ? "ফসল মুছে ফেলবেন?" : "Delete crop?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "bn" 
                ? "এই ফসলের তথ্য স্থায়ীভাবে মুছে যাবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।"
                : "This will permanently delete the crop data. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "bn" ? "বাতিল" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCrop} className="bg-red-600 hover:bg-red-700">
              {language === "bn" ? "মুছে ফেলুন" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Harvest Dialog */}
      <Dialog open={harvestDialogOpen} onOpenChange={setHarvestDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === "bn" ? "ফসল কাটার তথ্য" : "Harvest Details"}
            </DialogTitle>
            <DialogDescription>
              {language === "bn" 
                ? "ফসল কাটার ওজন, তারিখ এবং সংরক্ষণের তথ্য দিন"
                : "Enter harvest weight, date, and storage details"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <WeightInput
              weight={harvestWeight}
              setWeight={setHarvestWeight}
              unit={harvestUnit}
              setUnit={setHarvestUnit}
              label={language === "bn" ? "প্রকৃত ফলন" : "Final Weight"}
            />

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground">
                {language === "bn" ? "কাটার তারিখ" : "Harvest Date"}
              </label>
              <Input 
                type="date" 
                value={harvestDate} 
                onChange={e => setHarvestDate(e.target.value)} 
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-muted-foreground">
                {language === "bn" ? "সংরক্ষণের ধরন" : "Storage Type"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {storageTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setHarvestStorage(type.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col gap-1 ${
                      harvestStorage === type.id 
                        ? "border-primary bg-primary/5 ring-1 ring-primary" 
                        : "border-muted bg-white hover:border-primary/50"
                    }`}
                  >
                    <div className="text-xl">{type.icon}</div>
                    <div className="font-bold text-xs text-foreground">
                      {language === "bn" ? type.label_bn : type.label_en}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHarvestDialogOpen(false)}>
              {language === "bn" ? "বাতিল" : "Cancel"}
            </Button>
            <Button onClick={confirmHarvest} className="bg-green-600 hover:bg-green-700">
              {language === "bn" ? "নিশ্চিত করুন" : "Confirm Harvest"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CropCard({ crop, language, t, onEdit, onDelete, onMarkHarvested }: { 
  crop: any, 
  language: string, 
  t: any, 
  onEdit: (crop: any) => void, 
  onDelete: (id: string) => void,
  onMarkHarvested: (crop: any) => void 
}) {
  const weight = crop.stage === "growing" ? crop.estimatedWeight : crop.finalWeight || 0;
  const displayWeight = language === "bn" ? toBanglaDigits(weight) : weight;
  const type = crop.cropType || (language === "bn" ? "ধান" : "Rice");
  
  const dateStr = crop.stage === "growing" ? crop.expectedHarvestDate : crop.actualHarvestDate;
  const dateLabel = crop.stage === "growing" ? (language === "bn" ? "সম্ভাব্য কাটা:" : "Expected:") : (language === "bn" ? "কাটা হয়েছে:" : "Harvested:");

  const displayDate = dateStr 
    ? new Date(dateStr).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", { day: 'numeric', month: 'long' }) 
    : "-";
  
  let riskLevel = "safe";
  if (crop.stage === "growing") riskLevel = "growing";
  else if (crop.storageLocation === "open_space") riskLevel = "danger";
  else if (crop.storageLocation === "jute_bag") riskLevel = "warning";

  const config = {
    safe: { label: t("dashboard.risk_safe"), bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
    warning: { label: t("dashboard.risk_warning"), bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200" },
    danger: { label: t("dashboard.risk_danger"), bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
    growing: { label: language === "bn" ? "মাঠে আছে" : "Growing", bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" }
  };

  const status = config[riskLevel as keyof typeof config];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={`bg-white rounded-[1.5rem] p-5 shadow-sm border-2 ${status.border} transition-all relative overflow-hidden`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-2xl text-foreground flex items-center gap-2 mb-1">
            {type}
          </h3>
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${status.bg} ${status.text} text-sm font-bold`}>
            {status.label}
          </div>
        </div>
        <div className="flex gap-2">
          <div className="bg-gray-100 p-2.5 rounded-full">
            <Package className="w-6 h-6 text-gray-500" />
          </div>
          <button
            onClick={() => onEdit(crop)}
            className="bg-blue-50 hover:bg-blue-100 p-2.5 rounded-full transition-colors"
            aria-label={language === "bn" ? "সম্পাদনা করুন" : "Edit"}
          >
            <Edit className="w-5 h-5 text-blue-600" />
          </button>
          <button
            onClick={() => onDelete(crop.id)}
            className="bg-red-50 hover:bg-red-100 p-2.5 rounded-full transition-colors"
            aria-label={language === "bn" ? "মুছে ফেলুন" : "Delete"}
          >
            <Trash2 className="w-5 h-5 text-red-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-2">
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
          <p className="text-xs text-muted-foreground mb-1 font-medium">{t("crop.weight")}</p>
          <p className="font-bold text-lg text-foreground">{displayWeight} {language === "bn" ? "কেজি" : "kg"}</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
          <p className="text-xs text-muted-foreground mb-1 font-medium">{dateLabel}</p>
          <p className="font-bold text-lg text-foreground truncate">{displayDate}</p>
        </div>
      </div>

      {crop.stage === "growing" && (
        <Button 
          onClick={() => onMarkHarvested(crop)}
          className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white rounded-xl h-11 font-bold text-base"
        >
          {language === "bn" ? "ঘরে তোলা হয়েছে" : "Mark as Harvested"}
        </Button>
      )}
    </motion.div>
  );
}