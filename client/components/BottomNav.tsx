import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "@/context/LangContext";
import { LayoutGrid, Sprout, ScanLine, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const location = useLocation();
  const { language } = useLanguage();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      path: "/dashboard",
      icon: LayoutGrid,
      label: language === "bn" ? "ড্যাশবোর্ড" : "Dashboard",
    },
    {
      path: "/add-crop",
      icon: Sprout,
      label: language === "bn" ? "ফসল" : "Add Crop",
    },
    {
      path: "/scanner",
      icon: ScanLine,
      label: language === "bn" ? "স্ক্যানার" : "Scanner",
    },
    {
      path: "/profile",
      icon: User,
      label: language === "bn" ? "প্রোফাইল" : "Profile",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border shadow-lg">
      <div className="container-mobile">
        <div className="flex items-center justify-around h-20">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors flex-1 h-full",
                isActive(path)
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium text-center">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
