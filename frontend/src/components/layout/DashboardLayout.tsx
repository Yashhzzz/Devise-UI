import { AppSidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

type Tab = "overview" | "live-feed" | "analytics" | "devices" | "alerts" | "subscriptions" | "settings" | "team" | "firewall" | "data-risk";

interface DashboardShellProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  children?: React.ReactNode;
}

export function DashboardLayout({ activeTab, onTabChange, children }: DashboardShellProps) {
  return (
    /* Outer page — gray background */
    <div
      className="min-h-screen w-full flex items-stretch"
      style={{ backgroundColor: "#F0F2F5", padding: 24 }}
    >
      {/* White card — the entire app container */}
      <div
        className="flex flex-1 overflow-hidden"
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 24,
          boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
          minHeight: "calc(100vh - 48px)",
        }}
      >
        {/* Zone 1 — Left Icon Sidebar */}
        <AppSidebar activeTab={activeTab} onTabChange={onTabChange} />

        {/* Right column: Zone 2 (TopBar) + Zone 3 (Main content) */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Zone 2 — Top Navigation Bar */}
          <TopBar activeTab={activeTab} onTabChange={onTabChange} />

          {/* Zone 3 — Main Content Area */}
          <main className="flex-1 overflow-auto" style={{ padding: 24 }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

