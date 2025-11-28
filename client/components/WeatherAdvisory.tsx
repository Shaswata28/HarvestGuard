import { motion } from "framer-motion";
import { WeatherData, getWeatherAdvisory } from "@/utils/mockWeatherAPI";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeatherAdvisoryProps {
  weather: WeatherData;
  className?: string;
}

export default function WeatherAdvisory({
  weather,
  className,
}: WeatherAdvisoryProps) {
  const advisories = getWeatherAdvisory(weather);

  const getAdvisoryStyles = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-critical/10 border-critical text-critical";
      case "warning":
        return "bg-warning/10 border-warning text-warning";
      case "safe":
        return "bg-primary/10 border-primary text-primary";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getAdvisoryIcon = (level: string) => {
    switch (level) {
      case "critical":
        return <AlertCircle className="w-6 h-6" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6" />;
      case "safe":
        return <CheckCircle className="w-6 h-6" />;
      default:
        return <AlertCircle className="w-6 h-6" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      className={cn("space-y-4", className)}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {advisories.map((advisory, idx) => (
        <motion.div
          key={idx}
          className={cn(
            "rounded-lg border-2 p-4 space-y-2",
            getAdvisoryStyles(advisory.level)
          )}
          variants={itemVariants}
        >
          {/* Header with icon and title */}
          <div className="flex items-center gap-3">
            <div>{getAdvisoryIcon(advisory.level)}</div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              {advisory.emoji} {advisory.title}
            </h3>
          </div>

          {/* Message */}
          <p className="text-sm leading-relaxed">{advisory.message}</p>

          {/* Action suggestions */}
          <AdvisoryActions level={advisory.level} type={advisory.type} />
        </motion.div>
      ))}
    </motion.div>
  );
}

function AdvisoryActions({
  level,
  type,
}: {
  level: string;
  type: string;
}) {
  const getActions = () => {
    switch (type) {
      case "high_rain":
        return [
          "✓ তাত্ক্ষণিক কার্যক্রম: আজই ধান কাটুন",
          "✓ যদি কাটা না যায়, তাহলে প্লাস্টিক শীট দিয়ে ঢেকে রাখুন",
          "✓ নর্দমা/নালা পরিষ্কার রাখুন যাতে জল নিকাশ হয়",
        ];
      case "moderate_rain":
        return [
          "✓ পূর্বাভাস অনুযায়ী পরিকল্পনা করুন",
          "✓ ধান কাটার প্রস্তুতি নিন",
          "✓ কৃষি সেবা কেন্দ্রের সাথে যোগাযোগ করুন",
        ];
      case "high_temp":
        return [
          "✓ বিকেল ৪-৬ টায় সেচ দিন",
          "✓ গাছের গোড়ায় পানি দিন, পাতায় নয়",
          "✓ আগাছা দ্রুত অপসারণ করুন",
        ];
      case "high_humidity":
        return [
          "✓ ছত্রাক রোগের জন্য প্রস্তুত থাকুন",
          "✓ বায়ু চলাচল উন্নত করুন",
          "✓ প্���য়োজনে জৈব ছত্রাকনাশক ব্যবহার করুন",
        ];
      case "safe":
        return [
          "✓ স্বাভাবিক কৃষি কাজ চালিয়ে যান",
          "✓ নিয়মিত পর্যবেক্ষণ অব্যাহত রাখুন",
          "✓ আগামী দিনের পূর্বাভাস চেক করুন",
        ];
      default:
        return [];
    }
  };

  const actions = getActions();

  if (actions.length === 0) return null;

  return (
    <div className="space-y-1 pt-2 border-t border-current border-opacity-20">
      {actions.map((action, idx) => (
        <p key={idx} className="text-xs leading-relaxed">
          {action}
        </p>
      ))}
    </div>
  );
}
