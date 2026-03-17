import { useState, useEffect } from "react";
import { X, Building2, ShieldCheck, Mail, Calendar, Activity, Database } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useMe } from "@/hooks/useDashboard";
import { updateMe, getUserDetectionCount } from "@/services/api";
import { toast } from "sonner";

interface MyProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MyProfilePanel({ isOpen, onClose }: MyProfilePanelProps) {
  const { user } = useAuth();
  const { data: profile, refetch } = useMe();
  const [isClosing, setIsClosing] = useState(false);
  const [detectionCount, setDetectionCount] = useState<number | null>(null);
  
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setDepartment(profile.department || "General");
    }
  }, [profile]);

  useEffect(() => {
    if (user?.email) {
      getUserDetectionCount(user.email).then(setDetectionCount);
    }
  }, [user]);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMe({
        full_name: fullName,
        department: department
      });
      await refetch();
      toast.success("Profile updated successfully");
      handleClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "...";
    const d = typeof date === 'string' ? new Date(date) : date.toDate();
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>
            My Profile
          </h2>
          <button 
            onClick={handleClose}
            className="p-1 rounded-full transition-colors hover:bg-[#F8FAFC]"
            style={{ color: "#94A3B8" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          
          <div className="flex flex-col items-center">
            <div
              className="flex items-center justify-center rounded-full mb-4 uppercase"
              style={{ 
                width: 64, height: 64, 
                backgroundColor: "#FF5C1A", 
                color: "#ffffff",
                fontFamily: "Inter, sans-serif",
                fontWeight: 700,
                fontSize: 24,
                boxShadow: "0 4px 12px rgba(255, 92, 26, 0.25)"
              }}
            >
              {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || user?.email?.slice(0, 2) || "U"}
            </div>
            <button className="text-sm font-medium text-[#FF5C1A] hover:text-[#E5521A] transition-colors">
              Change avatar
            </button>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 13, color: "#64748B", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Full Name</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full outline-none focus:border-[#FF5C1A] transition-colors"
                style={{ padding: "10px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 13, color: "#64748B", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Email Address</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={user?.email || ""} 
                  readOnly
                  className="w-full outline-none bg-[#F8FAFC]"
                  style={{ padding: "10px 12px 10px 36px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, color: "#64748B", fontFamily: "Inter, sans-serif", cursor: "not-allowed" }}
                />
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label style={{ fontSize: 13, color: "#64748B", fontFamily: "Inter, sans-serif", fontWeight: 500 }}>Department</label>
              <select 
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full outline-none bg-white cursor-pointer focus:border-[#FF5C1A] transition-colors"
                style={{ padding: "10px 12px", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 14, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}
              >
                <option value="General">General</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            <div className="flex flex-col gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-[#F0F2F5]">
              <h3 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2">
                <Building2 size={16} className="text-[#94A3B8]" />
                Organization Details
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-bold">Workspace</span>
                  <span className="text-sm font-medium text-[#1A1A2E] truncate">{profile?.org_name || "Personal Team"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-bold">Workspace ID</span>
                  <span className="text-xs font-mono text-[#64748B] truncate">{profile?.org_id || "..."}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-bold">Role</span>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-[#1A1A2E] capitalize">
                    <ShieldCheck size={14} className="text-[#FF5C1A]" />
                    {profile?.role || "Member"}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-bold">Joined</span>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-[#1A1A2E]">
                    <Calendar size={14} className="text-[#94A3B8]" />
                    {formatDate(profile?.created_at)}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] uppercase tracking-wider text-[#94A3B8] font-bold">Last Active</span>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-[#1A1A2E]">
                    <Activity size={14} className="text-[#94A3B8]" />
                    {formatDate(profile?.last_active)}
                  </div>
                </div>
              </div>

              <div className="mt-2 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-[#94A3B8]" />
                  <span className="text-xs text-[#64748B]">Total Detections</span>
                </div>
                <span className="text-sm font-bold text-[#1A1A2E]">
                  {detectionCount ?? "..."}
                </span>
              </div>
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
            onClick={handleSave}
            disabled={isSaving}
            className="transition-all hover:-translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: "#FF5C1A", color: "white", padding: "10px 20px", borderRadius: 8, 
              fontSize: 14, fontWeight: 500, fontFamily: "Inter, sans-serif",
              boxShadow: "0 2px 4px rgba(255, 92, 26, 0.2)"
            }}
            onMouseEnter={e => !isSaving && (e.currentTarget.style.backgroundColor = "#E5521A")}
            onMouseLeave={e => !isSaving && (e.currentTarget.style.backgroundColor = "#FF5C1A")}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </>
  );
}
