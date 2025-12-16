import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User as UserIcon, Globe, Camera, MapPin, Phone, Edit } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/PageTransition";

const EditProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    bio: "",
    country: "",
    phone: "",
    avatar_url: "",
    is_public: false,
  });

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        setFormData({
          username: profile.username || "",
          full_name: profile.full_name || "",
          bio: profile.bio || "",
          country: profile.country || "",
          phone: profile.phone || "",
          avatar_url: profile.avatar_url || "",
          is_public: profile.is_public || false,
        });
      }
      
      setLoading(false);
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (formData.username) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', formData.username)
          .neq('id', user?.id)
          .single();
        
        if (existing) {
          toast({
            title: "Error",
            description: "Username is already taken",
            variant: "destructive",
          });
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username || null,
          full_name: formData.full_name || null,
          bio: formData.bio || null,
          country: formData.country || null,
          phone: formData.phone || null,
          avatar_url: formData.avatar_url || null,
          is_public: formData.is_public,
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Saved",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen animated-bg noise-overlay relative">
        <Navbar />
        <main className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg noise-overlay relative">
      {/* Background Orbs */}
      <div className="orb w-[400px] h-[400px] bg-primary/10 top-20 -right-48 fixed" />
      <div className="orb w-[300px] h-[300px] bg-secondary/10 bottom-20 -left-32 fixed" style={{ animationDelay: '-3s' }} />
      
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        <FadeIn>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <Edit className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold">Edit Profile</h1>
              <p className="text-muted-foreground">Customize your public profile</p>
            </div>
          </div>
        </FadeIn>
        
        <form onSubmit={handleSave}>
          <StaggerContainer className="space-y-6">
            {/* Avatar Section */}
            <StaggerItem>
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <Camera className="w-5 h-5 text-primary" />
                    Profile Picture
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-6">
                  <Avatar className="w-24 h-24 ring-2 ring-primary/20">
                    <AvatarImage src={formData.avatar_url || undefined} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
                      {formData.full_name?.charAt(0) || user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="avatar_url">Image URL</Label>
                    <Input
                      id="avatar_url"
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Basic Info */}
            <StaggerItem>
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <UserIcon className="w-5 h-5 text-primary" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Information displayed on your public profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                      <Input
                        id="username"
                        placeholder="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                        className="pl-8"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Others can find you with @{formData.username || 'username'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      placeholder="Enter your full name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      placeholder="Write a short bio about yourself..."
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      maxLength={200}
                      className="resize-none bg-input/50 border-border/50 rounded-xl"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.bio.length}/200
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="country"
                          placeholder="Your country"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          className="pl-11"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1234567890"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="pl-11"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>

            {/* Privacy Settings */}
            <StaggerItem>
              <Card className="glass-card border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <Globe className="w-5 h-5 text-primary" />
                    Privacy Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                    <div className="space-y-1">
                      <p className="font-medium">Public Profile</p>
                      <p className="text-sm text-muted-foreground">
                        Allow others to find and view your profile
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_public}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                    />
                  </div>
                  
                  {formData.is_public && formData.username && (
                    <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <p className="text-sm">
                        Your profile URL: 
                        <span className="font-mono text-primary ml-2">
                          {window.location.origin}/profile/{formData.username}
                        </span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </StaggerItem>

            <StaggerItem>
              <div className="flex gap-4">
                <Button type="submit" className="flex-1 h-12 btn-glow rounded-xl font-semibold" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/settings")} className="rounded-xl">
                  Cancel
                </Button>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </form>
      </main>
    </div>
  );
};

export default EditProfile;
