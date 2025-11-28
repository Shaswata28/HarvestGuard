import React from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LangContext";
import { Button } from "@/components/ui/button";
import { Globe, Leaf, LogIn } from "lucide-react";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "bn" ? "en" : "bn");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-foreground flex flex-col font-sans relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 animate-float pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container-mobile">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Leaf */}
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Leaf className="w-6 h-6 fill-current" />
              </div>
              <span className="hidden sm:inline font-bold">HarvestGuard</span>
            </Link>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Language Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleLanguage}
                className="flex items-center gap-1 rounded-full px-3 text-muted-foreground hover:text-primary"
                aria-label="Toggle language"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{language === "bn" ? "EN" : "বাংলা"}</span>
              </Button>

              {/* Login Button */}
              <Link to="/login">
                <Button 
                  size="sm" 
                  className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 h-9 shadow-sm"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  {t("hero.login")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full relative z-10">
        <div className="container-mobile">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white/60 py-6 mt-auto relative z-10">
        <div className="container-mobile text-center">
          <p className="text-sm text-muted-foreground font-medium">© 2025 HarvestGuard</p>
          <p className="text-xs text-muted-foreground mt-1 opacity-70">
            {language === "bn" ? "কৃষকের পাশে সর্বক্ষণ" : "Always beside the farmer"}
          </p>
        </div>
      </footer>
    </div>
  );
}