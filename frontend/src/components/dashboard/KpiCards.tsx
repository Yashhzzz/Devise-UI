import { Activity, Layers, AlertTriangle, ShieldOff, ArrowUpRight } from "lucide-react";
import { useStats } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Error badge ──────────────────────────────────────────────────────────────

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

// ─── Pulse placeholder for loading numbers ────────────────────────────────────

function NumberSkeleton({ white = false }: { white?: boolean }) {
  return (
    <Skeleton
      className="mt-2"
      style={{
        width: 72,
        height: 36,
        borderRadius: 8,
        backgroundColor: white ? "rgba(255,255,255,0.30)" : undefined,
      }}
    />
  );
}

// ─── Shared card shell ────────────────────────────────────────────────────────

interface CardShellProps {
  children: React.ReactNode;
  orange?: boolean;
  onClick?: () => void;
}

function CardShell({ children, orange = false, onClick }: CardShellProps) {
  return (
    <div
      onClick={onClick}
      className="flex-1 min-w-0 relative cursor-pointer select-none"
      style={{
        backgroundColor: orange ? "#FF5C1A" : "#ffffff",
        border: `1px solid ${orange ? "#FDDCC8" : "#F0F2F5"}`,
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        transition: "transform 200ms ease, box-shadow 200ms ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(-1px)";
        el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "translateY(0)";
        el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
      }}
    >
      {children}
    </div>
  );
}

// ─── Card 1 — Total Detections (orange hero) ─────────────────────────────────

function TotalDetectionsCard({
  value,
  isLoading,
  error,
  onClick,
}: {
  value: number;
  isLoading: boolean;
  error: boolean;
  onClick?: () => void;
}) {
  return (
    <CardShell orange onClick={onClick}>
      {error && <ErrorBadge />}

      {/* Top-right icon */}
      <div
        className="absolute top-5 right-5 flex items-center justify-center rounded-full"
        style={{ width: 36, height: 36, backgroundColor: "rgba(255,255,255,0.25)" }}
      >
        <Activity size={16} strokeWidth={2} color="#ffffff" />
      </div>

      <p
        className="font-semibold tracking-widest uppercase"
        style={{ fontSize: 11, color: "rgba(255,255,255,0.80)", letterSpacing: "0.08em" }}
      >
        Total Detections
      </p>

      {isLoading ? (
        <NumberSkeleton white />
      ) : (
        <p
          className="font-bold mt-2 leading-none"
          style={{ fontSize: 40, color: "#ffffff", fontFamily: "Inter, sans-serif" }}
        >
          {value}
        </p>
      )}

      <div className="flex items-center gap-1 mt-3">
        <ArrowUpRight size={14} color="rgba(255,255,255,0.80)" strokeWidth={2.5} />
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.80)" }}>
          12% vs yesterday
        </span>
      </div>
    </CardShell>
  );
}

// ─── Card 2 — Unique Tools ────────────────────────────────────────────────────

function UniqueToolsCard({
  value,
  isLoading,
  error,
  onClick,
}: {
  value: number;
  isLoading: boolean;
  error: boolean;
  onClick?: () => void;
}) {
  return (
    <CardShell onClick={onClick}>
      {error && <ErrorBadge />}

      {/* Top-right icon */}
      <div
        className="absolute top-5 right-5 flex items-center justify-center rounded-full"
        style={{ width: 36, height: 36, backgroundColor: "#EFF6FF" }}
      >
        <Layers size={16} strokeWidth={2} color="#3B82F6" />
      </div>

      <p
        className="font-semibold tracking-widest uppercase"
        style={{ fontSize: 11, color: "#94A3B8", letterSpacing: "0.08em" }}
      >
        Unique Tools
      </p>

      {isLoading ? (
        <NumberSkeleton />
      ) : (
        <p
          className="font-bold mt-2 leading-none"
          style={{ fontSize: 36, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}
        >
          {value}
        </p>
      )}

      <div className="flex items-center gap-1 mt-3">
        <ArrowUpRight size={14} color="#16A34A" strokeWidth={2.5} />
        <span style={{ fontSize: 13, color: "#16A34A" }}>
          3 new this week
        </span>
      </div>
    </CardShell>
  );
}

// ─── Card 3 — High Risk Events ────────────────────────────────────────────────

function HighRiskCard({
  value,
  isLoading,
  error,
  onClick,
}: {
  value: number;
  isLoading: boolean;
  error: boolean;
  onClick?: () => void;
}) {
  return (
    <CardShell onClick={onClick}>
      {error && <ErrorBadge />}

      {/* Top-right icon */}
      <div
        className="absolute top-5 right-5 flex items-center justify-center rounded-full"
        style={{ width: 36, height: 36, backgroundColor: "#FEF2F2" }}
      >
        <AlertTriangle size={16} strokeWidth={2} color="#DC2626" />
      </div>

      <p
        className="font-semibold tracking-widest uppercase"
        style={{ fontSize: 11, color: "#94A3B8", letterSpacing: "0.08em" }}
      >
        High Risk
      </p>

      {isLoading ? (
        <NumberSkeleton />
      ) : (
        <p
          className="font-bold mt-2 leading-none"
          style={{ fontSize: 36, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}
        >
          {value}
        </p>
      )}

      <div className="flex items-center gap-1 mt-3">
        <ArrowUpRight size={14} color="#DC2626" strokeWidth={2.5} />
        <span style={{ fontSize: 13, color: "#DC2626" }}>
          Needs review
        </span>
      </div>
    </CardShell>
  );
}

// ─── Card 4 — Unapproved Tools ────────────────────────────────────────────────

function UnapprovedCard({
  value,
  isLoading,
  error,
  onClick,
}: {
  value: number;
  isLoading: boolean;
  error: boolean;
  onClick?: () => void;
}) {
  return (
    <CardShell onClick={onClick}>
      {error && <ErrorBadge />}

      {/* Top-right icon */}
      <div
        className="absolute top-5 right-5 flex items-center justify-center rounded-full"
        style={{ width: 36, height: 36, backgroundColor: "#FFFBEB" }}
      >
        <ShieldOff size={16} strokeWidth={2} color="#D97706" />
      </div>

      <p
        className="font-semibold tracking-widest uppercase"
        style={{ fontSize: 11, color: "#94A3B8", letterSpacing: "0.08em" }}
      >
        Unapproved
      </p>

      {isLoading ? (
        <NumberSkeleton />
      ) : (
        <p
          className="font-bold mt-2 leading-none"
          style={{ fontSize: 36, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}
        >
          {value}
        </p>
      )}

      <div className="flex items-center gap-1 mt-3">
        {/* Amber dot instead of arrow */}
        <span
          className="rounded-full flex-shrink-0"
          style={{ width: 7, height: 7, backgroundColor: "#D97706" }}
        />
        <span style={{ fontSize: 13, color: "#D97706" }}>
          Not sanctioned
        </span>
      </div>
    </CardShell>
  );
}

// ─── Exported row ─────────────────────────────────────────────────────────────

interface KpiCardsProps {
  onNavigate?: (tab: string) => void;
}

export function KpiCards({ onNavigate }: KpiCardsProps) {
  const { data: stats, isLoading, error } = useStats();
  const hasError = !!error;

  return (
    <div className="flex gap-4 w-full">
      <TotalDetectionsCard
        value={stats?.totalDetections ?? 0}
        isLoading={isLoading}
        error={hasError}
        onClick={() => onNavigate?.("live-feed")}
      />
      <UniqueToolsCard
        value={stats?.uniqueTools ?? 0}
        isLoading={isLoading}
        error={hasError}
        onClick={() => onNavigate?.("subscriptions")}
      />
      <HighRiskCard
        value={stats?.highRiskCount ?? 0}
        isLoading={isLoading}
        error={hasError}
        onClick={() => onNavigate?.("alerts")}
      />
      <UnapprovedCard
        value={stats?.unapprovedCount ?? 0}
        isLoading={isLoading}
        error={hasError}
        onClick={() => onNavigate?.("alerts")}
      />
    </div>
  );
}
