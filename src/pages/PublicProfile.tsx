import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, ShieldCheck, User, Calendar, MapPin, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PublicProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  country: string | null;
  created_at: string | null;
}

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, bio, is_verified, country, created_at')
          .eq('username', username)
          .eq('is_public', true)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setProfile(data);
        }
      } catch (error) {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/profile/${searchQuery.trim()}`);
    }
  };

  if (!username) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">البحث عن مستخدم</h1>
              <p className="text-muted-foreground text-lg">
                ابحث عن أي مستخدم وتحقق من حالة حسابه
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-4 max-w-md mx-auto">
              <Input
                placeholder="أدخل اسم المستخدم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                بحث
              </Button>
            </form>

            <div className="grid md:grid-cols-3 gap-4 pt-8">
              <Card className="border-border/50">
                <CardContent className="pt-6 text-center">
                  <ShieldCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">التحقق من التوثيق</h3>
                  <p className="text-sm text-muted-foreground">
                    تأكد من أن الحساب موثق ومعتمد
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6 text-center">
                  <User className="w-12 h-12 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">معلومات الحساب</h3>
                  <p className="text-sm text-muted-foreground">
                    شاهد معلومات الحساب العامة
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardContent className="pt-6 text-center">
                  <Calendar className="w-12 h-12 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">تاريخ الانضمام</h3>
                  <p className="text-sm text-muted-foreground">
                    معرفة متى انضم المستخدم
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

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

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto">
              <User className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-bold">المستخدم غير موجود</h1>
            <p className="text-muted-foreground">
              لم نتمكن من العثور على حساب بهذا الاسم أو الحساب غير عام
            </p>
            <Button variant="outline" onClick={() => navigate("/profile")}>
              البحث عن مستخدم آخر
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-border/50 overflow-hidden">
            {/* Cover */}
            <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5" />
            
            {/* Profile Header */}
            <CardHeader className="relative pt-0">
              <div className="flex flex-col items-center -mt-16">
                <Avatar className="w-32 h-32 border-4 border-background">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-4xl bg-primary/10">
                    {profile.full_name?.charAt(0) || profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="mt-4 text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
                    {profile.is_verified && (
                      <ShieldCheck className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                  
                  <p className="text-muted-foreground">@{profile.username}</p>
                  
                  <div className="flex items-center justify-center gap-2">
                    {profile.is_verified ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        حساب موثق
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        غير موثق
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {profile.bio && (
                <div className="text-center">
                  <p className="text-muted-foreground">{profile.bio}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {profile.country && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border/50">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{profile.country}</span>
                  </div>
                )}
                
                {profile.created_at && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border/50">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      انضم في {new Date(profile.created_at).toLocaleDateString('ar')}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <span>ملف شخصي عام على Meta Wallet</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PublicProfile;