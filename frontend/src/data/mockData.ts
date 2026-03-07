/**
 * Type definitions for Devise Dashboard data models.
 *
 * NOTE: Mock data has been moved to mockData.backup.ts.
 * All runtime data now comes from the API via hooks in useDashboard.ts.
 */

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
