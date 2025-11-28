import { useLanguage } from "@/context/LangContext";
import { Check } from "lucide-react";
import { storageTypes } from "@/data/mockData";

interface StorageSelectorProps {
  selected: string;
  onChange: (value: string) => void;
}

export default function StorageSelector({
  selected,
  onChange,
}: StorageSelectorProps) {
  const { language } = useLanguage();

  return (
    <div className="grid grid-cols-2 gap-4">
      {storageTypes.map((storage) => (
        <button
          key={storage.id}
          onClick={() => onChange(storage.id)}
          className={`relative p-6 rounded-lg border-2 transition-all text-center space-y-3 ${
            selected === storage.id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
        >
          {/* Checkmark */}
          {selected === storage.id && (
            <div className="absolute top-2 right-2 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
          )}

          {/* Icon */}
          <div className="text-4xl">{storage.icon}</div>

          {/* Labels */}
          <div>
            <h3 className="font-bold text-sm text-foreground">
              {language === "bn" ? storage.label_bn : storage.label_en}
            </h3>
            <p className="text-xs text-muted-foreground">
              {language === "bn"
                ? storage.description_bn
                : storage.description_en}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
