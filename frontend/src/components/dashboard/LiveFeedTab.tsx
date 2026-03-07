import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  ChevronDown,
  Download,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEvents, useStats } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import type { DetectionEvent } from "@/data/mockData";

// ─── Types ─────────────────────────────────────────────────────────────────

type CategoryKey = "api" | "coding" | "video" | "search" | "image" | "productivity";
type RiskKey = "high" | "medium" | "low";

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return "just now";
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}hr ago`;
  const d = new Date(timestamp);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Badge configs ──────────────────────────────────────────────────────────

const categoryConf: Record<CategoryKey, { label: string; bg: string; text: string; border: string }> = {
  api:          { label:"Api",          bg:"rgba(59,130,246,0.08)",  text:"#3B82F6", border:"rgba(59,130,246,0.2)"  },
  coding:       { label:"Coding",       bg:"rgba(6,182,212,0.08)",   text:"#0891B2", border:"rgba(6,182,212,0.2)"   },
  video:        { label:"Video",        bg:"rgba(139,92,246,0.08)",  text:"#7C3AED", border:"rgba(139,92,246,0.2)"  },
  search:       { label:"Search",       bg:"rgba(20,184,166,0.08)",  text:"#0D9488", border:"rgba(20,184,166,0.2)"  },
  image:        { label:"Image",        bg:"rgba(236,72,153,0.08)",  text:"#DB2777", border:"rgba(236,72,153,0.2)"  },
  productivity: { label:"Productivity", bg:"rgba(34,197,94,0.08)",   text:"#16A34A", border:"rgba(34,197,94,0.2)"   },
};

const defaultCategoryConf = { label: "Other", bg: "rgba(100,116,139,0.08)", text: "#64748B", border: "rgba(100,116,139,0.2)" };

const riskConf: Record<RiskKey, { label: string; bg: string; text: string; border: string }> = {
  high:   { label:"High",   bg:"rgba(220,38,38,0.08)",   text:"#DC2626", border:"rgba(220,38,38,0.2)"   },
  medium: { label:"Medium", bg:"rgba(217,119,6,0.08)",   text:"#D97706", border:"rgba(217,119,6,0.2)"   },
  low:    { label:"Low",    bg:"rgba(22,163,74,0.08)",   text:"#16A34A", border:"rgba(22,163,74,0.2)"   },
};

// ─── Mini components ────────────────────────────────────────────────────────

function Pill({ bg, text, border, label }: { bg: string; text: string; border: string; label: string }) {
  return (
    <span
      className="inline-flex items-center font-medium"
      style={{
        backgroundColor: bg,
        color: text,
        border: `1px solid ${border}`,
        borderRadius: 9999,
        padding: "3px 10px",
        fontSize: 12,
        fontFamily: "Inter, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function KpiCard({
  label, value, sub,
  orange = false,
  isLoading = false,
}: {
  label: string;
  value: string;
  sub: React.ReactNode;
  orange?: boolean;
  isLoading?: boolean;
}) {
  return (
    <div
      className="flex-1 min-w-0 cursor-pointer"
      style={{
        backgroundColor: orange ? "#FF5C1A" : "#ffffff",
        border: `1px solid ${orange ? "#FDDCC8" : "#F0F2F5"}`,
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        transition: "transform 200ms ease, box-shadow 200ms ease",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-1px)";
        el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
      }}
    >
      <p
        className="font-semibold tracking-widest uppercase"
        style={{ fontSize: 10, color: orange ? "rgba(255,255,255,0.75)" : "#94A3B8", letterSpacing: "0.08em" }}
      >
        {label}
      </p>
      {isLoading ? (
        <Skeleton className="h-8 w-16 mt-2" style={{ backgroundColor: orange ? "rgba(255,255,255,0.2)" : undefined }} />
      ) : (
        <p
          className="font-bold mt-2 leading-none"
          style={{ fontSize: 32, color: orange ? "#ffffff" : "#1A1A2E", fontFamily: "Inter, sans-serif" }}
        >
          {value}
        </p>
      )}
      <div className="flex items-center gap-1.5 mt-2">{sub}</div>
    </div>
  );
}

function SelectDropdown({ 
  label, 
  value, 
  onChange, 
  options 
}: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  options: { label: string; value: string }[] 
}) {
  return (
    <div className="relative flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none outline-none cursor-pointer pr-8 font-medium"
        style={{
          backgroundColor: value ? "#FFF3EE" : "#F8FAFC",
          border: value ? "1px solid #FDDCC8" : "1px solid #E2E8F0",
          borderRadius: 12,
          padding: "8px 14px",
          fontSize: 14,
          color: value ? "#FF5C1A" : "#1A1A2E",
          fontFamily: "Inter, sans-serif",
          transition: "all 150ms ease"
        }}
      >
        <option value="">{label}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown
        size={14}
        color={value ? "#FF5C1A" : "#94A3B8"}
        className="absolute right-3 pointer-events-none transition-colors"
      />
    </div>
  );
}

// ─── Skeleton rows for loading state ────────────────────────────────────────

function TableRowSkeleton() {
  return (
    <tr style={{ borderBottom: "1px solid #F8FAFC" }}>
      <td style={{ padding: "0 0 0 20px", width: 36 }}>
        <Skeleton className="h-4 w-4 rounded" />
      </td>
      <td style={{ padding: "18px 12px" }}><Skeleton className="h-4 w-16" /></td>
      <td style={{ padding: "18px 12px" }}>
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="h-3 w-16" />
      </td>
      <td style={{ padding: "18px 12px" }}><Skeleton className="h-5 w-16 rounded-full" /></td>
      <td style={{ padding: "18px 12px" }}><Skeleton className="h-5 w-14 rounded-full" /></td>
      <td style={{ padding: "18px 12px" }}><Skeleton className="h-4 w-20" /></td>
      <td style={{ padding: "18px 12px" }}><Skeleton className="h-4 w-28" /></td>
      <td style={{ padding: "18px 12px" }}><Skeleton className="h-4 w-20" /></td>
      <td style={{ padding: "18px 20px 18px 12px" }}><Skeleton className="h-4 w-4 rounded-full" /></td>
    </tr>
  );
}

// ─── Main exported component ────────────────────────────────────────────────

export function LiveFeedTab() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [isFading, setIsFading] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  // Filters State
  const [categoryFilter, setCategoryFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  // API hooks — pass category and risk filters to the API
  const {
    data: eventsData,
    isLoading: eventsLoading,
    error: eventsError,
  } = useEvents(
    categoryFilter || undefined,
    riskFilter || undefined,
  );

  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useStats();

  // Map API events to display rows
  const apiEvents: DetectionEvent[] = eventsData?.events ?? [];

  // Client-side filter for vendor (sourceFilter)
  const filteredEvents = apiEvents.filter(ev => {
    if (sourceFilter && ev.vendor !== sourceFilter) return false;
    return true;
  });

  const ITEMS_PER_PAGE = 10;
  const totalItems = filteredEvents.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  const handlePageChange = (p: number) => {
    if (p === page || p < 1 || p > totalPages) return;
    setIsFading(true);
    setTimeout(() => {
      setPage(p);
      setIsFading(false);
    }, 200);
  };

  // Reset page when filters change
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (val: string) => {
    setter(val);
    setPage(1);
    setChecked(new Set());
  };

  const paginatedEvents = filteredEvents.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getPages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, "...", totalPages];
    if (page >= totalPages - 2) return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  const toggle = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setChecked(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const isAllChecked = paginatedEvents.length > 0 && paginatedEvents.every(ev => checked.has(ev.event_id));
  const toggleAll = () => {
    if (isAllChecked) {
      setChecked(new Set());
    } else {
      const newChecked = new Set(checked);
      paginatedEvents.forEach(ev => newChecked.add(ev.event_id));
      setChecked(newChecked);
    }
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: `Downloading ${totalItems} event records as CSV.`,
      duration: 3000,
    });
  };

  const handleBulkAction = (action: string) => {
    toast({
      title: "Bulk Action Applied",
      description: `Successfully applied '${action}' to ${checked.size} events.`,
      duration: 3000,
    });
    setChecked(new Set());
  };

  const cols = ["", "TIME", "TOOL", "CATEGORY", "RISK", "PROCESS", "DOMAIN", "DEPARTMENT", "APPROVED"];

  // KPI values from stats API
  const kpiEventsToday = statsData?.totalDetections ?? 0;
  const kpiUniqueTools = statsData?.uniqueTools ?? 0;
  const kpiHighRisk = statsData?.highRiskCount ?? 0;
  const kpiUnapproved = statsData?.unapprovedCount ?? 0;

  return (
    <div className="flex flex-col gap-4">

      {/* ── Section 1: Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-bold leading-tight"
            style={{ fontSize: 22, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}
          >
            Live Feed
          </h1>
          <p style={{ fontSize: 14, color: "#94A3B8", marginTop: 3 }}>
            Real-time AI tool detections across all devices
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className="relative flex h-2.5 w-2.5"
            aria-hidden
          >
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: "#16A34A" }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ backgroundColor: "#16A34A" }}
            />
          </span>
          <span
            className="font-semibold"
            style={{ fontSize: 13, color: "#16A34A" }}
          >
            Live
          </span>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>
            · Auto-refreshing every 10s
          </span>
        </div>
      </div>

      {/* ── Section 2: KPI strip ─────────────────────────────────────── */}
      {statsError && (
        <p style={{ fontSize: 13, color: "#DC2626", padding: "4px 0" }}>
          Failed to load stats. Retrying…
        </p>
      )}
      <div className="flex gap-4">
        <KpiCard
          label="Events Today"
          value={String(kpiEventsToday)}
          orange
          isLoading={statsLoading}
          sub={
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.80)" }}>
              Detected today
            </span>
          }
        />
        <KpiCard
          label="Unique Tools"
          value={String(kpiUniqueTools)}
          isLoading={statsLoading}
          sub={
            <>
              <span className="rounded-full" style={{ width: 7, height: 7, backgroundColor: "#3B82F6", display: "inline-block" }} />
              <span style={{ fontSize: 12, color: "#64748B" }}>Active right now</span>
            </>
          }
        />
        <KpiCard
          label="High Risk"
          value={String(kpiHighRisk)}
          isLoading={statsLoading}
          sub={
            <>
              <span className="rounded-full" style={{ width: 7, height: 7, backgroundColor: "#DC2626", display: "inline-block" }} />
              <span style={{ fontSize: 12, color: "#DC2626" }}>Needs review</span>
            </>
          }
        />
        <KpiCard
          label="Unapproved"
          value={String(kpiUnapproved)}
          isLoading={statsLoading}
          sub={
            <>
              <span className="rounded-full" style={{ width: 7, height: 7, backgroundColor: "#D97706", display: "inline-block" }} />
              <span style={{ fontSize: 12, color: "#D97706" }}>Not sanctioned</span>
            </>
          }
        />
      </div>

      {/* ── Section 3: Filter row & Bulk Actions ────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SelectDropdown 
            label="All Categories" 
            value={categoryFilter} 
            onChange={handleFilterChange(setCategoryFilter)}
            options={[
              { label: "API", value: "api" },
              { label: "Coding", value: "coding" },
              { label: "Video", value: "video" },
              { label: "Search", value: "search" },
              { label: "Image", value: "image" },
              { label: "Productivity", value: "productivity" },
            ]}
          />
          <SelectDropdown 
            label="All Risk Levels" 
            value={riskFilter}
            onChange={handleFilterChange(setRiskFilter)}
            options={[
              { label: "High Risk", value: "high" },
              { label: "Medium Risk", value: "medium" },
              { label: "Low Risk", value: "low" },
            ]}
          />
          <SelectDropdown 
            label="All Sources" 
            value={sourceFilter}
            onChange={handleFilterChange(setSourceFilter)}
            options={[
              { label: "OpenAI", value: "OpenAI" },
              { label: "Anthropic", value: "Anthropic" },
              { label: "Microsoft", value: "Microsoft" },
              { label: "Google", value: "Google" },
              { label: "Runway", value: "Runway" },
            ]}
          />
          {checked.size > 0 && (
            <div className="flex items-center gap-2 ml-4 animate-in fade-in slide-in-from-left-2 text-sm font-medium text-[#FF5C1A] bg-[#FFF3EE] px-3 py-1.5 rounded-xl border border-[#FDDCC8]">
              <span>{checked.size} selected</span>
              <div className="w-px h-4 bg-[#FFD1B8] mx-1" />
              <button 
                onClick={() => handleBulkAction("Mark Approved")}
                className="hover:underline transition-all"
              >
                Approve
              </button>
              <button 
                onClick={() => handleBulkAction("Escalate Risk")}
                className="hover:underline transition-all ml-1"
              >
                Escalate
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 font-medium transition-colors"
          style={{
            padding: "8px 16px",
            backgroundColor: "#ffffff",
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            fontSize: 14,
            color: "#1A1A2E",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F8FAFC"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#ffffff"; }}
        >
          <Download size={15} strokeWidth={2} />
          Export CSV
        </button>
      </div>

      {/* ── Section 4: Main event table ───────────────────────────────── */}
      {eventsError && (
        <p style={{ fontSize: 13, color: "#DC2626", padding: "4px 0" }}>
          Failed to load events. Retrying…
        </p>
      )}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #F0F2F5",
          borderRadius: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            {/* Header */}
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC" }}>
                {cols.map((col, i) => (
                  <th
                    key={i}
                    className="text-left font-semibold tracking-widest"
                    style={{
                      padding: i === 0 ? "12px 0 12px 20px" : i === cols.length - 1 ? "12px 20px 12px 12px" : "12px 12px",
                      fontSize: 11,
                      color: "#94A3B8",
                      letterSpacing: "0.07em",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                    }}
                  >
                    {i === 0 ? (
                      <div
                        onClick={toggleAll}
                        className="flex items-center justify-center rounded cursor-pointer"
                        style={{
                          width: 16, height: 16,
                          border: isAllChecked ? "none" : "1.5px solid #D1D5DB",
                          backgroundColor: isAllChecked ? "#FF5C1A" : "transparent",
                          borderRadius: 4,
                          flexShrink: 0,
                          transition: "all 150ms ease"
                        }}
                      >
                        {isAllChecked && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                    ) : (
                      col
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Rows */}
            <tbody style={{ opacity: isFading ? 0 : 1, transition: "opacity 200ms ease" }}>
              {eventsLoading ? (
                // Skeleton loading rows
                Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <TableRowSkeleton key={`skel-${i}`} />
                ))
              ) : paginatedEvents.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={cols.length} style={{ padding: "48px 0", textAlign: "center" }}>
                    <p style={{ fontSize: 15, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                      No events detected yet
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((ev, idx) => {
                  const isChecked = checked.has(ev.event_id);
                  const isLast = idx === paginatedEvents.length - 1;
                  const catKey = ev.category as CategoryKey;
                  const cat = categoryConf[catKey] ?? defaultCategoryConf;
                  const riskKey = ev.risk_level as RiskKey;
                  const risk = riskConf[riskKey] ?? riskConf.low;
                  return (
                    <tr
                      key={ev.event_id}
                      className="cursor-pointer transition-colors"
                      style={{
                        backgroundColor: isChecked ? "#FFF8F5" : "transparent",
                        borderBottom: isLast ? "none" : "1px solid #F8FAFC",
                        minHeight: 60,
                        transition: "background-color 150ms ease",
                      }}
                      onMouseEnter={e => { if (!isChecked) (e.currentTarget as HTMLElement).style.backgroundColor = "#FAFAFA"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = isChecked ? "#FFF8F5" : "transparent"; }}
                    >
                      {/* Checkbox */}
                      <td style={{ padding: "0 0 0 20px", width: 36 }}>
                        <div
                          onClick={() => toggle(ev.event_id)}
                          className="flex items-center justify-center rounded cursor-pointer"
                          style={{
                            width: 16, height: 16,
                            border: isChecked ? "none" : "1.5px solid #D1D5DB",
                            backgroundColor: isChecked ? "#FF5C1A" : "transparent",
                            borderRadius: 4,
                            flexShrink: 0,
                          }}
                        >
                          {isChecked && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>
                      </td>

                      {/* Time */}
                      <td style={{ padding: "18px 12px", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 13, color: "#94A3B8" }}>{formatRelativeTime(ev.timestamp)}</span>
                      </td>

                      {/* Tool + vendor */}
                      <td style={{ padding: "18px 12px" }}>
                        <p className="font-semibold" style={{ fontSize: 14, color: "#1A1A2E", lineHeight: 1.3 }}>{ev.tool_name}</p>
                        <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.3 }}>{ev.vendor}</p>
                      </td>

                      {/* Category badge */}
                      <td style={{ padding: "18px 12px" }}>
                        <Pill bg={cat.bg} text={cat.text} border={cat.border} label={cat.label} />
                      </td>

                      {/* Risk badge */}
                      <td style={{ padding: "18px 12px" }}>
                        <Pill bg={risk.bg} text={risk.text} border={risk.border} label={risk.label} />
                      </td>

                      {/* Process — monospace orange */}
                      <td style={{ padding: "18px 12px", whiteSpace: "nowrap" }}>
                        <span style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 13, color: "#FF5C1A" }}>
                          {ev.process_name}
                        </span>
                      </td>

                      {/* Domain */}
                      <td style={{ padding: "18px 12px", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 13, color: "#64748B" }}>{ev.domain}</span>
                      </td>

                      {/* Department */}
                      <td style={{ padding: "18px 12px" }}>
                        <span style={{ fontSize: 14, color: "#1A1A2E" }}>{ev.department}</span>
                      </td>

                      {/* Approved */}
                      <td style={{ padding: "18px 20px 18px 12px" }}>
                        {ev.is_approved
                          ? <CheckCircle2 size={18} strokeWidth={2} color="#16A34A" />
                          : <XCircle     size={18} strokeWidth={2} color="#DC2626" />
                        }
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer / pagination */}
        {!eventsLoading && totalItems > 0 && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: "1px solid #F8FAFC" }}
          >
            <span style={{ fontSize: 13, color: "#94A3B8" }}>
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, totalItems)} of {totalItems} events
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                className="flex items-center gap-1 font-medium transition-colors"
                style={{ fontSize: 13, color: page === 1 ? "#CBD5E1" : "#64748B", padding: "5px 10px", borderRadius: 8, border: "1px solid #E2E8F0", backgroundColor: "transparent", cursor: page === 1 ? "not-allowed" : "pointer" }}
                onMouseEnter={e => { if (page !== 1) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F8FAFC"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                onClick={() => handlePageChange(page - 1)}
              >
                <ChevronLeft size={13} strokeWidth={2} /> Prev
              </button>

              {getPages().map((p, idx) => (
                p === "..." ? (
                  <span key={`dots-${idx}`} style={{ fontSize: 13, color: "#CBD5E1", padding: "0 4px" }}>…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p as number)}
                    style={{
                      width: 30, height: 30, borderRadius: 8, fontSize: 13, cursor: "pointer",
                      border: p === page ? "1px solid #1A1A2E" : "1px solid #E2E8F0",
                      backgroundColor: p === page ? "#1A1A2E" : "transparent",
                      color: p === page ? "#ffffff" : "#64748B",
                      fontWeight: p === page ? 600 : 400,
                      transition: "all 150ms ease",
                    }}
                    onMouseEnter={e => { if (p !== page) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F8FAFC"; }}
                    onMouseLeave={e => { if (p !== page) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                  >
                    {p}
                  </button>
                )
              ))}

              <button
                disabled={page === totalPages}
                className="flex items-center gap-1 font-medium transition-colors"
                style={{ fontSize: 13, color: page === totalPages ? "#CBD5E1" : "#64748B", padding: "5px 10px", borderRadius: 8, border: "1px solid #E2E8F0", backgroundColor: "transparent", cursor: page === totalPages ? "not-allowed" : "pointer" }}
                onMouseEnter={e => { if (page !== totalPages) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F8FAFC"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                onClick={() => handlePageChange(page + 1)}
              >
                Next <ChevronRight size={13} strokeWidth={2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
