import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value?: string;
  icon?: React.ReactNode;
  variant?: "default" | "warning" | "critical";
  className?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  variant = "default",
  className,
}: StatsCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "warning":
        return "bg-accent/10 border-accent text-accent-foreground";
      case "critical":
        return "bg-critical/10 border-critical text-critical-foreground";
      default:
        return "bg-primary/10 border-primary text-foreground";
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-6 space-y-3 transition-transform hover:scale-105",
        getVariantStyles(),
        className
      )}
    >
      {icon && <div className="text-3xl">{icon}</div>}
      <div>
        <p className="text-sm font-medium opacity-75">{title}</p>
        {value && <p className="text-2xl font-bold">{value}</p>}
      </div>
    </div>
  );
}
