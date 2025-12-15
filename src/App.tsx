import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import Transfer from "./pages/Transfer";
import AdminUsers from "./pages/AdminUsers";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTransactions from "./pages/AdminTransactions";
import AdminActivity from "./pages/AdminActivity";
import AdminNotifications from "./pages/AdminNotifications";
import AdminSettings from "./pages/AdminSettings";
import AdminReports from "./pages/AdminReports";
import AdminVerification from "./pages/AdminVerification";
import AdminLogs from "./pages/AdminLogs";
import AdminSupport from "./pages/AdminSupport";
import Deposit from "./pages/Deposit";
import Withdraw from "./pages/Withdraw";
import WithdrawalRequests from "./pages/WithdrawalRequests";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminActivations from "./pages/AdminActivations";
import Settings from "./pages/Settings";
import EditProfile from "./pages/EditProfile";
import PublicProfile from "./pages/PublicProfile";
import NotFound from "./pages/NotFound";
import { SupportChat } from "./components/SupportChat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transfer" element={<Transfer />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/withdrawal-requests" element={<WithdrawalRequests />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/profile" element={<PublicProfile />} />
          <Route path="/profile/:username" element={<PublicProfile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/transactions" element={<AdminTransactions />} />
          <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
          <Route path="/admin/activations" element={<AdminActivations />} />
          <Route path="/admin/verification" element={<AdminVerification />} />
          <Route path="/admin/support" element={<AdminSupport />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/logs" element={<AdminLogs />} />
          <Route path="/admin/activity" element={<AdminActivity />} />
          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <SupportChat />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
