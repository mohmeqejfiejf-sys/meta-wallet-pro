import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  ArrowLeftRight, 
  FileCheck, 
  Wallet,
  Settings,
  Shield,
  Activity,
  Bell
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "لوحة التحكم", path: "/admin" },
  { icon: Users, label: "المستخدمين", path: "/admin/users" },
  { icon: ArrowLeftRight, label: "التحويلات", path: "/admin/transactions" },
  { icon: Wallet, label: "طلبات السحب", path: "/admin/withdrawals" },
  { icon: FileCheck, label: "طلبات التفعيل", path: "/admin/activations" },
  { icon: Activity, label: "سجل النشاط", path: "/admin/activity" },
  { icon: Bell, label: "الإشعارات", path: "/admin/notifications" },
  { icon: Settings, label: "الإعدادات", path: "/admin/settings" },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-card border-l border-border min-h-[calc(100vh-4rem)]">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-lg">لوحة الإدارة</h2>
            <p className="text-xs text-muted-foreground">إدارة النظام</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
