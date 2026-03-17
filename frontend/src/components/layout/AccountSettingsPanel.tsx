import { useState, useEffect } from "react";
import { X, Bell, Shield, Mail, Key, Layout, Check, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useMe } from "@/hooks/useDashboard";
import { updateMe } from "@/services/api";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toast } from "sonner";

interface AccountSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountSettingsPanel({ isOpen, onClose }: AccountSettingsPanelProps) {
  const { user } = useAuth();
  const { data: profile, refetch } = useMe();
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [notificationPrefs, setNotificationPrefs] = useState({
    high_risk_alerts: true,
    daily_summary: false,
    block_notifications: false
  });

  useEffect(() => {
    if (profile?.notification_prefs) {
      setNotificationPrefs(profile.notification_prefs);
    }
  }, [profile]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const handleTogglePref = (key: keyof typeof notificationPrefs) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateMe({
        notification_prefs: notificationPrefs
      });
      await refetch();
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      toast.success("Password reset email sent!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send reset email");
    } finally {
      setIsResettingPassword(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 transition-opacity duration-200"
        style={{ 
          backgroundColor: "rgba(0,0,0,0.4)", 
          backdropFilter: "blur(4px)",
          opacity: isClosing ? 0 : 1 
        }}
        onClick={handleClose}
      />
      
      <div 
        className="fixed top-0 bottom-0 right-0 z-50 bg-white flex flex-col transition-transform duration-200"
        style={{ 
          width: 480, 
          boxShadow: "-12px 0 48px rgba(0,0,0,0.12)",
          transform: isClosing ? "translateX(100%)" : "translateX(0)" 
        }}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#F0F2F5]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FFF3EE] text-[#FF5C1A]">
              <Shield size={20} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>
              Account Settings
            </h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-1 rounded-full transition-colors hover:bg-[#F8FAFC]"
            style={{ color: "#94A3B8" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          
          {/* Email Section */}
          <section className="flex flex-col gap-4">
            <h3 className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-bold flex items-center gap-2">
              <Mail size={14} />
              Email Configuration
            </h3>
            <div className="p-4 rounded-xl border border-[#F0F2F5] bg-[#F8FAFC]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#1A1A2E]">{user?.email}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-600 font-bold uppercase tracking-tight">Verified</span>
              </div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Email change is restricted for security. Please contact <a href="mailto:support@devise.ai" className="text-[#FF5C1A] hover:underline">support@devise.ai</a> to update your login email.
              </p>
            </div>
          </section>

          {/* Security Section */}
          <section className="flex flex-col gap-4">
            <h3 className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-bold flex items-center gap-2">
              <Key size={14} />
              Security & Access
            </h3>
            <div className="p-4 rounded-xl border border-[#F0F2F5] flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1A1A2E]">Update Password</p>
                <p className="text-xs text-[#94A3B8]">Securely reset your account password</p>
              </div>
              <button 
                onClick={handlePasswordReset}
                disabled={isResettingPassword}
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50"
              >
                {isResettingPassword ? "Sending..." : "Reset via Email"}
              </button>
            </div>
          </section>

          {/* Notifications Section */}
          <section className="flex flex-col gap-4">
            <h3 className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-bold flex items-center gap-2">
              <Bell size={14} />
              Notification Preferences
            </h3>
            <div className="flex flex-col gap-1 border border-[#F0F2F5] rounded-xl overflow-hidden text-sm">
              <NotificationToggle 
                label="High-risk Alerts" 
                description="Get instant emails for high-risk tool detections" 
                active={notificationPrefs.high_risk_alerts} 
                onToggle={() => handleTogglePref("high_risk_alerts")} 
              />
              <NotificationToggle 
                label="Daily Summary" 
                description="Receive a daily overview of activity and spend" 
                active={notificationPrefs.daily_summary} 
                onToggle={() => handleTogglePref("daily_summary")} 
              />
              <NotificationToggle 
                label="Block Notifications" 
                description="Alerts when a blocked tool is attempted" 
                active={notificationPrefs.block_notifications} 
                onToggle={() => handleTogglePref("block_notifications")} 
              />
            </div>
          </section>

          {/* Info Section */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3 text-amber-800">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold uppercase tracking-wider">Note on Privacy</p>
              <p className="text-xs leading-relaxed">
                Changes to security settings are logged and may notify the organization administrator for audit purposes.
              </p>
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-[#F0F2F5] flex justify-end gap-3">
          <button 
            onClick={handleClose}
            className="transition-colors hover:bg-[#F8FAFC]"
            style={{ 
              padding: "10px 16px", borderRadius: 8, fontSize: 14, 
              fontWeight: 500, color: "#64748B", fontFamily: "Inter, sans-serif",
              border: "1px solid #E2E8F0"
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="transition-all hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed group"
            style={{ 
              backgroundColor: "#FF5C1A", color: "white", padding: "10px 20px", borderRadius: 8, 
              fontSize: 14, fontWeight: 500, fontFamily: "Inter, sans-serif",
              boxShadow: "0 2px 4px rgba(255, 92, 26, 0.2)"
            }}
            onMouseEnter={e => !isSaving && (e.currentTarget.style.backgroundColor = "#E5521A")}
            onMouseLeave={e => !isSaving && (e.currentTarget.style.backgroundColor = "#FF5C1A")}
          >
            <div className="flex items-center gap-2">
              {isSaving ? "Saving..." : "Save Settings"}
              {!isSaving && <Check size={16} className="transition-transform group-hover:scale-110" />}
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

function NotificationToggle({ 
  label, 
  description, 
  active, 
  onToggle 
}: { 
  label: string, 
  description: string, 
  active: boolean, 
  onToggle: () => void 
}) {
  return (
    <div 
      className="flex items-center justify-between p-4 bg-white hover:bg-[#F8FAFC] transition-colors cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex flex-col gap-0.5 pr-4">
        <span className="font-semibold text-[#1A1A2E]">{label}</span>
        <span className="text-xs text-[#94A3B8]">{description}</span>
      </div>
      <div 
        className="relative flex items-center transition-colors duration-200 shrink-0"
        style={{
          width: 40, height: 22, borderRadius: 999,
          backgroundColor: active ? "#FF5C1A" : "#E2E8F0"
        }}
      >
        <div 
          className="absolute bg-white rounded-full transition-all duration-200 shadow-sm"
          style={{
            width: 18, height: 18, top: 2,
            left: active ? 20 : 2
          }}
        />
      </div>
    </div>
  );
}
