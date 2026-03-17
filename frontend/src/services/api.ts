/**
 * Devise Dashboard — API service layer (Firebase Edition)
 * Backend: None (Serverless / Direct Firestore)
 * Auth: Firebase SDK
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  deleteDoc,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  onSnapshot,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import type { DetectionEvent, HeartbeatEvent } from "@/data/mockData";

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
  created_at?: string | Timestamp;
  last_active?: string | Timestamp;
  dark_mode?: boolean;
  notification_prefs?: {
    high_risk_alerts: boolean;
    daily_summary: boolean;
    block_notifications: boolean;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function getOrgId(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  
  const profileRef = doc(db, "profiles", user.uid);
  const profileDoc = await getDoc(profileRef);
  
  if (!profileDoc.exists()) {
    // Lazy creation for users who signed up before the fix
    console.log("Profile missing, creating default...");
    const orgId = `org_${user.uid.slice(0, 8)}`;
    
    // Create Organization
    await setDoc(doc(db, "organizations", orgId), {
      id: orgId,
      name: `${user.displayName || 'My'}'s Team`,
      slug: orgId,
      created_at: new Date().toISOString()
    });

    // Create User Profile
    await setDoc(profileRef, {
      id: user.uid,
      email: user.email,
      full_name: user.displayName || "",
      org_id: orgId,
      role: "admin",
      department: "General",
      created_at: new Date().toISOString()
    });

    // Create Default Org Settings
    await setDoc(doc(db, "org_settings", orgId), {
      id: orgId,
      org_id: orgId,
      monthly_budget: 1000,
      alert_threshold: 80,
      auto_block: false,
      allowed_categories: ["AI Assistant", "Development"],
      blocked_domains: [],
      notification_email: true,
      notification_slack: false
    });

    return orgId;
  }
  
  return profileDoc.data().org_id;
}

/**
 * Normalizes any timestamp (Firestore Timestamp or string) to an ISO string.
 * This ensures consistency across the dashboard and fixes "Invalid Date" errors.
 */
function normalizeDate(ts: any): string {
  if (!ts) return new Date().toISOString();
  if (ts instanceof Timestamp) return ts.toDate().toISOString();
  if (typeof ts === 'string') {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  return new Date().toISOString();
}

// Stub for now (not used in direct Firestore version)
export function setApiToken(_token: string | null) {}

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------
export const fetchEvents = async (
  category?: string,
  riskLevel?: string,
  limit = 200,
  _offset = 0
): Promise<EventsResponse> => {
  const orgId = await getOrgId();
  let q = query(
    collection(db, "detection_events"),
    where("org_id", "==", orgId),
    orderBy("timestamp", "desc"),
    firestoreLimit(limit)
  );

  if (category && category !== "all") {
    q = query(q, where("category", "==", category));
  }
  if (riskLevel && riskLevel !== "all") {
    q = query(q, where("risk_level", "==", riskLevel));
  }

  const snapshot = await getDocs(q);
  const events = snapshot.docs.map(d => {
    const data = d.data();
    return { 
      ...data, 
      event_id: d.id,
      timestamp: normalizeDate(data.timestamp),
      department: (!data.department || data.department === "Unknown") ? "General" : data.department
    } as DetectionEvent;
  });

  return {
    total: events.length,
    events
  };
};

export const fetchHeartbeats = async (): Promise<HeartbeatEvent[]> => {
  const orgId = await getOrgId();
  const q = query(
    collection(db, "heartbeats"),
    where("org_id", "==", orgId),
    orderBy("timestamp", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as HeartbeatEvent);
};

export const fetchStats = async (): Promise<StatsResponse> => {
  const orgId = await getOrgId();
  
  // In a real app with huge data, we'd use aggregation queries or cloud functions.
  // For V1-V2, we process on the client or fetch a summary doc.
  const eventsSnap = await getDocs(query(collection(db, "detection_events"), where("org_id", "==", orgId)));
  const heartbeatsSnap = await getDocs(query(collection(db, "heartbeats"), where("org_id", "==", orgId)));
  
  // Wrap index-prone queries in try-catch to prevent crashing the whole stats load
  let tamperSnap: any = { size: 0, docs: [] };
  let gapSnap: any = { size: 0, docs: [] };
  
  try {
    tamperSnap = await getDocs(query(collection(db, "tamper_alerts"), where("org_id", "==", orgId)));
  } catch (e) {
    console.warn("Tamper alerts query failed (missing index?)", e);
  }
  
  try {
    gapSnap = await getDocs(query(collection(db, "agent_gaps"), where("org_id", "==", orgId), where("suspicious", "==", true)));
  } catch (e) {
    console.warn("Agent gaps query failed (missing index?)", e);
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const sixMinsAgo = new Date(now.getTime() - 6 * 60000).toISOString();
  
  const tools = new Set();
  let highRiskCount = 0;
  let unapprovedCount = 0;
  let highRiskUnapproved = 0;
  let todayDetections = 0;

  eventsSnap.docs.forEach(d => {
    const data = d.data();
    const ts = normalizeDate(data.timestamp);

    tools.add(data.tool_name);
    if (data.risk_level === "high") highRiskCount++;
    if (!data.is_approved) unapprovedCount++;
    if (data.risk_level === "high" && !data.is_approved) highRiskUnapproved++;
    if (ts && ts >= todayStart) todayDetections++;
  });

  const onlineDevices = heartbeatsSnap.docs.filter(d => {
    const data = d.data();
    const ts = normalizeDate(data.timestamp);
    return ts && ts >= sixMinsAgo;
  }).length;

  return {
    totalDetections: todayDetections, // Label in UI is "Events Today"
    uniqueTools: tools.size,
    highRiskCount,
    unapprovedCount,
    onlineDevices,
    totalDevices: heartbeatsSnap.size,
    activeAlerts: tamperSnap.size + gapSnap.size + highRiskUnapproved
  };
};

export const fetchAlerts = async (): Promise<AlertItem[]> => {
  const orgId = await getOrgId();
  const alerts: AlertItem[] = [];

  // High-risk unapproved
  const hrSnap = await getDocs(query(
    collection(db, "detection_events"),
    where("org_id", "==", orgId),
    where("risk_level", "==", "high"),
    where("is_approved", "==", false)
  ));
  hrSnap.forEach(d => {
    const r = d.data();
    alerts.push({
      id: `hr-${r.event_id}`,
      type: "high_risk",
      title: `High-risk unapproved tool: ${r.tool_name || "Unknown"}`,
      description: `${r.user_id || "?"} accessed ${r.domain || "?"} via ${r.process_name || "?"}`,
      timestamp: normalizeDate(r.timestamp),
      severity: "high"
    });
  });

  // Tamper alerts
  const taSnap = await getDocs(query(collection(db, "tamper_alerts"), where("org_id", "==", orgId)));
  taSnap.forEach(d => {
    const r = d.data();
    alerts.push({
      id: `ta-${r.device_id}-${r.timestamp}`,
      type: "tamper",
      title: "Agent binary tampered",
      description: `Device ${String(r.device_id).slice(0, 8)}… — hash mismatch detected`,
      timestamp: normalizeDate(r.timestamp),
      severity: "high"
    });
  });

  // Dismissed filter
  const dismissedSnap = await getDocs(query(collection(db, "dismissed_alerts"), where("org_id", "==", orgId)));
  const dismissedIds = new Set(dismissedSnap.docs.map(d => d.data().alert_id));

  return alerts
    .filter(a => !dismissedIds.has(a.id))
    .sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
};

export const fetchAnalytics = async (): Promise<AnalyticsResponse> => {
  const orgId = await getOrgId();
  const eventsSnap = await getDocs(query(collection(db, "detection_events"), where("org_id", "==", orgId)));
  
  const toolCounts: Record<string, number> = {};
  const catCounts: Record<string, number> = {};
  const procCounts: Record<string, number> = {};
  const timeCounts: Record<string, number> = {};

  eventsSnap.docs.forEach(d => {
    const e = d.data();
    const tn = e.tool_name || "Unknown";
    toolCounts[tn] = (toolCounts[tn] || 0) + 1;
    
    const cat = e.category || "Unknown";
    catCounts[cat] = (catCounts[cat] || 0) + 1;
    
    const proc = e.process_name || "Unknown";
    procCounts[proc] = (procCounts[proc] || 0) + 1;
    
    const ts = normalizeDate(e.timestamp);
      
    if (ts && ts.length >= 13) {
      // ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
      const hour = ts.substring(11, 13) + ":00";
      timeCounts[hour] = (timeCounts[hour] || 0) + 1;
    }
  });

  return {
    byTool: Object.entries(toolCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8),
    byCategory: Object.entries(catCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    overTime: Object.entries(timeCounts).map(([time, count]) => ({ time, count })).sort((a, b) => a.time.localeCompare(b.time)),
    topProcesses: Object.entries(procCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10),
  };
};

export const fetchSubscriptions = async (): Promise<SubscriptionItem[]> => {
  const orgId = await getOrgId();
  const q = query(collection(db, "subscriptions"), where("org_id", "==", orgId), orderBy("tool_name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as SubscriptionItem);
};

export const fetchSpendOverview = async (): Promise<SpendOverview> => {
  const orgId = await getOrgId();
  const subsSnap = await getDocs(query(collection(db, "subscriptions"), where("org_id", "==", orgId)));
  const settingsDoc = await getDoc(doc(db, "org_settings", orgId));

  const subs = subsSnap.docs.map(d => d.data());
  const activeSubs = subs.filter(s => s.status === "active");
  const totalMonthlySpend = activeSubs.reduce((acc, s) => acc + (Number(s.cost_monthly) || 0), 0);
  
  const zombies = subs.filter(s => s.status === "zombie");
  const zombieCost = zombies.reduce((acc, s) => acc + (Number(s.cost_monthly) || 0), 0);
  
  const budget = settingsDoc.exists() ? (Number(settingsDoc.data().monthly_budget) || 0) : 0;

  return {
    totalMonthlySpend,
    monthlyBudget: budget,
    budgetRemaining: budget - totalMonthlySpend,
    zombieLicenses: zombies.length,
    zombieCost
  };
};

export const fetchTeam = async (): Promise<TeamResponse> => {
  const orgId = await getOrgId();
  const membersSnap = await getDocs(query(collection(db, "profiles"), where("org_id", "==", orgId)));
  const invitesSnap = await getDocs(query(collection(db, "team_invites"), where("org_id", "==", orgId)));
  
  return {
    members: membersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)),
    invites: invitesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any))
  };
};

export const fetchSettings = async (): Promise<OrgSettings> => {
  const orgId = await getOrgId();
  const res = await getDoc(doc(db, "org_settings", orgId));
  if (!res.exists()) throw new Error("Settings not found");
  return { id: res.id, ...res.data() } as OrgSettings;
};

export const fetchMe = async (): Promise<UserProfile> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  
  const profileDoc = await getDoc(doc(db, "profiles", user.uid));
  if (!profileDoc.exists()) throw new Error("Profile not found");
  
  const data = profileDoc.data();
  const orgId = data.org_id;
  
  if (orgId) {
    const orgDoc = await getDoc(doc(db, "organizations", orgId));
    if (orgDoc.exists()) {
      const orgData = orgDoc.data();
      data.org_name = orgData.name || "";
      data.org_slug = orgData.slug || "";
    }
  }
  
  return { id: profileDoc.id, ...data } as UserProfile;
};

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
export const updateMe = async (data: Partial<UserProfile>): Promise<{ status: string }> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  
  const profileRef = doc(db, "profiles", user.uid);
  await setDoc(profileRef, data, { merge: true });
  return { status: "updated" };
};

export const updateLastActive = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return;
  
  const profileRef = doc(db, "profiles", user.uid);
  await setDoc(profileRef, {
    last_active: serverTimestamp()
  }, { merge: true });
};

export const getUserDetectionCount = async (email: string): Promise<number> => {
  const orgId = await getOrgId();
  const q = query(
    collection(db, "detection_events"),
    where("org_id", "==", orgId),
    where("user_id", "==", email) // Assuming user_id field in events stores email
  );
  const snap = await getDocs(q);
  return snap.size;
};

export const dismissAlert = async (alertId: string): Promise<{ status: string; id: string }> => {
  const orgId = await getOrgId();
  const user = auth.currentUser;
  
  await setDoc(doc(db, "dismissed_alerts", alertId), {
    alert_id: alertId,
    org_id: orgId,
    action: "dismissed",
    dismissed_by: user?.uid,
    timestamp: new Date().toISOString()
  });
  
  return { status: "dismissed", id: alertId };
};

export const resolveAlert = async (alertId: string): Promise<{ status: string; id: string }> => {
  // Logic could vary, for now same as dismiss or update a status field
  return dismissAlert(alertId);
};

export const inviteTeamMember = async (email: string, role: string = "member"): Promise<{ status: string; email: string }> => {
  const orgId = await getOrgId();
  const id = `inv_${Date.now()}`;
  
  await setDoc(doc(db, "team_invites", id), {
    email,
    role,
    org_id: orgId,
    status: "pending",
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
  
  return { status: "invited", email };
};

export const updateSettings = async (settings: Partial<OrgSettings>): Promise<{ status: string }> => {
  const orgId = await getOrgId();
  await setDoc(doc(db, "org_settings", orgId), settings, { merge: true });
  return { status: "updated" };
};

// ---------------------------------------------------------------------------
// AI FIREWALL
// ---------------------------------------------------------------------------
export interface FirewallRule {
  id: string;
  tool_name: string;
  domain: string;
  status: "allowed" | "blocked";
  updated_at: string;
  updated_by: string;
  block_count: number;
}

export interface BlockEvent {
  id: string;
  event_id: string;
  tool_name: string;
  domain: string;
  user_id: string;
  device_id: string;
  timestamp: string;
  block_reason: string | null;
  policy_matched: string | null;
  org_id: string;
}

export interface FirewallStats {
  blockedToday: number;
  blockEventsThisWeek: number;
  policyViolations: number;
  complianceScore: number;
}

export const fetchFirewallRules = async (): Promise<FirewallRule[]> => {
  const orgId = await getOrgId();
  const snap = await getDocs(
    collection(db, "org_settings", orgId, "firewall_rules")
  );
  return snap.docs.map(d => {
    const data = d.data();
    return { 
      id: d.id, 
      ...data,
      updated_at: normalizeDate(data.updated_at)
    } as FirewallRule;
  });
};

export const updateFirewallRule = async (
  rule: Omit<FirewallRule, "id" | "block_count" | "updated_at" | "updated_by">
): Promise<{ status: string }> => {
  const orgId = await getOrgId();
  const user = auth.currentUser;
  const ruleId = rule.tool_name.replace(/\s+/g, "_").toLowerCase();
  await setDoc(
    doc(db, "org_settings", orgId, "firewall_rules", ruleId),
    {
      ...rule,
      updated_at: new Date().toISOString(),
      updated_by: user?.email || "unknown",
      block_count: 0,
    },
    { merge: true }
  );
  return { status: "updated" };
};

export const deleteFirewallRule = async (toolName: string): Promise<void> => {
  const orgId = await getOrgId();
  const ruleId = toolName.replace(/\s+/g, "_").toLowerCase();
  await deleteDoc(doc(db, "org_settings", orgId, "firewall_rules", ruleId));
};

export const fetchBlockEvents = async (limitN = 100): Promise<BlockEvent[]> => {
  const orgId = await getOrgId();
  const q = query(
    collection(db, "detection_events"),
    where("org_id", "==", orgId),
    where("event_type", "==", "blocked"),
    orderBy("timestamp", "desc"),
    firestoreLimit(limitN)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return { 
      id: d.id, 
      ...data,
      timestamp: normalizeDate(data.timestamp)
    } as BlockEvent;
  });
};

export const fetchFirewallStats = async (): Promise<FirewallStats> => {
  const orgId = await getOrgId();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();

  const allBlocksSnap = await getDocs(query(
    collection(db, "detection_events"),
    where("org_id", "==", orgId),
    where("event_type", "==", "blocked")
  ));

  const allEventsSnap = await getDocs(query(
    collection(db, "detection_events"),
    where("org_id", "==", orgId)
  ));

  const allBlocks = allBlocksSnap.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      timestamp: normalizeDate(data.timestamp)
    };
  });
  const blockedToday = allBlocks.filter(e => (e.timestamp || "") >= todayStart).length;
  const blockEventsThisWeek = allBlocks.filter(e => (e.timestamp || "") >= weekStart).length;
  
  const rulesSnap = await getDocs(collection(db, "org_settings", orgId, "firewall_rules"));
  const totalRules = rulesSnap.size;
  const allowedRules = rulesSnap.docs.filter(d => d.data().status === "allowed").length;
  const complianceScore = totalRules > 0 ? Math.round((allowedRules / totalRules) * 100) : 100;

  return {
    blockedToday,
    blockEventsThisWeek,
    policyViolations: allBlocks.length,
    complianceScore,
  };
};

// Auto-populate firewall rules from detected events
export const syncFirewallRulesFromEvents = async (): Promise<void> => {
  const orgId = await getOrgId();
  const eventsSnap = await getDocs(query(
    collection(db, "detection_events"),
    where("org_id", "==", orgId)
  ));

  const existingSnap = await getDocs(collection(db, "org_settings", orgId, "firewall_rules"));
  const existingIds = new Set(existingSnap.docs.map(d => d.id));

  const toolsSeen: Record<string, { tool_name: string; domain: string }> = {};
  eventsSnap.docs.forEach(d => {
    const e = d.data();
    if (e.tool_name) {
      const ruleId = e.tool_name.replace(/\s+/g, "_").toLowerCase();
      if (!toolsSeen[ruleId]) toolsSeen[ruleId] = { tool_name: e.tool_name, domain: e.domain || "" };
    }
  });

  const user = auth.currentUser;
  const batch: Promise<void>[] = [];
  for (const [ruleId, info] of Object.entries(toolsSeen)) {
    if (!existingIds.has(ruleId)) {
      batch.push(setDoc(
        doc(db, "org_settings", orgId, "firewall_rules", ruleId),
        {
          tool_name: info.tool_name,
          domain: info.domain,
          status: "allowed",
          updated_at: new Date().toISOString(),
          updated_by: user?.email || "system",
          block_count: 0,
        }
      ));
    }
  }
  await Promise.all(batch);
};

// ---------------------------------------------------------------------------
// DATA SENSITIVITY
// ---------------------------------------------------------------------------
export type SensitivityFlag =
  | "SOURCE_CODE"
  | "FILE_UPLOAD"
  | "LARGE_PASTE"
  | "FINANCIAL_KEYWORDS"
  | "CREDENTIALS_PATTERN";

export interface SensitivityEvent {
  id: string;
  event_id: string;
  tool_name: string;
  domain: string;
  user_id: string;
  device_id: string;
  timestamp: string;
  sensitivity_flag: SensitivityFlag;
  sensitivity_score: number;
  window_title: string | null;
  paste_size_chars: number | null;
  file_name: string | null;
  org_id: string;
  reviewed: boolean;
}

export interface EmployeeRiskScore {
  id: string;
  user_email: string;
  risk_score: number;
  high_risk_events: number;
  medium_risk_events: number;
  last_incident: string;
  top_sensitivity_type: string;
  updated_at: string;
}

export interface DataRiskStats {
  highRiskToday: number;
  employeesWithRisk: number;
  mostCommonType: string;
  orgRiskScore: number;
}

export const fetchSensitivityEvents = async (
  flag?: SensitivityFlag,
  limitN = 100
): Promise<SensitivityEvent[]> => {
  const orgId = await getOrgId();
  let q = query(
    collection(db, "detection_events"),
    where("org_id", "==", orgId),
    where("sensitivity_flag", "!=", null),
    orderBy("sensitivity_flag"),
    orderBy("timestamp", "desc"),
    firestoreLimit(limitN)
  );
  const snap = await getDocs(q);
  const events = snap.docs
    .map(d => {
      const data = d.data();
      return { 
        id: d.id, 
        ...data,
        timestamp: normalizeDate(data.timestamp)
      } as SensitivityEvent;
    })
    .filter(e => !flag || e.sensitivity_flag === flag);
  return events;
};

export const fetchEmployeeRiskScores = async (): Promise<EmployeeRiskScore[]> => {
  const orgId = await getOrgId();
  const snap = await getDocs(
    collection(db, "risk_scores", orgId, "employees")
  );
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as EmployeeRiskScore))
    .sort((a, b) => b.risk_score - a.risk_score);
};

export const fetchDataRiskStats = async (): Promise<DataRiskStats> => {
  const orgId = await getOrgId();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const allSensitiveSnap = await getDocs(query(
    collection(db, "detection_events"),
    where("org_id", "==", orgId),
    where("sensitivity_flag", "!=", null)
  ));

  const all = allSensitiveSnap.docs.map(d => d.data());
  const highRiskToday = all.filter(e => 
    (e.timestamp || "") >= todayStart && (e.sensitivity_score || 0) >= 70
  ).length;
  
  const employeeSet = new Set(all.map(e => e.user_id).filter(Boolean));
  
  const flagCounts: Record<string, number> = {};
  all.forEach(e => {
    if (e.sensitivity_flag) flagCounts[e.sensitivity_flag] = (flagCounts[e.sensitivity_flag] || 0) + 1;
  });
  const mostCommonType = Object.entries(flagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  
  const avgScore = all.length > 0
    ? Math.round(all.reduce((s, e) => s + (e.sensitivity_score || 0), 0) / all.length)
    : 0;

  return {
    highRiskToday,
    employeesWithRisk: employeeSet.size,
    mostCommonType,
    orgRiskScore: avgScore,
  };
};

export const markSensitivityEventReviewed = async (eventDocId: string): Promise<void> => {
  await setDoc(doc(db, "detection_events", eventDocId), { reviewed: true }, { merge: true });
};

export const subscribeToHighRiskEvents = (
  orgId: string,
  callback: (events: SensitivityEvent[]) => void
): (() => void) => {
  const q = query(
    collection(db, "detection_events"),
    where("org_id", "==", orgId),
    where("sensitivity_flag", "!=", null),
    orderBy("sensitivity_flag"),
    orderBy("timestamp", "desc"),
    firestoreLimit(20)
  );
  return onSnapshot(q, snap => {
    const events = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as SensitivityEvent))
      .filter(e => (e.sensitivity_score || 0) >= 60);
    callback(events);
  });
};

// Rebuild employee risk scores from sensitivity events (client-side)
export const rebuildEmployeeRiskScores = async (): Promise<void> => {
  const orgId = await getOrgId();
  const eventsSnap = await getDocs(query(
    collection(db, "detection_events"),
    where("org_id", "==", orgId),
    where("sensitivity_flag", "!=", null)
  ));

  const byEmployee: Record<string, SensitivityEvent[]> = {};
  eventsSnap.docs.forEach(d => {
    const e = { id: d.id, ...d.data() } as SensitivityEvent;
    const key = e.user_id || "unknown";
    if (!byEmployee[key]) byEmployee[key] = [];
    byEmployee[key].push(e);
  });

  const batch: Promise<void>[] = [];
  for (const [email, events] of Object.entries(byEmployee)) {
    const highRisk = events.filter(e => (e.sensitivity_score || 0) >= 70).length;
    const medRisk  = events.filter(e => (e.sensitivity_score || 0) >= 40 && (e.sensitivity_score || 0) < 70).length;
    const avgScore = Math.round(events.reduce((s, e) => s + (e.sensitivity_score || 0), 0) / events.length);
    const sorted   = events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const flagCounts: Record<string, number> = {};
    events.forEach(e => { flagCounts[e.sensitivity_flag] = (flagCounts[e.sensitivity_flag] || 0) + 1; });
    const topType = Object.entries(flagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

    const scoreId = email.replace(/[^a-zA-Z0-9]/g, "_");
    batch.push(setDoc(
      doc(db, "risk_scores", orgId, "employees", scoreId),
      {
        user_email: email,
        risk_score: avgScore,
        high_risk_events: highRisk,
        medium_risk_events: medRisk,
        last_incident: typeof sorted[0]?.timestamp === 'string' ? sorted[0].timestamp : (sorted[0]?.timestamp as any)?.toDate?.()?.toISOString() || "",
        top_sensitivity_type: topType,
        updated_at: new Date().toISOString(),
      }
    ));
  }
  await Promise.all(batch);
};
