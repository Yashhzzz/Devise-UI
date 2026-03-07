import { useState, useEffect } from "react";
import { 
  Shield, 
  Users, 
  Bell, 
  Layers, 
  Lock, 
  CreditCard,
  X,
  AlertTriangle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings, useMe } from "@/hooks/useDashboard";
import { updateSettings } from "@/services/api";
import { useToast } from "@/components/ui/use-toast";

export function SettingsTab() {
  const [activeSection, setActiveSection] = useState("General");
  const [pollingHover, setPollingHover] = useState(false);

  const { data: settings, isLoading: settingsLoading, error: settingsError } = useSettings();
  const { data: me, isLoading: meLoading } = useMe();
  const { toast } = useToast();

  // ── Local state for editable fields ──
  const [orgName, setOrgName] = useState("");
  const [allowedCategories, setAllowedCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [autoBlock, setAutoBlock] = useState(false);
  const [notificationSlack, setNotificationSlack] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync local state when data loads
  useEffect(() => {
    if (me) {
      setOrgName(me.org_name || me.org_id || "");
    }
  }, [me]);

  useEffect(() => {
    if (settings) {
      setAllowedCategories(settings.allowed_categories || []);
      setAutoBlock(settings.auto_block);
      setNotificationSlack(settings.notification_slack);
      setNotificationEmail(settings.notification_email);
      setSlackWebhookUrl(settings.slack_webhook_url || "");
    }
  }, [settings]);

  const navItems = [
    { id: "General", icon: Shield },
    { id: "Team", icon: Users },
    { id: "Notifications", icon: Bell },
    { id: "Integrations", icon: Layers },
    { id: "Security & Privacy", icon: Lock },
    { id: "Billing", icon: CreditCard },
  ];

  const CustomToggle = ({ isOn, onToggle }: { isOn: boolean; onToggle?: () => void }) => (
    <div 
      onClick={onToggle}
      className="relative flex items-center transition-colors duration-200 cursor-pointer"
      style={{
        width: 36, height: 20, borderRadius: 999,
        backgroundColor: isOn ? "#FF5C1A" : "#E2E8F0"
      }}
    >
      <div 
        className="absolute bg-white rounded-full transition-all duration-200 shadow-sm"
        style={{
          width: 16, height: 16, top: 2,
          left: isOn ? 18 : 2
        }}
      />
    </div>
  );

  const handleRemoveCategory = (cat: string) => {
    setAllowedCategories(prev => prev.filter(c => c !== cat));
  };

  const handleAddCategory = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newCategory.trim()) {
      e.preventDefault();
      if (!allowedCategories.includes(newCategory.trim())) {
        setAllowedCategories(prev => [...prev, newCategory.trim()]);
      }
      setNewCategory("");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        allowed_categories: allowedCategories,
        auto_block: autoBlock,
        notification_slack: notificationSlack,
        notification_email: notificationEmail,
        slack_webhook_url: slackWebhookUrl || null,
      });
      toast({
        title: "Settings saved",
        description: "Your changes have been applied.",
        duration: 3000,
      });
    } catch (err: any) {
      toast({
        title: "Failed to save settings",
        description: err?.message || "Something went wrong. Please try again.",
        duration: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = settingsLoading || meLoading;

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-10">
        <div>
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex flex-col md:flex-row items-start gap-8 w-full">
          <nav className="flex flex-col gap-1 flex-shrink-0" style={{ width: 200 }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-10 w-full rounded-xl" />
            ))}
          </nav>
          <div className="flex-1 flex flex-col gap-6 w-full max-w-[800px]">
            <div className="flex flex-col gap-5 bg-white" style={{ borderRadius: 16, padding: 24, border: "1px solid #F0F2F5" }}>
              <Skeleton className="h-5 w-32 mb-2" />
              <div className="grid grid-cols-2 gap-5">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-9 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-5 bg-white" style={{ borderRadius: 16, padding: 24, border: "1px solid #F0F2F5" }}>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-64 mb-3" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (settingsError) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-10">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Settings</h1>
          <p className="mt-1" style={{ fontSize: 14, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>Configure Devise for your organization</p>
        </div>
        <div className="flex items-center gap-2 p-4 bg-white rounded-2xl border border-[#F0F2F5]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <AlertTriangle size={16} className="text-[#DC2626]" />
          <span className="text-sm font-medium text-[#DC2626]">Failed to load settings: {settingsError.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1400px] mx-auto pb-10">
      
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "#1A1A2E",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Settings
        </h1>
        <p
          className="mt-1"
          style={{ fontSize: 14, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}
        >
          Configure Devise for your organization
        </p>
      </div>

      <div className="flex flex-col md:flex-row items-start gap-8 w-full">
        {/* Left Nav (200px) */}
        <nav className="flex flex-col gap-1 flex-shrink-0" style={{ width: 200 }}>
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className="flex items-center gap-3 w-full transition-colors duration-150 text-left"
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  backgroundColor: isActive ? "#FFF3EE" : "transparent",
                  color: isActive ? "#FF5C1A" : "#64748B",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 14,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#FF5C1A";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#64748B";
                }}
              >
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                {item.id}
              </button>
            );
          })}
        </nav>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col gap-6 w-full max-w-[800px]">
          {activeSection === "General" ? (
            <>
              {/* SECTION: Organization */}
              <div 
                className="flex flex-col gap-5 bg-white"
                style={{ borderRadius: 16, padding: "24px", border: "1px solid #F0F2F5", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              >
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>
                  Organization
                </h2>
                
                <div className="grid grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label style={{ fontSize: 13, color: "#64748B", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Org name</label>
                    <input 
                      type="text" 
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      className="w-full outline-none"
                      style={{ padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label style={{ fontSize: 13, color: "#64748B", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Industry</label>
                    <select 
                      defaultValue="Technology"
                      className="w-full outline-none bg-white cursor-pointer"
                      style={{ padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}
                    >
                      <option>Technology</option>
                      <option>Finance</option>
                      <option>Healthcare</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label style={{ fontSize: 13, color: "#64748B", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Timezone</label>
                    <select 
                      defaultValue="Asia/Kolkata (IST)"
                      className="w-full outline-none bg-white cursor-pointer"
                      style={{ padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}
                    >
                      <option>Asia/Kolkata (IST)</option>
                      <option>America/New_York (EST)</option>
                      <option>Europe/London (GMT)</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label style={{ fontSize: 13, color: "#64748B", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Language</label>
                    <select 
                      defaultValue="English"
                      className="w-full outline-none bg-white cursor-pointer"
                      style={{ padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}
                    >
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="transition-all hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: "#FF5C1A", color: "white", padding: "8px 16px", borderRadius: 8, 
                      fontSize: 14, fontWeight: 500, fontFamily: "Inter, sans-serif",
                      boxShadow: "0 1px 2px rgba(255, 92, 26, 0.2)"
                    }}
                    onMouseEnter={e => { if (!isSaving) e.currentTarget.style.backgroundColor = "#E5521A"; }}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#FF5C1A"}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* SECTION: Agent Configuration */}
              <div 
                className="flex flex-col gap-6 bg-white"
                style={{ borderRadius: 16, padding: "24px", border: "1px solid #F0F2F5", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              >
                <div className="flex flex-col gap-1">
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>
                    Agent Configuration
                  </h2>
                  <p style={{ fontSize: 13, color: "#64748B", fontFamily: "Inter, sans-serif" }}>Manage how the desktop agent monitors tool usage.</p>
                </div>

                {/* Polling Interval Slider (Mock) */}
                <div className="flex flex-col gap-2 border-b border-[#F0F2F5] pb-6">
                  <div className="flex justify-between items-end">
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Detection polling interval</span>
                    <span style={{ fontSize: 13, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>Current: <strong style={{color:"#1A1A2E"}}>30s</strong></span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>10s</span>
                    <div 
                      className="relative w-full cursor-pointer h-6 flex items-center group"
                      onMouseEnter={() => setPollingHover(true)}
                      onMouseLeave={() => setPollingHover(false)}
                    >
                      <div className="w-full bg-[#E2E8F0] rounded-full" style={{ height: 4 }}>
                        <div className="bg-[#FF5C1A] rounded-full transition-all" style={{ width: "25%", height: "100%" }} />
                      </div>
                      <div 
                        className="absolute bg-white border-2 border-[#FF5C1A] rounded-full transition-all"
                        style={{
                          width: 16, height: 16, 
                          left: "25%", 
                          transform: "translate(-50%, 0)",
                          boxShadow: pollingHover ? "0 0 0 4px rgba(255,92,26,0.15)" : "0 2px 4px rgba(0,0,0,0.1)"
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>5min</span>
                  </div>
                </div>

                {/* Approved Tools List — now from allowed_categories */}
                <div className="flex flex-col gap-3 border-b border-[#F0F2F5] pb-6">
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Allowed categories</span>
                  <div className="flex flex-wrap gap-2">
                    {allowedCategories.length === 0 && (
                      <span style={{ fontSize: 13, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>No categories configured</span>
                    )}
                    {allowedCategories.map(t => (
                      <div 
                        key={t}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                        style={{ backgroundColor: "#FFF3EE", color: "#FF5C1A", fontSize: 13, fontFamily: "Inter, sans-serif", fontWeight: 500 }}
                      >
                        {t}
                        <X 
                          size={14} 
                          className="cursor-pointer hover:text-[#DC2626] transition-colors" 
                          onClick={() => handleRemoveCategory(t)}
                        />
                      </div>
                    ))}
                    <div className="flex items-center px-1">
                      <input 
                        type="text"
                        placeholder="+ Add category"
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        onKeyDown={handleAddCategory}
                        className="outline-none bg-transparent"
                        style={{ fontSize: 13, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Auto Block Toggle (inverted: auto_block=true means blocking) */}
                <div className="flex items-center justify-between border-b border-[#F0F2F5] pb-6">
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Auto-approve low risk tools</span>
                  <CustomToggle isOn={!autoBlock} onToggle={() => setAutoBlock(prev => !prev)} />
                </div>

                {/* Registry auto-update toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Registry auto-update</span>
                    <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>Last updated 2hr ago</span>
                  </div>
                  <CustomToggle isOn={true} />
                </div>
              </div>

              {/* SECTION: Notification Preferences */}
              <div 
                className="flex flex-col gap-5 bg-white"
                style={{ borderRadius: 16, padding: "24px", border: "1px solid #F0F2F5", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
              >
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>
                  Notification Preferences
                </h2>
                <div className="flex flex-col gap-5 mt-1">
                  
                  {/* Slack */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Slack alerts</span>
                      {slackWebhookUrl ? (
                        <span className="flex items-center gap-1.5" style={{ fontSize: 13, color: "#10B981", fontWeight: 500, fontFamily: "Inter, sans-serif" }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                          Connected
                        </span>
                      ) : (
                        <span style={{ fontSize: 13, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                          No webhook configured
                        </span>
                      )}
                    </div>
                    <CustomToggle isOn={notificationSlack} onToggle={() => setNotificationSlack(prev => !prev)} />
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-col gap-1">
                      <span style={{ fontSize: 14, fontWeight: 500, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Email digest</span>
                      <span style={{ fontSize: 13, color: "#64748B", fontFamily: "Inter, sans-serif" }}>
                        Daily at 9:00 AM
                      </span>
                    </div>
                    <CustomToggle isOn={notificationEmail} onToggle={() => setNotificationEmail(prev => !prev)} />
                  </div>

                  {/* Critical */}
                  <div className="flex items-center justify-between mt-1 pt-5 border-t border-[#F0F2F5]">
                    <span style={{ fontSize: 14, fontWeight: 500, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Critical alerts only mode</span>
                    <CustomToggle isOn={false} />
                  </div>

                </div>
              </div>

              {/* SECTION: Budget & Threshold (from settings) */}
              {settings && (
                <div 
                  className="flex flex-col gap-5 bg-white"
                  style={{ borderRadius: 16, padding: "24px", border: "1px solid #F0F2F5", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                >
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>
                    Budget & Alerts
                  </h2>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label style={{ fontSize: 13, color: "#64748B", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Monthly budget</label>
                      <div
                        className="w-full"
                        style={{ padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, color: "#1A1A2E", fontFamily: "Inter, sans-serif", backgroundColor: "#F8FAFC" }}
                      >
                        ${settings.monthly_budget.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label style={{ fontSize: 13, color: "#64748B", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Alert threshold</label>
                      <div
                        className="w-full"
                        style={{ padding: "8px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, color: "#1A1A2E", fontFamily: "Inter, sans-serif", backgroundColor: "#F8FAFC" }}
                      >
                        {settings.alert_threshold}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: Danger Zone */}
              <div 
                className="flex flex-col gap-5"
                style={{ 
                  borderRadius: 16, padding: "24px", 
                  border: "1px solid #FECACA", 
                  backgroundColor: "#FFF5F5"
                }}
              >
                <div className="flex flex-col gap-1">
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: "#DC2626", fontFamily: "Inter, sans-serif" }}>
                    Danger Zone
                  </h2>
                  <span style={{ fontSize: 12, color: "#DC2626", fontFamily: "Inter, sans-serif" }}>
                    These actions cannot be undone
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                  <button 
                    className="flex-1 transition-colors"
                    style={{
                      border: "1px solid #FECACA", backgroundColor: "white", color: "#DC2626",
                      padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500,
                      fontFamily: "Inter, sans-serif", cursor: "pointer"
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#FEF2F2"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}
                  >
                    Reset all detection data
                  </button>
                  <button 
                    className="flex-1 transition-colors"
                    style={{
                      border: "1px solid #FECACA", backgroundColor: "white", color: "#DC2626",
                      padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: 500,
                      fontFamily: "Inter, sans-serif", cursor: "pointer"
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#FEF2F2"}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "white"}
                  >
                    Remove all agents
                  </button>
                </div>
              </div>

            </>
          ) : (
            <div className="flex items-center justify-center py-20 bg-white" style={{ borderRadius: 16, border: "1px solid #F0F2F5" }}>
              <p style={{ color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>{activeSection} settings coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
