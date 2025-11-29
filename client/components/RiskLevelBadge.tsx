import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskLevelBadgeProps {
  riskLevel: 'high' | 'medium' | 'low';
  language: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function RiskLevelBadge({ 
  riskLevel, 
  language, 
  size = 'md',
  showIcon = true 
}: RiskLevelBadgeProps) {
  const labels = {
    high: language === 'bn' ? 'উচ্চ ঝুঁকি' : 'High Risk',
    medium: language === 'bn' ? 'মাধ্যম ঝুঁকি' : 'Medium Risk',
    low: language === 'bn' ? 'নিম্ন ঝুঁকি' : 'Low Risk',
  };

  const colors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200',
  };

  const icons = {
    high: AlertTriangle,
    medium: AlertCircle,
    low: CheckCircle,
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const Icon = icons[riskLevel];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold rounded-full border',
        colors[riskLevel],
        sizes[size]
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {labels[riskLevel]}
    </span>
  );
}
