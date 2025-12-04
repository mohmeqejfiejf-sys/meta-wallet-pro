import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  UserPlus, 
  Shield, 
  Wallet,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface Activity {
  id: string;
  type: "transfer" | "deposit" | "withdrawal" | "signup" | "activation";
  description: string;
  amount?: number;
  created_at: string;
  user_email?: string;
}

interface RecentActivityFeedProps {
  activities: Activity[];
}

const activityIcons = {
  transfer: ArrowUpRight,
  deposit: ArrowDownRight,
  withdrawal: Wallet,
  signup: UserPlus,
  activation: Shield,
};

const activityColors = {
  transfer: "text-blue-500 bg-blue-500/10",
  deposit: "text-green-500 bg-green-500/10",
  withdrawal: "text-orange-500 bg-orange-500/10",
  signup: "text-purple-500 bg-purple-500/10",
  activation: "text-primary bg-primary/10",
};

const RecentActivityFeed = ({ activities }: RecentActivityFeedProps) => {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            آخر النشاطات
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {activities.length} نشاط
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-1 p-4 pt-0">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد نشاطات حديثة
              </div>
            ) : (
              activities.map((activity) => {
                const Icon = activityIcons[activity.type];
                const colorClass = activityColors[activity.type];
                
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {activity.description}
                      </p>
                      {activity.user_email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.user_email}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), { 
                          addSuffix: true,
                          locale: ar 
                        })}
                      </p>
                    </div>
                    {activity.amount !== undefined && (
                      <div className="text-left">
                        <span className={`font-bold ${activity.type === "withdrawal" ? "text-red-500" : "text-green-500"}`}>
                          {activity.type === "withdrawal" ? "-" : "+"}${activity.amount.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentActivityFeed;
