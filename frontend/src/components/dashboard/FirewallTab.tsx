import { useState, useEffect, useCallback } from "react";
import { Shield, ShieldOff, Plus, RefreshCw, CheckCircle, XCircle, Trash2, Clock, Laptop, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";
import {
  fetchFirewallRules,
  updateFirewallRule,
  deleteFirewallRule,
  fetchBlockEvents,
  fetchFirewallStats,
  syncFirewallRulesFromEvents,
  type FirewallRule,
  type BlockEvent,
  type FirewallStats,
} from "@/services/api";

// ─── Helpers ───────────────────────────────────────────────────────────────
function fmtTs(ts: string | undefined) {
  if (!ts) return "—";
  const d = new Date(ts);
  return isNaN(d.getTime())
    ? ts
    : d.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
}

function RiskBadge({ status }: { status: "allowed" | "blocked" }) {
  return status === "allowed" ? (
    <span style={{ background: "#D1FAE5", color: "#065F46", border: "1px solid #6EE7B7" }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold">
      <CheckCircle size={11} strokeWidth={2} /> ALLOWED
    </span>
  ) : (
    <span style={{ background: "#FEE2E2", color: "#991B1B", border: "1px solid #FCA5A5" }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold">
      <XCircle size={11} strokeWidth={2} /> BLOCKED
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #F0F2F5", borderRadius: 16 }} className="flex flex-col gap-2 p-4 flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <div style={{ background: `${color}18`, borderRadius: 8, padding: 6 }}>
          <Icon size={16} strokeWidth={1.5} style={{ color }} />
        </div>
        <span style={{ color: "#8A94A6", fontSize: 12, fontWeight: 500 }}>{label}</span>
      </div>
      <span style={{ color: "#1A1D23", fontSize: 26, fontWeight: 700, lineHeight: 1 }}>{value}</span>
    </div>
  );
}

// ─── Add Tool Modal ─────────────────────────────────────────────────────────
function AddToolModal({ onClose, onSave }: { onClose: () => void; onSave: (rule: { tool_name: string; domain: string; status: "allowed" | "blocked" }) => void }) {
  const [toolName, setToolName] = useState("");
  const [domain, setDomain] = useState("");
  const [status, setStatus] = useState<"allowed" | "blocked">("blocked");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #F0F2F5", width: 420, padding: 28 }}>
        <h3 style={{ fontWeight: 700, fontSize: 18, color: "#1A1D23", marginBottom: 20 }}>Add Custom Domain Rule</h3>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 12, color: "#8A94A6", fontWeight: 500 }}>Tool Name</label>
            <input value={toolName} onChange={e => setToolName(e.target.value)} placeholder="e.g. ChatGPT"
              style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: "8px 12px", fontSize: 14, outline: "none" }} />
          </div>
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 12, color: "#8A94A6", fontWeight: 500 }}>Domain</label>
            <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="e.g. chat.openai.com"
              style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: "8px 12px", fontSize: 14, outline: "none" }} />
          </div>
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 12, color: "#8A94A6", fontWeight: 500 }}>Policy</label>
            <div className="flex gap-2">
              <button onClick={() => setStatus("allowed")}
                style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: `1px solid ${status === "allowed" ? "#10B981" : "#E5E7EB"}`,
                  background: status === "allowed" ? "#D1FAE5" : "#fff", color: status === "allowed" ? "#065F46" : "#6B7280", fontWeight: 600, fontSize: 14 }}>
                ✅ Allow
              </button>
              <button onClick={() => setStatus("blocked")}
                style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: `1px solid ${status === "blocked" ? "#EF4444" : "#E5E7EB"}`,
                  background: status === "blocked" ? "#FEE2E2" : "#fff", color: status === "blocked" ? "#991B1B" : "#6B7280", fontWeight: 600, fontSize: 14 }}>
                🚫 Block
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280", fontWeight: 600, fontSize: 14 }}>Cancel</button>
          <button onClick={() => { if (toolName && domain) { onSave({ tool_name: toolName, domain, status }); onClose(); } }}
            style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: "#FF5C1A", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
            Save Rule
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Tab ───────────────────────────────────────────────────────────────
export function FirewallTab() {
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [blockEvents, setBlockEvents] = useState<BlockEvent[]>([]);
  const [stats, setStats] = useState<FirewallStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, b, s] = await Promise.all([
        fetchFirewallRules(),
        fetchBlockEvents(),
        fetchFirewallStats(),
      ]);
      setRules(r);
      setBlockEvents(b);
      setStats(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncFirewallRulesFromEvents();
      await load();
      toast.success("Synced AI tools from detection events!");
    } catch (e: any) {
      toast.error("Sync failed: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleToggle = async (rule: FirewallRule) => {
    const newStatus = rule.status === "allowed" ? "blocked" : "allowed";
    // Optimistic update
    setRules(prev => prev.map(r => r.id === rule.id ? { ...r, status: newStatus } : r));
    try {
      await updateFirewallRule({ tool_name: rule.tool_name, domain: rule.domain, status: newStatus });
      toast.success(`${rule.tool_name} set to ${newStatus.toUpperCase()}`);
    } catch (e: any) {
      // Revert on failure
      setRules(prev => prev.map(r => r.id === rule.id ? { ...r, status: rule.status } : r));
      toast.error("Failed to update rule: " + e.message);
    }
  };

  const handleDelete = async (rule: FirewallRule) => {
    setRules(prev => prev.filter(r => r.id !== rule.id));
    try {
      await deleteFirewallRule(rule.tool_name);
      toast.success(`Removed rule for ${rule.tool_name}`);
    } catch (e: any) {
      toast.error("Failed to delete: " + e.message);
      load();
    }
  };

  const handleAddRule = async (rule: { tool_name: string; domain: string; status: "allowed" | "blocked" }) => {
    setSaving(true);
    try {
      await updateFirewallRule(rule);
      await load();
      toast.success(`Rule added for ${rule.tool_name}`);
    } catch (e: any) {
      toast.error("Failed to save: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const blockedCount = rules.filter(r => r.status === "blocked").length;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#1A1D23", marginBottom: 2 }}>AI Firewall</h2>
          <p style={{ color: "#8A94A6", fontSize: 13 }}>Control which AI tools employees can access. Changes sync to all active agents.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleSync} disabled={syncing}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280", fontWeight: 600, fontSize: 13, cursor: syncing ? "not-allowed" : "pointer" }}>
            <RefreshCw size={14} strokeWidth={1.5} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing…" : "Sync from Events"}
          </button>
          <button onClick={() => setShowAddModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, border: "none", background: "#FF5C1A", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            <Plus size={14} strokeWidth={2} /> Add Rule
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <StatCard label="Tools Blocked Today" value={stats?.blockedToday ?? "—"} icon={ShieldOff} color="#EF4444" />
        <StatCard label="Block Events This Week" value={stats?.blockEventsThisWeek ?? "—"} icon={AlertTriangle} color="#F59E0B" />
        <StatCard label="Total Violations" value={stats?.policyViolations ?? "—"} icon={Lock} color="#8B5CF6" />
        <StatCard label="Compliance Score" value={stats ? `${stats.complianceScore}%` : "—"} icon={Shield} color="#10B981" />
      </div>

      {/* Policy Rules Table */}
      <div style={{ background: "#fff", border: "1px solid #F0F2F5", borderRadius: 16, overflow: "hidden" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #F0F2F5" }}>
          <div className="flex items-center gap-2">
            <Shield size={16} strokeWidth={1.5} style={{ color: "#FF5C1A" }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: "#1A1D23" }}>Policy Rules</span>
            {blockedCount > 0 && (
              <span style={{ background: "#FEE2E2", color: "#991B1B", fontWeight: 700, fontSize: 11, borderRadius: 20, padding: "2px 8px" }}>
                {blockedCount} BLOCKED
              </span>
            )}
          </div>
          <span style={{ fontSize: 12, color: "#8A94A6" }}>{rules.length} rules configured</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16" style={{ color: "#8A94A6" }}>
            <RefreshCw size={20} strokeWidth={1.5} className="animate-spin mr-2" /> Loading firewall rules…
          </div>
        ) : rules.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <Shield size={40} strokeWidth={1} style={{ color: "#D1D5DB" }} />
            <p style={{ color: "#9CA3AF", fontSize: 14 }}>No rules yet. Click <strong>Sync from Events</strong> to auto-populate from your detected tools.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F2F5" }}>
                {["Tool", "Domain", "Status", "Last Updated By", "Block Count", ""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#8A94A6", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((rule, i) => (
                <tr key={rule.id} style={{ borderBottom: i < rules.length - 1 ? "1px solid #F0F2F5" : "none" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1A1D23", fontSize: 14 }}>{rule.tool_name}</td>
                  <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: 13, fontFamily: "monospace" }}>{rule.domain || "—"}</td>
                  <td style={{ padding: "12px 16px" }}><RiskBadge status={rule.status} /></td>
                  <td style={{ padding: "12px 16px", color: "#8A94A6", fontSize: 12 }}>{rule.updated_by || "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {rule.block_count > 0 ? (
                      <span style={{ background: "#FEE2E2", color: "#991B1B", fontWeight: 700, fontSize: 12, borderRadius: 20, padding: "2px 8px" }}>
                        {rule.block_count}
                      </span>
                    ) : <span style={{ color: "#9CA3AF", fontSize: 12 }}>0</span>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div className="flex items-center gap-2">
                      {/* Toggle */}
                      <button onClick={() => handleToggle(rule)}
                        style={{
                          width: 42, height: 22, borderRadius: 11, border: "none", cursor: "pointer",
                          background: rule.status === "allowed" ? "#10B981" : "#EF4444",
                          position: "relative", transition: "background 200ms"
                        }}>
                        <span style={{
                          position: "absolute", top: 3, left: rule.status === "allowed" ? 22 : 3,
                          width: 16, height: 16, background: "#fff", borderRadius: "50%", transition: "left 200ms"
                        }} />
                      </button>
                      <button onClick={() => handleDelete(rule)}
                        style={{ padding: "4px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", color: "#9CA3AF" }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
                        onMouseLeave={e => (e.currentTarget.style.color = "#9CA3AF")}>
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Block Events Table */}
      <div style={{ background: "#fff", border: "1px solid #F0F2F5", borderRadius: 16, overflow: "hidden" }}>
        <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid #F0F2F5" }}>
          <ShieldOff size={16} strokeWidth={1.5} style={{ color: "#EF4444" }} />
          <span style={{ fontWeight: 700, fontSize: 15, color: "#1A1D23" }}>Block Events</span>
          {blockEvents.length > 0 && (
            <span style={{ background: "#FEE2E2", color: "#991B1B", fontWeight: 700, fontSize: 11, borderRadius: 20, padding: "2px 8px" }}>
              {blockEvents.length}
            </span>
          )}
        </div>

        {blockEvents.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <CheckCircle size={36} strokeWidth={1} style={{ color: "#D1FAE5" }} />
            <p style={{ color: "#9CA3AF", fontSize: 14 }}>No block events recorded yet.</p>
            <p style={{ color: "#C0C8D4", fontSize: 12 }}>Block events appear here when the Desktop Agent intercepts a connection.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F2F5" }}>
                {["Time", "Employee", "Tool", "Reason", "Device"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#8A94A6", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blockEvents.map((ev, i) => (
                <tr key={ev.id} style={{ borderBottom: i < blockEvents.length - 1 ? "1px solid #F0F2F5" : "none" }}>
                  <td style={{ padding: "11px 16px", color: "#6B7280", fontSize: 12, whiteSpace: "nowrap" }}>
                    <div className="flex items-center gap-1"><Clock size={12} strokeWidth={1.5} /> {fmtTs(ev.timestamp)}</div>
                  </td>
                  <td style={{ padding: "11px 16px", fontWeight: 600, color: "#1A1D23", fontSize: 13 }}>{ev.user_id || "—"}</td>
                  <td style={{ padding: "11px 16px" }}>
                    <span style={{ background: "#FEE2E2", color: "#991B1B", fontWeight: 600, fontSize: 12, borderRadius: 8, padding: "3px 8px" }}>
                      🚫 {ev.tool_name}
                    </span>
                  </td>
                  <td style={{ padding: "11px 16px", color: "#8A94A6", fontSize: 12 }}>{ev.block_reason || ev.policy_matched || "Policy violation"}</td>
                  <td style={{ padding: "11px 16px" }}>
                    <div className="flex items-center gap-1" style={{ color: "#8A94A6", fontSize: 12 }}>
                      <Laptop size={12} strokeWidth={1.5} /> {ev.device_id ? ev.device_id.slice(0, 12) + "…" : "—"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <AddToolModal onClose={() => setShowAddModal(false)} onSave={handleAddRule} />
      )}
    </div>
  );
}
