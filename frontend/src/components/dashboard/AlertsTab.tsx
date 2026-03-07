import { useState, useMemo } from "react";
import {
  AlertTriangle, Info, CheckCircle2,
  ChevronDown, Bell, ShieldAlert, Pencil, Plus,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAlerts } from "@/hooks/useDashboard";
import { resolveAlert, dismissAlert, type AlertItem } from "@/services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ─────────────────────────────────────────────────────────────────

type Severity = "critical" | "high" | "medium" | "resolved";

interface Alert {
  id: string;
  severity: Severity;
  unread: boolean;
  title: string;
  desc: string;
  user: string;
  tool: string;
  dept: string;
  time: string;
  resolvedBy?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return "Just now";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function mapAlertSeverity(item: AlertItem): Severity {
  if (item.type === "high_risk" || item.type === "tamper") return "critical";
  if (item.type === "unapproved" || item.type === "high_frequency") return "high";
  return "medium";
}

function extractToolFromAlert(item: AlertItem): string {
  // Try to extract a tool name from title or description
  const toolPatterns = /\b(ChatGPT|OpenAI|Midjourney|Claude|Perplexity|Copilot|Replicate|Runway|Cursor|Gemini|Character\.ai|Grammarly|Notion|Jasper)\b/i;
  const titleMatch = item.title.match(toolPatterns);
  if (titleMatch) return titleMatch[1];
  const descMatch = item.description.match(toolPatterns);
  if (descMatch) return descMatch[1];
  return "\u2014";
}

function mapAlertItemToAlert(item: AlertItem): Alert {
  return {
    id: item.id,
    severity: mapAlertSeverity(item),
    unread: true,
    title: item.title,
    desc: item.description,
    user: "\u2014",
    tool: extractToolFromAlert(item),
    dept: "\u2014",
    time: formatRelativeTime(item.timestamp),
  };
}

// ─── Severity config ───────────────────────────────────────────────────────

const sevConf: Record<Severity, { border: string; badge: string; badgeText: string; badgeBorder: string; iconBg: string; iconColor: string; label: string }> = {
  critical: { border:"#DC2626", badge:"rgba(220,38,38,0.08)", badgeText:"#DC2626", badgeBorder:"rgba(220,38,38,0.2)", iconBg:"rgba(220,38,38,0.08)", iconColor:"#DC2626", label:"Critical" },
  high:     { border:"#FF5C1A", badge:"rgba(255,92,26,0.08)",  badgeText:"#FF5C1A", badgeBorder:"rgba(255,92,26,0.2)",  iconBg:"rgba(255,92,26,0.08)",  iconColor:"#FF5C1A", label:"High"     },
  medium:   { border:"#D97706", badge:"rgba(217,119,6,0.08)",  badgeText:"#D97706", badgeBorder:"rgba(217,119,6,0.2)",  iconBg:"rgba(217,119,6,0.08)",  iconColor:"#D97706", label:"Medium"   },
  resolved: { border:"#16A34A", badge:"rgba(22,163,74,0.08)",  badgeText:"#16A34A", badgeBorder:"rgba(22,163,74,0.2)",  iconBg:"rgba(22,163,74,0.08)",  iconColor:"#16A34A", label:"Resolved" },
};

function alertIcon(s: Severity) {
  if (s === "critical" || s === "high") return AlertTriangle;
  if (s === "resolved") return CheckCircle2;
  return Info;
}

// ─── Pill Toggle ───────────────────────────────────────────────────────────

function PillToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={on}
      style={{
        width: 44, height: 24, borderRadius: 9999,
        backgroundColor: on ? "#FF5C1A" : "#F0F2F5",
        border: "none", cursor: "pointer", position: "relative",
        flexShrink: 0, transition: "background-color 200ms ease",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: 9999,
        backgroundColor: "#ffffff",
        transition: "left 200ms ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.20)",
        display: "block",
      }} />
    </button>
  );
}

// ─── Select Dropdown ───────────────────────────────────────────────────────

function FilterSelect({ label }: { label: string }) {
  return (
    <div className="relative flex items-center">
      <select className="appearance-none outline-none cursor-pointer pr-8 font-medium"
        style={{ backgroundColor:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:12, padding:"7px 14px", fontSize:13, color:"#1A1A2E", fontFamily:"Inter, sans-serif" }}>
        <option>{label}</option>
      </select>
      <ChevronDown size={13} color="#94A3B8" className="absolute right-3 pointer-events-none" />
    </div>
  );
}

// ─── Single Alert Row ──────────────────────────────────────────────────────

function AlertRow({ alert, onResolve, isResolving }: { alert: Alert; onResolve: (id: string) => void; isResolving?: boolean }) {
  const cf = sevConf[alert.severity];
  const Icon = alertIcon(alert.severity);
  const isResolved = alert.severity === "resolved";

  return (
    <div
      style={{
        display: "flex", alignItems: "flex-start", gap: 16,
        padding: "18px 20px",
        borderLeft: `3px solid ${cf.border}`,
        borderBottom: "1px solid #F8FAFC",
        position: "relative",
        opacity: isResolved ? 0.75 : 1,
        transition: "background-color 150ms",
        backgroundColor: "transparent",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "#FAFAFA"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent"; }}
    >
      {/* Icon */}
      <div className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 38, height: 38, backgroundColor: cf.iconBg, marginTop: 2 }}>
        <Icon size={17} strokeWidth={2} color={cf.iconColor} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Severity badge */}
          <span className="font-semibold" style={{ fontSize: 11, backgroundColor: cf.badge, color: cf.badgeText, border: `1px solid ${cf.badgeBorder}`, borderRadius: 9999, padding: "2px 8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {cf.label}
          </span>
          <span className="font-semibold" style={{ fontSize: 14, color: "#1A1A2E" }}>{alert.title}</span>
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4, lineHeight: 1.4 }}>{alert.desc}</p>

        {/* Meta row */}
        <div className="flex items-center flex-wrap gap-1 mt-2" style={{ fontSize: 12, color: "#94A3B8" }}>
          <span>User: <span style={{ color: "#64748B" }}>{alert.user}</span></span>
          <span style={{ color: "#CBD5E1" }}>•</span>
          <span>Tool: <span style={{ color: "#64748B" }}>{alert.tool}</span></span>
          <span style={{ color: "#CBD5E1" }}>•</span>
          <span>Dept: <span style={{ color: "#64748B" }}>{alert.dept}</span></span>
          <span style={{ color: "#CBD5E1" }}>•</span>
          <span>{alert.time}</span>
          {alert.resolvedBy && (
            <>
              <span style={{ color: "#CBD5E1" }}>•</span>
              <span>Resolved by <span style={{ color: "#16A34A" }}>{alert.resolvedBy}</span></span>
            </>
          )}
        </div>
      </div>

      {/* Right: unread dot + actions */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {/* Unread dot */}
        {alert.unread && (
          <span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: "#FF5C1A", display: "block", marginBottom: 4 }} />
        )}

        {isResolved ? (
          <span className="font-semibold" style={{ fontSize: 12, backgroundColor: "rgba(22,163,74,0.08)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.2)", borderRadius: 9999, padding: "3px 10px" }}>
            Resolved ✓
          </span>
        ) : (
          <div className="flex items-center gap-3">
            <button className="font-semibold" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#FF5C1A", fontFamily: "Inter, sans-serif", padding: 0 }}>
              View Details
            </button>
            <button className="font-medium" style={{ background: "none", border: "none", cursor: isResolving ? "wait" : "pointer", fontSize: 13, color: "#94A3B8", fontFamily: "Inter, sans-serif", padding: 0, opacity: isResolving ? 0.5 : 1 }}
              onClick={() => onResolve(alert.id)}
              disabled={isResolving}>
              {isResolving ? "Resolving..." : "Resolve"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export function AlertsTab() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [localResolved, setLocalResolved] = useState<Map<string, string>>(new Map());
  const [rules, setRules] = useState([true, true, false]);
  const [hoverRule, setHoverRule] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alertItems, isLoading, error } = useAlerts();

  const resolveMutation = useMutation({
    mutationFn: resolveAlert,
    onSuccess: (_data, alertId) => {
      setLocalResolved(prev => new Map(prev).set(alertId, "Admin"));
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast({
        title: "Alert Resolved",
        description: "Policy violation marked as cleared successfully.",
        duration: 3000,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to resolve alert",
        description: err.message,
        duration: 4000,
      });
    },
  });

  const alerts: Alert[] = useMemo(() => {
    if (!alertItems) return [];
    return alertItems.map(item => {
      const alert = mapAlertItemToAlert(item);
      if (localResolved.has(item.id)) {
        return { ...alert, severity: "resolved" as Severity, unread: false, resolvedBy: localResolved.get(item.id) };
      }
      return alert;
    });
  }, [alertItems, localResolved]);

  const displayed = unreadOnly ? alerts.filter(a => a.unread) : alerts;

  const handleResolve = (id: string) => {
    resolveMutation.mutate(id);
  };

  // Computed stats
  const criticalCount = alerts.filter(a => a.severity === "critical").length;
  const highCount = alerts.filter(a => a.severity === "high").length;
  const mediumCount = alerts.filter(a => a.severity === "medium").length;
  const resolvedCount = alerts.filter(a => a.severity === "resolved").length;

  const ruleConf = [
    { Icon: ShieldAlert, color: "#FF5C1A", label: "Finance dept uses unapproved tool", action: "Block + Alert", actionColor: "#DC2626", actionBg: "rgba(220,38,38,0.08)", actionBorder: "rgba(220,38,38,0.2)" },
    { Icon: AlertTriangle, color: "#DC2626", label: "HIGH risk tool detected",          action: "Alert only",   actionColor: "#D97706", actionBg: "rgba(217,119,6,0.08)",  actionBorder: "rgba(217,119,6,0.2)"  },
    { Icon: Bell,          color: "#D97706", label: "After-hours usage",                action: "Log only",     actionColor: "#64748B", actionBg: "#F8FAFC",               actionBorder: "#E2E8F0"              },
  ];

  // ─── Loading skeleton ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold" style={{ fontSize: 22, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Alerts</h1>
            <p style={{ fontSize: 14, color: "#94A3B8", marginTop: 3 }}>Policy violations and high-risk activity notifications</p>
          </div>
        </div>
        <div className="flex gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-1" style={{ borderRadius: 16, padding: 20, border: "1px solid #F0F2F5" }}>
              <Skeleton className="h-3 w-20 mb-3" />
              <Skeleton className="h-9 w-12 mb-2" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #F0F2F5", borderRadius: 16, overflow: "hidden" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #F8FAFC" }}>
            <Skeleton className="h-5 w-32" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-4" style={{ borderBottom: "1px solid #F8FAFC" }}>
              <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-64 mb-2" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Error state ───────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold" style={{ fontSize: 22, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Alerts</h1>
            <p style={{ fontSize: 14, color: "#94A3B8", marginTop: 3 }}>Policy violations and high-risk activity notifications</p>
          </div>
        </div>
        <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 16, padding: "16px 20px" }}>
          <p style={{ fontSize: 14, color: "#DC2626", fontWeight: 500 }}>
            Failed to load alerts: {error.message}
          </p>
          <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>
            Data will retry automatically. Check your connection if this persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold" style={{ fontSize: 22, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Alerts</h1>
          <p style={{ fontSize: 14, color: "#94A3B8", marginTop: 3 }}>Policy violations and high-risk activity notifications</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="font-semibold" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#FF5C1A", fontFamily: "Inter, sans-serif" }}>
            Mark all read
          </button>
          <button className="flex items-center gap-2 font-medium"
            style={{ backgroundColor: "#ffffff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "8px 14px", fontSize: 13, color: "#1A1A2E", cursor: "pointer", fontFamily: "Inter, sans-serif" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F8FAFC"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff"; }}>
            Configure Alerts
          </button>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────── */}
      <div className="flex gap-4">
        {[
          { label: "Critical",       value: String(criticalCount),  sub: "Immediate action",       orange: true,  dotColor: "", subColor: "rgba(255,255,255,0.80)" },
          { label: "High",           value: String(highCount),      sub: "Needs review",           orange: false, dotColor: "#DC2626", subColor: "#DC2626" },
          { label: "Medium",         value: String(mediumCount),    sub: "Monitor closely",        orange: false, dotColor: "#D97706", subColor: "#D97706" },
          { label: "Resolved",       value: String(resolvedCount),  sub: "Closed successfully",    orange: false, dotColor: "#16A34A", subColor: "#16A34A" },
        ].map(card => (
          <div key={card.label} className="flex-1"
            style={{ backgroundColor: card.orange ? "#FF5C1A" : "#ffffff", border: `1px solid ${card.orange ? "#FDDCC8" : "#F0F2F5"}`, borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "transform 200ms, box-shadow 200ms", cursor: "default" }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-1px)"; el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
          >
            <p className="font-semibold tracking-widest uppercase" style={{ fontSize: 10, color: card.orange ? "rgba(255,255,255,0.75)" : "#94A3B8", letterSpacing: "0.08em" }}>{card.label}</p>
            <p className="font-bold mt-2" style={{ fontSize: 36, color: card.orange ? "#ffffff" : "#1A1A2E", lineHeight: 1 }}>{card.value}</p>
            <div className="flex items-center gap-1.5 mt-2">
              {card.dotColor && <span className="rounded-full" style={{ width: 7, height: 7, backgroundColor: card.dotColor, display: "inline-block", flexShrink: 0 }} />}
              <span style={{ fontSize: 12, color: card.subColor }}>{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter Row ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FilterSelect label="All Severity" />
          <FilterSelect label="All Types"    />
        </div>
        <div className="flex items-center gap-2.5">
          <span style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>Unread only</span>
          <PillToggle on={unreadOnly} onToggle={() => setUnreadOnly(v => !v)} />
        </div>
      </div>

      {/* ── Alerts List ─────────────────────────────────────────── */}
      <div style={{ backgroundColor: "#ffffff", border: "1px solid #F0F2F5", borderRadius: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        {/* List header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #F8FAFC" }}>
          <p className="font-semibold" style={{ fontSize: 15, color: "#1A1A2E" }}>
            All Alerts
            <span className="font-normal ml-2" style={{ fontSize: 13, color: "#94A3B8" }}>
              ({displayed.length} showing)
            </span>
          </p>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>
            {alerts.filter(a => a.unread).length} unread
          </span>
        </div>

        {/* Alert rows */}
        {displayed.length > 0 ? (
          displayed.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onResolve={handleResolve}
              isResolving={resolveMutation.isPending && resolveMutation.variables === alert.id}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 size={32} strokeWidth={1.5} color="#CBD5E1" />
            <p className="mt-3 font-medium" style={{ fontSize: 14, color: "#94A3B8" }}>
              {unreadOnly ? "No unread alerts" : "No active alerts"}
            </p>
          </div>
        )}
      </div>

      {/* ── Alert Rules ─────────────────────────────────────────── */}
      <div style={{ backgroundColor: "#ffffff", border: "1px solid #F0F2F5", borderRadius: 16, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="font-semibold" style={{ fontSize: 15, color: "#1A1A2E" }}>Active Alert Rules</p>
            <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Automation policies governing alert behavior</p>
          </div>
          <button className="flex items-center gap-1.5 font-semibold"
            style={{ backgroundColor: "#FF5C1A", color: "#ffffff", border: "none", borderRadius: 10, padding: "7px 14px", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "background-color 200ms" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E5521A"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FF5C1A"; }}>
            <Plus size={13} strokeWidth={2.5} /> Add Rule
          </button>
        </div>

        {/* Rules */}
        <div className="flex flex-col gap-3">
          {ruleConf.map((rule, i) => (
            <div key={i}
              className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors"
              style={{ border: "1px solid #F0F2F5", cursor: "default", position: "relative" }}
              onMouseEnter={() => setHoverRule(i)}
              onMouseLeave={() => setHoverRule(null)}
            >
              {/* Icon */}
              <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 36, height: 36, backgroundColor: `${rule.color}14` }}>
                <rule.Icon size={16} strokeWidth={2} color={rule.color} />
              </div>

              {/* Label */}
              <span className="font-medium flex-1" style={{ fontSize: 14, color: "#1A1A2E" }}>{rule.label}</span>

              {/* Action badge */}
              <span className="font-semibold flex-shrink-0" style={{ fontSize: 12, backgroundColor: rule.actionBg, color: rule.actionColor, border: `1px solid ${rule.actionBorder}`, borderRadius: 9999, padding: "3px 10px" }}>
                {rule.action}
              </span>

              {/* Edit icon (hover) */}
              {hoverRule === i && (
                <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}>
                  <Pencil size={14} strokeWidth={2} color="#94A3B8" />
                </button>
              )}

              {/* Toggle */}
              <PillToggle on={rules[i]} onToggle={() => setRules(prev => prev.map((v, j) => j === i ? !v : v))} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
