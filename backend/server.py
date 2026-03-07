"""
Devise Dashboard Backend Server — Supabase Edition
Uses the Supabase Python client (REST API over HTTPS).

Usage:
    uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload
"""

import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from pydantic import BaseModel
from supabase import create_client, Client

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL env var is required")
if not SUPABASE_SERVICE_KEY:
    raise RuntimeError("SUPABASE_SERVICE_KEY env var is required")
if not SUPABASE_JWT_SECRET:
    raise RuntimeError("SUPABASE_JWT_SECRET env var is required")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Supabase client (uses service_role key to bypass RLS for server-side ops)
# ---------------------------------------------------------------------------
sb: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
async def get_current_user(request: Request) -> Dict[str, Any]:
    """Validate Supabase JWT from Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header.removeprefix("Bearer ").strip()

    # Allow service_role key for agent ingest
    if token == SUPABASE_SERVICE_KEY:
        return {"sub": "service_role", "role": "service_role"}

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {e}")


async def get_user_org_id(user: Dict[str, Any]) -> Optional[str]:
    """Fetch the org_id for an authenticated user."""
    if user.get("role") == "service_role":
        return None
    user_id = user.get("sub")
    result = sb.table("profiles").select("org_id").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=403, detail="User profile not found")
    return result.data["org_id"]


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class EventPayload(BaseModel):
    model_config = {"extra": "allow"}
    event_type: Optional[str] = None
    org_id: Optional[str] = None


class TamperAlertPayload(BaseModel):
    model_config = {"extra": "allow"}
    type: str = "tamper_alert"
    device_id: str
    expected_hash: str
    actual_hash: str
    timestamp: str
    org_id: Optional[str] = None


class InvitePayload(BaseModel):
    email: str
    role: str = "member"


class SettingsPayload(BaseModel):
    model_config = {"extra": "allow"}
    monthly_budget: Optional[float] = None
    alert_threshold: Optional[float] = None
    auto_block: Optional[bool] = None
    allowed_categories: Optional[List[str]] = None
    blocked_domains: Optional[List[str]] = None
    notification_email: Optional[bool] = None
    notification_slack: Optional[bool] = None
    slack_webhook_url: Optional[str] = None


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Devise Dashboard API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8081",
        "http://127.0.0.1:5173",
        # Vercel deployments — update YOUR_PROJECT with your actual Vercel project name
        "https://devise-iris.vercel.app",
        "https://devise-iris-git-main.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Ingest endpoints (service_role or agent key auth)
# ---------------------------------------------------------------------------
@app.head("/api/event")
async def event_head():
    return {}


@app.post("/api/event", status_code=202)
async def receive_event(payload: EventPayload, request: Request):
    """Accept detection events, heartbeats, and agent gaps from the agent."""
    user = await get_current_user(request)
    data = payload.model_dump()
    etype = data.get("event_type")
    org_id = data.get("org_id")

    if not org_id and user.get("role") != "service_role":
        org_id = await get_user_org_id(user)

    if not org_id:
        raise HTTPException(status_code=400, detail="org_id is required")

    if etype == "heartbeat":
        sb.table("heartbeats").upsert({
            "org_id": org_id,
            "device_id": data.get("device_id"),
            "agent_version": data.get("agent_version"),
            "queue_depth": data.get("queue_depth", 0),
            "last_detection_time": data.get("last_detection_time"),
            "os_version": data.get("os_version"),
            "restart_detected": data.get("restart_detected", False),
            "timestamp": data.get("timestamp"),
        }, on_conflict="org_id,device_id").execute()
    elif etype == "agent_gap":
        sb.table("agent_gaps").insert({
            "org_id": org_id,
            "device_id": data.get("device_id"),
            "gap_seconds": data.get("gap_seconds", 0),
            "last_seen": data.get("last_seen"),
            "suspicious": data.get("suspicious", False),
            "timestamp": data.get("timestamp"),
        }).execute()
    else:
        sb.table("detection_events").upsert({
            "event_id": data.get("event_id"),
            "org_id": org_id,
            "user_id": data.get("user_id"),
            "user_email": data.get("user_email"),
            "department": data.get("department"),
            "device_id": data.get("device_id"),
            "tool_name": data.get("tool_name"),
            "domain": data.get("domain"),
            "category": data.get("category"),
            "vendor": data.get("vendor"),
            "risk_level": data.get("risk_level"),
            "source": data.get("source", "desktop"),
            "process_name": data.get("process_name"),
            "process_path": data.get("process_path"),
            "is_approved": data.get("is_approved", False),
            "timestamp": data.get("timestamp"),
            "connection_frequency": data.get("connection_frequency"),
            "high_frequency": data.get("high_frequency", False),
            "bytes_read": data.get("bytes_read"),
            "bytes_write": data.get("bytes_write"),
        }, on_conflict="event_id").execute()

    return {"status": "accepted"}


@app.post("/api/tamper-alert", status_code=202)
async def receive_tamper_alert(payload: TamperAlertPayload, request: Request):
    user = await get_current_user(request)
    org_id = payload.org_id
    if not org_id and user.get("role") != "service_role":
        org_id = await get_user_org_id(user)
    if not org_id:
        raise HTTPException(status_code=400, detail="org_id is required")

    sb.table("tamper_alerts").insert({
        "org_id": org_id,
        "device_id": payload.device_id,
        "expected_hash": payload.expected_hash,
        "actual_hash": payload.actual_hash,
        "timestamp": payload.timestamp,
    }).execute()
    return {"status": "accepted"}


# ---------------------------------------------------------------------------
# Query endpoints (JWT auth required)
# ---------------------------------------------------------------------------
@app.get("/api/events")
async def get_events(
    request: Request,
    category: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    user = await get_current_user(request)
    org_id = await get_user_org_id(user)

    q = sb.table("detection_events").select("*", count="exact").eq("org_id", org_id)
    if category and category != "all":
        q = q.eq("category", category)
    if risk_level and risk_level != "all":
        q = q.eq("risk_level", risk_level)
    q = q.order("timestamp", desc=True).range(offset, offset + limit - 1)

    result = q.execute()
    return {"total": result.count or 0, "events": result.data or []}


@app.get("/api/heartbeats")
async def get_heartbeats(request: Request):
    user = await get_current_user(request)
    org_id = await get_user_org_id(user)

    result = sb.table("heartbeats").select("*").eq("org_id", org_id).order("timestamp", desc=True).execute()
    return result.data or []


@app.get("/api/stats")
async def get_stats(request: Request):
    user = await get_current_user(request)
    org_id = await get_user_org_id(user)

    events = sb.table("detection_events").select("risk_level, is_approved, tool_name", count="exact").eq("org_id", org_id).execute()
    total_detections = events.count or 0

    tools = set()
    high_risk = 0
    unapproved = 0
    high_risk_unapproved = 0
    for e in (events.data or []):
        tools.add(e.get("tool_name"))
        if e.get("risk_level") == "high":
            high_risk += 1
        if not e.get("is_approved"):
            unapproved += 1
        if e.get("risk_level") == "high" and not e.get("is_approved"):
            high_risk_unapproved += 1

    heartbeats = sb.table("heartbeats").select("device_id, timestamp").eq("org_id", org_id).execute()
    total_devices = len(heartbeats.data or [])
    from datetime import timedelta
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=6)).isoformat()
    online_devices = sum(
        1 for h in (heartbeats.data or [])
        if h.get("timestamp") and h["timestamp"] >= cutoff
    )

    tamper_count = sb.table("tamper_alerts").select("id", count="exact").eq("org_id", org_id).execute().count or 0
    gap_count = sb.table("agent_gaps").select("id", count="exact").eq("org_id", org_id).eq("suspicious", True).execute().count or 0

    active_alerts = tamper_count + gap_count + high_risk_unapproved

    return {
        "totalDetections": total_detections,
        "uniqueTools": len(tools),
        "highRiskCount": high_risk,
        "unapprovedCount": unapproved,
        "onlineDevices": online_devices,
        "totalDevices": total_devices,
        "activeAlerts": active_alerts,
    }


@app.get("/api/alerts")
async def get_alerts(request: Request):
    user = await get_current_user(request)
    org_id = await get_user_org_id(user)

    alerts = []

    # High-risk unapproved
    hr = sb.table("detection_events").select("event_id, tool_name, domain, process_name, user_id, timestamp").eq("org_id", org_id).eq("risk_level", "high").eq("is_approved", False).order("timestamp", desc=True).execute()
    for r in (hr.data or []):
        alerts.append({
            "id": f"hr-{r['event_id']}",
            "type": "high_risk",
            "title": f"High-risk unapproved tool: {r.get('tool_name', 'Unknown')}",
            "description": f"{r.get('user_id', '?')} accessed {r.get('domain', '?')} via {r.get('process_name', '?')}",
            "timestamp": r.get("timestamp"),
            "severity": "high",
        })

    # Unapproved non-high-risk
    ua = sb.table("detection_events").select("event_id, tool_name, category, user_id, timestamp").eq("org_id", org_id).eq("is_approved", False).neq("risk_level", "high").order("timestamp", desc=True).execute()
    for r in (ua.data or []):
        alerts.append({
            "id": f"ua-{r['event_id']}",
            "type": "unapproved",
            "title": f"Unapproved tool: {r.get('tool_name', 'Unknown')}",
            "description": f"{r.get('user_id', '?')} used {r.get('tool_name', '?')} ({r.get('category', '?')})",
            "timestamp": r.get("timestamp"),
            "severity": "medium",
        })

    # Tamper alerts
    ta = sb.table("tamper_alerts").select("id, device_id, timestamp").eq("org_id", org_id).order("timestamp", desc=True).execute()
    for r in (ta.data or []):
        alerts.append({
            "id": f"ta-{r.get('device_id', '')}-{r.get('timestamp', '')}",
            "type": "tamper",
            "title": "Agent binary tampered",
            "description": f"Device {str(r.get('device_id', ''))[:8]}… — hash mismatch detected",
            "timestamp": r.get("timestamp"),
            "severity": "high",
        })

    # Suspicious gaps
    ag = sb.table("agent_gaps").select("device_id, gap_seconds, timestamp").eq("org_id", org_id).eq("suspicious", True).order("timestamp", desc=True).execute()
    for r in (ag.data or []):
        alerts.append({
            "id": f"ag-{r.get('device_id', '')}-{r.get('timestamp', '')}",
            "type": "agent_gap",
            "title": "Suspicious agent gap",
            "description": f"Device {str(r.get('device_id', ''))[:8]}… was offline for {round((r.get('gap_seconds', 0)) / 60)} min",
            "timestamp": r.get("timestamp"),
            "severity": "high",
        })

    # High-frequency
    hf = sb.table("detection_events").select("event_id, tool_name, process_name, connection_frequency, timestamp").eq("org_id", org_id).eq("high_frequency", True).order("timestamp", desc=True).execute()
    for r in (hf.data or []):
        alerts.append({
            "id": f"hf-{r['event_id']}",
            "type": "high_frequency",
            "title": f"High-frequency connection: {r.get('tool_name', 'Unknown')}",
            "description": f"{r.get('connection_frequency', '?')} connections in 5 min from {r.get('process_name', '?')}",
            "timestamp": r.get("timestamp"),
            "severity": "medium",
        })

    # Sort and filter dismissed
    alerts.sort(key=lambda a: a["timestamp"] or "", reverse=True)

    dismissed = sb.table("dismissed_alerts").select("alert_id").eq("org_id", org_id).execute()
    dismissed_ids = {r["alert_id"] for r in (dismissed.data or [])}
    alerts = [a for a in alerts if a["id"] not in dismissed_ids]

    return alerts


@app.delete("/api/alerts/{alert_id}")
async def dismiss_alert(alert_id: str, request: Request):
    user = await get_current_user(request)
    org_id = await get_user_org_id(user)
    user_id = user.get("sub")

    sb.table("dismissed_alerts").upsert({
        "alert_id": alert_id,
        "org_id": org_id,
        "action": "dismissed",
        "dismissed_by": user_id,
    }, on_conflict="alert_id").execute()
    return {"status": "dismissed", "id": alert_id}


@app.put("/api/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, request: Request):
    user = await get_current_user(request)
    org_id = await get_user_org_id(user)
    user_id = user.get("sub")

    sb.table("dismissed_alerts").upsert({
        "alert_id": alert_id,
        "org_id": org_id,
        "action": "resolved",
        "dismissed_by": user_id,
    }, on_conflict="alert_id").execute()
    return {"status": "resolved", "id": alert_id}


@app.get("/api/analytics")
async def get_analytics(request: Request):
    user = await get_current_user(request)
    org_id = await get_user_org_id(user)

    events = sb.table("detection_events").select("tool_name, category, process_name, timestamp").eq("org_id", org_id).execute()
    data = events.data or []

    # by_tool
    tool_counts: Dict[str, int] = {}
    cat_counts: Dict[str, int] = {}
    proc_counts: Dict[str, int] = {}
    time_counts: Dict[str, int] = {}

    for e in data:
        tn = e.get("tool_name", "Unknown")
        tool_counts[tn] = tool_counts.get(tn, 0) + 1

        cat = e.get("category", "Unknown")
        cat_counts[cat] = cat_counts.get(cat, 0) + 1

        proc = e.get("process_name", "Unknown")
        proc_counts[proc] = proc_counts.get(proc, 0) + 1

        ts = e.get("timestamp", "")
        if ts and len(ts) >= 13:
            hour = ts[11:13] + ":00"
            time_counts[hour] = time_counts.get(hour, 0) + 1

    by_tool = sorted([{"name": k, "count": v} for k, v in tool_counts.items()], key=lambda x: x["count"], reverse=True)[:8]
    by_category = sorted([{"name": k, "value": v} for k, v in cat_counts.items()], key=lambda x: x["value"], reverse=True)
    over_time = sorted([{"time": k, "count": v} for k, v in time_counts.items()], key=lambda x: x["time"])
    top_processes = sorted([{"name": k, "count": v} for k, v in proc_counts.items()], key=lambda x: x["count"], reverse=True)[:10]

    return {
        "byTool": by_tool,
        "byCategory": by_category,
        "overTime": over_time,
        "topProcesses": top_processes,
    }


# ---------------------------------------------------------------------------
# Phase 2 endpoints
# ---------------------------------------------------------------------------
@app.get("/api/subscriptions")
async def get_subscriptions(request: Request):
    user = await get_current_user(request)
    org_id = await get_user_org_id(user)

    result = sb.table("subscriptions").select("*").eq("org_id", org_id).order("tool_name").execute()
    return result.data or []


@app.get("/api/overview/spend")
async def get_overview_spend(request: Request):
    user = await get_current_user(request)
    org_id = await get_user_org_id(user)

    subs = sb.table("subscriptions").select("cost_monthly, status").eq("org_id", org_id).execute()
    settings = sb.table("org_settings").select("monthly_budget").eq("org_id", org_id).single().execute()

    total_monthly = sum(float(s.get("cost_monthly", 0)) for s in (subs.data or []) if s.get("status") == "active")
    zombie_items = [s for s in (subs.data or []) if s.get("status") == "zombie"]
    zombie_cost = sum(float(s.get("cost_monthly", 0)) for s in zombie_items)
    budget = float(settings.data.get("monthly_budget", 0)) if settings.data else 0

    return {
        "totalMonthlySpend": total_monthly,
        "monthlyBudget": budget,
        "budgetRemaining": budget - total_monthly,
        "zombieLicenses": len(zombie_items),
        "zombieCost": zombie_cost,
    }


@app.get("/api/team")
async def get_team(request: Request):
    user = await get_current_user(request)
    org_id = await get_user_org_id(user)

    members = sb.table("profiles").select("id, full_name, email, department, role, avatar_url, created_at").eq("org_id", org_id).order("created_at").execute()
    invites = sb.table("team_invites").select("id, email, role, status, created_at, expires_at").eq("org_id", org_id).eq("status", "pending").order("created_at", desc=True).execute()

    return {"members": members.data or [], "invites": invites.data or []}


@app.post("/api/team/invite", status_code=201)
async def invite_team_member(payload: InvitePayload, request: Request):
    user = await get_current_user(request)
    org_id = await get_user_org_id(user)
    user_id = user.get("sub")

    existing = sb.table("team_invites").select("id", count="exact").eq("org_id", org_id).eq("email", payload.email).eq("status", "pending").execute()
    if (existing.count or 0) > 0:
        raise HTTPException(status_code=409, detail="User already has a pending invite")

    sb.table("team_invites").insert({
        "org_id": org_id,
        "email": payload.email,
        "role": payload.role,
        "invited_by": user_id,
    }).execute()
    return {"status": "invited", "email": payload.email}


@app.get("/api/settings")
async def get_settings(request: Request):
    user = await get_current_user(request)
    org_id = await get_user_org_id(user)

    result = sb.table("org_settings").select("*").eq("org_id", org_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Settings not found")
    return result.data


@app.put("/api/settings")
async def update_settings(payload: SettingsPayload, request: Request):
    user = await get_current_user(request)
    org_id = await get_user_org_id(user)

    data = payload.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields to update")

    sb.table("org_settings").update(data).eq("org_id", org_id).execute()
    return {"status": "updated"}


@app.get("/api/me")
async def get_me(request: Request):
    """Return current user's profile + org info."""
    user = await get_current_user(request)
    user_id = user.get("sub")

    profile = sb.table("profiles").select("*, organizations(name, slug)").eq("id", user_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Profile not found")

    data = profile.data
    org = data.pop("organizations", {}) or {}
    data["org_name"] = org.get("name", "")
    data["org_slug"] = org.get("slug", "")
    return data


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.get("/health")
async def health():
    return {"status": "ok", "time": datetime.now(timezone.utc).isoformat()}


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
