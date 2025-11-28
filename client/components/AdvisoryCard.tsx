import { useLanguage } from "@/context/LangContext";
import { AlertTriangle, CloudLightning, Sun, Droplets, Info, Megaphone } from "lucide-react";
import { WeatherData } from "@/data/mockData";
import { toBanglaDigits, cn } from "@/lib/utils";

interface AdvisoryCardProps {
  weatherData: WeatherData;
}

export default function AdvisoryCard({ weatherData }: AdvisoryCardProps) {
  const { language } = useLanguage();

  const rainChance = weatherData.rainChance ?? 0;
  const temp = weatherData.temperature ?? 30;
  const humidity = weatherData.humidity ?? 60;

  const dRain = language === "bn" ? toBanglaDigits(rainChance) : rainChance;
  const dTemp = language === "bn" ? toBanglaDigits(temp) : temp;

  // Logic for Specific Advice
  let type: "rain" | "heat" | "humidity" | "good" = "good";
  let title = "";
  let message = "";
  let action = "";

  if (rainChance > 70) {
    type = "rain";
    title = language === "bn" ? "বৃষ্টি সতর্কতা" : "Rain Alert";
    message = language === "bn" 
      ? `আগামী ৩ দিনে ${dRain}% বৃষ্টির সম্ভাবনা।` 
      : `${rainChance}% rain chance ahead.`;
    action = language === "bn" ? "পাকা ধান দ্রুত কেটে ঘরে তুলুন।" : "Harvest ripe paddy immediately.";
  } else if (temp > 35) {
    type = "heat";
    title = language === "bn" ? "তাপপ্রবাহ" : "Heatwave";
    message = language === "bn" 
      ? `তাপমাত্রা ${dTemp}°C, যা ফসলের জন্য ঝুঁকিপূর্ণ।` 
      : `High temp (${temp}°C) detected.`;
    action = language === "bn" ? "বিকালে গাছের গোড়ায় পানি দিন।" : "Irrigate crop roots in afternoon.";
  } else if (humidity > 85) {
    type = "humidity";
    title = language === "bn" ? "আর্দ্রতা বেশি" : "High Humidity";
    message = language === "bn" 
      ? "পোকা ও ছত্রাকের আক্রমণ হতে পারে।" 
      : "Risk of pest & fungal attack.";
    action = language === "bn" ? "নিয়মিত ক্ষেত পরিদর্শন করুন।" : "Monitor field for pests.";
  } else {
    type = "good";
    title = language === "bn" ? "আবহাওয়া ভালো" : "Good Weather";
    message = language === "bn" 
      ? "এখন আবহাওয়া কৃষিকাজের অনুকূল।" 
      : "Conditions are favorable.";
    action = language === "bn" ? "আগাছা পরিষ্কার ও সার দিন।" : "Clear weeds & apply fertilizer.";
  }

  // Styles configuration
  const config = {
    rain: {
      bg: "bg-slate-800 text-white",
      iconBox: "bg-white/20 text-white",
      icon: CloudLightning,
      actionBg: "bg-white/10 border-white/20",
      accent: "from-slate-700 to-slate-900",
      pulse: true
    },
    heat: {
      bg: "bg-amber-500 text-white",
      iconBox: "bg-white/20 text-white",
      icon: Sun,
      actionBg: "bg-white/20 border-white/30",
      accent: "from-amber-400 to-orange-500",
      pulse: true
    },
    humidity: {
      bg: "bg-blue-600 text-white",
      iconBox: "bg-white/20 text-white",
      icon: Droplets,
      actionBg: "bg-white/20 border-white/30",
      accent: "from-blue-500 to-indigo-600",
      pulse: false
    },
    good: {
      bg: "bg-white border-2 border-green-100",
      iconBox: "bg-green-100 text-green-600",
      icon: CheckCircleIcon,
      actionBg: "bg-green-50 border-green-100 text-green-900",
      accent: "", // No gradient for good weather, keep it clean
      pulse: false,
      isLight: true
    }
  };

  const style = config[type];
  const Icon = style.icon;
  const isLight = style.isLight;

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-5 shadow-sm transition-all",
      style.accent ? `bg-gradient-to-br ${style.accent} text-white border-none` : style.bg
    )}>
      {/* Decorative pulse for alerts */}
      {style.pulse && (
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-2xl animate-pulse" />
      )}

      <div className="relative z-10 flex flex-col gap-4">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl backdrop-blur-md", style.iconBox)}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className={cn("font-bold text-lg leading-tight", isLight ? "text-gray-900" : "text-white")}>
              {title}
            </h3>
            <p className={cn("text-xs font-medium opacity-90", isLight ? "text-gray-500" : "text-white/80")}>
              {message}
            </p>
          </div>
        </div>

        {/* Action Box */}
        <div className={cn(
          "flex items-start gap-3 p-3 rounded-xl border backdrop-blur-sm",
          style.actionBg
        )}>
          <Megaphone className={cn("w-5 h-5 shrink-0 mt-0.5", isLight ? "text-green-600" : "text-white/90")} />
          <div>
            <p className={cn("text-xs font-bold uppercase tracking-wider mb-0.5 opacity-70", isLight ? "text-green-800" : "text-white")}>
              {language === "bn" ? "পরামর্শ" : "Action"}
            </p>
            <p className={cn("text-sm font-semibold", isLight ? "text-gray-800" : "text-white")}>
              {action}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Icon for "Good" state
function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  )
}