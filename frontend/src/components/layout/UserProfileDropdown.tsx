import { useEffect, useRef, useState } from "react";
import { User, Settings, Layers, HelpCircle, Moon, LogOut } from "lucide-react";
import { MyProfilePanel } from "./MyProfilePanel";
import { AccountSettingsPanel } from "./AccountSettingsPanel";
import { HelpModal } from "./HelpModal";
import { SignOutModal } from "./SignOutModal";
import { useAuth } from "@/lib/AuthContext";
import { useMe } from "@/hooks/useDashboard";
import { updateMe } from "@/services/api";

type Tab = "overview" | "live-feed" | "analytics" | "devices" | "alerts" | "subscriptions" | "settings" | "team" | "firewall" | "data-risk";

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onTabChange: (tab: Tab) => void;
}

export function UserProfileDropdown({ isOpen, onClose, onTabChange }: UserProfileDropdownProps) {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading } = useMe();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEsc);
    }
    
    // Read dark mode initial state
    const savedTheme = localStorage.getItem("devise-theme");
    if (savedTheme === "dark" || document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

  const toggleDarkMode = async () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // UI update
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("devise-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("devise-theme", "light");
    }

    // Sync to Firestore
    try {
      await updateMe({ dark_mode: newDarkMode });
    } catch (error) {
      console.error("Failed to sync dark mode to Firestore:", error);
    }
  };

  const handleSignOutConfirm = async () => {
    localStorage.clear();
    await signOut();
    window.location.href = "/login";
  };

  return (
    <>
      {/* Modals are rendered outside the open check so they don't unmount when dropdown closes */}
      <MyProfilePanel isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <AccountSettingsPanel isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <SignOutModal isOpen={isSignOutOpen} onClose={() => setIsSignOutOpen(false)} onConfirm={handleSignOutConfirm} />

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute bg-white flex flex-col z-40 overflow-hidden"
          style={{
        top: 56,
        right: 24,
        width: 260,
        borderRadius: 16,
        border: "1px solid #F0F2F5",
        boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
      }}
    >
      {/* Top Section */}
      <div 
        className="flex flex-col items-center justify-center pt-5 pb-[12px] border-b border-[#F0F2F5]"
      >
        <div
          className="flex items-center justify-center rounded-full mb-3 uppercase"
          style={{ 
            width: 48, height: 48, 
            backgroundColor: "#FF5C1A", 
            color: "#ffffff",
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: 18,
            boxShadow: "0 2px 8px rgba(255, 92, 26, 0.25)"
          }}
        >
          {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || user?.email?.slice(0, 2) || "U"}
        </div>
        <span
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 15,
            color: "#1A1A2E",
            lineHeight: 1.2,
          }}
        >
          {profile?.full_name || user?.displayName || "User"}
        </span>
        <span
          className="mt-0.5 mb-2"
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 13,
            color: "#94A3B8",
            lineHeight: 1.2,
          }}
        >
          {user?.email || "..."}
        </span>
        <span
          className="capitalize"
          style={{
            backgroundColor: "#FFF3EE",
            color: "#FF5C1A",
            border: "1px solid #FDDCC8",
            borderRadius: 9999,
            padding: "2px 8px",
            fontSize: 12,
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
          }}
        >
          {profile?.role || "Member"}
        </span>
      </div>

      {/* Menu Items */}
      <div className="flex flex-col p-2 gap-0.5" onClick={(e) => e.stopPropagation()}>
        
        <MenuItem icon={User} label="My Profile" onClick={() => { setIsProfileOpen(true); onClose(); }} />
        <MenuItem icon={Settings} label="Account Settings" onClick={() => { setIsAccountOpen(true); onClose(); }} />
        <MenuItem icon={Layers} label="Subscription" onClick={() => { onTabChange("subscriptions"); onClose(); }} />
        <MenuItem icon={HelpCircle} label="Help & Documentation" onClick={() => { setIsHelpOpen(true); onClose(); }} />
        
        <div style={{ height: 1, backgroundColor: "#F0F2F5", margin: "4px 0" }} />
        
        {/* Dark Mode Toggle */}
        <div
          className="flex items-center group cursor-pointer"
          style={{
            height: 40, padding: "0 16px", borderRadius: 8, transition: "background-color 150ms",
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#F8FAFC"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          onClick={toggleDarkMode}
        >
          <div className="flex items-center gap-[10px] flex-1">
            <Moon 
              size={16} 
              className="text-[#94A3B8] transition-colors group-hover:text-[#FF5C1A]"
              strokeWidth={2}
            />
            <span style={{ fontSize: 14, color: "#1A1A2E", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
              Dark Mode
            </span>
          </div>
          
          <div 
            className="relative flex items-center transition-colors duration-200"
            style={{
              width: 36, height: 20, borderRadius: 999,
              backgroundColor: isDarkMode ? "#FF5C1A" : "#E2E8F0"
            }}
          >
            <div 
              className="absolute bg-white rounded-full transition-all duration-200 shadow-sm"
              style={{
                width: 16, height: 16, top: 2,
                left: isDarkMode ? 18 : 2
              }}
            />
          </div>
        </div>

        <div style={{ height: 1, backgroundColor: "#F0F2F5", margin: "4px 0" }} />

        {/* Log Out */}
        <div
          className="flex items-center gap-[10px] cursor-pointer"
          style={{
            height: 40, padding: "0 16px", borderRadius: 8, transition: "background-color 150ms",
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = "#FEF2F2"}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
          onClick={() => { setIsSignOutOpen(true); onClose(); }}
        >
          <LogOut size={16} color="#DC2626" strokeWidth={2} />
          <span style={{ fontSize: 14, color: "#DC2626", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
            Sign Out
          </span>
        </div>

      </div>
        </div>
      )}
    </>
  );
}

// Helper for standard menu items
function MenuItem({ 
  icon: Icon, 
  label, 
  onClick 
}: { 
  icon: React.ElementType, 
  label: string, 
  onClick: () => void 
}) {
  return (
    <div
      className="flex items-center gap-[10px] group cursor-pointer"
      style={{
        height: 40, padding: "0 16px", borderRadius: 8, transition: "background-color 150ms",
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = "#F8FAFC"}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
      onClick={onClick}
    >
      <Icon 
        size={16} 
        className="text-[#94A3B8] transition-colors group-hover:text-[#FF5C1A]" 
        strokeWidth={2} 
      />
      <span style={{ fontSize: 14, color: "#1A1A2E", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}
