import { useState, useMemo } from "react";
import {
  Plus, Search, ChevronDown, Monitor,
  CheckCircle2, XCircle, MoreHorizontal,
  RefreshCw, Trash2, Eye, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useToast } from "@/components/ui/use-toast";
import { useHeartbeats } from "@/hooks/useDashboard";
import type { HeartbeatEvent } from "@/data/mockData";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ─────────────────────────────────────────────────────────────────

type DeviceStatus = "healthy" | "outdated" | "offline";
type OS = "macos" | "windows";
type LastSeenStatus = "online" | "recent" | "offline";

interface Device {
  id: string;
  name: string;
  hostname: string;
  userInitials: string;
  userName: string;
  userDept: string;
  os: OS;
  osVersion: string;
  browserAgent: boolean;
  desktopAgent: boolean;
  lastSeen: string;
  lastSeenStatus: LastSeenStatus;
  version: string;
  status: DeviceStatus;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function computeLastSeenStatus(timestamp: string): LastSeenStatus {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  if (diffMs < 10 * 60_000) return "online";
  if (diffMs < 60 * 60_000) return "recent";
  return "offline";
}

function deriveOS(osVersion: string): OS {
  if (osVersion.toLowerCase().includes("mac")) return "macos";
  return "windows";
}

function deriveDeviceName(osVersion: string, deviceId: string): string {
  const os = osVersion.toLowerCase();
  if (os.includes("macos") || os.includes("mac os")) return "macOS Device";
  if (os.includes("windows")) return "Windows Device";
  return deviceId.substring(0, 12);
}

function mapHeartbeatToDevice(hb: HeartbeatEvent, latestVersion: string): Device {
  const lastSeenStatus = computeLastSeenStatus(hb.timestamp);
  const os = deriveOS(hb.os_version);
  let status: DeviceStatus = "healthy";
  if (lastSeenStatus === "offline") status = "offline";
  else if (hb.agent_version !== latestVersion) status = "outdated";

  return {
    id: hb.device_id,
    name: deriveDeviceName(hb.os_version, hb.device_id),
    hostname: hb.device_id.length > 20 ? hb.device_id.substring(0, 20) + "…" : hb.device_id,
    userInitials: hb.device_id.substring(0, 2).toUpperCase(),
    userName: "Device " + hb.device_id.substring(0, 4),
    userDept: "Unknown",
    os,
    osVersion: hb.os_version,
    browserAgent: true,
    desktopAgent: true,
    lastSeen: formatRelativeTime(hb.timestamp),
    lastSeenStatus,
    version: hb.agent_version,
    status,
  };
}

function findLatestVersion(heartbeats: HeartbeatEvent[]): string {
  if (heartbeats.length === 0) return "";
  const versions = heartbeats.map(h => h.agent_version);
  // Sort versions semantically, pick the highest
  const sorted = [...new Set(versions)].sort((a, b) => {
    const pa = a.replace(/^v/, "").split(".").map(Number);
    const pb = b.replace(/^v/, "").split(".").map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const diff = (pb[i] || 0) - (pa[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });
  return sorted[0] || "";
}

function rowShadow(s: DeviceStatus): string {
  if (s === "offline")  return "inset 3px 0 0 #DC2626";
  if (s === "outdated") return "inset 3px 0 0 #D97706";
  return "none";
}

const dotColor: Record<LastSeenStatus, string> = {
  online:  "#16A34A",
  recent:  "#D97706",
  offline: "#DC2626",
};

// ─── OS icon SVGs ───────────────────────────────────────────────────────────

function AppleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}

function WindowsIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 12V6.75l6-1.32v6.57H3zm17 0V3.43l-9 1.98V12h9zm-17 1h6v6.57l-6-1.32V13zm17 0h-9v6.58l9 1.99V13z"/>
    </svg>
  );
}

// ─── Shared card ────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: "#ffffff",
      border: "1px solid #F0F2F5",
      borderRadius: 16,
      padding: 24,
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export function DevicesTab() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isFading, setIsFading] = useState(false);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [syncedIds, setSyncedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { data: heartbeats, isLoading, error } = useHeartbeats();

  const latestVersion = useMemo(
    () => findLatestVersion(heartbeats ?? []),
    [heartbeats]
  );

  const allDevices: Device[] = useMemo(() => {
    if (!heartbeats) return [];
    return heartbeats
      .filter(hb => !removedIds.has(hb.device_id))
      .map(hb => {
        const device = mapHeartbeatToDevice(hb, latestVersion);
        if (syncedIds.has(hb.device_id)) {
          return { ...device, lastSeen: "Just now", lastSeenStatus: "online" as LastSeenStatus, status: "healthy" as DeviceStatus };
        }
        return device;
      });
  }, [heartbeats, latestVersion, removedIds, syncedIds]);

  const ITEMS_PER_PAGE = 10;
  const totalItems = allDevices.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  const handlePageChange = (p: number) => {
    if (p === page || p < 1 || p > totalPages) return;
    setIsFading(true);
    setTimeout(() => {
      setPage(p);
      setIsFading(false);
    }, 200);
  };

  const handleForceSync = (id: string, name: string) => {
    setSyncedIds(prev => new Set(prev).add(id));
    toast({
      title: "Sync Command Sent",
      description: `Requested state refresh from ${name}.`,
      duration: 3000,
    });
  };

  const handleRemoveAgent = (id: string, name: string) => {
    setRemovedIds(prev => new Set(prev).add(id));
    toast({
      title: "Agent Removed",
      description: `Successfully unlinked ${name} from governance.`,
      duration: 3000,
    });
  };

  const paginatedDevices = allDevices.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const getPages = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3) return [1, 2, 3, 4, "...", totalPages];
    if (page >= totalPages - 2) return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  // Computed stats
  const agentsActive = allDevices.filter(d => d.lastSeenStatus === "online" || d.lastSeenStatus === "recent").length;
  const needsAttention = allDevices.filter(d => d.status === "offline" || d.status === "outdated").length;

  // Coverage donut
  const activeCount = allDevices.filter(d => d.lastSeenStatus !== "offline").length;
  const inactiveCount = allDevices.length - activeCount;
  const coverageData = [
    { name: "Active",   value: activeCount || 0,   color: "#FF5C1A" },
    { name: "Inactive", value: inactiveCount || 0,  color: "#E2E8F0" },
  ];
  const coveragePct = totalItems > 0 ? ((activeCount / totalItems) * 100).toFixed(1) : "0";

  // OS breakdown
  const macCount = allDevices.filter(d => d.os === "macos").length;
  const winCount = allDevices.filter(d => d.os === "windows").length;

  // Version distribution
  const versionMap = useMemo(() => {
    const map = new Map<string, number>();
    allDevices.forEach(d => {
      map.set(d.version, (map.get(d.version) || 0) + 1);
    });
    // Sort: latest first, then by count descending
    const entries = [...map.entries()].sort((a, b) => {
      if (a[0] === latestVersion) return -1;
      if (b[0] === latestVersion) return 1;
      return b[1] - a[1];
    });
    return entries.map(([version, count]) => {
      const pct = totalItems > 0 ? Math.round((count / totalItems) * 100) : 0;
      let color = "#D97706"; // default non-latest
      if (version === latestVersion) color = "#16A34A";
      else {
        // older versions get red if very old
        const vParts = version.replace(/^v/, "").split(".").map(Number);
        const lParts = latestVersion.replace(/^v/, "").split(".").map(Number);
        const majorDiff = (lParts[0] || 0) - (vParts[0] || 0);
        const minorDiff = (lParts[1] || 0) - (vParts[1] || 0);
        if (majorDiff > 0 || minorDiff > 1) color = "#DC2626";
      }
      return {
        version: version === latestVersion ? `${version} (latest)` : version,
        count,
        pct,
        color,
      };
    });
  }, [allDevices, latestVersion, totalItems]);

  const cols = ["DEVICE", "USER", "OS", "AGENT STATUS", "LAST SEEN", "VERSION", "ACTIONS"];

  // ─── Loading skeleton ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold" style={{ fontSize: 22, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Devices</h1>
            <p style={{ fontSize: 14, color: "#94A3B8", marginTop: 3 }}>Monitor agent status across all managed devices</p>
          </div>
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-1" style={{ borderRadius: 16, padding: 20, border: "1px solid #F0F2F5" }}>
              <Skeleton className="h-3 w-24 mb-3" />
              <Skeleton className="h-9 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid #F8FAFC" }}>
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="px-6 py-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <Skeleton className="h-8 w-8 rounded-xl" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-8" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ─── Error state ───────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold" style={{ fontSize: 22, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Devices</h1>
            <p style={{ fontSize: 14, color: "#94A3B8", marginTop: 3 }}>Monitor agent status across all managed devices</p>
          </div>
        </div>
        <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 16, padding: "16px 20px" }}>
          <p style={{ fontSize: 14, color: "#DC2626", fontWeight: 500 }}>
            Failed to load devices: {error.message}
          </p>
          <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4 }}>
            Data will retry automatically. Check your connection if this persists.
          </p>
        </div>
      </div>
    );
  }

  // ─── Empty state ───────────────────────────────────────────────────────
  if (allDevices.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold" style={{ fontSize: 22, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Devices</h1>
            <p style={{ fontSize: 14, color: "#94A3B8", marginTop: 3 }}>Monitor agent status across all managed devices</p>
          </div>
          <button
            className="flex items-center gap-2 font-semibold"
            style={{ backgroundColor: "#FF5C1A", color: "#ffffff", border: "none", borderRadius: 12, padding: "9px 18px", fontSize: 14, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "background-color 200ms ease" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E5521A"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FF5C1A"; }}
          >
            <Plus size={15} strokeWidth={2.5} /> Deploy Agent
          </button>
        </div>
        <Card>
          <div className="flex flex-col items-center justify-center py-16">
            <Monitor size={40} strokeWidth={1.5} color="#CBD5E1" />
            <p className="mt-4 font-medium" style={{ fontSize: 16, color: "#94A3B8" }}>No devices registered yet</p>
            <p style={{ fontSize: 13, color: "#CBD5E1", marginTop: 4 }}>Deploy the agent to start monitoring devices</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold" style={{ fontSize: 22, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>Devices</h1>
          <p style={{ fontSize: 14, color: "#94A3B8", marginTop: 3 }}>Monitor agent status across all managed devices</p>
        </div>
        <button
          className="flex items-center gap-2 font-semibold"
          style={{ backgroundColor: "#FF5C1A", color: "#ffffff", border: "none", borderRadius: 12, padding: "9px 18px", fontSize: 14, cursor: "pointer", fontFamily: "Inter, sans-serif", transition: "background-color 200ms ease" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E5521A"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FF5C1A"; }}
        >
          <Plus size={15} strokeWidth={2.5} /> Deploy Agent
        </button>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────── */}
      <div className="flex gap-4">
        {/* Card 1 orange */}
        <div className="flex-1" style={{ backgroundColor: "#FF5C1A", border: "1px solid #FDDCC8", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "transform 200ms, box-shadow 200ms" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-1px)"; el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
        >
          <p className="font-semibold tracking-widest uppercase" style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", letterSpacing: "0.08em" }}>Total Devices</p>
          <p className="font-bold mt-2" style={{ fontSize: 36, color: "#ffffff", lineHeight: 1 }}>{totalItems}</p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.80)", marginTop: 6 }}>Managed endpoints</p>
        </div>

        {/* Card 2 white */}
        <div className="flex-1" style={{ backgroundColor: "#ffffff", border: "1px solid #F0F2F5", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "transform 200ms, box-shadow 200ms" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-1px)"; el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
        >
          <p className="font-semibold tracking-widest uppercase" style={{ fontSize: 10, color: "#94A3B8", letterSpacing: "0.08em" }}>Agents Active</p>
          <p className="font-bold mt-2" style={{ fontSize: 36, color: "#1A1A2E", lineHeight: 1 }}>{agentsActive}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="rounded-full" style={{ width: 7, height: 7, backgroundColor: "#16A34A", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#64748B" }}>Browser + Desktop running</span>
          </div>
        </div>

        {/* Card 3 white */}
        <div className="flex-1" style={{ backgroundColor: "#ffffff", border: "1px solid #F0F2F5", borderRadius: 16, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", transition: "transform 200ms, box-shadow 200ms" }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-1px)"; el.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)"; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(0)"; el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
        >
          <p className="font-semibold tracking-widest uppercase" style={{ fontSize: 10, color: "#94A3B8", letterSpacing: "0.08em" }}>Needs Attention</p>
          <p className="font-bold mt-2" style={{ fontSize: 36, color: "#1A1A2E", lineHeight: 1 }}>{needsAttention}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <span className="rounded-full" style={{ width: 7, height: 7, backgroundColor: "#DC2626", display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#DC2626" }}>Offline or outdated</span>
          </div>
        </div>
      </div>

      {/* ── Device Table ────────────────────────────────────────────── */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {/* Table header controls */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #F8FAFC" }}>
          <p className="font-semibold" style={{ fontSize: 16, color: "#1A1A2E" }}>All Devices</p>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex items-center">
              <Search size={13} color="#94A3B8" className="absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search devices..."
                className="outline-none"
                style={{ paddingLeft: 30, paddingRight: 12, paddingTop: 7, paddingBottom: 7, backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, fontSize: 13, color: "#1A1A2E", width: 180, fontFamily: "Inter, sans-serif" }}
              />
            </div>
            {/* Status filter */}
            <div className="relative flex items-center">
              <select className="appearance-none outline-none cursor-pointer pr-8 font-medium"
                style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "7px 14px", fontSize: 13, color: "#1A1A2E", fontFamily: "Inter, sans-serif" }}>
                <option>All Status</option>
                <option>Healthy</option>
                <option>Outdated</option>
                <option>Offline</option>
              </select>
              <ChevronDown size={13} color="#94A3B8" className="absolute right-3 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC" }}>
                {cols.map((col, i) => (
                  <th key={i} className="text-left font-semibold"
                    style={{ padding: i === 0 ? "10px 12px 10px 24px" : i === cols.length - 1 ? "10px 24px 10px 12px" : "10px 12px", fontSize: 11, color: "#94A3B8", letterSpacing: "0.07em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ opacity: isFading ? 0 : 1, transition: "opacity 200ms ease" }}>
              {paginatedDevices.map((d, idx) => {
                const isLast = idx === paginatedDevices.length - 1;
                return (
                  <tr key={d.id}
                    style={{ boxShadow: rowShadow(d.status), borderBottom: isLast ? "none" : "1px solid #F8FAFC", transition: "background-color 150ms" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#FAFAFA"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                  >
                    {/* DEVICE */}
                    <td style={{ padding: "14px 12px 14px 24px", minWidth: 180 }}>
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center justify-center rounded-xl flex-shrink-0"
                          style={{ width: 34, height: 34, backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                          <Monitor size={16} strokeWidth={1.8} color="#64748B" />
                        </div>
                        <div>
                          <p className="font-semibold" style={{ fontSize: 13, color: "#1A1A2E", lineHeight: 1.3 }}>{d.name}</p>
                          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#94A3B8", lineHeight: 1.3 }}>{d.hostname}</p>
                        </div>
                      </div>
                    </td>

                    {/* USER */}
                    <td style={{ padding: "14px 12px", minWidth: 150 }}>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center rounded-full font-bold flex-shrink-0"
                          style={{ width: 28, height: 28, backgroundColor: "#FF5C1A", color: "#ffffff", fontSize: 10 }}>
                          {d.userInitials}
                        </div>
                        <div>
                          <p className="font-medium" style={{ fontSize: 13, color: "#1A1A2E", lineHeight: 1.3 }}>{d.userName}</p>
                          <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.3 }}>{d.userDept}</p>
                        </div>
                      </div>
                    </td>

                    {/* OS */}
                    <td style={{ padding: "14px 12px", minWidth: 140 }}>
                      <div className="flex items-center gap-1.5">
                        <span style={{ color: d.os === "macos" ? "#1A1A2E" : "#0078D4", flexShrink: 0 }}>
                          {d.os === "macos" ? <AppleIcon size={14} /> : <WindowsIcon size={14} />}
                        </span>
                        <span style={{ fontSize: 13, color: "#1A1A2E" }}>{d.osVersion}</span>
                      </div>
                    </td>

                    {/* AGENT STATUS */}
                    <td style={{ padding: "14px 12px", minWidth: 155 }}>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1">
                          {d.browserAgent
                            ? <CheckCircle2 size={13} strokeWidth={2} color="#16A34A" />
                            : <XCircle      size={13} strokeWidth={2} color="#DC2626" />}
                          <span style={{ fontSize: 12, color: d.browserAgent ? "#16A34A" : "#DC2626" }}>
                            Browser {d.browserAgent ? "Active" : "Not installed"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {d.desktopAgent
                            ? <CheckCircle2 size={13} strokeWidth={2} color="#16A34A" />
                            : <XCircle      size={13} strokeWidth={2} color="#DC2626" />}
                          <span style={{ fontSize: 12, color: d.desktopAgent ? "#16A34A" : "#DC2626" }}>
                            Desktop {d.desktopAgent ? "Active" : "Not installed"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* LAST SEEN */}
                    <td style={{ padding: "14px 12px", whiteSpace: "nowrap" }}>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full flex-shrink-0" style={{ width: 7, height: 7, backgroundColor: dotColor[d.lastSeenStatus], display: "inline-block" }} />
                        <span style={{ fontSize: 13, color: "#64748B" }}>{d.lastSeen}</span>
                      </div>
                    </td>

                    {/* VERSION */}
                    <td style={{ padding: "14px 12px" }}>
                      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#94A3B8" }}>{d.version}</p>
                      {d.status === "outdated" && (
                        <span style={{ fontSize: 11, backgroundColor: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.2)", color: "#D97706", borderRadius: 9999, padding: "1px 7px", marginTop: 3, display: "inline-block" }}>
                          Update available
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td style={{ padding: "14px 24px 14px 12px" }}>
                      <div className="relative">
                        <button
                          className="flex items-center justify-center rounded-lg transition-colors"
                          style={{ width: 30, height: 30, border: "1px solid #E2E8F0", backgroundColor: openMenu === d.id ? "#F8FAFC" : "transparent", cursor: "pointer" }}
                          onClick={() => setOpenMenu(openMenu === d.id ? null : d.id)}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F8FAFC"; }}
                          onMouseLeave={e => { if (openMenu !== d.id) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                        >
                          <MoreHorizontal size={15} color="#64748B" />
                        </button>
                        {openMenu === d.id && (
                          <div className="absolute right-0 z-50"
                            style={{ top: 34, backgroundColor: "#ffffff", border: "1px solid #E2E8F0", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", minWidth: 155, overflow: "hidden" }}>
                            <button className="flex items-center gap-2.5 w-full font-medium"
                              style={{ padding: "9px 14px", fontSize: 13, color: "#1A1A2E", backgroundColor: "transparent", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", textAlign: "left" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F8FAFC"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                              onClick={() => { setOpenMenu(null); toast({ title: "View Details", description: "Opening device profile..." }); }}
                            >
                              <Eye size={13} strokeWidth={2} /> View Details
                            </button>

                            <button className="flex items-center gap-2.5 w-full font-medium"
                              style={{ padding: "9px 14px", fontSize: 13, color: "#1A1A2E", backgroundColor: "transparent", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", textAlign: "left" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#F8FAFC"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                              onClick={() => { setOpenMenu(null); handleForceSync(d.id, d.name); }}
                            >
                              <RefreshCw size={13} strokeWidth={2} /> Force Sync
                            </button>

                            <button className="flex items-center gap-2.5 w-full font-medium"
                              style={{ padding: "9px 14px", fontSize: 13, color: "#DC2626", backgroundColor: "transparent", border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif", textAlign: "left" }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FEF2F2"; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
                              onClick={() => { setOpenMenu(null); handleRemoveAgent(d.id, d.name); }}
                            >
                              <Trash2 size={13} strokeWidth={2} /> Remove Agent
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Table footer / pagination */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: "1px solid #F8FAFC" }}
        >
          <span style={{ fontSize: 13, color: "#94A3B8" }}>
            Showing {totalItems > 0 ? (page - 1) * ITEMS_PER_PAGE + 1 : 0}-{Math.min(page * ITEMS_PER_PAGE, totalItems)} of {totalItems} devices
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
      </Card>

      {/* ── Bottom section ──────────────────────────────────────────── */}
      <div className="flex gap-4">

        {/* Left — Deployment Coverage donut */}
        <Card style={{ flex: "0 0 320px" }}>
          <p className="font-semibold mb-1" style={{ fontSize: 15, color: "#1A1A2E" }}>Deployment Coverage</p>
          <p style={{ fontSize: 13, color: "#94A3B8", marginBottom: 16 }}>Active agents across all devices</p>
          <div className="flex flex-col items-center">
            <div className="relative inline-block">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={coverageData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                    paddingAngle={3} dataKey="value" labelLine={false} strokeWidth={0}>
                    {coverageData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-bold" style={{ fontSize: 22, color: "#1A1A2E", lineHeight: 1.1 }}>{coveragePct}%</span>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>coverage</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: "#FF5C1A", display: "inline-block" }} />
                <span style={{ fontSize: 12, color: "#64748B" }}>macOS: {macCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full" style={{ width: 8, height: 8, backgroundColor: "#E2E8F0", display: "inline-block", border: "1px solid #CBD5E1" }} />
                <span style={{ fontSize: 12, color: "#64748B" }}>Windows: {winCount}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Right — Agent Version Distribution */}
        <Card style={{ flex: 1 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold" style={{ fontSize: 15, color: "#1A1A2E" }}>Agent Version Distribution</p>
              <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}>Across all {totalItems} managed devices</p>
            </div>
            <button style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#FF5C1A", fontWeight: 600, fontFamily: "Inter, sans-serif" }}>
              Update all outdated →
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {versionMap.length > 0 ? versionMap.map(v => (
              <div key={v.version}>
                <div className="flex items-center justify-between mb-1.5">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#1A1A2E" }}>{v.version}</span>
                  <span style={{ fontSize: 13, color: "#94A3B8" }}>{v.count} devices</span>
                </div>
                <div className="w-full rounded-full" style={{ height: 8, backgroundColor: "#F8FAFC" }}>
                  <div className="rounded-full" style={{ height: 8, width: `${v.pct}%`, backgroundColor: v.color, transition: "width 600ms ease" }} />
                </div>
              </div>
            )) : (
              <p style={{ fontSize: 13, color: "#94A3B8" }}>No version data available</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
