import { useSpendOverview } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

export function BudgetProgress() {
  const { data: spend, isLoading, error } = useSpendOverview();

  const spent = spend?.totalMonthlySpend ?? 0;
  const total = spend?.monthlyBudget ?? 0;
  const pct = total > 0 ? Math.round((spent / total) * 100) : 0;

  const fmt = (n: number) =>
    "₹" + n.toLocaleString("en-IN");

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #F0F2F5",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        transition: "box-shadow 200ms ease",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
    >
      {/* Title */}
      <p
        className="font-semibold"
        style={{ fontSize: 15, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}
      >
        Monthly Budget Usage
      </p>

      {error && (
        <p style={{ fontSize: 12, color: "#DC2626", marginTop: 6 }}>
          Unable to load budget data
        </p>
      )}

      {/* Progress bar */}
      {isLoading ? (
        <Skeleton className="w-full mt-4" style={{ height: 10, borderRadius: 9999 }} />
      ) : (
        <div
          className="w-full rounded-full overflow-hidden mt-4"
          style={{ height: 10, backgroundColor: "#F0F2F5" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: "linear-gradient(to right, #FF5C1A, #FF8C42)",
              transition: "width 600ms ease",
            }}
          />
        </div>
      )}

      {/* Labels */}
      {isLoading ? (
        <div className="flex items-center justify-between mt-2.5">
          <Skeleton style={{ width: 100, height: 14, borderRadius: 4 }} />
          <Skeleton style={{ width: 72, height: 14, borderRadius: 4 }} />
        </div>
      ) : (
        <div className="flex items-center justify-between mt-2.5">
          <span style={{ fontSize: 13, color: "#1A1A2E", fontWeight: 500 }}>
            {fmt(spent)} spent
          </span>
          <span style={{ fontSize: 13, color: "#94A3B8" }}>
            {fmt(total)}
          </span>
        </div>
      )}
    </div>
  );
}
