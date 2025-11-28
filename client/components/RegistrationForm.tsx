import { useState } from "react";
import { useLanguage } from "@/context/LangContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { offlineStorage } from "@/utils/offlineStorage";
import { z } from "zod";

const registrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface RegistrationFormProps {
  onSuccess?: () => void;
}

export default function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const { t, language } = useLanguage();
  const isOnline = useOnlineStatus();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Validate form data
      const validatedData = registrationSchema.parse(formData);

      // Save to localStorage
      offlineStorage.saveFarmer({
        name: validatedData.name,
        phone: validatedData.phone,
        password: validatedData.password,
        registeredDate: new Date().toISOString(),
      });

      const message = isOnline
        ? t("registration.success")
        : t("offline.saved_offline");

      toast({
        title: message,
        description: language === "bn" ? "আপনি সফলভাবে নিবন্ধিত হয়েছেন" : "Registration successful",
        duration: 3000,
      });

      // Reset form
      setFormData({ name: "", phone: "", password: "" });

      // Call onSuccess callback
      if (onSuccess) {
        onSuccess();
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
        title: t("registration.error"),
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">{t("registration.name")}</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder={language === "bn" ? "আপনার নাম" : "Your name"}
          disabled={isLoading}
          className={errors.name ? "border-critical" : ""}
        />
        {errors.name && (
          <p className="text-sm text-critical">{errors.name}</p>
        )}
      </div>

      {/* Phone Field */}
      <div className="space-y-2">
        <Label htmlFor="phone">{t("registration.phone")}</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder={language === "bn" ? "০১XXXXXXXXX" : "01XXXXXXXXX"}
          disabled={isLoading}
          className={errors.phone ? "border-critical" : ""}
        />
        {errors.phone && (
          <p className="text-sm text-critical">{errors.phone}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password">{t("registration.password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder={language === "bn" ? "একটি শক্তিশালী পাসওয়ার্ড" : "A strong password"}
          disabled={isLoading}
          className={errors.password ? "border-critical" : ""}
        />
        {errors.password && (
          <p className="text-sm text-critical">{errors.password}</p>
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
        {isLoading ? t("loading") : t("registration.submit")}
      </Button>
    </form>
  );
}
