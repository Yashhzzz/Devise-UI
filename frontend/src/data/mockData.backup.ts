// Mock data for Devise Dashboard

export interface DetectionEvent {
  event_id: string;
  user_id: string;
  user_email: string;
  department: string;
  device_id: string;
  tool_name: string;
  domain: string;
  category: string;
  vendor: string;
  risk_level: "low" | "medium" | "high";
  source: string;
  process_name: string;
  process_path: string;
  is_approved: boolean;
  timestamp: string;
  connection_frequency?: number;
  high_frequency?: boolean;
  bytes_read?: number;
  bytes_write?: number;
}

export interface HeartbeatEvent {
  event_type: "heartbeat";
  device_id: string;
  agent_version: string;
  queue_depth: number;
  last_detection_time: string | null;
  os_version: string;
  restart_detected: boolean;
  timestamp: string;
}

export interface TamperAlert {
  type: "tamper_alert";
  device_id: string;
  expected_hash: string;
  actual_hash: string;
  timestamp: string;
}

export interface AgentGapEvent {
  event_type: "agent_gap";
  device_id: string;
  gap_seconds: number;
  last_seen: string;
  suspicious: boolean;
  timestamp: string;
}

const now = new Date();
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60000).toISOString();

const devices = [
  "03479922-d748-5ca6-aaf9-31f1f7e93c28",
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
  "11223344-5566-7788-99aa-bbccddeeff00",
  "deadbeef-cafe-babe-face-123456789abc",
];

const users = [
  { id: "yashm", email: "yash.m@company.com", dept: "Engineering" },
  { id: "sarahk", email: "sarah.k@company.com", dept: "Product" },
  { id: "mikej", email: "mike.j@company.com", dept: "Design" },
  { id: "emilyw", email: "emily.w@company.com", dept: "Marketing" },
  { id: "alexr", email: "alex.r@company.com", dept: "Engineering" },
];

let eventId = 0;
const eid = () => `evt-${String(++eventId).padStart(4, "0")}-${Math.random().toString(36).slice(2, 10)}`;

export const mockDetectionEvents: DetectionEvent[] = [
  { event_id: eid(), user_id: "yashm", user_email: "yash.m@company.com", department: "Engineering", device_id: devices[0], tool_name: "OpenAI ChatGPT", domain: "chat.openai.com", category: "chat", vendor: "OpenAI", risk_level: "medium", source: "desktop", process_name: "chrome.exe", process_path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", is_approved: true, timestamp: ago(2), connection_frequency: 3 },
  { event_id: eid(), user_id: "sarahk", user_email: "sarah.k@company.com", department: "Product", device_id: devices[1], tool_name: "Claude", domain: "claude.ai", category: "chat", vendor: "Anthropic", risk_level: "medium", source: "desktop", process_name: "firefox.exe", process_path: "C:\\Program Files\\Mozilla Firefox\\firefox.exe", is_approved: true, timestamp: ago(5) },
  { event_id: eid(), user_id: "yashm", user_email: "yash.m@company.com", department: "Engineering", device_id: devices[0], tool_name: "OpenAI API", domain: "api.openai.com", category: "api", vendor: "OpenAI", risk_level: "high", source: "desktop", process_name: "python.exe", process_path: "C:\\Python311\\python.exe", is_approved: false, timestamp: ago(8), connection_frequency: 15, high_frequency: true, bytes_read: 2048000, bytes_write: 512000 },
  { event_id: eid(), user_id: "mikej", user_email: "mike.j@company.com", department: "Design", device_id: devices[2], tool_name: "Midjourney", domain: "midjourney.com", category: "image", vendor: "Midjourney", risk_level: "medium", source: "desktop", process_name: "chrome.exe", process_path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", is_approved: false, timestamp: ago(12) },
  { event_id: eid(), user_id: "alexr", user_email: "alex.r@company.com", department: "Engineering", device_id: devices[4], tool_name: "GitHub Copilot", domain: "copilot.github.com", category: "coding", vendor: "Microsoft", risk_level: "low", source: "desktop", process_name: "Code.exe", process_path: "C:\\Users\\alexr\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", is_approved: true, timestamp: ago(15) },
  { event_id: eid(), user_id: "emilyw", user_email: "emily.w@company.com", department: "Marketing", device_id: devices[3], tool_name: "Jasper", domain: "jasper.ai", category: "productivity", vendor: "Jasper", risk_level: "medium", source: "desktop", process_name: "chrome.exe", process_path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", is_approved: false, timestamp: ago(18) },
  { event_id: eid(), user_id: "yashm", user_email: "yash.m@company.com", department: "Engineering", device_id: devices[0], tool_name: "Anthropic API", domain: "api.anthropic.com", category: "api", vendor: "Anthropic", risk_level: "high", source: "desktop", process_name: "node.exe", process_path: "C:\\Program Files\\nodejs\\node.exe", is_approved: false, timestamp: ago(22), connection_frequency: 8 },
  { event_id: eid(), user_id: "sarahk", user_email: "sarah.k@company.com", department: "Product", device_id: devices[1], tool_name: "Perplexity", domain: "perplexity.ai", category: "search", vendor: "Perplexity", risk_level: "medium", source: "desktop", process_name: "chrome.exe", process_path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", is_approved: false, timestamp: ago(30) },
  { event_id: eid(), user_id: "mikej", user_email: "mike.j@company.com", department: "Design", device_id: devices[2], tool_name: "DALL-E", domain: "labs.openai.com", category: "image", vendor: "OpenAI", risk_level: "medium", source: "desktop", process_name: "chrome.exe", process_path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", is_approved: true, timestamp: ago(35) },
  { event_id: eid(), user_id: "alexr", user_email: "alex.r@company.com", department: "Engineering", device_id: devices[4], tool_name: "Cursor", domain: "cursor.sh", category: "coding", vendor: "Anysphere", risk_level: "medium", source: "desktop", process_name: "Cursor.exe", process_path: "C:\\Users\\alexr\\AppData\\Local\\Programs\\Cursor\\Cursor.exe", is_approved: false, timestamp: ago(40) },
  { event_id: eid(), user_id: "emilyw", user_email: "emily.w@company.com", department: "Marketing", device_id: devices[3], tool_name: "Grammarly", domain: "grammarly.com", category: "productivity", vendor: "Grammarly", risk_level: "low", source: "desktop", process_name: "chrome.exe", process_path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", is_approved: true, timestamp: ago(45) },
  { event_id: eid(), user_id: "yashm", user_email: "yash.m@company.com", department: "Engineering", device_id: devices[0], tool_name: "Google Gemini", domain: "gemini.google.com", category: "chat", vendor: "Google", risk_level: "medium", source: "desktop", process_name: "chrome.exe", process_path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", is_approved: true, timestamp: ago(55) },
  { event_id: eid(), user_id: "sarahk", user_email: "sarah.k@company.com", department: "Product", device_id: devices[1], tool_name: "Notion AI", domain: "notion.so", category: "productivity", vendor: "Notion", risk_level: "low", source: "desktop", process_name: "Notion.exe", process_path: "C:\\Users\\sarahk\\AppData\\Local\\Programs\\Notion\\Notion.exe", is_approved: true, timestamp: ago(60) },
  { event_id: eid(), user_id: "alexr", user_email: "alex.r@company.com", department: "Engineering", device_id: devices[4], tool_name: "DeepSeek", domain: "deepseek.com", category: "chat", vendor: "DeepSeek", risk_level: "medium", source: "desktop", process_name: "chrome.exe", process_path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", is_approved: false, timestamp: ago(70) },
  { event_id: eid(), user_id: "mikej", user_email: "mike.j@company.com", department: "Design", device_id: devices[2], tool_name: "Leonardo AI", domain: "leonardo.ai", category: "image", vendor: "Leonardo AI", risk_level: "medium", source: "desktop", process_name: "chrome.exe", process_path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", is_approved: false, timestamp: ago(80) },
  { event_id: eid(), user_id: "yashm", user_email: "yash.m@company.com", department: "Engineering", device_id: devices[0], tool_name: "Replicate", domain: "replicate.com", category: "api", vendor: "Replicate", risk_level: "high", source: "desktop", process_name: "python.exe", process_path: "C:\\Python311\\python.exe", is_approved: false, timestamp: ago(90), connection_frequency: 12, high_frequency: true },
  { event_id: eid(), user_id: "emilyw", user_email: "emily.w@company.com", department: "Marketing", device_id: devices[3], tool_name: "ElevenLabs", domain: "elevenlabs.io", category: "audio", vendor: "ElevenLabs", risk_level: "medium", source: "desktop", process_name: "chrome.exe", process_path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", is_approved: false, timestamp: ago(100) },
  { event_id: eid(), user_id: "alexr", user_email: "alex.r@company.com", department: "Engineering", device_id: devices[4], tool_name: "Tabnine", domain: "tabnine.com", category: "coding", vendor: "Tabnine", risk_level: "medium", source: "desktop", process_name: "Code.exe", process_path: "C:\\Users\\alexr\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe", is_approved: false, timestamp: ago(120) },
  { event_id: eid(), user_id: "sarahk", user_email: "sarah.k@company.com", department: "Product", device_id: devices[1], tool_name: "Runway", domain: "runwayml.com", category: "video", vendor: "Runway", risk_level: "high", source: "desktop", process_name: "chrome.exe", process_path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", is_approved: false, timestamp: ago(140) },
  { event_id: eid(), user_id: "yashm", user_email: "yash.m@company.com", department: "Engineering", device_id: devices[0], tool_name: "Groq", domain: "groq.com", category: "api", vendor: "Groq", risk_level: "high", source: "desktop", process_name: "python.exe", process_path: "C:\\Python311\\python.exe", is_approved: false, timestamp: ago(160) },
];

export const mockHeartbeats: HeartbeatEvent[] = [
  { event_type: "heartbeat", device_id: devices[0], agent_version: "1.0.0", queue_depth: 0, last_detection_time: ago(2), os_version: "Windows 11", restart_detected: false, timestamp: ago(1) },
  { event_type: "heartbeat", device_id: devices[1], agent_version: "1.0.0", queue_depth: 2, last_detection_time: ago(5), os_version: "Windows 10", restart_detected: false, timestamp: ago(3) },
  { event_type: "heartbeat", device_id: devices[2], agent_version: "0.9.8", queue_depth: 0, last_detection_time: ago(12), os_version: "macOS 14.2", restart_detected: false, timestamp: ago(4) },
  { event_type: "heartbeat", device_id: devices[3], agent_version: "1.0.0", queue_depth: 5, last_detection_time: ago(18), os_version: "Windows 11", restart_detected: true, timestamp: ago(8) },
  { event_type: "heartbeat", device_id: devices[4], agent_version: "1.0.1", queue_depth: 0, last_detection_time: ago(15), os_version: "macOS 15.0", restart_detected: false, timestamp: ago(2) },
];

export const mockTamperAlerts: TamperAlert[] = [
  { type: "tamper_alert", device_id: devices[3], expected_hash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6", actual_hash: "e5f6a7b8c9d0e1f2a3b4c5d6a1b2c3d4", timestamp: ago(45) },
  { type: "tamper_alert", device_id: devices[1], expected_hash: "1234567890abcdef1234567890abcdef", actual_hash: "fedcba0987654321fedcba0987654321", timestamp: ago(200) },
];

export const mockAgentGaps: AgentGapEvent[] = [
  { event_type: "agent_gap", device_id: devices[3], gap_seconds: 3600, last_seen: ago(120), suspicious: true, timestamp: ago(60) },
  { event_type: "agent_gap", device_id: devices[1], gap_seconds: 900, last_seen: ago(50), suspicious: false, timestamp: ago(35) },
];

// Derived stats
export const getStats = () => {
  const events = mockDetectionEvents;
  return {
    totalDetections: events.length,
    uniqueTools: new Set(events.map(e => e.tool_name)).size,
    highRiskCount: events.filter(e => e.risk_level === "high").length,
    unapprovedCount: events.filter(e => !e.is_approved).length,
    onlineDevices: mockHeartbeats.filter(h => {
      const diff = (Date.now() - new Date(h.timestamp).getTime()) / 60000;
      return diff < 6;
    }).length,
    totalDevices: mockHeartbeats.length,
    activeAlerts: mockTamperAlerts.length + mockAgentGaps.filter(g => g.suspicious).length + events.filter(e => e.risk_level === "high" && !e.is_approved).length,
  };
};

// Chart data helpers
export const getDetectionsByTool = () => {
  const counts: Record<string, number> = {};
  mockDetectionEvents.forEach(e => { counts[e.tool_name] = (counts[e.tool_name] || 0) + 1; });
  return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
};

export const getDetectionsByCategory = () => {
  const counts: Record<string, number> = {};
  mockDetectionEvents.forEach(e => { counts[e.category] = (counts[e.category] || 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
};

export const getDetectionsOverTime = () => {
  const buckets: Record<string, number> = {};
  mockDetectionEvents.forEach(e => {
    const hour = new Date(e.timestamp).getHours();
    const label = `${hour.toString().padStart(2, "0")}:00`;
    buckets[label] = (buckets[label] || 0) + 1;
  });
  return Object.entries(buckets).map(([time, count]) => ({ time, count })).sort((a, b) => a.time.localeCompare(b.time));
};

export const getTopProcesses = () => {
  const counts: Record<string, number> = {};
  mockDetectionEvents.forEach(e => { counts[e.process_name] = (counts[e.process_name] || 0) + 1; });
  return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
};
