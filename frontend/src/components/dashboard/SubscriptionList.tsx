import { Code2, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useSubscriptions } from "@/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ─────────────────────────────────────────────────────────────────

interface Sub {
  iconBg: string;
  icon: React.ElementType;
  iconColor: string;
  name: string;
  seats: string;
  price: string;
  badge: "active" | "zombie";
}

// ─── Color palette for subscriptions ───────────────────────────────────────

const subColors = [
  { iconBg: "#F0FFF4", iconColor: "#16A34A" },
  { iconBg: "#FFF7ED", iconColor: "#FF5C1A" },
  { iconBg: "#FEF2F2", iconColor: "#DC2626" },
  { iconBg: "#EFF6FF", iconColor: "#3B82F6" },
  { iconBg: "#F5F3FF", iconColor: "#8B5CF6" },
];

// ─── Badge ─────────────────────────────────────────────────────────────────

function Badge({ type }: { type: "active" | "zombie" }) {
  const isActive = type === "active";
  return (
    <span
      className="text-xs font-medium rounded-full px-2.5 py-0.5 flex-shrink-0"
      style={{
        backgroundColor: isActive ? "#F0FFF4" : "#FEF2F2",
        color: isActive ? "#16A34A" : "#DC2626",
        border: `1px solid ${isActive ? "#BBF7D0" : "#FECACA"}`,
        fontSize: 11,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {isActive ? "Active" : "Zombie"}
    </span>
  );
}

// ─── Row ───────────────────────────────────────────────────────────────────

function SubRow({ sub, last, onClick }: { sub: Sub; last: boolean; onClick?: () => void }) {
  const Icon = sub.icon;
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 cursor-pointer transition-colors"
      style={{
        padding: "12px 4px",
        borderBottom: last ? "none" : "1px solid #F5F5F5",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "#FAFAFA";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: 38, height: 38, backgroundColor: sub.iconBg }}
      >
        <Icon size={16} strokeWidth={2} color={sub.iconColor} />
      </div>

      {/* Name + seats */}
      <div className="flex-1 min-w-0">
        <p
          className="font-semibold truncate"
          style={{ fontSize: 14, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}
        >
          {sub.name}
        </p>
        <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>{sub.seats}</p>
      </div>

      {/* Price + badge */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span
          className="font-semibold"
          style={{ fontSize: 13, color: "#FF5C1A", fontFamily: "Inter, sans-serif" }}
        >
          {sub.price}
        </span>
        <Badge type={sub.badge} />
      </div>
    </div>
  );
}

// ─── Exported component ───────────────────────────────────────────────────

export function SubscriptionList({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { data: subscriptions, isLoading, error } = useSubscriptions();

  const topSubs: Sub[] = useMemo(() => {
    if (!subscriptions?.length) return [];
    return [...subscriptions]
      .sort((a, b) => b.cost_monthly - a.cost_monthly)
      .slice(0, 3)
      .map((item, i) => {
        const colors = subColors[i % subColors.length];
        return {
          iconBg: colors.iconBg,
          icon: Code2,
          iconColor: colors.iconColor,
          name: item.tool_name,
          seats: `${item.seats_used} of ${item.seats} seats active`,
          price: `₹${item.cost_monthly.toLocaleString("en-IN")}/mo`,
          badge: item.status === "zombie" ? "zombie" as const : "active" as const,
        };
      });
  }, [subscriptions]);

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #F0F2F5",
        borderRadius: 16,
        padding: 24,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <p
          className="font-semibold"
          style={{ fontSize: 15, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}
        >
          Top Subscriptions
        </p>
        <button
          onClick={() => setIsAddOpen(true)}
          className="font-medium transition-colors"
          style={{
            fontSize: 12,
            color: "#FF5C1A",
            border: "1px solid #FF5C1A",
            borderRadius: 999,
            padding: "4px 12px",
            backgroundColor: "transparent",
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FFF3EE";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          }}
        >
          + Add tool
        </button>
      </div>

      {/* Rows */}
      <div>
        {isLoading ? (
          // Skeleton loading rows
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`skel-${i}`}
              className="flex items-center gap-3"
              style={{
                padding: "12px 4px",
                borderBottom: i === 2 ? "none" : "1px solid #F5F5F5",
              }}
            >
              <Skeleton className="rounded-xl flex-shrink-0" style={{ width: 38, height: 38 }} />
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <Skeleton className="w-28 h-4 rounded" />
                <Skeleton className="w-20 h-3 rounded" />
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <Skeleton className="w-20 h-4 rounded" />
                <Skeleton className="w-14 h-5 rounded-full" />
              </div>
            </div>
          ))
        ) : error ? (
          <div style={{ padding: "20px 4px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#DC2626" }}>
              Failed to load subscriptions
            </p>
          </div>
        ) : topSubs.length === 0 ? (
          <div style={{ padding: "20px 4px", textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "#94A3B8" }}>
              No subscriptions
            </p>
          </div>
        ) : (
          topSubs.map((sub, i) => (
            <SubRow key={sub.name} sub={sub} last={i === topSubs.length - 1} onClick={() => onNavigate?.("subscriptions")} />
          ))
        )}
      </div>

      <AddSubscriptionModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </div>
  );
}

// ─── ADD SUBSCRIPTION MODAL ─────────────────────────────────────────────────

function AddSubscriptionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { toast } = useToast();
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Tool subscription added",
      description: "It has been recorded to your organization's ledger.",
      duration: 3000,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-[480px] p-6 shadow-[0_24px_64px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200 text-left">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#1A1A2E]">Add AI Tool Subscription</h2>
          <button onClick={onClose} className="p-2 text-[#94A3B8] hover:text-[#1A1A2E] hover:bg-[#F0F2F5] rounded-lg transition-colors">
            <X size={20} className="active:scale-95 transition-transform" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#1A1A2E]">Tool Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Cursor Pro" 
              className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#FF5C1A] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-semibold text-[#1A1A2E]">Seats Paid</label>
              <input 
                required
                type="number" 
                defaultValue={1}
                min={1}
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#FF5C1A] focus:bg-white transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-sm font-semibold text-[#1A1A2E]">Monthly Cost (₹)</label>
              <input 
                required
                type="number" 
                placeholder="0"
                className="w-full px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#FF5C1A] focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-[#F0F2F5]">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-[#64748B] hover:text-[#1A1A2E] hover:bg-[#F8FAFC] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#FF5C1A] hover:bg-[#E65318] hover:translate-y-[-1px] active:scale-[0.98] rounded-xl transition-all shadow-sm"
            >
              Add Tool
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
