import { useQuery } from "@tanstack/react-query";
import {
  fetchEvents,
  fetchHeartbeats,
  fetchStats,
  fetchAlerts,
  fetchAnalytics,
  fetchSubscriptions,
  fetchSpendOverview,
  fetchTeam,
  fetchSettings,
  fetchMe,
  type StatsResponse,
  type AlertItem,
  type AnalyticsResponse,
  type EventsResponse,
  type SubscriptionItem,
  type SpendOverview,
  type TeamResponse,
  type OrgSettings,
  type UserProfile,
} from "@/services/api";
import type { HeartbeatEvent } from "@/data/mockData";

/**
 * Polling intervals (user-specified):
 *   Events:       10s
 *   Stats:        30s
 *   Heartbeats:   30s
 *   Alerts:       30s
 *   Analytics:    60s
 *   Subscriptions:60s
 *
 * Phase 2 plan: Replace polling for Events and Alerts with Supabase Realtime
 * WebSocket subscriptions.
 */

export function useEvents(category?: string, riskLevel?: string) {
  return useQuery<EventsResponse, Error>({
    queryKey: ["events", category, riskLevel],
    queryFn: () => fetchEvents(category, riskLevel),
    refetchInterval: 10_000,
    staleTime: 8_000,
    retry: 2,
  });
}

export function useStats() {
  return useQuery<StatsResponse, Error>({
    queryKey: ["stats"],
    queryFn: fetchStats,
    refetchInterval: 30_000,
    staleTime: 25_000,
    retry: 2,
  });
}

export function useHeartbeats() {
  return useQuery<HeartbeatEvent[], Error>({
    queryKey: ["heartbeats"],
    queryFn: fetchHeartbeats,
    refetchInterval: 30_000,
    staleTime: 25_000,
    retry: 2,
  });
}

export function useAlerts() {
  return useQuery<AlertItem[], Error>({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
    refetchInterval: 30_000,
    staleTime: 25_000,
    retry: 2,
  });
}

export function useAnalytics() {
  return useQuery<AnalyticsResponse, Error>({
    queryKey: ["analytics"],
    queryFn: fetchAnalytics,
    refetchInterval: 60_000,
    staleTime: 55_000,
    retry: 2,
  });
}

export function useSubscriptions() {
  return useQuery<SubscriptionItem[], Error>({
    queryKey: ["subscriptions"],
    queryFn: fetchSubscriptions,
    refetchInterval: 60_000,
    staleTime: 55_000,
    retry: 2,
  });
}

export function useSpendOverview() {
  return useQuery<SpendOverview, Error>({
    queryKey: ["spend-overview"],
    queryFn: fetchSpendOverview,
    refetchInterval: 60_000,
    staleTime: 55_000,
    retry: 2,
  });
}

export function useTeam() {
  return useQuery<TeamResponse, Error>({
    queryKey: ["team"],
    queryFn: fetchTeam,
    refetchInterval: 60_000,
    staleTime: 55_000,
    retry: 2,
  });
}

export function useSettings() {
  return useQuery<OrgSettings, Error>({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    staleTime: 60_000,
    retry: 2,
  });
}

export function useMe() {
  return useQuery<UserProfile, Error>({
    queryKey: ["me"],
    queryFn: fetchMe,
    staleTime: 300_000,
    retry: 2,
  });
}
