import { Search, Bell, Info, ChevronDown, AlertTriangle, ShieldAlert, Activity, Monitor } from "lucide-react";
import { useState } from "react";
import { SearchModal } from "./SearchModal";
import { NotificationDropdown } from "./NotificationDropdown";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { useAuth } from "@/lib/AuthContext";
import { useMe } from "@/hooks/useDashboard";

type Tab = "overview" | "live-feed" | "analytics" | "devices" | "alerts" | "subscriptions" | "settings" | "team" | "firewall" | "data-risk";


export interface NotificationItem {
  id: number;
  icon: any;
  iconBg: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
  category: "Alerts" | "System";
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    icon: AlertTriangle,
    iconBg: "#DC2626",
    title: "Critical: Finance dept used Replicate",
    desc: "Policy violation detected",
    time: "2m ago",
    unread: true,
    category: "Alerts"
  },
  {
    id: 2,
    icon: ShieldAlert,
    iconBg: "#FF5C1A",
    title: "New shadow AI tool detected",
    desc: "Character.ai first seen",
    time: "8m ago",
    unread: true,
    category: "Alerts"
  },
  {
    id: 3,
    icon: Bell,
    iconBg: "#D97706",
    title: "5 zombie licenses need review",
    desc: "₹48,000 potential savings",
    time: "1hr ago",
    unread: true,
    category: "System"
  },
  {
    id: 4,
    icon: Activity,
    iconBg: "#3B82F6",
    title: "Weekly report ready",
    desc: "247 detections this week",
    time: "2hr ago",
    unread: true,
    category: "System"
  },
  {
    id: 5,
    icon: Monitor,
    iconBg: "#16A34A",
    title: "New device enrolled",
    desc: "macbook-arjun.local added",
    time: "5hr ago",
    unread: true,
    category: "System"
  },
  {
    id: 6,
    icon: Bell,
    iconBg: "#94A3B8",
    title: "Scheduled maintenance",
    desc: "System update tonight at 2AM",
    time: "1d ago",
    unread: false,
    category: "System"
  },
  {
    id: 7,
    icon: Activity,
    iconBg: "#94A3B8",
    title: "Agent v2.4 deployed",
    desc: "Successfully updated 12 devices",
    time: "2d ago",
    unread: false,
    category: "System"
  },
  {
    id: 8,
    icon: ShieldAlert,
    iconBg: "#94A3B8",
    title: "Low risk tool approved",
    desc: "Grammarly Business added to allowed list",
    time: "3d ago",
    unread: false,
    category: "Alerts"
  },
];

interface TopBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { id: Tab; label: string }[] = [
  { id: "overview",  label: "Overview"  },
  { id: "live-feed", label: "Live Feed" },
  { id: "analytics", label: "Analytics" },
  { id: "devices",   label: "Devices"   },
  { id: "alerts",    label: "Alerts"    },
];

export function TopBar({ activeTab, onTabChange }: TopBarProps) {
  const { user } = useAuth();
  const { data: profile } = useMe();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Derive unread count from notifications array passed below
  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    );
  };

  return (
    <header
      className="flex items-center justify-between px-6 flex-shrink-0 border-b"
      style={{ height: 72, borderColor: "#F5F5F5", backgroundColor: "#ffffff" }}
    >
      {/* Left — Greeting */}
      <div className="flex flex-col justify-center min-w-[220px]">
        <span
          className="font-bold leading-tight"
          style={{ fontSize: 22, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}
        >
          Good morning, {profile?.full_name?.split(' ')[0] || "Yash"}
        </span>
        <span
          className="leading-tight mt-0.5"
          style={{ fontSize: 13, color: "#94A3B8" }}
        >
          Monitor your AI governance across all devices
        </span>
      </div>

      {/* Center — Pill Tabs */}
      <nav className="flex items-center gap-1 bg-[#F5F7FA] rounded-full px-1.5 py-1.5">
        {tabs.map(({ id, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="transition-all duration-200 font-medium text-sm leading-none"
              style={{
                padding: "7px 18px",
                borderRadius: 999,
                backgroundColor: isActive ? "#1A1A2E" : "transparent",
                color: isActive ? "#ffffff" : "#94A3B8",
                fontFamily: "Inter, sans-serif",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.color = "#1A1A2E";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8";
              }}
            >
              {label}
            </button>
          );
        })}
      </nav>

      {/* Right — Actions + Avatar */}
      <div className="flex items-center justify-end" style={{ gap: 20, marginRight: 24 }}>
        
        {/* Search */}
        <button
          className="flex items-center justify-center transition-colors"
          style={{ cursor: "pointer", background: "none", border: "none", color: "#94A3B8" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#1A1A2E"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; }}
          aria-label="Search"
          onClick={() => setIsSearchOpen(true)}
        >
          <Search size={18} strokeWidth={2} />
        </button>

        {/* Bell with orange dot */}
        <div className="relative flex items-center justify-center">
          <button
            className="flex items-center justify-center transition-colors"
            style={{ cursor: "pointer", background: "none", border: "none", color: "#94A3B8" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#1A1A2E"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; }}
            aria-label="Notifications"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            <Bell size={18} strokeWidth={2} />
            {unreadCount > 0 && (
              <span
                className="absolute rounded-full"
                style={{ 
                  top: 0, 
                  right: 0, 
                  width: 8, 
                  height: 8, 
                  backgroundColor: "#FF5C1A" 
                }}
              />
            )}
          </button>
          <NotificationDropdown 
            isOpen={isNotifOpen} 
            onClose={() => setIsNotifOpen(false)}
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
            onNotificationClick={handleNotificationClick}
            unreadCount={unreadCount}
          />
        </div>

        {/* Info */}
        <button
          className="flex items-center justify-center transition-colors"
          style={{ cursor: "pointer", background: "none", border: "none", color: "#94A3B8" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#1A1A2E"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#94A3B8"; }}
          aria-label="Info"
        >
          <Info size={18} strokeWidth={2} />
        </button>

        {/* Vertical Divider */}
        <div style={{ width: 1, height: 28, backgroundColor: "#F0F2F5", margin: "0 4px" }} />

        {/* Avatar + name */}
        <div className="relative flex items-center">
          <div 
            className="flex items-center transition-colors select-none" 
            style={{ gap: 10, cursor: "pointer", borderRadius: 12, padding: "4px 8px" }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "#F8FAFC"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{ 
                width: 36, height: 36, 
                backgroundColor: "#FF5C1A", 
                color: "#ffffff",
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: "0.5px"
              }}
            >
              {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || user?.email?.slice(0, 2).toUpperCase() || "U"}
            </div>
            <div className="flex flex-col text-left">
              <span
                className="font-semibold"
                style={{ fontSize: 14, color: "#1A1A2E", lineHeight: 1.2, fontFamily: "Inter, sans-serif" }}
              >
                {profile?.full_name || user?.email?.split('@')[0] || "User"}
              </span>
              <span
                style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.2, fontFamily: "Inter, sans-serif" }}
              >
                {user?.email || "..."}
              </span>
            </div>
            <ChevronDown size={16} strokeWidth={2} style={{ color: "#94A3B8", marginLeft: 4 }} />
          </div>
          <UserProfileDropdown 
            isOpen={isProfileOpen} 
            onClose={() => setIsProfileOpen(false)} 
            onTabChange={onTabChange}
          />
        </div>
      </div>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onNavigate={onTabChange} />
    </header>
  );
}

