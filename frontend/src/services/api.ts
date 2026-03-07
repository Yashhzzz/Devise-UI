/**
 * Devise Dashboard — API service layer
 * Backend: FastAPI deployed as Vercel serverless function
 * Auth: Supabase JWT attached to every request
 *
 * API_BASE is empty so that all requests use relative URLs.
 * This works on both localhost (via Vite proxy) and Vercel (same origin).
 */

import type { DetectionEvent, HeartbeatEvent } from "@/data/mockData";
import { supabase } from "@/lib/supabase";

export const API_BASE = "";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

async function apiFetch<T>(
  path: string,
  params?: Record<string, string | number>,
  init?: RequestInit
): Promise<T> {
  let url = `${API_BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) qs.set(k, String(v));
    });
    const qsStr = qs.toString();
    if (qsStr) url += `?${qsStr}`;
  }
  const headers = await getAuthHeaders();
  const res = await fetch(url, {
    ...init,
    headers: { ...headers, ...(init?.headers || {}) },
  });
  if (res.status === 401) {
    // Session expired — sign out and redirect
    await supabase.auth.signOut();
    window.location.reload();
    throw new Error("Session expired");
  }
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------
export interface EventsResponse {
  total: number;
  events: DetectionEvent[];
}

export interface StatsResponse {
  totalDetections: number;
  uniqueTools: number;
  highRiskCount: number;
  unapprovedCount: number;
  onlineDevices: number;
  totalDevices: number;
  activeAlerts: number;
}

export interface AlertItem {
  id: string;
  type: "high_risk" | "unapproved" | "tamper" | "agent_gap" | "high_frequency";
  title: string;
  description: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
}

export interface AnalyticsResponse {
  byTool: { name: string; count: number }[];
  byCategory: { name: string; value: number }[];
  overTime: { time: string; count: number }[];
  topProcesses: { name: string; count: number }[];
}

export interface SubscriptionItem {
  id: string;
  tool_name: string;
  vendor: string;
  seats: number;
  seats_used: number;
  cost_monthly: number;
  currency: string;
  status: "active" | "zombie" | "cancelled" | "trial";
  renewal_date: string | null;
  created_at: string;
}

export interface SpendOverview {
  totalMonthlySpend: number;
  monthlyBudget: number;
  budgetRemaining: number;
  zombieLicenses: number;
  zombieCost: number;
}

export interface TeamResponse {
  members: {
    id: string;
    full_name: string;
    email: string;
    department: string;
    role: string;
    avatar_url: string | null;
    created_at: string;
  }[];
  invites: {
    id: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    expires_at: string;
  }[];
}

export interface OrgSettings {
  id: string;
  org_id: string;
  monthly_budget: number;
  alert_threshold: number;
  auto_block: boolean;
  allowed_categories: string[];
  blocked_domains: string[];
  notification_email: boolean;
  notification_slack: boolean;
  slack_webhook_url: string | null;
}

export interface UserProfile {
  id: string;
  org_id: string;
  full_name: string;
  email: string;
  department: string;
  role: string;
  avatar_url: string | null;
  org_name: string;
  org_slug: string;
}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------
export const fetchEvents = (
  category?: string,
  riskLevel?: string,
  limit = 200,
  offset = 0
): Promise<EventsResponse> => {
  const params: Record<string, string | number> = { limit, offset };
  if (category && category !== "all") params.category = category;
  if (riskLevel && riskLevel !== "all") params.risk_level = riskLevel;
  return apiFetch<EventsResponse>("/api/events", params);
};

export const fetchHeartbeats = (): Promise<HeartbeatEvent[]> =>
  apiFetch<HeartbeatEvent[]>("/api/heartbeats");

export const fetchStats = (): Promise<StatsResponse> =>
  apiFetch<StatsResponse>("/api/stats");

export const fetchAlerts = (): Promise<AlertItem[]> =>
  apiFetch<AlertItem[]>("/api/alerts");

export const fetchAnalytics = (): Promise<AnalyticsResponse> =>
  apiFetch<AnalyticsResponse>("/api/analytics");

export const fetchSubscriptions = (): Promise<SubscriptionItem[]> =>
  apiFetch<SubscriptionItem[]>("/api/subscriptions");

export const fetchSpendOverview = (): Promise<SpendOverview> =>
  apiFetch<SpendOverview>("/api/overview/spend");

export const fetchTeam = (): Promise<TeamResponse> =>
  apiFetch<TeamResponse>("/api/team");

export const fetchSettings = (): Promise<OrgSettings> =>
  apiFetch<OrgSettings>("/api/settings");

export const fetchMe = (): Promise<UserProfile> =>
  apiFetch<UserProfile>("/api/me");

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export const dismissAlert = async (
  alertId: string
): Promise<{ status: string; id: string }> => {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE}/api/alerts/${encodeURIComponent(alertId)}`,
    { method: "DELETE", headers }
  );
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
};

export const resolveAlert = async (
  alertId: string
): Promise<{ status: string; id: string }> => {
  const headers = await getAuthHeaders();
  const res = await fetch(
    `${API_BASE}/api/alerts/${encodeURIComponent(alertId)}/resolve`,
    { method: "PUT", headers }
  );
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
};

export const inviteTeamMember = async (
  email: string,
  role: string = "member"
): Promise<{ status: string; email: string }> => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/team/invite`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
};

export const updateSettings = async (
  settings: Partial<OrgSettings>
): Promise<{ status: string }> => {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
};
