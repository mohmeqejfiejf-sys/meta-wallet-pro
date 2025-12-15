import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type Language = "ar" | "en" | null;

interface Message {
  id: string;
  message: string;
  is_from_admin: boolean;
  is_read: boolean;
  created_at: string;
}

const translations = {
  ar: {
    title: "الدعم الفني",
    placeholder: "اكتب رسالتك...",
    send: "إرسال",
    noMessages: "لا توجد رسائل بعد",
    selectLanguage: "اختر لغة المحادثة",
    arabic: "العربية",
    english: "English",
    welcome: "مرحباً! كيف يمكننا مساعدتك؟",
  },
  en: {
    title: "Support",
    placeholder: "Type your message...",
    send: "Send",
    noMessages: "No messages yet",
    selectLanguage: "Select chat language",
    arabic: "العربية",
    english: "English",
    welcome: "Hello! How can we help you?",
  },
};

export function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Load saved language preference
        const savedLang = localStorage.getItem(`support_lang_${user.id}`);
        if (savedLang === "ar" || savedLang === "en") {
          setLanguage(savedLang);
        }
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (!userId || !language) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
        const unread = data.filter(m => m.is_from_admin && !m.is_read).length;
        setUnreadCount(unread);
      }
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel("support_messages_user")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "support_messages",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [...prev, payload.new as Message]);
            if ((payload.new as Message).is_from_admin) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const selectLanguage = (lang: Language) => {
    if (lang && userId) {
      setLanguage(lang);
      localStorage.setItem(`support_lang_${userId}`, lang);
    }
  };

  const markAsRead = async () => {
    if (!userId) return;
    await supabase
      .from("support_messages")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_from_admin", true)
      .eq("is_read", false);
    setUnreadCount(0);
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (language) {
      markAsRead();
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || !language) return;

    setLoading(true);
    const { error } = await supabase.from("support_messages").insert({
      user_id: userId,
      message: newMessage.trim(),
      is_from_admin: false,
      language: language,
    });

    if (error) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "فشل إرسال الرسالة" : "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }
    setLoading(false);
  };

  const t = language ? translations[language] : translations.ar;

  if (!userId) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-lg transition-all hover:scale-105"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <h3 className="font-semibold">{t.title}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary/80"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Language Selection */}
          {!language ? (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Globe className="h-5 w-5" />
                <span>{translations.ar.selectLanguage}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => selectLanguage("ar")}
                  variant="outline"
                  className="h-16 text-lg"
                >
                  🇸🇦 العربية
                </Button>
                <Button
                  onClick={() => selectLanguage("en")}
                  variant="outline"
                  className="h-16 text-lg"
                >
                  🇺🇸 English
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="h-80 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>{t.welcome}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.is_from_admin ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 ${
                            msg.is_from_admin
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary text-primary-foreground"
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <span className="text-xs opacity-70">
                            {new Date(msg.created_at).toLocaleTimeString(
                              language === "ar" ? "ar-SA" : "en-US",
                              { hour: "2-digit", minute: "2-digit" }
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t border-border flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t.placeholder}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  dir={language === "ar" ? "rtl" : "ltr"}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={loading} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
