import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
}

const StatsCard = ({ title, value, icon: Icon, trend, variant = "default" }: StatsCardProps) => {
  const variantStyles = {
    default: "bg-card",
    primary: "bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20",
    success: "bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/20",
    warning: "bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/20",
    danger: "bg-gradient-to-br from-red-500/20 to-red-500/5 border-red-500/20",
  };

  const iconStyles = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/20 text-primary",
    success: "bg-green-500/20 text-green-500",
    warning: "bg-yellow-500/20 text-yellow-500",
    danger: "bg-red-500/20 text-red-500",
  };

  return (
    <Card className={cn("border transition-all duration-300 hover:shadow-lg hover:-translate-y-1", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <div className={cn(
                "text-sm font-medium flex items-center gap-1",
                trend.isPositive ? "text-green-500" : "text-red-500"
              )}>
                <span>{trend.isPositive ? "↑" : "↓"}</span>
                <span>{trend.value}%</span>
                <span className="text-muted-foreground">من الأمس</span>
              </div>
            )}
          </div>
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", iconStyles[variant])}>
            <Icon className="w-7 h-7" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
