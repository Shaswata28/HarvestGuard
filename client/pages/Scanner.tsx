import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Image as ImageIcon, ScanLine, CheckCircle2, AlertTriangle, XCircle, ChevronRight, WifiOff, Loader2, Bug, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toBanglaDigits, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { AnalyzeScanResponse, CropBatchResponse } from "@shared/api";
import { notificationService } from "@/services/notificationService";
import { RiskLevelBadge } from "@/components/RiskLevelBadge";
import { GroundingSources } from "@/components/GroundingSources";

type ScanState = "idle" | "preview" | "analyzing" | "result";
type ScanMode = "disease" | "pest";

export default function Scanner() {
  const { language, t } = useLanguage();
  const { farmerId } = useAuth();
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const [scanMode, setScanMode] = useState<ScanMode>("disease");
  const [status, setStatus] = useState<ScanState>("idle");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [cropBatches, setCropBatches] = useState<CropBatchResponse[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeScanResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load crop batches when farmer is available
  useEffect(() => {
    if (farmerId) {
      loadCropBatches();
    }
  }, [farmerId]);

  const loadCropBatches = async () => {
    if (!farmerId) return;
    
    setLoadingBatches(true);
    try {
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
      const apiUrl = apiBaseUrl ? `${apiBaseUrl}/api/crop-batches?farmerId=${farmerId}` : `/api/crop-batches?farmerId=${farmerId}`;
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        setCropBatches(data.batches || []);
      }
    } catch (error) {
      console.error("Failed to load crop batches:", error);
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setStatus("preview");
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = () => {
    if (!isOnline) {
      toast({
        title: language === "bn" ? "ইন্টারনেট সংযোগ প্রয়োজন" : "Internet connection required",
        description: language === "bn" ? "স্ক্যান করতে অনলাইন থাকুন" : "Please go online to scan",
        variant: "destructive",
      });
      return;
    }
    cameraInputRef.current?.click();
  };

  const handleGalleryUpload = () => {
    if (!isOnline) {
      toast({
        title: language === "bn" ? "ইন্টারনেট সংযোগ প্রয়োজন" : "Internet connection required",
        description: language === "bn" ? "স্ক্যান করতে অনলাইন থাকুন" : "Please go online to scan",
        variant: "destructive",
      });
      return;
    }
    fileInputRef.current?.click();
  };

  const handleRetake = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setStatus("idle");
  };

  const handleAnalyze = async () => {
    if (!selectedImage || !farmerId) {
      console.log("Missing image or farmerId:", { hasImage: !!selectedImage, hasFarmerId: !!farmerId });
      return;
    }

    setStatus("analyzing");

    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("farmerId", farmerId);
      if (selectedBatch && selectedBatch !== "none") {
        formData.append("batchId", selectedBatch);
      }

      // Route to appropriate endpoint based on scan mode
      const endpoint = scanMode === "pest" ? "/api/scanner/analyze-pest" : "/api/scanner/analyze";
      console.log(`Sending ${scanMode} analysis request...`);
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
      const apiUrl = apiBaseUrl ? `${apiBaseUrl}${endpoint}` : endpoint;
      
      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Analysis failed:", errorData);
        throw new Error(errorData.error?.message || "Analysis failed");
      }

      const data: AnalyzeScanResponse = await response.json();
      console.log("Analysis result:", data);
      setAnalysisResult(data);
      setStatus("result");

      // Trigger notification for scan completion
      notificationService.notifyScanComplete(data.scan, language as 'bn' | 'en');

      toast({
        title: language === "bn" ? "বিশ্লেষণ সম্পন্ন" : "Analysis complete",
        description: language === "bn" ? "ফলাফল সংরক্ষিত হয়েছে" : "Results saved to health journal",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: error instanceof Error ? error.message : (language === "bn" ? "বিশ্লেষণ ব্যর্থ হয়েছে" : "Analysis failed"),
        variant: "destructive",
      });
      setStatus("preview");
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center py-6 px-4 relative overflow-hidden">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
      />

      {/* Offline Warning */}
      {!isOnline && (
        <div className="w-full max-w-md mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <WifiOff className="w-5 h-5 text-amber-600" />
          <p className="text-sm text-amber-800 font-medium">
            {language === "bn" ? "অফলাইন - স্ক্যান করতে ইন্টারনেট প্রয়োজন" : "Offline - Internet required to scan"}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="w-full max-w-md space-y-4 mb-8 z-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-1.5 rounded-full text-sm font-bold mb-3">
            <ScanLine className="w-4 h-4" />
            {t("scanner.title")}
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {language === "bn" ? "আপনার ধান কি সুস্থ?" : "Is your crop healthy?"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {scanMode === "disease" ? t("scanner.subtitle_disease") : t("scanner.subtitle_pest")}
          </p>
        </div>
        
        {/* Mode Toggle - Simplified */}
        <div className="flex p-1 bg-muted/50 rounded-xl">
          <button 
            onClick={() => setScanMode("disease")}
            className={cn(
              "flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2", 
              scanMode === "disease" ? "bg-white shadow text-primary" : "text-muted-foreground"
            )}
          >
            <Leaf className="w-4 h-4" />
            {t("scanner.mode_disease")}
          </button>
          <button 
            onClick={() => setScanMode("pest")}
            className={cn(
              "flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2", 
              scanMode === "pest" ? "bg-white shadow text-primary" : "text-muted-foreground"
            )}
          >
            <Bug className="w-4 h-4" />
            {t("scanner.mode_pest")}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-md flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="space-y-6"
            >
              <div className="aspect-[3/4] bg-black/5 rounded-[2rem] border-4 border-dashed border-primary/30 relative flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/leaf.png')]" />
                <ScanLine className="w-20 h-20 text-primary/40 mb-4" />
                <p className="text-sm text-muted-foreground font-medium">
                  {language === "bn" ? "এখানে পাতা রাখুন" : "Place leaf here"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleCameraCapture}
                  disabled={!isOnline}
                  className="h-16 rounded-2xl bg-primary hover:bg-primary/90 text-lg font-bold shadow-lg shadow-primary/20 flex flex-col gap-1"
                >
                  <Camera className="w-6 h-6" />
                  {t("scanner.camera_btn")}
                </Button>
                <Button
                  onClick={handleGalleryUpload}
                  disabled={!isOnline}
                  variant="outline"
                  className="h-16 rounded-2xl border-2 border-primary/20 text-primary hover:bg-primary/5 flex flex-col gap-1 font-bold"
                >
                  <ImageIcon className="w-6 h-6" />
                  {t("scanner.gallery_btn")}
                </Button>
              </div>
            </motion.div>
          )}

          {status === "preview" && imagePreview && (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="aspect-[3/4] rounded-[2rem] overflow-hidden shadow-2xl">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {language === "bn" ? "ফসল ব্যাচ নির্বাচন করুন (ঐচ্ছিক)" : "Select Crop Batch (Optional)"}
                  </label>
                  <Select value={selectedBatch} onValueChange={setSelectedBatch} disabled={loadingBatches}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder={loadingBatches ? (language === "bn" ? "লোড হচ্ছে..." : "Loading...") : (language === "bn" ? "ব্যাচ নির্বাচন করুন" : "Select batch")} />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="none">{language === "bn" ? "কোনটিই নয়" : "None"}</SelectItem>
                      {cropBatches.map((batch) => (
                        <SelectItem key={batch._id} value={batch._id}>
                          {batch.cropType} - {batch.stage === 'growing' ? (language === "bn" ? "বৃদ্ধি" : "Growing") : (language === "bn" ? "সংগ্রহ" : "Harvested")}
                          {batch.batchNumber ? ` (#${batch.batchNumber})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={handleRetake} variant="outline" className="h-12 rounded-xl">
                    {language === "bn" ? "পুনরায় নিন" : "Retake"}
                  </Button>
                  <Button onClick={handleAnalyze} className="h-12 rounded-xl" disabled={!selectedImage}>
                    {language === "bn" ? "বিশ্লেষণ করুন" : "Analyze"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {status === "analyzing" && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="aspect-[3/4] bg-black rounded-[2rem] relative overflow-hidden w-full shadow-2xl"
            >
              {imagePreview && (
                <img src={imagePreview} alt="Analyzing" className="w-full h-full object-cover opacity-80" />
              )}

              <motion.div
                className="absolute top-0 left-0 w-full h-1 bg-green-400 shadow-[0_0_20px_rgba(74,222,128,0.8)] z-20"
                animate={{ top: ["0%", "100%", "0%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />

              <div className="absolute inset-0 flex flex-col items-center justify-center z-30">
                <Loader2 className="w-16 h-16 text-white animate-spin mb-4" />
                <p className="text-white font-bold text-lg">
                  {scanMode === "pest" ? t("scanner.analyzing_pest") : t("scanner.analyzing")}
                </p>
              </div>
            </motion.div>
          )}

          {status === "result" && analysisResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <ResultCard result={analysisResult} language={language} />

              <Button
                onClick={() => {
                  setStatus("idle");
                  setAnalysisResult(null);
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                variant="outline"
                className="w-full h-14 rounded-xl font-bold text-muted-foreground hover:text-foreground"
              >
                {t("scanner.scan_again")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ResultCard({ result, language }: { result: AnalyzeScanResponse; language: string }) {
  const { analysis } = result;
  const isHealthy = analysis.overallHealth === "healthy";
  const isPestScan = analysis.scanType === "pest";
  
  // For pest scans, use pest data; for disease scans, use disease data
  const primaryDisease = analysis.diseases[0];
  const primaryPest = analysis.pests?.[0];
  
  const displayName = isPestScan 
    ? (primaryPest?.pestName || (language === "bn" ? "কোন পোকা নেই" : "No pests detected"))
    : (primaryDisease?.name || (language === "bn" ? "সুস্থ ফসল" : "Healthy Crop"));
  
  const confidence = isPestScan ? primaryPest?.confidence : primaryDisease?.confidence;

  const Icon = isHealthy ? CheckCircle2 : analysis.overallHealth === "major_issues" ? XCircle : AlertTriangle;
  const colorClass = isHealthy ? "green" : analysis.overallHealth === "major_issues" ? "red" : "amber";

  return (
    <div className={`rounded-[2rem] p-6 bg-${colorClass}-50 border-2 border-${colorClass}-200 text-center space-y-6 shadow-sm`}>
      <div className="flex flex-col items-center">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 bg-${colorClass}-100 text-${colorClass}-600 shadow-inner`}>
          <Icon className="w-12 h-12" />
        </div>
        <h2 className={`text-3xl font-bold text-${colorClass}-800 mb-1`}>
          {displayName}
        </h2>
        
        {/* Scientific Name for Pests */}
        {isPestScan && primaryPest && (
          <p className="text-sm text-muted-foreground italic mb-2">
            {primaryPest.scientificName}
          </p>
        )}
        
        {/* Risk Level Badge */}
        {analysis.riskLevel && (
          <div className="mb-2">
            <RiskLevelBadge riskLevel={analysis.riskLevel} language={language} size="lg" />
          </div>
        )}
        
        {confidence && (
          <div className="inline-flex items-center gap-1 px-3 py-1 bg-white/60 rounded-full text-xs font-bold text-muted-foreground">
            <span>{language === "bn" ? "নিশ্চিততা" : "Confidence"}:</span>
            <span>{language === "bn" ? toBanglaDigits(confidence) : confidence}%</span>
          </div>
        )}
      </div>

      {analysis.recommendations.length > 0 && (
        <div className="bg-white rounded-xl p-4 text-left border border-black/5 shadow-sm space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            {language === "bn" ? "সুপারিশ" : "Recommendations"}
          </p>
          {analysis.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className={`mt-1 p-1 rounded-full bg-${colorClass}-100 text-${colorClass}-600`}>
                <ChevronRight className="w-3 h-3" />
              </div>
              <p className="text-sm font-medium text-foreground">{rec}</p>
            </div>
          ))}
        </div>
      )}

      {/* Grounding Sources */}
      {analysis.groundingSources && analysis.groundingSources.length > 0 && (
        <GroundingSources sources={analysis.groundingSources} language={language} />
      )}
    </div>
  );
}
