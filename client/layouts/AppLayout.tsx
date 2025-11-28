import React from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useLanguage } from "@/context/LangContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { useLocation } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();
  const { toast } = useToast();
  const lastOnlineStatus = useRef<boolean | null>(null);
  
  // Check if current route is Admin Dashboard
  const location = useLocation();
  const isAdminDashboard = location.pathname === "/admin-dashboard";

  useEffect(() => {
    if (lastOnlineStatus.current === null) {
      lastOnlineStatus.current = isOnline;
      return;
    }

    if (isOnline && !lastOnlineStatus.current) {
      toast({
        title: t("offline.online_restored"),
        duration: 3000,
      });
    } else if (!isOnline && lastOnlineStatus.current) {
      toast({
        title: t("offline.saved_offline"),
        variant: "destructive",
        duration: 3000,
      });
    }

    lastOnlineStatus.current = isOnline;
  }, [isOnline, toast, t]);

  return (
    // Updated Background: #FDFBF7 and added decorative blob
    <div className={`min-h-screen bg-[#FDFBF7] text-foreground flex flex-col relative overflow-hidden font-sans ${isAdminDashboard ? "" : "pb-24"}`}>
      
      {/* Decorative Blob (Soulful Background) */}
      <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 animate-float pointer-events-none" />

      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-critical text-critical-foreground px-4 py-2 text-center text-sm font-medium z-50">
          {t("offline.offline_mode")}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full relative z-10">
        <div className="container-mobile py-6">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Hide for Admin */}
      {!isAdminDashboard && <BottomNav />}
    </div>
  );
}