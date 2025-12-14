import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ShieldCheck, ShieldX, Search, CheckCircle, XCircle, User } from "lucide-react";

interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_public: boolean;
  country: string | null;
  created_at: string | null;
}

const AdminVerification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError || !roleData) {
        toast({
          title: "غير مصرح",
          description: "ليس لديك صلاحية للوصول لهذه الصفحة",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsAdmin(true);
      await fetchProfiles();
      setIsLoading(false);
    };

    checkAdminAndFetch();
  }, [navigate, toast]);

  const toggleVerification = async (profileId: string, currentStatus: boolean) => {
    setProcessing(profileId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus })
        .eq('id', profileId);

      if (error) throw error;

      // Create notification for user
      await supabase
        .from('system_notifications')
        .insert({
          user_id: profileId,
          title: !currentStatus ? 'تم توثيق حسابك' : 'تم إلغاء توثيق حسابك',
          message: !currentStatus 
            ? 'مبارك! تم توثيق حسابك بنجاح وأصبح يحمل علامة التوثيق الرسمية.'
            : 'تم إلغاء توثيق حسابك. يرجى التواصل مع الدعم لمزيد من المعلومات.',
          type: !currentStatus ? 'success' : 'warning',
        });

      toast({
        title: "تم التحديث",
        description: !currentStatus ? "تم توثيق الحساب بنجاح" : "تم إلغاء التوثيق",
      });

      await fetchProfiles();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const filteredProfiles = profiles.filter(profile => 
    profile.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const verifiedCount = profiles.filter(p => p.is_verified).length;
  const publicCount = profiles.filter(p => p.is_public).length;

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
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <ShieldCheck className="w-8 h-8" />
                  إدارة التوثيق
                </h1>
                <p className="text-muted-foreground mt-1">توثيق وإدارة حسابات المستخدمين</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">إجمالي المستخدمين</p>
                      <p className="text-3xl font-bold">{profiles.length}</p>
                    </div>
                    <User className="w-10 h-10 text-primary/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">حسابات موثقة</p>
                      <p className="text-3xl font-bold text-green-500">{verifiedCount}</p>
                    </div>
                    <ShieldCheck className="w-10 h-10 text-green-500/50" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">ملفات عامة</p>
                      <p className="text-3xl font-bold">{publicCount}</p>
                    </div>
                    <User className="w-10 h-10 text-primary/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>البحث عن مستخدم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث بالبريد أو الاسم أو اسم المستخدم..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>قائمة المستخدمين</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>المستخدم</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>اسم المستخدم</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>ملف عام</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={profile.avatar_url || undefined} />
                              <AvatarFallback>
                                {profile.full_name?.charAt(0) || profile.email.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{profile.full_name || 'بدون اسم'}</p>
                              {profile.country && (
                                <p className="text-xs text-muted-foreground">{profile.country}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{profile.email}</TableCell>
                        <TableCell>
                          {profile.username ? (
                            <span className="font-mono">@{profile.username}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {profile.is_verified ? (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              موثق
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <ShieldX className="w-3 h-3 mr-1" />
                              غير موثق
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {profile.is_public ? (
                            <Badge variant="outline">عام</Badge>
                          ) : (
                            <Badge variant="secondary">خاص</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={profile.is_verified ? "destructive" : "default"}
                            onClick={() => toggleVerification(profile.id, profile.is_verified)}
                            disabled={processing === profile.id}
                          >
                            {processing === profile.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : profile.is_verified ? (
                              <>
                                <XCircle className="w-4 h-4 ml-1" />
                                إلغاء التوثيق
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 ml-1" />
                                توثيق
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredProfiles.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد نتائج
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminVerification;