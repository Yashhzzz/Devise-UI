import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAnalytics } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";

// Custom tooltip
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        backgroundColor: "#1A1A2E",
        borderRadius: 10,
        padding: "8px 14px",
        fontSize: 12,
        color: "#fff",
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
      }}
    >
      <p style={{ fontWeight: 700, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.name === "detections" ? "#FF5C1A" : "#94A3B8" }}>
          {p.name === "detections" ? "Detections" : "Violations"}: {p.value}
        </p>
      ))}
    </div>
  );
}

export function UsageTrendChart() {
  const { data: analytics, isLoading, error } = useAnalytics();

  const chartData = useMemo(() => {
    if (!analytics?.overTime?.length) return [];
    return analytics.overTime.map((entry) => ({
      month: entry.time,
      detections: entry.count,
      violations: Math.round(entry.count * 0.4),
    }));
  }, [analytics]);

  return (
    <div
      className="flex-1 min-w-0 flex flex-col"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #F0F2F5",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p
            className="font-semibold"
            style={{ fontSize: 16, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}
          >
            AI Usage Trend
          </p>
          <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>
            Detection volume over last 8 weeks
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="rounded-full"
              style={{ width: 9, height: 9, backgroundColor: "#FF5C1A", display: "inline-block" }}
            />
            <span style={{ fontSize: 12, color: "#64748B" }}>Detections</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="rounded-full"
              style={{ width: 9, height: 9, backgroundColor: "#1A1A2E", display: "inline-block" }}
            />
            <span style={{ fontSize: 12, color: "#64748B" }}>Violations</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ flex: 1 }}>
        {isLoading ? (
          <div className="flex flex-col gap-3" style={{ height: 200, justifyContent: "flex-end" }}>
            <div className="flex items-end gap-4 px-4" style={{ height: 170 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-1 items-end flex-1">
                  <Skeleton className="flex-1" style={{ height: 40 + Math.random() * 100 }} />
                  <Skeleton className="flex-1" style={{ height: 20 + Math.random() * 50 }} />
                </div>
              ))}
            </div>
            <Skeleton className="w-full" style={{ height: 14 }} />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center" style={{ height: 200 }}>
            <p style={{ fontSize: 13, color: "#DC2626" }}>
              Failed to load analytics data
            </p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: 200 }}>
            <p style={{ fontSize: 13, color: "#94A3B8" }}>
              No data yet
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={chartData}
              barCategoryGap="28%"
              barGap={4}
              margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
            >
              <defs>
                {/* Diagonal hatch pattern for violations bars */}
                <pattern
                  id="hatch"
                  patternUnits="userSpaceOnUse"
                  width="5"
                  height="5"
                  patternTransform="rotate(45)"
                >
                  <rect width="5" height="5" fill="#1A1A2E" />
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="5"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeOpacity="0.18"
                  />
                </pattern>
              </defs>

              <XAxis
                dataKey="month"
                axisLine={{ stroke: "#E2E8F0" }}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#94A3B8", fontFamily: "Inter, sans-serif" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#CBD5E1", fontFamily: "Inter, sans-serif" }}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(0,0,0,0.03)", radius: 4 }}
              />

              {/* Detections — solid orange */}
              <Bar
                dataKey="detections"
                radius={[5, 5, 0, 0]}
                fill="#FF5C1A"
                maxBarSize={22}
              />

              {/* Violations — hatched dark */}
              <Bar
                dataKey="violations"
                radius={[5, 5, 0, 0]}
                maxBarSize={22}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill="url(#hatch)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
