import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BadgeCardProps {
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedDate?: string;
  variant?: "gold" | "silver" | "bronze";
  className?: string;
}

export default function BadgeCard({
  name,
  icon,
  description,
  earned,
  earnedDate,
  variant = "gold",
  className,
}: BadgeCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "silver":
        return "bg-slate-100 border-slate-300 text-slate-700";
      case "bronze":
        return "bg-amber-50 border-amber-200 text-amber-700";
      default:
        return "bg-primary/10 border-primary text-primary";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
    hover: {
      scale: 1.05,
      transition: { duration: 0.3 },
    },
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
      },
    },
  };

  return (
    <motion.div
      className={cn(
        "rounded-lg border-2 p-4 space-y-3 transition-all",
        getVariantStyles(),
        earned ? "shadow-md" : "opacity-50",
        className
      )}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover={earned ? "hover" : undefined}
    >
      {/* Icon */}
      <div className="relative">
        <motion.div
          className="text-4xl"
          animate={earned ? "pulse" : {}}
          variants={pulseVariants}
        >
          {icon}
        </motion.div>
        {earned && (
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            ✓
          </div>
        )}
      </div>

      {/* Badge Name */}
      <div>
        <h3 className="font-bold text-lg">{name}</h3>
        <p className="text-xs opacity-75">{description}</p>
      </div>

      {/* Earned Date */}
      {earned && earnedDate && (
        <p className="text-xs font-medium">
          অর্জিত: {new Date(earnedDate).toLocaleDateString("bn-BD")}
        </p>
      )}

      {/* Lock Status */}
      {!earned && (
        <p className="text-xs font-medium opacity-60">🔒 আনলক করা হয়নি</p>
      )}
    </motion.div>
  );
}

// Badge definitions
export const BADGE_DEFINITIONS = [
  {
    id: "rain_warrior",
    name: "বৃষ্টি যোদ্ধা",
    icon: "⛈️",
    description: "বৃষ্টির আগে ফসল রক্ষা করেছেন",
    variant: "gold" as const,
  },
  {
    id: "crop_protector",
    name: "ফসল রক্ষক",
    icon: "🛡️",
    description: "৫টি ফসল এন্ট্রি সম্পন্ন করেছেন",
    variant: "gold" as const,
  },
  {
    id: "storage_expert",
    name: "সংরক্ষণ বিশেষজ্ঞ",
    icon: "📦",
    description: "সঠিক সংরক্ষণ স্থান নির্বাচন করেছেন",
    variant: "silver" as const,
  },
  {
    id: "harvest_master",
    name: "ফসল কাটার মাস্টার",
    icon: "🌾",
    description: "১০টি সফল ফসল কাটা হয়েছে",
    variant: "bronze" as const,
  },
];
