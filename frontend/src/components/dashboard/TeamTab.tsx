import { useState, useMemo } from "react";
import { 
  UserPlus, Search, MoreHorizontal, X, User, Activity, AlertTriangle, CheckCircle2, 
  MapPin, Shield, Copy, ExternalLink, ChevronDown, Bell
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell, PieChart, Pie } from "recharts";
import { useToast } from "@/components/ui/use-toast";
import { useTeam } from "@/hooks/useDashboard";
import { inviteTeamMember } from "@/services/api";

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface TeamMember {
  id: string;
  initials: string;
  name: string;
  email: string;
  department: string;
  role: string;
  toolsUsed: number;
  risk: "zero";
  lastActive: string;
}

const riskConf: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: "rgba(220,38,38,0.1)", text: "#DC2626", label: "High" },
  medium: { bg: "rgba(217,119,6,0.1)", text: "#D97706", label: "Medium" },
  low: { bg: "rgba(22,163,74,0.1)", text: "#16A34A", label: "Low" },
  zero: { bg: "transparent", text: "#C0C8D4", label: "—" },
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

function deriveInitials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export function TeamTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const { data, isLoading, error } = useTeam();

  // Map API members to local TeamMember shape
  const teamMembers: TeamMember[] = useMemo(() => {
    if (!data?.members) return [];
    return data.members.map(m => ({
      id: m.id,
      initials: deriveInitials(m.full_name),
      name: m.full_name,
      email: m.email,
      department: m.department || "—",
      role: capitalizeFirst(m.role),
      toolsUsed: 0,
      risk: "zero" as const,
      lastActive: m.created_at ? formatDate(m.created_at) : "—",
    }));
  }, [data]);

  // Compute department breakdown from real data
  const deptData = useMemo(() => {
    if (!teamMembers.length) return [];
    const counts: Record<string, number> = {};
    teamMembers.forEach(m => {
      const dept = m.department || "Unknown";
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, members]) => ({ name, members }))
      .sort((a, b) => b.members - a.members);
  }, [teamMembers]);

  const filteredMembers = teamMembers.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 relative w-full pb-10">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        {/* Stats row skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <Card key={i} className="p-5 flex flex-col justify-between border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
              <Skeleton className="h-3 w-28 mb-3" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>

        {/* Table skeleton */}
        <Card className="flex flex-col border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-[#F0F2F5]">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-9 w-60 rounded-xl" />
          </div>
          <div className="p-5 flex flex-col gap-4">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24 ml-auto" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="flex flex-col gap-6 relative w-full pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#1A1A2E] leading-tight mb-1">Team</h1>
            <p className="text-[14px] text-[#64748B]">Manage members and their AI usage permissions</p>
          </div>
        </div>
        <Card className="p-6 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white rounded-2xl">
          <div className="flex items-center gap-2 text-[#DC2626]">
            <AlertTriangle size={16} />
            <span className="text-sm font-medium">Failed to load team data: {error.message}</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 relative w-full pb-10">
      
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[#1A1A2E] leading-tight mb-1">Team</h1>
          <p className="text-[14px] text-[#64748B]">Manage members and their AI usage permissions</p>
        </div>
        <button
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-2 bg-[#FF5C1A] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#E65318] transition-colors"
        >
          <UserPlus size={16} />
          + Invite Member
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5 flex flex-col justify-between border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-[#FFF3EE]">
          <span className="text-xs font-bold tracking-wider text-[#FF5C1A] mb-3">TOTAL MEMBERS</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-[#1A1A2E] leading-none">{teamMembers.length}</span>
            {data?.invites && data.invites.filter(inv => inv.status === "pending").length > 0 && (
              <span className="text-sm font-medium text-[#64748B] flex items-center gap-1">
                {data.invites.filter(inv => inv.status === "pending").length} pending invite{data.invites.filter(inv => inv.status === "pending").length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </Card>
        
        <Card className="p-5 flex flex-col justify-between border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
          <span className="text-xs font-bold tracking-wider text-[#94A3B8] mb-3">POWER USERS</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-[#C0C8D4] leading-none">—</span>
            <span className="text-sm text-[#64748B] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E2E8F0]" /> No data available
            </span>
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white">
          <span className="text-xs font-bold tracking-wider text-[#94A3B8] mb-3">ZERO USAGE</span>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-[#C0C8D4] leading-none">—</span>
            <span className="text-sm text-[#64748B] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E2E8F0]" /> No data available
            </span>
          </div>
        </Card>
      </div>

      {/* ── Table Container ── */}
      <Card className="flex flex-col border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white rounded-2xl overflow-hidden">
        
        {/* Table Header Row */}
        <div className="flex items-center justify-between p-5 border-b border-[#F0F2F5]">
          <h2 className="text-base font-semibold text-[#1A1A2E]">All Members</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={16} />
            <input 
              type="text" 
              placeholder="Search members..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#FF5C1A] focus:bg-white transition-colors w-[240px]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {teamMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <User size={32} className="text-[#C0C8D4] mb-3" />
              <p className="text-[15px] font-medium text-[#64748B]">No team members yet</p>
              <p className="text-[13px] text-[#94A3B8] mt-1">Invite your first team member to get started</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F0F2F5]">
                  <th className="px-5 py-3 text-xs font-semibold tracking-wider text-[#94A3B8]">MEMBER</th>
                  <th className="px-5 py-3 text-xs font-semibold tracking-wider text-[#94A3B8]">DEPARTMENT</th>
                  <th className="px-5 py-3 text-xs font-semibold tracking-wider text-[#94A3B8]">ROLE</th>
                  <th className="px-5 py-3 text-xs font-semibold tracking-wider text-[#94A3B8]">AI TOOLS USED</th>
                  <th className="px-5 py-3 text-xs font-semibold tracking-wider text-[#94A3B8]">RISK LEVEL</th>
                  <th className="px-5 py-3 text-xs font-semibold tracking-wider text-[#94A3B8]">LAST ACTIVE</th>
                  <th className="px-5 py-3 text-xs font-semibold tracking-wider text-[#94A3B8] text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((m, idx) => {
                  const conf = riskConf[m.risk];
                  const isLast = idx === filteredMembers.length - 1;
                  return (
                    <tr 
                      key={m.id} 
                      onClick={() => setSelectedMember(m)}
                      className="group hover:bg-[#F8FAFC] cursor-pointer transition-colors"
                      style={{ borderBottom: isLast ? "none" : "1px solid #F0F2F5" }}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#FF5C1A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                            {m.initials}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[14px] text-[#1A1A2E] leading-tight">{m.name}</span>
                            <span className="text-[12px] text-[#94A3B8] leading-tight mt-0.5">{m.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[14px] text-[#1A1A2E]">{m.department}</td>
                      <td className="px-5 py-3 text-[14px] text-[#1A1A2E]">{m.role}</td>
                      <td className="px-5 py-3 text-[14px] text-[#C0C8D4] font-medium">—</td>
                      <td className="px-5 py-3">
                        <span className="text-[#C0C8D4] font-medium">—</span>
                      </td>
                      <td className="px-5 py-3 text-[13px] text-[#64748B]">{m.lastActive}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="relative inline-block" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
                            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#1A1A2E] hover:bg-[#F0F2F5] transition-colors"
                          >
                            <MoreHorizontal size={18} />
                          </button>
                          {openMenu === m.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                              <div className="absolute right-0 mt-1 w-48 bg-white border border-[#F0F2F5] shadow-[0_12px_24px_rgba(0,0,0,0.12)] rounded-xl py-1 z-20 text-left">
                                <button className="w-full px-4 py-2 text-sm text-[#1A1A2E] hover:bg-[#F8FAFC] text-left">View Usage Report</button>
                                <button className="w-full px-4 py-2 text-sm text-[#1A1A2E] hover:bg-[#F8FAFC] text-left">Edit Role</button>
                                <button className="w-full px-4 py-2 text-sm text-[#1A1A2E] hover:bg-[#F8FAFC] text-left">Suspend Access</button>
                                <button className="w-full px-4 py-2 text-sm text-[#DC2626] hover:bg-[#FEF2F2] text-left">Remove Member</button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* ── Bottom Section Options ── */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left: Department Breakdown */}
        <Card className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white rounded-2xl flex flex-col">
          <h3 className="text-[16px] font-semibold text-[#1A1A2E] mb-6">Department Breakdown</h3>
          <div className="flex-1 w-full" style={{ minHeight: 250 }}>
            {deptData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[#94A3B8] text-sm">
                No department data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={deptData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 13 }} width={90} />
                  <RechartsTooltip cursor={{ fill: "#F8FAFC" }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="members" radius={[0, 4, 4, 0]} barSize={20}>
                    {deptData.map((d, i) => (
                      <Cell key={`cell-${i}`} fill={i === 0 ? "#FF5C1A" : "#E2E8F0"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Right: AI Adoption Rate */}
        <Card className="p-5 border-none shadow-[0_2px_12px_rgba(0,0,0,0.04)] bg-white rounded-2xl flex flex-col relative">
          <h3 className="text-[16px] font-semibold text-[#1A1A2E] mb-4">AI Adoption Rate</h3>
          <div className="flex-1 w-full flex items-center justify-center relative" style={{ minHeight: 250 }}>
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-bold text-[#C0C8D4] leading-none mb-1">—</span>
              <span className="text-xs text-[#94A3B8]">adoption data not available</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Modals & Slide-overs ── */}
      <InviteMemberModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
      <MemberDetailPanel member={selectedMember} onClose={() => setSelectedMember(null)} />

    </div>
  );
}

// ─── INVITE MEMBER MODAL ────────────────────────────────────────────────────

function InviteMemberModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await inviteTeamMember(email, role);
      toast({
        title: `Invite sent to ${email}`,
        description: "They will receive an email with instructions to join.",
        duration: 3000,
      });
      setEmail("");
      setRole("member");
      onClose();
    } catch (err: any) {
      toast({
        title: "Failed to send invite",
        description: err?.message || "Something went wrong. Please try again.",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-[480px] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#1A1A2E]">Invite Team Member</h2>
          <button onClick={onClose} className="p-2 text-[#94A3B8] hover:text-[#1A1A2E] hover:bg-[#F0F2F5] rounded-lg transition-colors">
            <X size={20} className="active:scale-95 transition-transform" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1A1A2E]">Email address</label>
            <input 
              required
              type="email" 
              placeholder="e.g. colleague@devise.ai" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#FF5C1A] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1A1A2E]">Department</label>
            <div className="relative">
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" size={16} />
              <select className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm appearance-none focus:outline-none focus:border-[#FF5C1A] focus:bg-white transition-colors">
                <option>Engineering</option>
                <option>Design</option>
                <option>Product</option>
                <option>Marketing</option>
                <option>Finance</option>
                <option>HR</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1A1A2E]">Role</label>
            <div className="relative">
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" size={16} />
              <select 
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm appearance-none focus:outline-none focus:border-[#FF5C1A] focus:bg-white transition-colors"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#F0F2F5]">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-[#64748B] hover:text-[#1A1A2E] hover:bg-[#F8FAFC] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#FF5C1A] hover:bg-[#E65318] hover:translate-y-[-1px] active:scale-[0.98] rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MEMBER DETAIL PANEL (SLIDE-OVER) ───────────────────────────────────────

function MemberDetailPanel({ member, onClose }: { member: TeamMember | null; onClose: () => void }) {
  if (!member) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Panel */}
      <div 
        className="absolute top-0 right-0 h-full w-[480px] bg-white border-l border-[#F0F2F5] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
      >
        {/* Top Header Section */}
        <div className="flex flex-col items-center justify-center p-8 border-b border-[#F0F2F5] relative bg-[#FAFAFA]">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 text-[#94A3B8] hover:text-[#1A1A2E] hover:bg-[#F0F2F5] rounded-lg transition-colors"
          >
            <X size={20} className="active:scale-95 transition-transform" />
          </button>
          
          <div className="w-16 h-16 rounded-full bg-[#FF5C1A] text-white flex items-center justify-center font-bold text-2xl shadow-md mb-4">
            {member.initials}
          </div>
          
          <h2 className="text-xl font-bold text-[#1A1A2E] leading-tight mb-1">{member.name}</h2>
          <p className="text-sm text-[#94A3B8] mb-3">{member.email}</p>
          
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white border border-[#E2E8F0] rounded-full text-[13px] font-medium text-[#1A1A2E] shadow-sm">
              {member.department}
            </span>
            <span className="px-3 py-1 bg-[#FFF3EE] border border-[#FDDCC8] rounded-full text-[13px] font-semibold text-[#FF5C1A] shadow-sm">
              {member.role}
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          
          {/* AI Usage Summary */}
          <section>
            <h3 className="text-[13px] font-bold tracking-wider text-[#94A3B8] mb-4">AI USAGE SUMMARY</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col justify-center">
                <span className="text-xs text-[#64748B] mb-1">Total events this month</span>
                <span className="text-xl font-bold text-[#C0C8D4]">—</span>
              </div>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col justify-center">
                <span className="text-xs text-[#64748B] mb-1">Most used tool</span>
                <span className="text-[15px] font-bold text-[#C0C8D4]">—</span>
              </div>
            </div>
            
            <div className="mt-4 p-4 border border-[#E2E8F0] rounded-xl flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#1A1A2E]">Risk Score</span>
                <span className="text-sm font-bold text-[#C0C8D4]">—</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#F0F2F5] overflow-hidden">
                <div className="h-full bg-[#E2E8F0]" style={{ width: '0%' }} />
              </div>
            </div>
          </section>

          {/* Top Tools Used */}
          <section>
            <h3 className="text-[13px] font-bold tracking-wider text-[#94A3B8] mb-4">TOP TOOLS USED</h3>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <span className="text-sm text-[#94A3B8]">No tool usage data available</span>
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-bold tracking-wider text-[#94A3B8]">RECENT ACTIVITY</h3>
            </div>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <span className="text-sm text-[#94A3B8]">No recent activity data available</span>
            </div>
          </section>

          {/* Permissions (Toggles) */}
          <section className="mb-8">
            <h3 className="text-[13px] font-bold tracking-wider text-[#94A3B8] mb-4">PERMISSIONS</h3>
            <div className="flex flex-col gap-0 border border-[#E2E8F0] rounded-xl overflow-hidden bg-[#FAFAFA]">
              
              <PermissionToggle label="Can use approved tools" defaultOn={true} />
              <PermissionToggle label="Can request new tools" defaultOn={true} />
              <PermissionToggle label="Receives alert notifications" defaultOn={false} />
              <PermissionToggle label="Admin access" defaultOn={member.role === "Admin"} isLast />

            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

// ─── HELPER: PERMISSION TOGGLE ──────────────────────────────────────────────

function PermissionToggle({ label, defaultOn, isLast }: { label: string; defaultOn: boolean; isLast?: boolean }) {
  const [isOn, setIsOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between p-4 bg-white" style={{ borderBottom: isLast ? 'none' : '1px solid #F0F2F5' }}>
      <span className="text-[14px] font-medium text-[#1A1A2E]">{label}</span>
      <button 
        onClick={() => setIsOn(!isOn)}
        className="relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out cursor-pointer shadow-inner"
        style={{ backgroundColor: isOn ? '#16A34A' : '#E2E8F0' }}
      >
        <span 
          className="absolute left-[2px] top-[2px] w-[20px] h-[20px] bg-white rounded-full shadow transition-transform duration-200 ease-in-out"
          style={{ transform: isOn ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );
}
