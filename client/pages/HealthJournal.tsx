import { useState, useEffect } from "react";
import { useLanguage } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Stethoscope, Clock, CheckCircle2, AlertTriangle, Calendar, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toBanglaDigits, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { HealthScanResponse } from "@shared/api";

export default function HealthJournal() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { farmerId } = useAuth();
  const [scans, setScans] = useState<HealthScanResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending">("all");

  useEffect(() => {
    if (farmerId) {
      loadHealthScans();
    }
  }, [farmerId]);

  const loadHealthScans = async () => {
    if (!farmerId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/health-scans?farmerId=${farmerId}`);
      if (response.ok) {
        const data = await response.json();
        setScans(data.scans || []);
      }
    } catch (error) {
      console.error("Failed to load health scans:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "স্ক্যান লোড করতে ব্যর্থ" : "Failed to load scans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOutcomeFeedback = async (scanId: string, outcome: "recovered" | "same" | "worse") => {
    try {
      const response = await fetch(`/api/health-scans/${scanId}/outcome`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome }),
      });

      if (!response.ok) throw new Error('Failed to update outcome');

      // Update local state immediately
      setScans(prev => prev.map(s => s._id === scanId ? { ...s, outcome } : s));

      const messages = {
        recovered: language === "bn" ? "আলহামদুলিল্লাহ! তথ্য সেভ করা হলো।" : "Great! Status updated.",
        same: language === "bn" ? "তথ্য সেভ করা হলো।" : "Status updated.",
        worse: language === "bn" ? "সতর্কতা! বিশেষজ্ঞের পরামর্শ নিন।" : "Warning! Please consult an expert."
      };

      toast({ title: messages[outcome] });
    } catch (error) {
      console.error("Failed to update outcome:", error);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "আপডেট করতে ব্যর্থ" : "Failed to update",
        variant: "destructive",
      });
    }
  };

  const filteredScans = scans.filter(s => {
    if (filter === "pending") {
      const isHealthy = s.diseaseLabel?.toLowerCase().includes('healthy') || 
                       s.diseaseLabel?.toLowerCase().includes('সুস্থ');
      return !s.outcome && !isHealthy;
    }
    return true;
  });

  return (
    <div className="pb-24 pt-4 px-2 space-y-6 min-h-screen animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full bg-muted/50 hover:bg-muted">
                <ArrowLeft className="w-5 h-5" />
            </Button>
        </Link>
        <div>
            <h1 className="text-2xl font-bold text-foreground">
                {language === "bn" ? "ফসলের স্বাস্থ্য খাতা" : "Crop Health Journal"}
            </h1>
            <p className="text-xs text-muted-foreground">
                {language === "bn" ? "আপনার সকল স্ক্যান এবং রিপোর্ট" : "All your scans and reports"}
            </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex p-1 bg-muted/50 rounded-xl">
        <button 
            onClick={() => setFilter("all")}
            className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all", 
                filter === "all" ? "bg-white shadow text-primary" : "text-muted-foreground"
            )}
        >
            {language === "bn" ? "সব" : "All"}
        </button>
        <button 
            onClick={() => setFilter("pending")}
            className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all", 
                filter === "pending" ? "bg-white shadow text-rose-600" : "text-muted-foreground"
            )}
        >
            {language === "bn" ? "অমীমাংসিত" : "Pending Action"}
        </button>
      </div>

      {/* Scan List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
            <p className="text-muted-foreground">{language === "bn" ? "লোড হচ্ছে..." : "Loading..."}</p>
          </div>
        ) : filteredScans.length === 0 ? (
            <div className="text-center py-20 opacity-50">
                <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>{language === "bn" ? "কোন তথ্য নেই" : "No records found"}</p>
            </div>
        ) : (
            filteredScans.map((scan) => (
                <JournalCard 
                    key={scan._id} 
                    scan={scan} 
                    language={language} 
                    onFeedback={handleOutcomeFeedback} 
                />
            ))
        )}
      </div>
    </div>
  );
}

function JournalCard({ scan, language, onFeedback }: { scan: HealthScanResponse, language: string, onFeedback: any }) {
    const isHealthy = scan.diseaseLabel?.toLowerCase().includes('healthy') || 
                     scan.diseaseLabel?.toLowerCase().includes('সুস্থ');
    const date = new Date(scan.capturedAt).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    
    // Status Logic
    const isPending = !scan.outcome && !isHealthy;
    const isRecovered = scan.outcome === "recovered";

    return (
        <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={cn(
                "bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden transition-all",
                isPending && "border-l-4 border-l-rose-500 shadow-md"
            )}
        >
            <div className="flex flex-wrap justify-between items-start mb-3 gap-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium bg-gray-50 px-2 py-1 rounded-md w-fit">
                    <Calendar className="w-3 h-3" />
                    {date}
                </div>
                {/* Status Badge */}
                {isHealthy ? (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {language === "bn" ? "সুস্থ" : "Healthy"}
                    </span>
                ) : isPending ? (
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> {language === "bn" ? "ব্যবস্থা নিন" : "Action Needed"}
                    </span>
                ) : (
                    <span className={cn("text-xs font-bold px-2 py-1 rounded-full capitalize flex items-center gap-1", 
                        isRecovered ? "text-green-600 bg-green-50" : "text-gray-600 bg-gray-50"
                    )}>
                        {isRecovered && <CheckCircle2 className="w-3 h-3"/>}
                        {scan.outcome}
                    </span>
                )}
            </div>

            <h3 className="text-lg font-bold text-foreground mb-1">{scan.diseaseLabel}</h3>
            
            {scan.confidence && (
                <p className="text-xs text-muted-foreground mb-2">
                    {language === "bn" ? "নিশ্চিততা: " : "Confidence: "}
                    {language === "bn" ? toBanglaDigits(scan.confidence) : scan.confidence}%
                </p>
            )}
            
            {scan.remedyText && (
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    <span className="font-semibold">{language === "bn" ? "পরামর্শ: " : "Remedy: "}</span>
                    {scan.remedyText}
                </p>
            )}

            {/* Action Buttons for Pending Items */}
            {isPending && (
                <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                    <p className="text-xs font-bold text-rose-700 mb-3 text-center uppercase tracking-wide">
                        {language === "bn" ? "বর্তমান অবস্থা কি?" : "Current Status?"}
                    </p>
                    {/* Responsive Grid: Stacks on mobile, Grid on larger screens */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <Button 
                            onClick={() => onFeedback(scan._id, "recovered")} 
                            variant="outline" 
                            size="sm" 
                            className="h-10 text-xs border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 w-full justify-center"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                            {language === 'bn' ? 'সুস্থ' : 'Cured'}
                        </Button>
                        <Button 
                            onClick={() => onFeedback(scan._id, "same")} 
                            variant="outline" 
                            size="sm" 
                            className="h-10 text-xs border-amber-200 text-amber-700 hover:bg-amber-100 hover:text-amber-800 w-full justify-center"
                        >
                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                            {language === 'bn' ? 'একই' : 'Same'}
                        </Button>
                        <Button 
                            onClick={() => onFeedback(scan._id, "worse")} 
                            variant="outline" 
                            size="sm" 
                            className="h-10 text-xs border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 w-full justify-center"
                        >
                            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                            {language === 'bn' ? 'খারাপ' : 'Worse'}
                        </Button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}