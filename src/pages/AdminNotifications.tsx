import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { 
  Loader2, 
  Bell,
  Send,
  Users,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminNotifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("info");
  const [targetAudience, setTargetAudience] = useState("all");

  const [recentNotifications] = useState([
    { id: 1, title: "تحديث النظام", message: "تم تحديث النظام بنجاح", type: "info", sentAt: "منذ ساعة", recipients: 150 },
    { id: 2, title: "صيانة مجدولة", message: "سيتم إجراء صيانة مجدولة غداً", type: "warning", sentAt: "منذ يوم", recipients: 150 },
    { id: 3, title: "عرض خاص", message: "احصل على خصم 10% على جميع التحويلات", type: "success", sentAt: "منذ 3 أيام", recipients: 150 },
  ]);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحية للوصول لهذه الصفحة",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      setIsLoading(false);
    };

    checkAdmin();
  }, [navigate, toast]);

  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationMessage) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    // Simulate sending notification
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "تم الإرسال",
      description: "تم إرسال الإشعار بنجاح لجميع المستخدمين",
    });
    
    setNotificationTitle("");
    setNotificationMessage("");
    setNotificationType("info");
    setIsSending(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      info: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      success: "bg-green-500/10 text-green-500 border-green-500/20",
    };
    const labels: Record<string, string> = {
      info: "معلومات",
      warning: "تحذير",
      success: "نجاح",
    };
    return (
      <Badge variant="outline" className={styles[type]}>
        {getTypeIcon(type)}
        <span className="mr-1">{labels[type]}</span>
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </main>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex">
        <AdminSidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">الإشعارات</h1>
                <p className="text-muted-foreground">إرسال إشعارات للمستخدمين</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Send Notification */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-primary" />
                    إرسال إشعار جديد
                  </CardTitle>
                  <CardDescription>
                    أرسل إشعار لجميع المستخدمين أو مجموعة محددة
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">العنوان</label>
                    <Input
                      placeholder="عنوان الإشعار..."
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">الرسالة</label>
                    <Textarea
                      placeholder="اكتب رسالة الإشعار هنا..."
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">نوع الإشعار</label>
                      <Select value={notificationType} onValueChange={setNotificationType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">معلومات</SelectItem>
                          <SelectItem value="warning">تحذير</SelectItem>
                          <SelectItem value="success">نجاح</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">الفئة المستهدفة</label>
                      <Select value={targetAudience} onValueChange={setTargetAudience}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">جميع المستخدمين</SelectItem>
                          <SelectItem value="active">المستخدمين النشطين</SelectItem>
                          <SelectItem value="new">المستخدمين الجدد</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleSendNotification}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 ml-2" />
                        إرسال الإشعار
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    الإشعارات الأخيرة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentNotifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className="p-4 rounded-xl bg-muted/50 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium">{notification.title}</h4>
                          {getTypeBadge(notification.type)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{notification.sentAt}</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {notification.recipients} مستلم
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminNotifications;
