import { useState, useEffect, useRef } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageCircle, Search, User, Globe } from "lucide-react";

interface UserConversation {
  user_id: string;
  email: string;
  full_name: string | null;
  language: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: string;
  message: string;
  is_from_admin: boolean;
  is_read: boolean;
  created_at: string;
}

export default function AdminSupport() {
  const [conversations, setConversations] = useState<UserConversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminId, setAdminId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setAdminId(user.id);
    };
    getAdmin();
  }, []);

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel("admin_support")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_messages" },
        () => {
          fetchConversations();
          if (selectedUser) {
            fetchMessages(selectedUser.user_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser]);

  const fetchConversations = async () => {
    setLoading(true);
    
    // Get all unique users with messages
    const { data: messagesData, error } = await supabase
      .from("support_messages")
      .select("user_id, message, created_at, is_from_admin, is_read, language")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      setLoading(false);
      return;
    }

    // Group by user
    const userMap = new Map<string, any>();
    messagesData?.forEach((msg) => {
      if (!userMap.has(msg.user_id)) {
        userMap.set(msg.user_id, {
          user_id: msg.user_id,
          last_message: msg.message,
          last_message_time: msg.created_at,
          language: msg.language || "ar",
          unread_count: 0,
        });
      }
      if (!msg.is_from_admin && !msg.is_read) {
        const user = userMap.get(msg.user_id);
        user.unread_count += 1;
      }
    });

    // Get user profiles
    const userIds = Array.from(userMap.keys());
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      profiles?.forEach((profile) => {
        const user = userMap.get(profile.id);
        if (user) {
          user.email = profile.email;
          user.full_name = profile.full_name;
        }
      });
    }

    setConversations(Array.from(userMap.values()));
    setLoading(false);
  };

  const fetchMessages = async (userId: string) => {
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      
      // Mark as read
      await supabase
        .from("support_messages")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_from_admin", false);
    }
  };

  const selectUser = (user: UserConversation) => {
    setSelectedUser(user);
    fetchMessages(user.user_id);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !adminId) return;

    const { error } = await supabase.from("support_messages").insert({
      user_id: selectedUser.user_id,
      admin_id: adminId,
      message: newMessage.trim(),
      is_from_admin: true,
      language: selectedUser.language,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
      fetchMessages(selectedUser.user_id);
    }
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageCircle className="h-8 w-8" />
              Support Messages
              {totalUnread > 0 && (
                <Badge variant="destructive">{totalUnread} unread</Badge>
              )}
            </h1>
            <p className="text-muted-foreground">Manage customer support conversations</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Conversations</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-340px)]">
                  {loading ? (
                    <div className="p-4 text-center text-muted-foreground">Loading...</div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">No conversations</div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {filteredConversations.map((conv) => (
                        <button
                          key={conv.user_id}
                          onClick={() => selectUser(conv)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedUser?.user_id === conv.user_id
                              ? "bg-primary/10 border border-primary/20"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="bg-muted rounded-full p-2">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-sm truncate">
                                  {conv.full_name || conv.email}
                                </p>
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {conv.last_message}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-xs text-muted-foreground">
                                {conv.language === "ar" ? "🇸🇦" : "🇺🇸"}
                              </span>
                              {conv.unread_count > 0 && (
                                <Badge variant="destructive" className="text-xs px-1.5">
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Window */}
            <Card className="lg:col-span-2 flex flex-col">
              {selectedUser ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 rounded-full p-2">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {selectedUser.full_name || "User"}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {selectedUser.language === "ar" ? "Arabic" : "English"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 flex flex-col">
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                      <div className="space-y-3">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.is_from_admin ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                msg.is_from_admin
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                              <span className="text-xs opacity-70">
                                {new Date(msg.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="p-4 border-t flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your reply..."
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage}>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </main>
      </div>
  );
}
