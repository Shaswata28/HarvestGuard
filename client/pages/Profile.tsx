import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Phone, 
  LogOut, 
  Award, 
  FileDown, 
  Edit3,
  Loader2,
  AlertCircle,
  Bell
} from "lucide-react";
import { toBanglaDigits } from "@/lib/utils";
import BadgeCard, { BADGE_DEFINITIONS } from "@/components/BadgeCard";
import { useToast } from "@/hooks/use-toast";
import { cacheService } from "@/services/cache";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { FarmerDashboardResponse } from "@shared/api";
import { notificationService, NotificationPreferences } from "@/services/notificationService";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function Profile() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { farmerId, farmerData, logout } = useAuth();
  const isOnline = useOnlineStatus();
  
  const [dashboardData, setDashboardData] = useState<FarmerDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    notificationService.getPreferences()
  );

  const CACHE_KEY = 'profile';
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    if (!farmerId) {
      navigate("/login");
      return;
    }
    
    fetchDashboardData();
  }, [farmerId, navigate]);

  useEffect(() => {
    // Auto-refresh when coming back online
    if (isOnline && isStale) {
      fetchDashboardData();
    }
  }, [isOnline, isStale]);

  const fetchDashboardData = async () => {
    if (!farmerId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch from API
      const response = await fetch(`/api/dashboard/farmer/${farmerId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.statusText}`);
      }

      const data: FarmerDashboardResponse = await response.json();
      
      // Update state
      setDashboardData(data);
      setLastFetched(new Date());
      setIsStale(false);
      
      // Cache the data
      cacheService.set(CACHE_KEY, data, farmerId);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      
      // Try to use cached data
      const cached = cacheService.get<FarmerDashboardResponse>(CACHE_KEY, farmerId);
      
      if (cached) {
        setDashboardData(cached.data);
        setLastFetched(new Date(cached.timestamp));
        setIsStale(cacheService.isStale(cached, CACHE_TTL));
        
        if (!isOnline) {
          toast({
            title: language === "bn" ? "অফলাইন মোড" : "Offline Mode",
            description: language === "bn" ? "ক্যাশ থেকে ডেটা দেখানো হচ্ছে" : "Showing cached data",
            variant: "default",
          });
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to load profile data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear cache on logout
    cacheService.clear(CACHE_KEY, farmerId || '');
    
    // Use AuthContext logout
    logout();
    
    navigate("/login");
    
    toast({
      title: language === "bn" ? "লগ আউট সফল" : "Logged out successfully",
    });
  };

  const handleDownload = async () => {
    if (!farmerId) return;
    
    if (!isOnline) {
      toast({
        title: language === "bn" ? "ইন্টারনেট সংযোগ প্রয়োজন" : "Internet connection required",
        description: language === "bn" ? "ডাউনলোড করতে অনলাইন থাকুন" : "Please go online to download",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch(`/api/crop-batches?farmerId=${farmerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch crop data');
      }
      
      const data = await response.json();
      const crops = data.batches || []; // Extract batches array from response
      
      if (crops.length === 0) {
        toast({
          title: language === "bn" ? "কোন তথ্য নেই" : "No data available",
          description: language === "bn" ? "ডাউনলোড করার জন্য কোন ফসল নেই" : "No crops to download",
          variant: "default",
        });
        return;
      }
      
      // Generate CSV
      const headers = ['Crop Type', 'Stage', 'Weight (kg)', 'Entered Date', 'Harvest Date', 'Storage Location', 'Division', 'District'];
      const rows = crops.map((crop: any) => [
        crop.cropType || '',
        crop.stage || '',
        crop.weightKg || crop.finalWeightKg || '',
        crop.enteredDate ? new Date(crop.enteredDate).toLocaleDateString() : '',
        crop.harvestDate ? new Date(crop.harvestDate).toLocaleDateString() : '',
        crop.storageLocation || '',
        crop.division || '',
        crop.district || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `harvest-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: language === "bn" ? "ডাউনলোড সফল" : "Download successful",
        description: language === "bn" ? `${crops.length} টি ফসলের তথ্য সংরক্ষণ করা হয়েছে` : `${crops.length} crops data saved`,
      });
    } catch (err) {
      console.error('Export error:', err);
      toast({
        title: language === "bn" ? "ডাউনলোড ব্যর্থ" : "Download failed",
        description: err instanceof Error ? err.message : (language === "bn" ? "আবার চেষ্টা করুন" : "Please try again"),
        variant: "destructive",
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">{language === "bn" ? "লোড হচ্ছে..." : "Loading..."}</p>
      </div>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">{language === "bn" ? "ত্রুটি" : "Error"}</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchDashboardData}>{language === "bn" ? "আবার চেষ্টা করুন" : "Retry"}</Button>
      </div>
    );
  }

  // No farmer data
  if (!farmerData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <User className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2">{t("no_farmer_registered")}</h2>
        <Button onClick={() => navigate("/register")}>{t("register_now")}</Button>
      </div>
    );
  }

  const { name, phone, registeredDate } = farmerData;
  const joinDate = new Date(registeredDate).toLocaleDateString(
    language === "bn" ? "bn-BD" : "en-US", 
    { day: 'numeric', month: 'long', year: 'numeric' }
  );

  // Get statistics from dashboard data
  const totalCrops = dashboardData?.totalCrops || 0;
  const totalWeightKg = dashboardData?.totalWeightKg || 0;
  const growingCrops = dashboardData?.growingCrops || 0;
  const harvestedCrops = dashboardData?.harvestedCrops || 0;
  const badges = dashboardData?.badges || [];

  // Badge logic based on API data
  const hasCropBadge = badges.includes('first_harvest');
  const hasHarvestBadge = badges.includes('experienced_farmer');

  return (
    <div className="pb-24 pt-4 px-2 space-y-8 animate-in fade-in duration-500">
      
      {/* Staleness indicator */}
      {isStale && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
          {language === "bn" ? "ডেটা পুরানো হতে পারে" : "Data may be outdated"}
          {lastFetched && ` • ${language === "bn" ? "শেষ আপডেট" : "Last updated"}: ${Math.floor((Date.now() - lastFetched.getTime()) / 60000)} ${language === "bn" ? "মিনিট আগে" : "min ago"}`}
        </div>
      )}

      {/* 1. HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary">{t("profile")}</h1>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
          <Edit3 className="w-5 h-5 text-muted-foreground" />
        </Button>
      </div>

      {/* 2. PROFILE CARD */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-border relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8" />
        
        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-50 rounded-full flex items-center justify-center mb-4 shadow-inner border-4 border-white">
            <span className="text-4xl">👨‍🌾</span>
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-1">{name}</h2>
          
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 px-3 py-1 rounded-full text-sm mb-4">
            <Phone className="w-3.5 h-3.5" />
            <span>{language === "bn" ? toBanglaDigits(phone) : phone}</span>
          </div>

          <div className="w-full h-px bg-border mb-4" />

          <div className="grid grid-cols-2 w-full gap-4 text-sm">
            <div className="flex flex-col items-center p-2 bg-orange-50 rounded-xl border border-orange-100">
              <span className="text-xs text-orange-600 font-medium mb-1">
                {language === "bn" ? "যোগদান" : "Joined"}
              </span>
              <span className="font-bold text-orange-900">{joinDate}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-xs text-blue-600 font-medium mb-1">
                {language === "bn" ? "মোট ফসল" : "Total Crops"}
              </span>
              <span className="font-bold text-blue-900 text-lg">
                {language === "bn" ? toBanglaDigits(totalCrops.toString()) : totalCrops}
              </span>
            </div>
          </div>

          {/* Additional stats */}
          <div className="grid grid-cols-3 w-full gap-2 mt-4 text-xs">
            <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg">
              <span className="text-green-600 font-medium">{language === "bn" ? "চলমান" : "Growing"}</span>
              <span className="font-bold text-green-900">{language === "bn" ? toBanglaDigits(growingCrops.toString()) : growingCrops}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-amber-50 rounded-lg">
              <span className="text-amber-600 font-medium">{language === "bn" ? "তোলা" : "Harvested"}</span>
              <span className="font-bold text-amber-900">{language === "bn" ? toBanglaDigits(harvestedCrops.toString()) : harvestedCrops}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-purple-50 rounded-lg">
              <span className="text-purple-600 font-medium">{language === "bn" ? "ওজন" : "Weight"}</span>
              <span className="font-bold text-purple-900">{language === "bn" ? toBanglaDigits(totalWeightKg.toFixed(0)) : totalWeightKg.toFixed(0)} kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BADGES SECTION */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Award className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-lg">{language === "bn" ? "আপনার অর্জন" : "Your Achievements"}</h3>
        </div>
        
        {badges.length === 0 ? (
          <div className="text-center p-6 bg-muted/30 rounded-xl">
            <p className="text-muted-foreground">
              {language === "bn" ? "এখনও কোনো ব্যাজ অর্জন করেননি" : "No badges earned yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {language === "bn" ? "ফসল যোগ করে শুরু করুন!" : "Start by adding crops!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {/* Show earned badges */}
            {hasCropBadge && (
              <BadgeCard 
                {...BADGE_DEFINITIONS[1]} // Crop Protector
                earned={true}
                description={language === "bn" ? "প্রথম ফসল যোগ করার জন্য" : "For adding your first crop"}
              />
            )}
            
            {hasHarvestBadge && (
              <BadgeCard 
                {...BADGE_DEFINITIONS[3]} // Harvest Master
                earned={true}
                description={language === "bn" ? "৩টি ফসল সফলভাবে তোলার জন্য" : "For harvesting 3 crops"}
              />
            )}
          </div>
        )}
      </section>

      {/* 4. NOTIFICATION PREFERENCES */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center gap-2 px-1">
          <Bell className="w-5 h-5 text-blue-500" />
          <h3 className="font-bold text-lg">{language === "bn" ? "বিজ্ঞপ্তি সেটিংস" : "Notification Settings"}</h3>
        </div>
        
        <div className="bg-white rounded-2xl p-5 border-2 border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="scan-notifications" className="text-base font-medium">
                {language === "bn" ? "স্ক্যান ফলাফল" : "Scan Results"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === "bn" ? "রোগ শনাক্তকরণের বিজ্ঞপ্তি" : "Disease detection notifications"}
              </p>
            </div>
            <Switch
              id="scan-notifications"
              checked={notificationPrefs.scanResults}
              onCheckedChange={(checked) => {
                const updated = { ...notificationPrefs, scanResults: checked };
                setNotificationPrefs(updated);
                notificationService.updatePreferences({ scanResults: checked });
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pending-notifications" className="text-base font-medium">
                {language === "bn" ? "অমীমাংসিত স্ক্যান" : "Pending Scans"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === "bn" ? "দৈনিক অনুস্মারক" : "Daily reminders"}
              </p>
            </div>
            <Switch
              id="pending-notifications"
              checked={notificationPrefs.pendingScans}
              onCheckedChange={(checked) => {
                const updated = { ...notificationPrefs, pendingScans: checked };
                setNotificationPrefs(updated);
                notificationService.updatePreferences({ pendingScans: checked });
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="advisory-notifications" className="text-base font-medium">
                {language === "bn" ? "আবহাওয়া পরামর্শ" : "Weather Advisories"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === "bn" ? "জরুরি আবহাওয়া সতর্কতা" : "Urgent weather alerts"}
              </p>
            </div>
            <Switch
              id="advisory-notifications"
              checked={notificationPrefs.weatherAdvisories}
              onCheckedChange={(checked) => {
                const updated = { ...notificationPrefs, weatherAdvisories: checked };
                setNotificationPrefs(updated);
                notificationService.updatePreferences({ weatherAdvisories: checked });
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="harvest-notifications" className="text-base font-medium">
                {language === "bn" ? "ফসল কাটার অনুস্মারক" : "Harvest Reminders"}
              </Label>
              <p className="text-sm text-muted-foreground">
                {language === "bn" ? "ফসল কাটার আগে সতর্কতা" : "Alerts before harvest"}
              </p>
            </div>
            <Switch
              id="harvest-notifications"
              checked={notificationPrefs.harvestReminders}
              onCheckedChange={(checked) => {
                const updated = { ...notificationPrefs, harvestReminders: checked };
                setNotificationPrefs(updated);
                notificationService.updatePreferences({ harvestReminders: checked });
              }}
            />
          </div>
        </div>
      </section>

      {/* 5. ACTIONS */}
      <section className="space-y-3 pt-2">
        <h3 className="font-bold text-lg px-1">{language === "bn" ? "অন্যান্য" : "Other"}</h3>
        
        <Button 
          variant="outline" 
          className="w-full h-14 justify-between rounded-xl border-2 hover:bg-green-50 hover:border-green-200 group"
          onClick={handleDownload}
        >
          <span className="flex items-center gap-3 font-medium">
            <div className="p-2 bg-green-100 rounded-full text-green-700 group-hover:bg-green-200 transition-colors">
              <FileDown className="w-5 h-5" />
            </div>
            {t("export.button")}
          </span>
        </Button>

        <Button 
          variant="outline" 
          className="w-full h-14 justify-between rounded-xl border-2 hover:bg-red-50 hover:border-red-200 group hover:text-red-600"
          onClick={handleLogout}
        >
          <span className="flex items-center gap-3 font-medium">
            <div className="p-2 bg-red-50 rounded-full text-red-500 group-hover:bg-red-100 transition-colors">
              <LogOut className="w-5 h-5" />
            </div>
            {language === "bn" ? "লগ আউট" : "Log Out"}
          </span>
        </Button>
      </section>

      <div className="text-center text-xs text-muted-foreground pt-6 pb-4">
        HarvestGuard v1.0.0
        <br />
        {language === "bn" ? "কৃষকের হাসি, দেশের খুশি" : "Farmers' smile, Country's pride"}
      </div>
    </div>
  );
}
