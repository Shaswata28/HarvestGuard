import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LangContext";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "bn" ? "en" : "bn");
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b border-border shadow-sm">
      <div className="container-mobile">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Name */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl text-primary hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
              HG
            </div>
            <span className="hidden sm:inline">{t("appName")}</span>
          </Link>

          {/* Navigation Links - Hidden on mobile, visible on desktop */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" label={t("home")} />
            <NavLink to="/dashboard" label={t("nav_dashboard")} />
            <NavLink to="/weather" label={language === "bn" ? "আবহাওয়া" : "Weather"} />
            <NavLink to="/profile" label={t("profile")} />
            <NavLink to="/resources" label={t("resources")} />
          </div>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2"
            aria-label={t("language")}
          >
            <Globe className="w-5 h-5" />
            <span className="text-sm font-medium">{language === "bn" ? "EN" : "বাংলা"}</span>
          </Button>
        </div>

        {/* Mobile Navigation - Visible on mobile only */}
        <div className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
          <NavLink to="/" label={t("home")} mobile />
          <NavLink to="/dashboard" label={t("dashboard")} mobile />
          <NavLink to="/weather" label={language === "bn" ? "আবহাওয়া" : "Weather"} mobile />
          <NavLink to="/profile" label={t("profile")} mobile />
          <NavLink to="/resources" label={t("resources")} mobile />
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  to,
  label,
  mobile = false,
}: {
  to: string;
  label: string;
  mobile?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "font-medium transition-colors hover:text-primary",
        mobile
          ? "px-3 py-2 text-sm whitespace-nowrap"
          : "px-4 py-2 rounded-md text-sm hover:bg-accent"
      )}
    >
      {label}
    </Link>
  );
}
