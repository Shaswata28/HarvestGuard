import { useState } from "react";
import { useLanguage } from "@/context/LangContext";
import { Button } from "@/components/ui/button";
import { offlineStorage } from "@/utils/offlineStorage";
import { FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ExportData() {
  const { t, language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsLoading(true);
    try {
      // Get profile to check if farmer exists
      const profile = offlineStorage.getFarmerProfile();

      if (!profile.farmer) {
        toast({
          title: language === "bn" ? "কোনো ডেটা নেই" : "No Data",
          description: language === "bn" ? "প্রথমে একটি কৃষক প্রোফাইল তৈরি করুন" : "Please register as a farmer first",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      // Trigger download
      offlineStorage.downloadCSV();

      toast({
        title: language === "bn" ? "ডাউনলোড সম্পন্ন" : "Download Complete",
        description: language === "bn" ? "আপনার ডেটা CSV হিসাবে ডাউনলোড হয়েছে" : "Your data has been exported as CSV",
        duration: 3000,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "রপ্তানি ব্যর্থ হয়েছে" : "Export failed",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isLoading}
      variant="outline"
      className="w-full min-h-12 gap-2"
    >
      <FileDown className="w-5 h-5" />
      {isLoading ? t("loading") : t("export.button")}
    </Button>
  );
}
