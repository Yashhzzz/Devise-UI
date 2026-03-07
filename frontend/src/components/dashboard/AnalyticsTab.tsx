import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { ChevronDown, Check } from "lucide-react";
import { useAnalytics } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Shared card shell ─────────────────────────────────────────────────────
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex flex-col ${className}`}
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #F0F2F5",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-5">
      <p className="font-semibold" style={{ fontSize: 16, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>{title}</p>
      <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>{sub}</p>
    </div>
  );
}

// ─── Pie chart colors ──────────────────────────────────────────────────────
const PIE_COLORS = ["#DC2626", "#D97706", "#16A34A", "#3B82F6", "#7C3AED", "#0891B2", "#DB2777", "#64748B"];

// ─── Horizontal bar custom tooltip ────────────────────────────────────────
function BarTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#1A1A2E", color:"#fff", padding:"6px 12px", borderRadius:8, fontSize:12 }}>
      <b>{label}</b>: {payload[0].value}
    </div>
  );
}

// ─── Skeleton placeholders ─────────────────────────────────────────────────
function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="flex flex-col gap-3" style={{ height }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-7 w-7 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export function AnalyticsTab() {
  const [dateFilter, setDateFilter] = useState("Last 30 days");
  const [isDateOpen, setIsDateOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: analytics, isLoading, error } = useAnalytics();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDateOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateChange = (range: string) => {
    setDateFilter(range);
    setIsDateOpen(false);
    // Phase 2: re-fetch analytics with date range param
  };

  // Derived data from API
  const byCategory = analytics?.byCategory ?? [];
  const byTool = analytics?.byTool ?? [];
  const overTime = analytics?.overTime ?? [];
  const topProcesses = analytics?.topProcesses ?? [];

  // Prepare bar chart data (byCategory → horizontal bars)
  const barData = byCategory.map(c => ({ dept: c.name, count: c.value }));

  // Prepare pie chart data (byCategory as donut)
  const pieTotal = byCategory.reduce((sum, c) => sum + c.value, 0);
  const pieData = byCategory.map((c, i) => ({
    name: c.name,
    value: c.value,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  // Prepare top tools with rank and percent bar
  const maxToolCount = byTool.length > 0 ? Math.max(...byTool.map(t => t.count)) : 1;
  const toolsDisplay = byTool.slice(0, 5).map((t, i) => ({
    rank: i + 1,
    name: t.name,
    uses: t.count,
    pct: Math.round((t.count / maxToolCount) * 100),
  }));

  // Prepare overTime for vertical bar chart
  const overTimeData = overTime.map(d => ({ time: d.time, count: d.count }));

  // Top processes
  const maxProcCount = topProcesses.length > 0 ? Math.max(...topProcesses.map(p => p.count)) : 1;
  const processesDisplay = topProcesses.slice(0, 5).map((p, i) => ({
    rank: i + 1,
    name: p.name,
    uses: p.count,
    pct: Math.round((p.count / maxProcCount) * 100),
  }));

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold" style={{ fontSize:22, color:"#1A1A2E", fontFamily:"Inter, sans-serif" }}>Analytics</h1>
          <p style={{ fontSize:14, color:"#94A3B8", marginTop:3 }}>AI adoption and usage insights across your organization</p>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDateOpen(!isDateOpen)}
            className="flex items-center gap-2 font-medium"
            style={{ backgroundColor:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:12, padding:"8px 14px", fontSize:14, color:"#1A1A2E", cursor:"pointer", fontFamily:"Inter, sans-serif" }}
          >
            {dateFilter} <ChevronDown size={14} color="#94A3B8" strokeWidth={2} />
          </button>
          {isDateOpen && (
            <div 
              className="absolute top-full right-0 mt-2 bg-white flex flex-col z-10"
              style={{ width: 160, border: "1px solid #F0F2F5", borderRadius: 12, boxShadow: "0 10px 24px rgba(0,0,0,0.08)", padding: 6 }}
            >
              {["Last 7 days", "Last 30 days", "Last 3 months", "Last 12 months"].map(opt => (
                <button
                  key={opt}
                  onClick={() => handleDateChange(opt)}
                  className="flex items-center justify-between w-full text-left transition-colors"
                  style={{ padding: "8px 12px", borderRadius: 8, fontSize: 13, color: dateFilter === opt ? "#FF5C1A" : "#1A1A2E", fontFamily: "Inter, sans-serif", backgroundColor: dateFilter === opt ? "#FFF3EE" : "transparent" }}
                  onMouseEnter={e => { if (dateFilter !== opt) e.currentTarget.style.backgroundColor = "#F8FAFC"; }}
                  onMouseLeave={e => { if (dateFilter !== opt) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {opt}
                  {dateFilter === opt && <Check size={14} color="#FF5C1A" strokeWidth={2.5} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p style={{ fontSize: 13, color: "#DC2626", padding: "4px 0" }}>
          Failed to load analytics data. Retrying…
        </p>
      )}

      {/* Row 1 — Charts */}
      <div className="flex gap-4">

        {/* Left: Horizontal bar chart — Usage by Category */}
        <Card className="flex-1">
          <CardHeader title="Usage by Category" sub={`Total detections per category (${dateFilter.toLowerCase()})`} />
          {isLoading ? (
            <ChartSkeleton height={200} />
          ) : barData.length === 0 ? (
            <p style={{ fontSize: 14, color: "#94A3B8", textAlign: "center", padding: "40px 0" }}>No analytics data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} layout="vertical" margin={{ top:0, right:16, left:0, bottom:0 }} barCategoryGap="28%">
                <XAxis type="number" axisLine={false} tickLine={false}
                  tick={{ fontSize:11, fill:"#CBD5E1" }} />
                <YAxis type="category" dataKey="dept" axisLine={false} tickLine={false}
                  tick={{ fontSize:13, fill:"#94A3B8", fontFamily:"Inter, sans-serif" }} width={90} />
                <RTooltip content={<BarTip />} cursor={{ fill:"rgba(0,0,0,0.03)" }} />
                <Bar dataKey="count" fill="#FF5C1A" radius={[0, 6, 6, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Right: Donut chart — Category Distribution */}
        <div style={{ flex:"0 0 320px" }}>
          <Card>
          <CardHeader title="Category Distribution" sub={`Detections by category (${dateFilter.toLowerCase()})`} />
          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="rounded-full" style={{ width: 200, height: 200 }} />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ) : pieData.length === 0 ? (
            <p style={{ fontSize: 14, color: "#94A3B8", textAlign: "center", padding: "40px 0" }}>No analytics data yet</p>
          ) : (
            <div className="flex flex-col items-center">
              {/* Donut chart with center overlay */}
              <div className="relative inline-block">
                <ResponsiveContainer width={200} height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      strokeWidth={0}
                    >
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label as absolute overlay */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                >
                  <span className="font-bold" style={{ fontSize: 24, color: "#1A1A2E", lineHeight: 1.1 }}>{pieTotal}</span>
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>Total</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-5 mt-1 flex-wrap justify-center">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="rounded-full" style={{ width:9, height:9, backgroundColor:d.color, display:"inline-block" }} />
                    <span style={{ fontSize:13, color:"#64748B" }}>{d.name}</span>
                    <span className="font-semibold" style={{ fontSize:13, color:"#1A1A2E" }}>
                      {pieTotal > 0 ? Math.round((d.value / pieTotal) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
        </div>{/* end 320px wrapper */}
      </div>{/* end Row 1 flex */}

      {/* Row 2 — Detections Over Time (replaces heatmap) */}
      <Card>
        <CardHeader title="Detections Over Time" sub={`Detection volume trend (${dateFilter.toLowerCase()})`} />
        {isLoading ? (
          <ChartSkeleton height={200} />
        ) : overTimeData.length === 0 ? (
          <p style={{ fontSize: 14, color: "#94A3B8", textAlign: "center", padding: "40px 0" }}>No time-series data yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={overTimeData} margin={{ top:0, right:16, left:0, bottom:0 }} barCategoryGap="20%">
              <XAxis dataKey="time" axisLine={false} tickLine={false}
                tick={{ fontSize:11, fill:"#CBD5E1" }} />
              <YAxis axisLine={false} tickLine={false}
                tick={{ fontSize:11, fill:"#CBD5E1" }} />
              <RTooltip content={<BarTip />} cursor={{ fill:"rgba(0,0,0,0.03)" }} />
              <Bar dataKey="count" fill="#FF5C1A" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Row 3 — Three cards */}
      <div className="flex gap-4">

        {/* Top Tools */}
        <Card className="flex-1">
          <CardHeader title={`Top Tools (${dateFilter})`} sub="By detection volume" />
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : toolsDisplay.length === 0 ? (
            <p style={{ fontSize: 14, color: "#94A3B8", textAlign: "center", padding: "40px 0" }}>No tool data yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {toolsDisplay.map(t => (
                <div key={t.rank} className="flex items-center gap-3">
                  {/* Rank circle */}
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0 font-bold"
                    style={{ width:26, height:26, backgroundColor: t.rank === 1 ? "#FFF3EE" : "#F8FAFC", fontSize:12, color: t.rank === 1 ? "#FF5C1A" : "#94A3B8" }}
                  >
                    {t.rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold truncate" style={{ fontSize:13, color:"#1A1A2E" }}>{t.name}</span>
                      <span style={{ fontSize:12, color:"#94A3B8", flexShrink:0, marginLeft:8 }}>{t.uses} uses</span>
                    </div>
                    <div className="w-full rounded-full" style={{ height:6, backgroundColor:"#FFF3EE" }}>
                      <div className="rounded-full" style={{ height:6, width:`${t.pct}%`, backgroundColor:"#FF5C1A", transition:"width 600ms ease" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Processes */}
        <Card className="flex-1">
          <CardHeader title="Top Processes" sub={`By detection count (${dateFilter.toLowerCase()})`} />
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : processesDisplay.length === 0 ? (
            <p style={{ fontSize: 14, color: "#94A3B8", textAlign: "center", padding: "40px 0" }}>No process data yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {processesDisplay.map(p => (
                <div key={p.rank} className="flex items-center gap-3">
                  {/* Rank circle */}
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0 font-bold"
                    style={{ width:26, height:26, backgroundColor: p.rank === 1 ? "#FFF3EE" : "#F8FAFC", fontSize:12, color: p.rank === 1 ? "#FF5C1A" : "#94A3B8" }}
                  >
                    {p.rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold truncate" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize:13, color:"#1A1A2E" }}>{p.name}</span>
                      <span style={{ fontSize:12, color:"#94A3B8", flexShrink:0, marginLeft:8 }}>{p.uses} detections</span>
                    </div>
                    <div className="w-full rounded-full" style={{ height:6, backgroundColor:"#FFF3EE" }}>
                      <div className="rounded-full" style={{ height:6, width:`${p.pct}%`, backgroundColor:"#FF5C1A", transition:"width 600ms ease" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Data Not Available — placeholder for Shadow AI / Most Active Users */}
        <Card className="flex-1">
          <div className="mb-4">
            <p className="font-semibold" style={{ fontSize:16, color:"#1A1A2E" }}>Most Active Users</p>
            <p style={{ fontSize:13, color:"#94A3B8", marginTop:2 }}>Top users by event count</p>
          </div>
          <div className="flex-1 flex items-center justify-center" style={{ minHeight: 180 }}>
            <p style={{ fontSize: 14, color: "#94A3B8", textAlign: "center" }}>
              Data not available — coming in a future update
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
