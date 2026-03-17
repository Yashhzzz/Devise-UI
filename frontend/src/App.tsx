import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";

// Dashboard Imports
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { BentoRow } from "@/components/dashboard/BentoRow";
import { UsageTrendChart } from "@/components/dashboard/UsageTrendChart";
import { BudgetProgress } from "@/components/dashboard/BudgetProgress";
import { SubscriptionList } from "@/components/dashboard/SubscriptionList";
import { RecentDetectionsTable } from "@/components/dashboard/RecentDetectionsTable";
import { LiveFeedTab } from "@/components/dashboard/LiveFeedTab";
import { AnalyticsTab } from "@/components/dashboard/AnalyticsTab";
import { DevicesTab } from "@/components/dashboard/DevicesTab";
import { AlertsTab } from "@/components/dashboard/AlertsTab";
import { SubscriptionsTab } from "@/components/dashboard/SubscriptionsTab";
import { SettingsTab } from "@/components/dashboard/SettingsTab";
import { TeamTab } from "@/components/dashboard/TeamTab";

// Landing Page Imports
import { LandingPage } from "./pages/landing/LandingPage";
import { OversightPage } from "./pages/landing/OversightPage";
import { PulsePage } from "./pages/landing/PulsePage";
import { SpendPage } from "./pages/landing/SpendPage";
import { AboutPage } from "./pages/landing/AboutPage";
import { UseCasesPage } from "./pages/landing/UseCasesPage";
import { DemoPage } from "./pages/landing/DemoPage";
import NotFound from "./pages/landing/NotFound";

type Tab = "overview" | "live-feed" | "analytics" | "devices" | "alerts" | "subscriptions" | "settings" | "team";

const queryClient = new QueryClient();

function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div
        key={activeTab}
        className="animate-in fade-in duration-300 fill-mode-both"
      >
        {activeTab === "overview" && (
          <div className="flex flex-col gap-4">
            <KpiCards onNavigate={setActiveTab as (tab: string) => void} />
            <div className="flex gap-4">
              <BentoRow onNavigate={setActiveTab as (tab: string) => void} />
              <UsageTrendChart />
            </div>
            <div className="flex gap-4" style={{ alignItems: "stretch" }}>
              <div className="flex flex-col gap-4" style={{ flex: "0 0 auto", width: 424 }}>
                <BudgetProgress />
                <SubscriptionList onNavigate={setActiveTab as (tab: string) => void} />
              </div>
              <RecentDetectionsTable />
            </div>
          </div>
        )}
        {activeTab === "live-feed"  && <LiveFeedTab />}
        {activeTab === "analytics"  && <AnalyticsTab />}
        {activeTab === "devices"    && <DevicesTab />}
        {activeTab === "team"       && <TeamTab />}
        {activeTab === "alerts"     && <AlertsTab />}
        {activeTab === "subscriptions" && <SubscriptionsTab />}
        {activeTab === "settings"   && <SettingsTab />}
      </div>
    </DashboardLayout>
  );
}

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      {/* Landing Page Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/product/oversight" element={<OversightPage />} />
      <Route path="/product/pulse" element={<PulsePage />} />
      <Route path="/product/spend" element={<SpendPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/use-cases" element={<UseCasesPage />} />
      <Route path="/demo" element={<DemoPage />} />
      
      {/* Auth Routes */}
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route 
        path="/signup" 
        element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />} 
      />
      
      {/* Dashboard Routes (Protected) */}
      <Route 
        path="/dashboard/*" 
        element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
      />
      
      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
