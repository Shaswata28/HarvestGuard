import { useState } from "react";
import { useLanguage } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, MapPin, CheckCircle2, User, Phone, ArrowLeft, ArrowRight, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { offlineStorage } from "@/utils/offlineStorage";
import { LOCATION_LISTS_BANGLA } from "@/utils/locationData";

// Mock Data
const divisions = ["ঢাকা (Dhaka)", "চট্টগ্রাম (Chittagong)", "রাজশাহী (Rajshahi)", "খুলনা (Khulna)", "সিলেট (Sylhet)", "বরিশাল (Barisal)", "রংপুর (Rangpur)", "ময়মনসিংহ (Mymensingh)"];
const districts: Record<string, string[]> = {
  "ঢাকা (Dhaka)": ["ঢাকা", "গাজীপুর", "নারায়ণগঞ্জ", "টাঙ্গাইল", "নরসিংদী"],
  "চট্টগ্রাম (Chittagong)": ["চট্টগ্রাম", "কক্সবাজার", "কুমিল্লা", "নোয়াখালী", "ফেনী"],
  "default": ["সদর", "জেলা সদর"]
};
const upazilas: Record<string, string[]> = {
  "default": ["সদর", "উত্তর", "দক্ষিণ", "পূর্ব", "পশ্চিম"]
};

export default function Register() {
  const { language, t } = useLanguage();
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    division: "",
    district: "",
    upazila: "",
    password: ""
  });

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.mobile || formData.mobile.length < 11) {
        toast({ title: language === "bn" ? "সঠিক তথ্য দিন" : "Invalid Input", variant: "destructive" });
        return;
      }
    }
    if (step === 2) {
      if (!formData.division) {
        toast({ title: language === "bn" ? "ঠিকানা নির্বাচন করুন" : "Select Address", variant: "destructive" });
        return;
      }
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!formData.password) {
      toast({ title: "পাসওয়ার্ড দিন", variant: "destructive" });
      return;
    }
    setLoading(true);
    
    try {
      // Format phone number to +880XXXXXXXXXX
      let formattedPhone = formData.mobile;
      if (!formattedPhone.startsWith('+880')) {
        // Remove leading 0 if present and add +880
        formattedPhone = formattedPhone.startsWith('0') 
          ? `+880${formattedPhone.slice(1)}` 
          : `+880${formattedPhone}`;
      }

      // Convert Bangla location names to English for backend
      const divisionEnglish = LOCATION_LISTS_BANGLA.divisionMap[formData.division] || formData.division;
      const districtEnglish = LOCATION_LISTS_BANGLA.districtMap[formData.district] || formData.district;
      const upazilaEnglish = LOCATION_LISTS_BANGLA.upazilaMap[formData.upazila] || formData.upazila;

      // Call backend API
      const response = await fetch('/api/farmers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          password: formData.password,
          name: formData.name,
          division: divisionEnglish,
          district: districtEnglish,
          upazila: upazilaEnglish,
          language: language as 'bn' | 'en'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      // Save to offline storage as backup with farmer ID from backend
      // Save English names for API compatibility
      offlineStorage.saveFarmer({
        id: data._id, // Save the MongoDB _id from backend
        name: formData.name,
        phone: formattedPhone, // Save the formatted phone number
        password: formData.password,
        division: divisionEnglish, // Save English name for API calls
        district: districtEnglish, // Save English name for API calls
        upazila: upazilaEnglish, // Save English name for API calls
        registeredDate: data.registeredAt || new Date().toISOString(),
      });

      // Log the user in with AuthContext
      login(data._id, {
        id: data._id,
        name: formData.name,
        phone: formattedPhone,
        division: divisionEnglish,
        district: districtEnglish,
        upazila: upazilaEnglish,
        registeredDate: data.registeredAt || new Date().toISOString(),
      });

      setLoading(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error) {
      setLoading(false);
      toast({ 
        title: language === "bn" ? "রেজিস্ট্রেশন ব্যর্থ" : "Registration failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive" 
      });
    }
  };

  const currentDistricts = LOCATION_LISTS_BANGLA.districts[formData.division] || [];
  const currentUpazilas = LOCATION_LISTS_BANGLA.upazilas[formData.district] || [];

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-primary animate-pulse">
            <Leaf className="w-12 h-12 fill-current" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            {language === "bn" ? "স্বাগতম!" : "Welcome!"}
          </h1>
          <p className="text-xl text-gray-600">
            {language === "bn" 
              ? "আপনি এখন আমাদের পরিবারের সদস্য।" 
              : "You are now part of the family."}
          </p>
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl w-full max-w-sm border border-primary/10"
        >
          <p className="text-sm text-gray-500 mb-2">
            {language === "bn" ? "আপনার যাত্রা শুরু হচ্ছে..." : "Your journey begins..."}
          </p>
          <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary" 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2.5 }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center py-10 px-4">
      {/* Header */}
      <div className="w-full max-w-lg flex justify-between items-center mb-8">
        <Link to="/" className="p-2 rounded-full hover:bg-white/50 transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </Link>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-300'}`} />
          <div className={`h-2 w-2 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`} />
          <div className={`h-2 w-2 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-gray-300'}`} />
        </div>
      </div>

      <div className="w-full max-w-lg">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {step === 1 && (language === "bn" ? "পরিচয় দিন" : "Basic Info")}
            {step === 2 && (language === "bn" ? "আপনার ঠিকানা" : "Location")}
            {step === 3 && (language === "bn" ? "নিরাপত্তা" : "Security")}
          </h1>
          <p className="text-gray-500">
            {step === 1 && (language === "bn" ? "আমরা আপনাকে চিনতে চাই" : "Let's get to know you")}
            {step === 2 && (language === "bn" ? "যাতে সঠিক আবহাওয়া জানাতে পারি" : "To provide accurate weather info")}
            {step === 3 && (language === "bn" ? "আপনার অ্যাকাউন্ট সুরক্ষিত রাখুন" : "Secure your account")}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm border border-white/50 p-6 md:p-8 space-y-6">
          
          {step === 1 && (
            <div className="space-y-5 animate-in slide-in-from-right-10 duration-300">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> {language === "bn" ? "আপনার নাম" : "Your Name"}
                </label>
                <Input 
                  placeholder="যেমন: রহিম মিয়া" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary text-base bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" /> {language === "bn" ? "মোবাইল নম্বর" : "Phone Number"}
                </label>
                <Input 
                  type="tel"
                  placeholder="017XXXXXXXX" 
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary text-base bg-white"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-in slide-in-from-right-10 duration-300">
              <CustomSelect 
                label={language === "bn" ? "বিভাগ" : "Division"}
                placeholder="নির্বাচন করুন"
                value={formData.division}
                options={LOCATION_LISTS_BANGLA.divisions}
                onChange={(val: any) => setFormData({...formData, division: val, district: "", upazila: ""})}
              />
              <CustomSelect 
                label={language === "bn" ? "জেলা" : "District"}
                placeholder="নির্বাচন করুন"
                value={formData.district}
                options={currentDistricts}
                onChange={(val: any) => setFormData({...formData, district: val, upazila: ""})}
                disabled={!formData.division}
              />
              <CustomSelect 
                label={language === "bn" ? "উপজেলা" : "Upazila"}
                placeholder="নির্বাচন করুন"
                value={formData.upazila}
                options={currentUpazilas}
                onChange={(val: any) => setFormData({...formData, upazila: val})}
                disabled={!formData.district}
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-10 duration-300">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  {language === "bn" ? "পাসওয়ার্ড (মনে রাখুন)" : "Set Password"}
                </label>
                <Input 
                  type="password"
                  placeholder="******" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="h-12 rounded-xl border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary text-base bg-white"
                />
              </div>
              <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 space-y-3">
                <h4 className="font-bold text-primary flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  {language === "bn" ? "কেন অনুমতি দেবেন?" : "Why Allow?"}
                </h4>
                <div className="space-y-2">
                  <PermissionItem icon={<MapPin className="w-3.5 h-3.5" />} text="সঠিক আবহাওয়ার জন্য" />
                  <PermissionItem icon={<Camera className="w-3.5 h-3.5" />} text="রোগ শনাক্তকরণের জন্য" />
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 flex gap-4">
            {step > 1 && (
              <Button 
                variant="ghost" 
                onClick={() => setStep(s => s - 1)}
                className="h-12 flex-1 font-semibold text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              >
                {t("back")}
              </Button>
            )}
            
            {step < 3 ? (
              <Button 
                onClick={handleNext}
                className="h-12 rounded-xl flex-1 bg-primary hover:bg-primary/90 text-lg font-bold shadow-lg shadow-primary/20"
              >
                {language === "bn" ? "পরবর্তী" : "Next"} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className={`h-12 rounded-xl flex-1 bg-primary hover:bg-primary/90 font-bold shadow-lg shadow-primary/20 ${language === "bn" ? "text-sm" : "text-lg"}`}
              >
                {loading ? t("loading") : t("registration.submit")}
              </Button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function CustomSelect({ label, placeholder, value, onChange, options, disabled }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary text-base">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white z-50 border border-gray-100 shadow-xl rounded-xl max-h-[300px]">
          {options.map((opt: string) => (
            <SelectItem key={opt} value={opt} className="py-2.5 px-4 text-base focus:bg-green-50 focus:text-primary cursor-pointer">
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PermissionItem({ icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-gray-600">
      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-primary shadow-sm border border-green-100">
        {icon}
      </div>
      <span>{text}</span>
    </div>
  );
}