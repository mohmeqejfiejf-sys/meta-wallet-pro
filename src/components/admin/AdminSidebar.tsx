import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  ArrowLeftRight,
  Wallet,
  ShieldCheck,
  Activity,
  Bell,
  Settings,
  FileText,
  LogOut,
  ChevronLeft,
  BarChart3
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "لوحة التحكم", path: "/admin" },
  { icon: Users, label: "المستخدمين", path: "/admin/users" },
  { icon: ArrowLeftRight, label: "التحويلات", path: "/admin/transactions" },
  { icon: Wallet, label: "طلبات السحب", path: "/admin/withdrawals" },
  { icon: ShieldCheck, label: "طلبات التفعيل", path: "/admin/activations" },
  { icon: ShieldCheck, label: "التوثيق", path: "/admin/verification" },
  { icon: BarChart3, label: "التقارير", path: "/admin/reports" },
  { icon: Activity, label: "النشاط", path: "/admin/activity" },
  { icon: FileText, label: "السجلات", path: "/admin/logs" },
  { icon: Bell, label: "الإشعارات", path: "/admin/notifications" },
  { icon: Settings, label: "الإعدادات", path: "/admin/settings" },
];

const AdminSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      "sticky top-0 h-screen border-l border-border bg-card transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!collapsed && <h2 className="font-bold text-lg">لوحة الإدارة</h2>}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(collapsed && "mx-auto")}
          >
            <ChevronLeft className={cn(
              "w-4 h-4 transition-transform",
              collapsed && "rotate-180"
            )} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-border">
          <Link
            to="/dashboard"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              collapsed && "justify-center"
            )}
            title={collapsed ? "العودة للوحة المستخدم" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm">العودة للوحة المستخدم</span>}
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
