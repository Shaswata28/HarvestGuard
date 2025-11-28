import { useState } from "react";
import { useLanguage } from "@/context/LangContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { offlineStorage, CropBatch } from "@/utils/offlineStorage";
import { z } from "zod";

const cropBatchSchema = z.object({
  weight: z.number().positive("Weight must be greater than 0"),
  harvestDate: z.string().min(1, "Harvest date is required"),
  storageLocation: z.enum(["silo", "jute_bag", "open_space"]),
});

type CropBatchFormData = z.infer<typeof cropBatchSchema>;

interface CropBatchEntryProps {
  onSuccess?: (crop: CropBatch) => void;
}

export default function CropBatchEntry({ onSuccess }: CropBatchEntryProps) {
  const { t, language } = useLanguage();
  const isOnline = useOnlineStatus();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    weight: "",
    harvestDate: "",
    storageLocation: "silo" as "silo" | "jute_bag" | "open_space",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      storageLocation: value as "silo" | "jute_bag" | "open_space",
    }));
    if (errors.storageLocation) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.storageLocation;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Parse and validate form data
      const validatedData = cropBatchSchema.parse({
        weight: parseFloat(formData.weight),
        harvestDate: formData.harvestDate,
        storageLocation: formData.storageLocation,
      });

      // Save crop batch to offline storage
      const newCrop = offlineStorage.addCropBatch({
        cropType: "ধান",
        weight: validatedData.weight,
        harvestDate: validatedData.harvestDate,
        storageLocation: validatedData.storageLocation,
      });

      const message = isOnline
        ? t("crop.success")
        : t("offline.saved_offline");

      toast({
        title: message,
        duration: 3000,
      });

      // Reset form
      setFormData({
        weight: "",
        harvestDate: "",
        storageLocation: "silo",
      });

      // Call onSuccess callback
      if (onSuccess) {
        onSuccess(newCrop);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }

      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "ফর্ম পূরণে সমস্যা" : "Failed to save crop data",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Crop Type Field - Read Only */}
      <div className="space-y-2">
        <Label htmlFor="cropType">{t("crop.crop_type")}</Label>
        <Input
          id="cropType"
          value={t("crop.rice")}
          disabled
          className="bg-muted opacity-60"
        />
        <p className="text-xs text-muted-foreground">
          {language === "bn" ? "এখন শুধুমাত্র ধান সমর্থিত" : "Only rice is supported currently"}
        </p>
      </div>

      {/* Weight Field */}
      <div className="space-y-2">
        <Label htmlFor="weight">{t("crop.weight")}</Label>
        <Input
          id="weight"
          name="weight"
          type="number"
          value={formData.weight}
          onChange={handleChange}
          placeholder={language === "bn" ? "যেমন: ৫০০" : "e.g., 500"}
          disabled={isLoading}
          className={errors.weight ? "border-critical" : ""}
        />
        {errors.weight && (
          <p className="text-sm text-critical">{errors.weight}</p>
        )}
      </div>

      {/* Harvest Date Field */}
      <div className="space-y-2">
        <Label htmlFor="harvestDate">{t("crop.harvest_date")}</Label>
        <Input
          id="harvestDate"
          name="harvestDate"
          type="date"
          value={formData.harvestDate}
          onChange={handleChange}
          disabled={isLoading}
          className={errors.harvestDate ? "border-critical" : ""}
        />
        {errors.harvestDate && (
          <p className="text-sm text-critical">{errors.harvestDate}</p>
        )}
      </div>

      {/* Storage Location Select */}
      <div className="space-y-2">
        <Label htmlFor="storageLocation">{t("crop.storage_location")}</Label>
        <Select value={formData.storageLocation} onValueChange={handleSelectChange}>
          <SelectTrigger
            id="storageLocation"
            disabled={isLoading}
            className={errors.storageLocation ? "border-critical" : ""}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="silo">{t("crop.silo")}</SelectItem>
            <SelectItem value="jute_bag">{t("crop.jute_bag")}</SelectItem>
            <SelectItem value="open_space">{t("crop.open_space")}</SelectItem>
          </SelectContent>
        </Select>
        {errors.storageLocation && (
          <p className="text-sm text-critical">{errors.storageLocation}</p>
        )}
      </div>

      {/* Offline Indicator */}
      {!isOnline && (
        <p className="text-sm text-warning bg-warning/10 p-2 rounded">
          {t("offline.saved_offline")}
        </p>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground min-h-14 font-semibold text-base"
      >
        {isLoading ? t("loading") : t("crop.submit")}
      </Button>
    </form>
  );
}
