import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LangContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeatherByUpazila, UPAZILAS, WeatherData } from "@/utils/mockWeatherAPI";
import WeatherCard from "@/components/WeatherCard";
import WeatherAdvisory from "@/components/WeatherAdvisory";
import { Cloud, Loader2 } from "lucide-react";
import type { WeatherResponse, ForecastResponse } from "@shared/api";
import { offlineStorage } from "@/utils/offlineStorage";
import { translateWeatherCondition } from "@/utils/weatherTranslations";

export default function Weather() {
  const { t, language } = useLanguage();
  const [selectedUpazila, setSelectedUpazila] = useState(UPAZILAS[0]);
  const [weather, setWeather] = useState<WeatherData>(() =>
    getWeatherByUpazila(UPAZILAS[0])
  );
  const [isLoading, setIsLoading] = useState(false);
  const profile = offlineStorage.getFarmerProfile();

  // Fetch real weather data on mount
  useEffect(() => {
    const fetchWeather = async () => {
      if (!profile.farmer) return;
      
      setIsLoading(true);
      try {
        const [currentRes, forecastRes] = await Promise.all([
          fetch(`/api/weather/current?farmerId=${profile.farmer.id}`),
          fetch(`/api/weather/forecast?farmerId=${profile.farmer.id}`)
        ]);
        
        const currentData: WeatherResponse = await currentRes.json();
        const forecastData: ForecastResponse = await forecastRes.json();
        
        console.log('[Weather] API Response:', {
          windSpeed: currentData.data?.windSpeed,
          windSpeedKmh: currentData.data?.windSpeed ? Math.round(currentData.data.windSpeed * 3.6) : 0,
          humidity: currentData.data?.humidity,
          rainfall: currentData.data?.rainfall
        });
        
        if (currentData.success && currentData.data) {
          // Calculate rain chance from current weather conditions
          // Use rainfall amount and weather condition to estimate probability
          let rainChance = 0;
          if (currentData.data.rainfall > 0) {
            // If it's currently raining, show high probability
            rainChance = 90;
          } else if (currentData.data.weatherDescription.toLowerCase().includes('rain')) {
            rainChance = 70;
          } else if (currentData.data.weatherCondition.toLowerCase() === 'clouds') {
            rainChance = Math.min(currentData.data.cloudiness, 60);
          } else {
            rainChance = Math.floor(currentData.data.cloudiness / 3);
          }
          
          // Convert wind speed from m/s to km/h
          const windSpeedKmh = Math.round(currentData.data.windSpeed * 3.6);
          
          setWeather({
            temperature: Math.round(currentData.data.temperature),
            feelsLike: Math.round(currentData.data.feelsLike),
            condition: translateWeatherCondition(currentData.data.weatherDescription, language as 'bn' | 'en'),
            humidity: currentData.data.humidity,
            rainChance: Math.round(rainChance),
            windSpeed: windSpeedKmh,
            upazila: profile.farmer.upazila || "Dhaka",
            forecast: forecastData.success ? forecastData.data.daily.slice(0, 5).map((day, idx) => ({
              day: new Date(day.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { weekday: 'short' }),
              highTemp: Math.round(day.tempMax),
              lowTemp: Math.round(day.tempMin),
              rainChance: Math.round(day.precipitationProbability * 100),
              condition: translateWeatherCondition(day.weatherDescription, language as 'bn' | 'en')
            })) : []
          });
        }
      } catch (error) {
        console.error('Failed to fetch weather:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [profile.farmer, language]);

  const handleUpazilaChange = (upazila: string) => {
    setSelectedUpazila(upazila);
    const weatherData = getWeatherByUpazila(upazila);
    setWeather(weatherData);
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Cloud className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">
            {t("weather.title")}
          </h1>
        </div>
        <p className="text-muted-foreground">
          {language === "bn"
            ? "আপনার এলাকার ��বহাওয়া এবং কৃষি পরামর্শ পান"
            : "Get weather and farming advice for your area"}
        </p>
      </div>

      {/* Upazila Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {t("weather.select_upazila")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedUpazila} onValueChange={handleUpazilaChange}>
            <SelectTrigger className="w-full min-h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UPAZILAS.map((upazila) => (
                <SelectItem key={upazila} value={upazila}>
                  {upazila}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Current Weather Card */}
      {isLoading ? (
        <Card className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </Card>
      ) : (
        <WeatherCard weather={weather} />
      )}

      {/* Weather Advisory */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-foreground">
          {language === "bn" ? "পরামর্শ" : "Advisories"}
        </h2>
        <WeatherAdvisory weather={weather} />
      </div>

      {/* Additional Information */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle>
            {language === "bn" ? "কৃষি টিপস" : "Farming Tips"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <p className="font-semibold text-foreground">
              {language === "bn" ? "বৃষ্টির আগে করণীয়:" : "Before Rain:"}
            </p>
            <ul className="text-sm space-y-1 text-foreground opacity-90">
              <li>• {language === "bn" ? "নর্দমা/নালা খোলা রাখুন" : "Keep drainage open"}</li>
              <li>• {language === "bn" ? "পাকা ফসল তাড়াতাড়ি কাটুন" : "Harvest ripe crops quickly"}</li>
              <li>• {language === "bn" ? "ভারী বৃষ্টির প্রস্তুতি নিন" : "Prepare for heavy rain"}</li>
            </ul>
          </div>

          <div className="space-y-2 border-t border-primary/20 pt-3">
            <p className="font-semibold text-foreground">
              {language === "bn" ? "গরমে করণীয়:" : "During Heat:"}
            </p>
            <ul className="text-sm space-y-1 text-foreground opacity-90">
              <li>• {language === "bn" ? "নিয়মিত সেচ দিন" : "Irrigate regularly"}</li>
              <li>• {language === "bn" ? "সকাল ও সন্ধ্যায় পানি দিন" : "Water in morning and evening"}</li>
              <li>• {language === "bn" ? "মালচিং করুন" : "Apply mulching"}</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="border-warning/20 bg-warning/5">
        <CardHeader>
          <CardTitle className="text-lg">
            {language === "bn" ? "নোট" : "Note"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground">
            {language === "bn"
              ? "এই আবহাওয়া পূর্বাভাস এবং পরামর্শ মক ডেটার উপর ভিত্তি করে তৈরি। সর্বদা স্থানীয় আবহাওয়া সংস্থা এবং কৃষি বিভাগের সাথে যোগাযোগ করুন।"
              : "This weather forecast and advisory is based on mock data. Always consult with local weather agencies and agricultural departments."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
