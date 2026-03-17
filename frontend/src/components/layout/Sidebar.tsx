import {
  Activity,
  BarChart2,
  Monitor,
  Bell,
  Users,
  Layers,
  Settings,
  HelpCircle,
  LogOut,
  PieChart,
  Shield,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { HelpModal } from "./HelpModal";
import { SignOutModal } from "./SignOutModal";

type Tab = "overview" | "live-feed" | "analytics" | "devices" | "alerts" | "subscriptions" | "settings" | "team" | "firewall" | "data-risk";

interface SidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const mainIcons = [
  { id: "overview",   icon: Activity,  tab: "overview" },
  { id: "live-feed", icon: BarChart2, tab: "live-feed" },
  { id: "analytics", icon: PieChart,  tab: "analytics" },
  { id: "devices",   icon: Monitor,   tab: "devices" },
  { id: "alerts",    icon: Bell,      tab: "alerts" },
  { id: "team",      icon: Users,     tab: "team" },
  { id: "layers",    icon: Layers,    tab: "subscriptions" },
  { id: "firewall",  icon: Shield,    tab: "firewall" },
  { id: "data-risk", icon: Eye,       tab: "data-risk" },
];

export function AppSidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);

  const handleSignOutConfirm = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Shared renderer for the icon buttons
  const renderIconButton = (
    id: string,
    Icon: React.ElementType,
    isActive: boolean,
    hoverColor: string,
    hoverBg: string,
    onClick?: () => void
  ) => {
    return (
      <button
        key={id}
        onClick={onClick}
        className="flex items-center justify-center transition-all"
        style={{
          width: 40, height: 40, borderRadius: 12, cursor: "pointer",
          backgroundColor: isActive ? "#FFF3EE" : "transparent",
          color: isActive ? "#FF5C1A" : "#C0C8D4",
          border: isActive ? "1px solid #FDDCC8" : "1px solid transparent",
          transitionDuration: "150ms",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLButtonElement).style.color = hoverColor;
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = hoverBg;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLButtonElement).style.color = "#C0C8D4";
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          }
        }}
        aria-label={id}
      >
        <Icon size={18} strokeWidth={1.5} />
      </button>
    );
  };

  return (
    <aside
      style={{
        width: 64, minWidth: 64, backgroundColor: "#ffffff",
        borderRight: "1px solid #F0F2F5", paddingTop: 20, paddingBottom: 20
      }}
      className="flex flex-col items-center h-full z-10"
    >
      {/* Logo */}
      <div
        className="flex items-center justify-center rounded-full mb-6 flex-shrink-0"
        style={{ width: 36, height: 36, backgroundColor: "#FF5C1A" }}
      >
        <span className="text-white font-bold text-base leading-none">D</span>
      </div>

      {/* Nav icons */}
      <div className="flex flex-col items-center w-full flex-1" style={{ gap: 8 }}>
        
        {/* Main 6 icons */}
        {mainIcons.map(({ id, icon, tab }) => {
          const isActive = tab ? activeTab === tab : false;
          
          return renderIconButton(id, icon, isActive, "#FF5C1A", "#FFF3EE", () => {
            if (tab && (["overview", "live-feed", "analytics", "devices", "alerts", "subscriptions", "team", "firewall", "data-risk"] as string[]).includes(tab)) {
              onTabChange(tab as Tab);
            }
          });
        })}

        {/* Bottom cluster (Settings + Line + Help + Logout) pushed down */}
        <div className="flex flex-col items-center w-full" style={{ marginTop: "auto", gap: 8 }}>
          {/* Settings */}
          {renderIconButton("settings", Settings, activeTab === "settings", "#FF5C1A", "#FFF3EE", () => onTabChange("settings"))}

          {/* Divider */}
          <div style={{ width: "100%", height: 1, backgroundColor: "#F0F2F5", margin: "4px 0" }} />

          {/* Help & Logout */}
          {renderIconButton("help", HelpCircle, false, "#FF5C1A", "#FFF3EE", () => setIsHelpOpen(true))}
          {renderIconButton("logout", LogOut, false, "#DC2626", "rgba(220,38,38,0.08)", () => setIsSignOutOpen(true))}
        </div>
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <SignOutModal isOpen={isSignOutOpen} onClose={() => setIsSignOutOpen(false)} onConfirm={handleSignOutConfirm} />
    </aside>
  );
}
