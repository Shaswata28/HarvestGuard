import React from "react";
import Navbar from "./Navbar";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useLanguage } from "@/context/LangContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const isOnline = useOnlineStatus();
  const { t } = useLanguage();
  const { toast } = useToast();
  const lastOnlineStatus = useRef<boolean | null>(null);

  // Show toast when offline/online status changes
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
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-critical text-critical-foreground px-4 py-2 text-center text-sm font-medium">
          {t("offline.offline_mode")}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full">
        <div className="container-mobile py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/20 py-4 mt-8">
        <div className="container-mobile text-center text-sm text-muted-foreground">
          <p>© 2025 HarvestGuard. {t("offline.offline_mode")} ✓</p>
        </div>
      </footer>
    </div>
  );
}
