import { useLanguage } from "@/context/LangContext";
import { Input } from "@/components/ui/input";
import { Scale } from "lucide-react";
import { toBanglaDigits } from "@/lib/utils";
import * as React from "react";

interface WeightInputProps {
  weight: string;
  setWeight: (weight: string) => void;
  unit: "kg" | "mon";
  setUnit: (unit: "kg" | "mon") => void;
  label: string;
}

/**
 * Custom input component for managing crop weight with KG and Mon units.
 * Mon (মন) is a common unit in Bangladesh, approximately 40 KG.
 */
export default function WeightInput({
  weight,
  setWeight,
  unit,
  setUnit,
  label,
}: WeightInputProps) {
  const { language } = useLanguage();
  const MON_TO_KG = 40;

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and one decimal point for fluid input
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setWeight(value);
  };

  const calculatedWeightKg = unit === "mon" ? parseFloat(weight || "0") * MON_TO_KG : parseFloat(weight || "0");
  // Round to nearest integer for display, as farmers prefer whole numbers for Mon conversion
  const displayWeightKg = toBanglaDigits(Math.round(calculatedWeightKg)); 

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
          <Scale className="w-4 h-4" /> 
          {label}
        </label>
        
        {/* Unit Toggle Buttons - Updated for Bangla Support */}
        <div className="flex bg-muted p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setUnit("kg")}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${unit === "kg" ? "bg-white shadow text-primary" : "text-muted-foreground"}`}
          >
            {language === "bn" ? "কেজি" : "KG"}
          </button>
          <button
            type="button"
            onClick={() => setUnit("mon")}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${unit === "mon" ? "bg-white shadow text-primary" : "text-muted-foreground"}`}
          >
            {language === "bn" ? "মণ" : "MON"}
          </button>
        </div>
      </div>
      <Input 
        type="text" // Use text to manage controlled input properly
        placeholder={language === "bn" ? "পরিমাণ দিন (যেমন: ৫০০)" : "Enter amount (e.g. 500)"} 
        value={weight} 
        onChange={handleWeightChange} 
        className="h-14 text-xl font-bold rounded-xl border-2 focus:border-primary"
      />
      {/* Conversion Display */}
      {weight && unit === "mon" && parseFloat(weight) > 0 && (
        <p className="text-xs text-primary font-medium text-right animate-in fade-in">
          ≈ {displayWeightKg} {language === "bn" ? "কেজি" : "kg"} ({language === "bn" ? "আনুমানিক" : "approx"})
        </p>
      )}
    </div>
  );
}