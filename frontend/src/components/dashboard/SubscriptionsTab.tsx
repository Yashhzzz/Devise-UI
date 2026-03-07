import { useMemo } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { useSubscriptions, useSpendOverview } from "@/hooks/useDashboard";
import type { SubscriptionItem, SpendOverview } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Sub {
  id: string;
  name: string;
  vendor: string;
  seats: number;
  active: number;
  util: number;
  cost: string;
  status: "Active" | "Zombie" | "Expiring soon";
  cycle: string;
  renewal: string;
  bg: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const COLOR_PALETTE = [
  "#10A37F", "#181717", "#FF5C1A", "#D97706", "#0F172A",
  "#000000", "#8B5CF6", "#3B82F6", "#EC4899", "#10B981",
  "#4285F4", "#6366F1", "#14B8A6", "#F43F5E", "#8B5CF6",
];

function hashStringToIndex(str: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % max;
}

function formatINR(amount: number): string {
  // Format as Indian locale with ₹
  return "\u20B9" + amount.toLocaleString("en-IN");
}

function formatRenewalDate(dateStr: string | null): string {
  if (!dateStr) return "\u2014";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "\u2014";
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  if (diffMs < 0) return "Expired";
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays < 30) return "Renews next month";
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `Renews ${month} ${year}`;
}

function mapSubscriptionItem(item: SubscriptionItem): Sub {
  const util = item.seats > 0 ? Math.round((item.seats_used / item.seats) * 100) : 0;
  const statusMap: Record<SubscriptionItem["status"], Sub["status"]> = {
    active: "Active",
    zombie: "Zombie",
    trial: "Active",
    cancelled: "Zombie",
  };

  return {
    id: item.id,
    name: item.tool_name,
    vendor: item.vendor,
    seats: item.seats,
    active: item.seats_used,
    util,
    cost: `${formatINR(item.cost_monthly)}/mo`,
    status: statusMap[item.status],
    cycle: item.renewal_date ? "Annual contract" : "Monthly",
    renewal: formatRenewalDate(item.renewal_date),
    bg: COLOR_PALETTE[hashStringToIndex(item.tool_name, COLOR_PALETTE.length)],
  };
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export function SubscriptionsTab() {
  const { data: subscriptionItems, isLoading: subsLoading, error: subsError } = useSubscriptions();
  const { data: spendOverview, isLoading: spendLoading, error: spendError } = useSpendOverview();

  const isLoading = subsLoading || spendLoading;
  const error = subsError || spendError;

  const subscriptions: Sub[] = useMemo(() => {
    if (!subscriptionItems) return [];
    return subscriptionItems.map(mapSubscriptionItem);
  }, [subscriptionItems]);

  // Computed stats (fallback to spend overview, then compute from subscriptions)
  const totalMonthlySpend = spendOverview?.totalMonthlySpend ?? (subscriptionItems?.reduce((sum, s) => sum + s.cost_monthly, 0) ?? 0);
  const totalTools = subscriptions.length;
  const zombieLicenses = spendOverview?.zombieLicenses ?? subscriptions.filter(s => s.status === "Zombie").length;
  const zombieCost = spendOverview?.zombieCost ?? (subscriptionItems?.filter(s => s.status === "zombie" || s.status === "cancelled").reduce((sum, s) => sum + s.cost_monthly, 0) ?? 0);

  const CardInfo = ({ title, value, sub }: { title: string; value: string; sub: React.ReactNode }) => (
    <div
      className="flex-1 flex flex-col justify-center"
      style={{
        backgroundColor: title === "MONTHLY SPEND" ? "#FF5C1A" : "#ffffff",
        borderRadius: 20,
        padding: "20px 24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        border: title === "MONTHLY SPEND" ? "none" : "1px solid #F0F2F5",
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: title === "MONTHLY SPEND" ? "rgba(255,255,255,0.9)" : "#94A3B8",
          letterSpacing: "0.5px",
          fontFamily: "Inter, sans-serif",
          textTransform: "uppercase",
        }}
      >
        {title}
      </span>
      <span
        className="mt-2"
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: title === "MONTHLY SPEND" ? "#ffffff" : "#1A1A2E",
          fontFamily: "Inter, sans-serif",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      <div
        className="mt-3 flex items-center gap-1.5"
        style={{
          fontSize: 13,
          color: title === "MONTHLY SPEND" ? "rgba(255,255,255,0.8)" : "#64748B",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {sub}
      </div>
    </div>
  );

  const getBarColor = (util: number) => {
    if (util > 70) return "#16A34A";
    if (util >= 40) return "#D97706";
    return "#DC2626";
  };

  const getActiveUsersColor = (util: number) => {
    if (util > 70) return "#16A34A";
    if (util < 40) return "#DC2626";
    return "#1A1A2E";
  };

  const getStatusBadge = (status: Sub["status"]) => {
    switch (status) {
      case "Active":
        return { bg: "#ECFDF5", text: "#10B981" };
      case "Zombie":
        return { bg: "#FEF2F2", text: "#DC2626" };
      case "Expiring soon":
        return { bg: "#FFFBEB", text: "#D97706" };
    }
  };

  // ─── Loading skeleton ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Subscriptions</h1>
            <p className="mt-1" style={{ fontSize: 14, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>Manage all AI tool licenses and spending</p>
          </div>
          <Skeleton className="h-9 w-40 rounded-xl" />
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1" style={{ borderRadius: 20, padding: "20px 24px", border: "1px solid #F0F2F5" }}>
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-9 w-28 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center" style={{ backgroundColor: "#ffffff", border: "1px solid #F0F2F5", borderRadius: 20, padding: "20px 24px", gap: 20 }}>
              <Skeleton className="h-11 w-11 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-28 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex-1">
                <Skeleton className="h-3 w-full" />
              </div>
              <div className="flex flex-col items-end gap-1">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-5 w-20" />
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
      <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Subscriptions</h1>
            <p className="mt-1" style={{ fontSize: 14, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>Manage all AI tool licenses and spending</p>
          </div>
        </div>
        <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 16, padding: "16px 20px" }}>
          <p style={{ fontSize: 14, color: "#DC2626", fontWeight: 500 }}>
            Failed to load subscriptions: {error.message}
          </p>
          <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>
            Data will retry automatically. Check your connection if this persists.
          </p>
        </div>
      </div>
    );
  }

  // ─── Empty state ───────────────────────────────────────────────────────
  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Subscriptions</h1>
            <p className="mt-1" style={{ fontSize: 14, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>Manage all AI tool licenses and spending</p>
          </div>
          <button
            className="flex items-center gap-2 hover:-translate-y-[1px] transition-all duration-200"
            style={{ backgroundColor: "#FF5C1A", color: "#ffffff", padding: "8px 16px", borderRadius: 12, fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E5521A")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FF5C1A")}
          >
            <Plus size={16} strokeWidth={2} />
            Add Subscription
          </button>
        </div>
        <div className="flex gap-4">
          <CardInfo title="MONTHLY SPEND" value={formatINR(0)} sub={<>No spend data</>} />
          <CardInfo title="TOTAL TOOLS" value="0" sub={<><span className="w-2 h-2 rounded-full bg-[#16A34A]" />No subscriptions</>} />
          <CardInfo title="WASTED SPEND" value={formatINR(0)} sub={<><span className="w-2 h-2 rounded-full bg-[#DC2626]" />0 zombie licenses</>} />
        </div>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #F0F2F5", borderRadius: 20, padding: "48px 24px" }} className="flex flex-col items-center justify-center">
          <Plus size={40} strokeWidth={1.5} color="#CBD5E1" />
          <p className="mt-4 font-medium" style={{ fontSize: 16, color: "#94A3B8" }}>No subscriptions yet</p>
          <p style={{ fontSize: 13, color: "#CBD5E1", marginTop: 4 }}>Add your first AI tool subscription to start tracking</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#1A1A2E",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Subscriptions
          </h1>
          <p
            className="mt-1"
            style={{ fontSize: 14, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}
          >
            Manage all AI tool licenses and spending
          </p>
        </div>
        <button
          className="flex items-center gap-2 hover:-translate-y-[1px] transition-all duration-200"
          style={{
            backgroundColor: "#FF5C1A",
            color: "#ffffff",
            padding: "8px 16px",
            borderRadius: 12,
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            fontSize: 14,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E5521A")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FF5C1A")}
        >
          <Plus size={16} strokeWidth={2} />
          Add Subscription
        </button>
      </div>

      {/* Stats Row */}
      <div className="flex gap-4">
        <CardInfo title="MONTHLY SPEND" value={formatINR(totalMonthlySpend)} sub={<>Across {totalTools} tools</>} />
        <CardInfo
          title="TOTAL TOOLS"
          value={String(totalTools)}
          sub={
            <>
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              Active subscriptions
            </>
          }
        />
        <CardInfo
          title="WASTED SPEND"
          value={formatINR(zombieCost)}
          sub={
            <>
              <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
              {zombieLicenses} zombie licenses
            </>
          }
        />
      </div>

      {/* Zombie Alert Banner — only show if zombies exist */}
      {zombieLicenses > 0 && (
        <div
          className="flex items-center justify-between"
          style={{
            backgroundColor: "#FFF3EE",
            border: "1px solid #FDDCC8",
            borderRadius: 16,
            padding: "16px 20px",
          }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} color="#FF5C1A" strokeWidth={2} />
            <span
              style={{
                color: "#1A1A2E",
                fontFamily: "Inter, sans-serif",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <span style={{ fontWeight: 700 }}>{zombieLicenses} zombie licenses detected</span> — potential savings of {formatINR(zombieCost)}/month
            </span>
          </div>
          <button
            style={{
              color: "#FF5C1A",
              fontFamily: "Inter, sans-serif",
              fontSize: 14,
              fontWeight: 600,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Review Now &rarr;
          </button>
        </div>
      )}

      {/* Grid of Subscriptions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
        }}
      >
        {subscriptions.map((sub) => {
          const badge = getStatusBadge(sub.status);
          return (
            <div
              key={sub.id}
              className="flex items-center transition-all duration-200 cursor-pointer hover:-translate-y-[1px]"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #F0F2F5",
                borderRadius: 20,
                padding: "20px 24px",
                gap: 20,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
              }}
            >
              {/* Left Column (Icon + Name) */}
              <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                <div
                  className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{
                    width: 44,
                    height: 44,
                    backgroundColor: sub.bg,
                    color: "#ffffff",
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    fontSize: 20,
                  }}
                >
                  {sub.name.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 600,
                      fontSize: 16,
                      color: "#1A1A2E",
                      lineHeight: 1.2,
                    }}
                  >
                    {sub.name}
                  </span>
                  <span
                    className="mt-1"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontSize: 13,
                      color: "#94A3B8",
                      lineHeight: 1.2,
                    }}
                  >
                    {sub.vendor}
                  </span>
                </div>
              </div>

              {/* Middle Section (3 Cols) */}
              <div className="flex items-start flex-1" style={{ gap: 24 }}>
                <div className="flex flex-col gap-1 w-[80px]">
                  <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                    Seats Paid
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>
                    {sub.seats}
                  </span>
                </div>
                <div className="flex flex-col gap-1 w-[80px]">
                  <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                    Active Users
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: getActiveUsersColor(sub.util), fontFamily: "Inter, sans-serif" }}>
                    {sub.active}
                  </span>
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[100px]">
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: "Inter, sans-serif" }}>
                      Utilization
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>
                      {sub.util}%
                    </span>
                  </div>
                  {/* Utilization Bar */}
                  <div
                    className="mt-1.5 w-full overflow-hidden"
                    style={{ height: 6, backgroundColor: "#F0F2F5", borderRadius: 999 }}
                  >
                    <div
                      style={{
                        width: `${sub.util}%`,
                        height: "100%",
                        backgroundColor: getBarColor(sub.util),
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column (Cost + Badges) */}
              <div className="flex flex-col items-end text-right justify-center" style={{ minWidth: 140 }}>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.text,
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    {sub.status}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 700,
                    fontSize: 18,
                    color: "#1A1A2E",
                    lineHeight: 1.2,
                  }}
                >
                  {sub.cost}
                </span>
                <span
                  className="mt-0.5"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 12,
                    color: "#94A3B8",
                  }}
                >
                  {sub.cycle}
                </span>
                <span
                  className="mt-0.5"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 11,
                    color: "#94A3B8",
                  }}
                >
                  {sub.renewal}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
