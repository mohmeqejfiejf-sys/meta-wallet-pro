import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import { User } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, ArrowUpRight, ArrowDownLeft, Clock, ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Wallet {
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  status: string;
  description: string;
  created_at: string;
  from_user_id: string | null;
  to_user_id: string | null;
}

interface Profile {
  email: string;
  full_name: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profiles, setProfiles] = useState<{ [key: string]: Profile }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      fetchWallet(session.user.id);
      fetchTransactions(session.user.id);
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

  const fetchWallet = async (userId: string) => {
    const { data, error } = await supabase
      .from('wallets')
      .select('balance, currency')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching wallet:', error);
    } else {
      setWallet(data);
    }
    setLoading(false);
  };

  const fetchTransactions = async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      setTransactions(data || []);
      
      // Fetch profiles for all user IDs in transactions
      const userIds = new Set<string>();
      data?.forEach(t => {
        if (t.from_user_id) userIds.add(t.from_user_id);
        if (t.to_user_id) userIds.add(t.to_user_id);
      });
      
      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', Array.from(userIds));
        
        if (profilesData) {
          const profilesMap: { [key: string]: Profile } = {};
          profilesData.forEach(p => {
            profilesMap[p.id] = { email: p.email, full_name: p.full_name };
          });
          setProfiles(profilesMap);
        }
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: string, isOutgoing: boolean) => {
    if (type === 'deposit') return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
    if (type === 'withdrawal') return <ArrowUpRight className="w-4 h-4 text-red-500" />;
    return isOutgoing ? <ArrowUpRight className="w-4 h-4 text-orange-500" /> : <ArrowDownLeft className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="col-span-full lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-2xl">Wallet Balance</CardTitle>
              <CardDescription>Your current available balance</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-16 w-48" />
              ) : (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-8 h-8 text-primary" />
                  <span className="text-5xl font-bold">
                    {wallet?.balance.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-2xl text-muted-foreground">{wallet?.currency}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => navigate("/transfer")}
                className="w-full p-3 text-left rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-primary" />
                  <span className="font-medium">Send Money</span>
                </div>
              </button>
              <button
                onClick={() => navigate("/deposit")}
                className="w-full p-3 text-left rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ArrowDownLeft className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Deposit Funds</span>
                </div>
              </button>
              <button
                onClick={() => navigate("/withdraw")}
                className="w-full p-3 text-left rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-red-500" />
                  <span className="font-medium">Withdraw</span>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest transaction history</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const isOutgoing = tx.from_user_id === user?.id;
                  const otherUserId = isOutgoing ? tx.to_user_id : tx.from_user_id;
                  const otherUser = otherUserId ? profiles[otherUserId] : null;
                  
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(tx.transaction_type, isOutgoing)}
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {otherUser ? `${otherUser.full_name || otherUser.email}` : 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-semibold ${isOutgoing ? 'text-red-500' : 'text-green-500'}`}>
                          {isOutgoing ? '-' : '+'} ${tx.amount.toFixed(2)}
                        </p>
                        <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;