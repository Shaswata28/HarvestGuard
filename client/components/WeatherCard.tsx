import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WeatherData } from "@/data/mockData";
import { 
  Cloud, 
  CloudRain, 
  Sun, 
  Droplets, 
  ChevronDown, 
  MapPin, 
  Clock, 
  Wind, 
  Moon, 
  Sunrise, 
  Sunset 
} from "lucide-react";
import { cn, toBanglaDigits } from "@/lib/utils";
import { useLanguage } from "@/context/LangContext";
import { Button } from "@/components/ui/button";

interface WeatherCardProps {
  weather: WeatherData;
  className?: string;
}

export default function WeatherCard({ weather, className }: WeatherCardProps) {
  const { t, language } = useLanguage();
  const [isForecastOpen, setIsForecastOpen] = useState(false);

  // Helper to format time
  const currentTime = new Date().toLocaleTimeString(language === "bn" ? "bn-BD" : "en-US", {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Determine time of day and conditions
  const hour = new Date().getHours();
  
  // Time Periods
  const isMorning = hour >= 5 && hour < 11;
  const isEvening = hour >= 17 && hour < 19;
  const isNight = hour >= 19 || hour < 5;

  // Weather Conditions
  const isRaining = weather.rainChance > 60;

  // Dynamic Theme Logic
  const getTheme = () => {
    // 1. Rain overrides everything (Gloomy)
    if (isRaining) {
      return {
        bg: "bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800",
        bgIcon: <CloudRain className="w-48 h-48 text-white/10 absolute -top-12 -right-12" />,
        mainIcon: <CloudRain className="w-12 h-12 text-white drop-shadow-lg" />
      };
    }
    
    // 2. Night
    if (isNight) {
      return {
        bg: "bg-gradient-to-br from-indigo-950 via-slate-900 to-black",
        bgIcon: <Moon className="w-48 h-48 text-yellow-50/10 absolute -top-8 -right-12" />,
        mainIcon: <Moon className="w-12 h-12 text-yellow-100 drop-shadow-lg" />
      };
    }

    // 3. Morning
    if (isMorning) {
      return {
        bg: "bg-gradient-to-br from-orange-400 via-rose-400 to-indigo-400",
        bgIcon: <Sunrise className="w-48 h-48 text-yellow-100/20 absolute -top-12 -right-12" />,
        mainIcon: <Sunrise className="w-12 h-12 text-white drop-shadow-lg" />
      };
    }

    // 4. Evening
    if (isEvening) {
      return {
        bg: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500",
        bgIcon: <Sunset className="w-48 h-48 text-orange-100/20 absolute -top-12 -right-12" />,
        mainIcon: <Sunset className="w-12 h-12 text-orange-50 drop-shadow-lg" />
      };
    }

    // 5. Default Day
    return {
      bg: "bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600",
      bgIcon: <Sun className="w-48 h-48 text-yellow-300/30 absolute -top-12 -right-12 animate-pulse-slow" />,
      mainIcon: <Sun className="w-12 h-12 text-yellow-300 drop-shadow-lg" />
    };
  };

  const theme = getTheme();

  // Helper icons for forecast list (Small icons)
  const getForecastIcon = (rainChance: number) => {
    if (rainChance > 70) return <CloudRain className="w-6 h-6 text-white/90" />;
    if (rainChance > 40) return <Cloud className="w-6 h-6 text-white/90" />;
    return <Sun className="w-6 h-6 text-yellow-300" />;
  };

  const displayNum = (num: number | string) => {
    return language === "bn" ? toBanglaDigits(num) : num;
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-[1.5rem] text-white shadow-xl shadow-black/10 transition-all duration-1000 ease-in-out",
      theme.bg,
      className
    )}>
      {/* Dynamic Background Element */}
      <div className="pointer-events-none select-none">
        {theme.bgIcon}
      </div>
      
      {/* Content Container - Reduced Padding */}
      <div className="p-5 relative z-10">
        
        {/* Top Row: Location & Main Icon */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1 bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full w-fit border border-white/10">
              <MapPin className="w-3 h-3 text-white" />
              <span className="text-xs font-bold tracking-wide">{weather.upazila}</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-90 text-[10px] ml-1 mt-1 font-medium">
              <Clock className="w-2.5 h-2.5" />
              <span>{currentTime}</span>
            </div>
          </div>
          
          {/* Current Weather Icon */}
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-md border border-white/30 shadow-lg">
            {theme.mainIcon}
          </div>
        </div>

        {/* Big Temperature & Condition */}
        <div className="flex flex-col mb-5 pl-1">
          <div className="flex items-start gap-1">
            <span className="text-6xl font-bold leading-none tracking-tighter drop-shadow-md">
              {displayNum(weather.temperature)}°
            </span>
            <span className="text-2xl font-bold mt-1 opacity-90">C</span>
          </div>
          <span className="text-base font-medium opacity-100 mt-1 pl-1 text-white tracking-wide">
            {weather.condition}
          </span>
        </div>

        {/* Essential Stats Grid - Reduced height/spacing */}
        <div className="grid grid-cols-3 gap-2 mb-1">
          {/* Humidity */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-2 flex flex-col justify-center items-center text-center border border-white/10">
            <Droplets className="w-4 h-4 text-blue-200 mb-1" />
            <p className="text-sm font-bold">{displayNum(weather.humidity)}%</p>
            <p className="text-[9px] opacity-80 font-medium">{t("weather.humidity")}</p>
          </div>

          {/* Rain Chance */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-2 flex flex-col justify-center items-center text-center border border-white/10">
            <CloudRain className="w-4 h-4 text-gray-200 mb-1" />
            <p className="text-sm font-bold">{displayNum(weather.rainChance)}%</p>
            <p className="text-[9px] opacity-80 font-medium">{t("weather.rain_chance")}</p>
          </div>

           {/* Wind Speed */}
           <div className="bg-black/20 backdrop-blur-sm rounded-xl p-2 flex flex-col justify-center items-center text-center border border-white/10">
            <Wind className="w-4 h-4 text-gray-200 mb-1" />
            <p className="text-sm font-bold">{displayNum(weather.windSpeed)}</p>
            <p className="text-[9px] opacity-80 font-medium">{language === 'bn' ? 'কিমি/ঘণ্টা' : 'km/h'}</p>
          </div>
        </div>
      </div>

      {/* Collapsible Forecast Section */}
      <div className="bg-black/20 backdrop-blur-md border-t border-white/10">
        <Button
          variant="ghost"
          onClick={() => setIsForecastOpen(!isForecastOpen)}
          className="w-full flex items-center justify-between py-4 px-5 h-10 text-white bg-white/5 hover:bg-white/10 hover:text-white transition-colors rounded-none"
        >
          <span className="font-bold text-xs uppercase tracking-wider opacity-90">{t("dashboard.forecast_title")}</span>
          <div className={`bg-white/20 rounded-full p-0.5 transition-transform duration-300 ${isForecastOpen ? "rotate-180" : ""}`}>
            <ChevronDown className="w-3 h-3" />
          </div>
        </Button>

        <AnimatePresence initial={false}>
          {isForecastOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="p-3 space-y-2 pb-4 bg-black/10">
                {weather.forecast && weather.forecast.map((day, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white/10 rounded-lg p-2 border border-white/5 shadow-sm backdrop-blur-sm">
                    <span className="font-bold text-xs w-16">{day.day}</span>
                    
                    {/* Icon & Condition */}
                    <div className="flex items-center gap-1.5 flex-1 justify-center">
                      {getForecastIcon(day.rainChance)}
                      <span className="text-[10px] opacity-90 truncate max-w-[60px] font-medium">{day.condition}</span>
                    </div>

                    {/* Temp & Rain */}
                    <div className="text-right min-w-[50px]">
                      <span className="font-bold text-sm block">{displayNum(day.highTemp)}°C</span>
                      {day.lowTemp && (
                        <span className="text-[9px] opacity-70 block font-medium">
                          {displayNum(day.lowTemp)}°C
                        </span>
                      )}
                      {day.rainChance > 0 && (
                        <span className="text-[9px] text-blue-200 block font-medium">
                          {displayNum(day.rainChance)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}