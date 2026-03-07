import {
  Briefcase,
  Wallet,
  Monitor,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useSpendOverview, useStats } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Error badge ───────────────────────────────────────────────────────────

function ErrorBadge() {
  return (
    <span
      className="absolute top-2 left-2 flex items-center justify-center rounded-full font-bold"
      style={{
        width: 18,
        height: 18,
        backgroundColor: "#DC2626",
        color: "#ffffff",
        fontSize: 11,
        lineHeight: 1,
        zIndex: 2,
      }}
      title="Failed to load data"
    >
      !
    </span>
  );
}

// ─── Pulse placeholder ────────────────────────────────────────────────────

function ValueSkeleton() {
  return (
    <Skeleton
      style={{ width: 96, height: 28, borderRadius: 6, marginTop: 8 }}
    />
  );
}

// ─── Currency formatter (Indian Rupee) ─────────────────────────────────────

function formatINR(n: number): string {
  return "₹" + n.toLocaleString("en-IN");
}

// ─── Shared metric card shell ──────────────────────────────────────────────

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  iconBg: string;
  icon: React.ElementType;
  iconColor: string;
  onClick?: () => void;
  isDanger?: boolean;
  isLoading?: boolean;
  error?: boolean;
}

function MetricCard({
  label,
  value,
  sub,
  iconBg,
  icon: Icon,
  iconColor,
  onClick,
  isDanger,
  isLoading,
  error,
}: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer transition-all duration-200 flex flex-col justify-between"
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #F0F2F5",
        borderRadius: 16,
        padding: "20px 20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        height: "100%"
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-2px)";
        el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
      }}
    >
      {error && <ErrorBadge />}

      {/* Top-right icon */}
      <div
        className="absolute top-4 right-4 flex items-center justify-center rounded-full flex-shrink-0"
        style={{ width: 32, height: 32, backgroundColor: iconBg }}
      >
        <Icon size={16} strokeWidth={1.5} color={iconColor} />
      </div>

      {/* Content wrapper to match exact spacing */}
      <div>
        {/* Label */}
        <p
          className="font-medium tracking-widest uppercase"
          style={{ fontSize: 11, color: "#94A3B8", letterSpacing: "0.08em", fontFamily: "Inter, sans-serif" }}
        >
          {label}
        </p>

        {/* Value */}
        {isLoading ? (
          <ValueSkeleton />
        ) : (
          <p
            className="font-bold"
            style={{
              fontSize: 32,
              color: isDanger ? "#DC2626" : "#1A1A2E",
              fontFamily: "Inter, sans-serif",
              lineHeight: 1.1,
              marginTop: 8
            }}
          >
            {value}
          </p>
        )}

        {/* Sub-line */}
        <div style={{ marginTop: 6 }} className="flex items-center gap-1.5">{sub}</div>
      </div>
    </div>
  );
}

// ─── Sub-line helpers ──────────────────────────────────────────────────────

function GreenUp({ text }: { text: string }) {
  return (
    <>
      <ArrowUpRight size={14} color="#16A34A" strokeWidth={2} />
      <span style={{ fontSize: 13, color: "#16A34A", fontFamily: "Inter, sans-serif", fontWeight: 400 }}>{text}</span>
    </>
  );
}

function RedDown({ text }: { text: string }) {
  return (
    <>
      <ArrowDownRight size={14} color="#DC2626" strokeWidth={2} />
      <span style={{ fontSize: 13, color: "#DC2626", fontFamily: "Inter, sans-serif", fontWeight: 400 }}>{text}</span>
    </>
  );
}

function GreenDot({ text }: { text: string }) {
  return (
    <>
      <span
        className="rounded-full flex-shrink-0"
        style={{ width: 8, height: 8, backgroundColor: "#16A34A" }}
      />
      <span style={{ fontSize: 13, color: "#16A34A", fontFamily: "Inter, sans-serif", fontWeight: 400 }}>{text}</span>
    </>
  );
}

function RedText({ text }: { text: string }) {
  return <span style={{ fontSize: 13, color: "#DC2626", fontFamily: "Inter, sans-serif", fontWeight: 400 }}>{text}</span>;
}

// ─── Exported component ────────────────────────────────────────────────────

export function BentoRow({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { data: spend, isLoading: spendLoading, error: spendError } = useSpendOverview();
  const { data: stats, isLoading: statsLoading, error: statsError } = useStats();

  const hasSpendError = !!spendError;
  const hasStatsError = !!statsError;

  return (
    <div
      style={{
        flex: "0 0 auto",
        width: 424,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gap: 16,
        alignItems: "stretch"
      }}
    >
      {/* Card A — Total AI Spend */}
      <MetricCard
        label="TOTAL AI SPEND"
        value={spend ? formatINR(spend.totalMonthlySpend) : "—"}
        sub={<GreenUp text="8% this month" />}
        iconBg="#F0FDF4"
        icon={Briefcase}
        iconColor="#16A34A"
        onClick={() => onNavigate("subscriptions")}
        isLoading={spendLoading}
        error={hasSpendError}
      />

      {/* Card B — Budget Remaining */}
      <MetricCard
        label="BUDGET REMAINING"
        value={spend ? formatINR(spend.budgetRemaining) : "—"}
        sub={<RedDown text="5% this month" />}
        iconBg="#FFF7ED"
        icon={Wallet}
        iconColor="#D97706"
        onClick={() => onNavigate("subscriptions")}
        isLoading={spendLoading}
        error={hasSpendError}
      />

      {/* Card C — Active Agents */}
      <MetricCard
        label="ACTIVE AGENTS"
        value={stats ? `${stats.onlineDevices}/${stats.totalDevices}` : "—"}
        sub={<GreenDot text="Browser + Desktop" />}
        iconBg="#EFF6FF"
        icon={Monitor}
        iconColor="#3B82F6"
        onClick={() => onNavigate("devices")}
        isLoading={statsLoading}
        error={hasStatsError}
      />

      {/* Card D — Zombie Licenses */}
      <MetricCard
        label="ZOMBIE LICENSES"
        value={spend?.zombieLicenses ?? 0}
        sub={<RedText text={spend ? `${formatINR(spend.zombieCost)} wasted` : "—"} />}
        iconBg="#FEF2F2"
        icon={Trash2}
        iconColor="#DC2626"
        isDanger={true}
        onClick={() => {
          onNavigate("subscriptions");
          // Dispatch a custom event to tell the Subscriptions page to filter by Zombie
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('filter-zombie-licenses'));
          }, 50);
        }}
        isLoading={spendLoading}
        error={hasSpendError}
      />
    </div>
  );
}
