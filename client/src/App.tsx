import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Docs from "@/pages/Docs";
import Dashboard from "@/pages/Dashboard";
import Databases from "@/pages/Databases";
import DatabaseDetail from "@/pages/DatabaseDetail";
import ApiKeys from "@/pages/ApiKeys";
import DataExplorer from "@/pages/DataExplorer";
import QueryLogs from "@/pages/QueryLogs";
import SettingsPage from "@/pages/SettingsPage";
import TableData from "@/pages/TableData";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <DashboardLayout>{children}</DashboardLayout>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
            <Route path="/docs" element={<ProtectedRoute><Docs /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/databases" element={<ProtectedRoute><Databases /></ProtectedRoute>} />
            <Route path="/databases/:id" element={<ProtectedRoute><DatabaseDetail /></ProtectedRoute>} />
            <Route path="/api-keys" element={<ProtectedRoute><ApiKeys /></ProtectedRoute>} />
            <Route path="/explorer" element={<ProtectedRoute><DataExplorer /></ProtectedRoute>} />
            <Route path="/logs" element={<ProtectedRoute><QueryLogs /></ProtectedRoute>} />
            <Route path="/tables/:id" element={<ProtectedRoute><TableData /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
