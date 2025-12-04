import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  UserPlus, 
  Send, 
  Download, 
  Shield, 
  Bell, 
  RefreshCw,
  Zap
} from "lucide-react";

interface QuickActionsProps {
  onRefresh: () => void;
  onBroadcast?: () => void;
}

const QuickActions = ({ onRefresh, onBroadcast }: QuickActionsProps) => {
  const actions = [
    { icon: RefreshCw, label: "تحديث البيانات", onClick: onRefresh, variant: "outline" as const },
    { icon: Bell, label: "إرسال إشعار", onClick: onBroadcast, variant: "outline" as const },
    { icon: Download, label: "تصدير التقارير", onClick: () => {}, variant: "outline" as const },
    { icon: Shield, label: "فحص الأمان", onClick: () => {}, variant: "outline" as const },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          إجراءات سريعة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="h-auto py-4 flex-col gap-2"
              onClick={action.onClick}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
