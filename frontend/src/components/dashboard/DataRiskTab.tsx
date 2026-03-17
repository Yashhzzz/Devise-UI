import { useState, useEffect, useRef, useCallback } from "react";
import { AlertTriangle, RefreshCw, Eye, CheckCheck, User, FileCode, Upload, Clipboard, DollarSign, Key, TrendingUp, Clock, Laptop, ShieldAlert, Activity } from "lucide-react";
import { toast } from "sonner";
import {
  fetchSensitivityEvents,
  fetchEmployeeRiskScores,
  fetchDataRiskStats,
  markSensitivityEventReviewed,
  subscribeToHighRiskEvents,
  rebuildEmployeeRiskScores,
  type SensitivityEvent,
  type EmployeeRiskScore,
  type DataRiskStats,
  type SensitivityFlag,
} from "@/services/api";
import { auth } from "@/lib/firebase";

// ─── Helpers ────────────────────────────────────────────────────────────────
function fmtTs(ts: string | undefined) {
  if (!ts) return "—";
  const d = new Date(ts);
  return isNaN(d.getTime()) ? ts : d.toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
}

const FLAG_META: Record<SensitivityFlag, { label: string; color: string; bg: string; icon: React.ElementType; emoji: string }> = {
  SOURCE_CODE:          { label: "Source Code",         color: "#991B1B", bg: "#FEE2E2",  icon: FileCode,   emoji: "🔴" },
  FILE_UPLOAD:          { label: "File Upload",          color: "#991B1B", bg: "#FEE2E2",  icon: Upload,     emoji: "🔴" },
  LARGE_PASTE:          { label: "Large Paste",          color: "#92400E", bg: "#FEF3C7",  icon: Clipboard,  emoji: "🟡" },
  FINANCIAL_KEYWORDS:   { label: "Financial Keywords",   color: "#92400E", bg: "#FEF3C7",  icon: DollarSign, emoji: "🟡" },
  CREDENTIALS_PATTERN:  { label: "Credentials Pattern",  color: "#7C2D12", bg: "#FFEDD5",  icon: Key,        emoji: "🟠" },
};

function SensitivityBadge({ flag }: { flag: SensitivityFlag }) {
  const m = FLAG_META[flag] ?? { label: flag, color: "#6B7280", bg: "#F3F4F6", icon: AlertTriangle, emoji: "⚪" };
  const Icon = m.icon;
  return (
    <span style={{ background: m.bg, color: m.color, border: `1px solid ${m.color}40`, fontWeight: 600, fontSize: 11, borderRadius: 8, padding: "3px 8px" }}
      className="inline-flex items-center gap-1">
      <Icon size={11} strokeWidth={2} /> {m.emoji} {m.label}
    </span>
  );
}

function RiskScorePill({ score }: { score: number }) {
  const color = score >= 80 ? "#EF4444" : score >= 50 ? "#F59E0B" : "#10B981";
  const bg = score >= 80 ? "#FEE2E2" : score >= 50 ? "#FEF3C7" : "#D1FAE5";
  const label = score >= 80 ? "Critical" : score >= 50 ? "Medium" : "Low";
  return (
    <span style={{ background: bg, color, fontWeight: 700, fontSize: 12, borderRadius: 20, padding: "2px 10px", minWidth: 70, display: "inline-block", textAlign: "center" }}>
      {score} · {label}
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

// ─── Employee Slide-over ─────────────────────────────────────────────────────
function EmployeeDrawer({ employee, events, onClose }: { employee: EmployeeRiskScore; events: SensitivityEvent[]; onClose: () => void }) {
  const empEvents = events.filter(e => e.user_id === employee.user_email);
  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: "rgba(0,0,0,0.35)" }} onClick={onClose}>
      <div className="ml-auto h-full flex flex-col"
        style={{ width: 440, background: "#fff", boxShadow: "-8px 0 32px rgba(0,0,0,0.12)" }}
        onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5" style={{ borderBottom: "1px solid #F0F2F5" }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#FF5C1A22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={18} strokeWidth={1.5} style={{ color: "#FF5C1A" }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#1A1D23" }}>{employee.user_email}</div>
                <RiskScorePill score={employee.risk_score} />
              </div>
            </div>
            <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#9CA3AF", fontSize: 20, lineHeight: 1 }}>×</button>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="text-center"><div style={{ fontSize: 20, fontWeight: 700, color: "#EF4444" }}>{employee.high_risk_events}</div><div style={{ fontSize: 11, color: "#8A94A6" }}>High Risk</div></div>
            <div className="text-center"><div style={{ fontSize: 20, fontWeight: 700, color: "#F59E0B" }}>{employee.medium_risk_events}</div><div style={{ fontSize: 11, color: "#8A94A6" }}>Medium Risk</div></div>
            <div className="text-center"><div style={{ fontSize: 20, fontWeight: 700, color: "#8B5CF6" }}>{employee.top_sensitivity_type || "—"}</div><div style={{ fontSize: 11, color: "#8A94A6" }}>Top Flag</div></div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div style={{ fontWeight: 600, fontSize: 14, color: "#1A1D23", marginBottom: 12 }}>Event History</div>
          {empEvents.length === 0 ? (
            <p style={{ color: "#9CA3AF", fontSize: 13 }}>No events found for this employee in this view window.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {empEvents.map(ev => (
                <div key={ev.id} style={{ border: "1px solid #F0F2F5", borderRadius: 12, padding: "12px 14px" }}>
                  <div className="flex items-center justify-between mb-2">
                    <SensitivityBadge flag={ev.sensitivity_flag} />
                    <span style={{ fontSize: 11, color: "#9CA3AF" }}>{fmtTs(ev.timestamp)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{ev.tool_name}</div>
                  {ev.window_title && <div style={{ fontSize: 12, color: "#8A94A6", marginTop: 2 }}>🪟 {ev.window_title}</div>}
                  {ev.paste_size_chars && <div style={{ fontSize: 12, color: "#8A94A6" }}>📋 {ev.paste_size_chars.toLocaleString()} chars</div>}
                  {ev.file_name && <div style={{ fontSize: 12, color: "#8A94A6" }}>📄 {ev.file_name}</div>}
                  <div style={{ fontSize: 12, color: "#8A94A6", marginTop: 4 }}>Risk Score: <strong style={{ color: ev.sensitivity_score >= 70 ? "#EF4444" : "#F59E0B" }}>{ev.sensitivity_score}</strong></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Tab ────────────────────────────────────────────────────────────────
export function DataRiskTab() {
  const [events, setEvents] = useState<SensitivityEvent[]>([]);
  const [riskScores, setRiskScores] = useState<EmployeeRiskScore[]>([]);
  const [stats, setStats] = useState<DataRiskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<SensitivityFlag | "all">("all");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRiskScore | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ev, rs, st] = await Promise.all([
        fetchSensitivityEvents(),
        fetchEmployeeRiskScores(),
        fetchDataRiskStats(),
      ]);
      setEvents(ev);
      setRiskScores(rs);
      setStats(st);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Real-time listener for high-risk events
    const user = auth.currentUser;
    if (user) {
      // Get orgId from profile first, then subscribe
      import("@/services/api").then(({ fetchMe }) => {
        fetchMe().then(profile => {
          unsubRef.current = subscribeToHighRiskEvents(profile.org_id, (newEvents) => {
            if (newEvents.length > 0) {
              const latest = newEvents[0];
              toast.warning(`🔴 High-risk event detected: ${latest.tool_name} — ${FLAG_META[latest.sensitivity_flag]?.label ?? latest.sensitivity_flag}`, {
                duration: 6000,
              });
            }
          });
        }).catch(() => {});
      });
    }
    return () => { unsubRef.current?.(); };
  }, [load]);

  const handleRebuild = async () => {
    setRebuilding(true);
    try {
      await rebuildEmployeeRiskScores();
      const rs = await fetchEmployeeRiskScores();
      setRiskScores(rs);
      toast.success("Employee risk scores rebuilt!");
    } catch (e: any) {
      toast.error("Rebuild failed: " + e.message);
    } finally {
      setRebuilding(false);
    }
  };

  const handleMarkReviewed = async (ev: SensitivityEvent) => {
    try {
      await markSensitivityEventReviewed(ev.id);
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, reviewed: true } : e));
      toast.success("Event marked as reviewed");
    } catch (e: any) {
      toast.error("Failed: " + e.message);
    }
  };

  const filteredEvents = selectedFlag === "all"
    ? events
    : events.filter(e => e.sensitivity_flag === selectedFlag);

  const flags: (SensitivityFlag | "all")[] = ["all", "SOURCE_CODE", "FILE_UPLOAD", "LARGE_PASTE", "FINANCIAL_KEYWORDS", "CREDENTIALS_PATTERN"];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: "#1A1D23", marginBottom: 2 }}>Data Risk</h2>
          <p style={{ color: "#8A94A6", fontSize: 13 }}>Detect potential sensitive data exposure across all AI tools. Real-time signal monitoring.</p>
        </div>
        <button onClick={handleRebuild} disabled={rebuilding}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280", fontWeight: 600, fontSize: 13, cursor: rebuilding ? "not-allowed" : "pointer" }}>
          <RefreshCw size={14} strokeWidth={1.5} className={rebuilding ? "animate-spin" : ""} />
          {rebuilding ? "Rebuilding…" : "Rebuild Risk Scores"}
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <StatCard label="High Risk Events Today" value={stats?.highRiskToday ?? "—"} icon={ShieldAlert} color="#EF4444" />
        <StatCard label="Employees at Risk" value={stats?.employeesWithRisk ?? "—"} icon={User} color="#8B5CF6" />
        <StatCard label="Most Common Flag" value={stats?.mostCommonType || "—"} icon={AlertTriangle} color="#F59E0B" />
        <StatCard label="Org Risk Score" value={stats ? `${stats.orgRiskScore}%` : "—"} icon={Activity} color="#FF5C1A" />
      </div>

      {/* Events Feed */}
      <div style={{ background: "#fff", border: "1px solid #F0F2F5", borderRadius: 16, overflow: "hidden" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #F0F2F5" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} strokeWidth={1.5} style={{ color: "#EF4444" }} />
              <span style={{ fontWeight: 700, fontSize: 15, color: "#1A1D23" }}>Risk Events Feed</span>
              {events.length > 0 && (
                <span style={{ background: "#FEE2E2", color: "#991B1B", fontWeight: 700, fontSize: 11, borderRadius: 20, padding: "2px 8px" }}>
                  {events.filter(e => !e.reviewed).length} unreviewed
                </span>
              )}
            </div>
          </div>
          {/* Flag Filter */}
          <div className="flex gap-2 flex-wrap">
            {flags.map(f => {
              const isActive = selectedFlag === f;
              return (
                <button key={f} onClick={() => setSelectedFlag(f)}
                  style={{
                    padding: "4px 12px", borderRadius: 20, border: "1px solid #E5E7EB", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: isActive ? "#FF5C1A" : "#fff", color: isActive ? "#fff" : "#6B7280",
                    borderColor: isActive ? "#FF5C1A" : "#E5E7EB"
                  }}>
                  {f === "all" ? "All" : (FLAG_META[f as SensitivityFlag]?.emoji + " " + FLAG_META[f as SensitivityFlag]?.label)}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16" style={{ color: "#8A94A6" }}>
            <RefreshCw size={20} strokeWidth={1.5} className="animate-spin mr-2" /> Loading risk events…
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <ShieldAlert size={40} strokeWidth={1} style={{ color: "#D1D5DB" }} />
            <p style={{ color: "#9CA3AF", fontSize: 14 }}>No sensitivity events found.</p>
            <p style={{ color: "#C0C8D4", fontSize: 12 }}>Events appear here when the Desktop Agent detects data sensitivity signals.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredEvents.map((ev, i) => (
              <div key={ev.id}
                style={{
                  padding: "14px 20px", borderBottom: i < filteredEvents.length - 1 ? "1px solid #F9FAFB" : "none",
                  opacity: ev.reviewed ? 0.5 : 1, transition: "opacity 200ms"
                }}
                className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#F0F2F5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={16} strokeWidth={1.5} style={{ color: "#8A94A6" }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span style={{ fontWeight: 700, fontSize: 14, color: "#1A1D23" }}>{ev.user_id || "Unknown"}</span>
                      <SensitivityBadge flag={ev.sensitivity_flag} />
                      {ev.reviewed && <span style={{ background: "#D1FAE5", color: "#065F46", fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "1px 8px" }}>✓ Reviewed</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
                      Used <strong>{ev.tool_name}</strong>
                      {ev.domain && <span style={{ color: "#9CA3AF" }}> ({ev.domain})</span>}
                    </div>
                    {ev.window_title && (
                      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>🪟 <em>{ev.window_title}</em></div>
                    )}
                    {ev.paste_size_chars && (
                      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>📋 {ev.paste_size_chars.toLocaleString()} chars pasted</div>
                    )}
                    {ev.file_name && (
                      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 2 }}>📄 {ev.file_name}</div>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1" style={{ color: "#9CA3AF", fontSize: 11 }}>
                        <Clock size={11} strokeWidth={1.5} /> {fmtTs(ev.timestamp)}
                      </div>
                      {ev.device_id && (
                        <div className="flex items-center gap-1" style={{ color: "#9CA3AF", fontSize: 11 }}>
                          <Laptop size={11} strokeWidth={1.5} /> {ev.device_id.slice(0, 10)}…
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>Risk Score</div>
                    <span style={{
                      fontWeight: 800, fontSize: 18,
                      color: ev.sensitivity_score >= 70 ? "#EF4444" : ev.sensitivity_score >= 40 ? "#F59E0B" : "#10B981"
                    }}>{ev.sensitivity_score}</span>
                  </div>
                  {!ev.reviewed && (
                    <button onClick={() => handleMarkReviewed(ev)}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 10, border: "1px solid #E5E7EB", background: "#fff", color: "#6B7280", fontWeight: 600, fontSize: 12, cursor: "pointer" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#10B981"; (e.currentTarget as HTMLButtonElement).style.color = "#065F46"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#E5E7EB"; (e.currentTarget as HTMLButtonElement).style.color = "#6B7280"; }}>
                      <CheckCheck size={12} strokeWidth={2} /> Mark Reviewed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Employee Risk Leaderboard */}
      <div style={{ background: "#fff", border: "1px solid #F0F2F5", borderRadius: 16, overflow: "hidden" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #F0F2F5" }}>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} strokeWidth={1.5} style={{ color: "#8B5CF6" }} />
            <span style={{ fontWeight: 700, fontSize: 15, color: "#1A1D23" }}>Employee Risk Leaderboard</span>
          </div>
          <span style={{ fontSize: 12, color: "#8A94A6" }}>Click a row to see full history</span>
        </div>

        {riskScores.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <User size={36} strokeWidth={1} style={{ color: "#D1D5DB" }} />
            <p style={{ color: "#9CA3AF", fontSize: 14 }}>No risk scores yet. Click <strong>Rebuild Risk Scores</strong> after events are collected.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #F0F2F5" }}>
                {["Employee", "Risk Score", "High Risk Events", "Last Incident", "Top Flag"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#8A94A6", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riskScores.map((emp, i) => (
                <tr key={emp.id}
                  onClick={() => setSelectedEmployee(emp)}
                  style={{ borderBottom: i < riskScores.length - 1 ? "1px solid #F0F2F5" : "none", cursor: "pointer", transition: "background 150ms" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={{ padding: "12px 16px" }}>
                    <div className="flex items-center gap-2">
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#FF5C1A22", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <User size={14} strokeWidth={1.5} style={{ color: "#FF5C1A" }} />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 13, color: "#1A1D23" }}>{emp.user_email}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}><RiskScorePill score={emp.risk_score} /></td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: emp.high_risk_events > 0 ? "#EF4444" : "#9CA3AF" }}>
                      {emp.high_risk_events}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: 12 }}>{fmtTs(emp.last_incident)}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {emp.top_sensitivity_type ? (
                      <SensitivityBadge flag={emp.top_sensitivity_type as SensitivityFlag} />
                    ) : <span style={{ color: "#9CA3AF", fontSize: 12 }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Slide-over */}
      {selectedEmployee && (
        <EmployeeDrawer
          employee={selectedEmployee}
          events={events}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}
