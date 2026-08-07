"""FastMCP Server — Model Context Protocol (JSON-RPC 2.0).

Exposes standardized campus database tools over JSON-RPC 2.0 to decouple
agent implementations from raw database operations.
"""

from __future__ import annotations
import json
from typing import Any, Callable, Dict
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

mcp_router = APIRouter(prefix="/api/mcp", tags=["mcp"])

# Tool Registry
MCP_TOOLS: Dict[str, Dict[str, Any]] = {}

def register_mcp_tool(name: str, description: str, schema: dict, handler: Callable):
    MCP_TOOLS[name] = {
        "name": name,
        "description": description,
        "inputSchema": schema,
        "handler": handler,
    }

# --- Standard Campus Tools Exposed via MCP ---

def _get_timetable(student_id: str = "22B81A05xx") -> dict:
    return {
        "student_id": student_id,
        "day": "Today",
        "classes": [
            {"time": "09:00 - 10:00", "subject": "Deep Learning (CSE-401)", "venue": "LH-302"},
            {"time": "10:15 - 11:15", "subject": "Distributed Systems (CSE-403)", "venue": "LH-304"},
            {"time": "11:30 - 12:30", "subject": "NLP & Speech (CSE-407)", "venue": "LH-302"},
            {"time": "14:00 - 16:00", "subject": "Multi-Agent Systems Lab", "venue": "Lab-6"},
        ],
    }

def _check_placement_eligibility(company: str = "Google", cgpa: float = 8.0) -> dict:
    min_cgpa = 8.0 if company.lower() in ["google", "microsoft", "apple", "meta", "nvidia"] else 7.0
    return {
        "company": company,
        "student_cgpa": cgpa,
        "eligible": cgpa >= min_cgpa,
        "min_cgpa_required": min_cgpa,
        "backlogs_allowed": 0,
        "student_backlogs": 0,
    }

def _search_campus_events(category: str = "all") -> dict:
    return {
        "category": category,
        "events": [
            {"id": "ev-101", "title": "AI Systems Workshop", "date": "Aug 12, 2026", "seats": 42},
            {"id": "ev-102", "title": "AgentX Hackathon 2026", "date": "Aug 18, 2026", "seats": 120},
            {"id": "ev-103", "title": "Placement Prep Bootcamp", "date": "Aug 21, 2026", "seats": 8},
        ],
    }

register_mcp_tool(
    "get_timetable",
    "Fetch student class schedule",
    {"type": "object", "properties": {"student_id": {"type": "string"}}},
    _get_timetable,
)

register_mcp_tool(
    "check_placement_eligibility",
    "Verify placement eligibility for a company",
    {"type": "object", "properties": {"company": {"type": "string"}, "cgpa": {"type": "number"}}},
    _check_placement_eligibility,
)

register_mcp_tool(
    "search_campus_events",
    "Search campus events and workshops",
    {"type": "object", "properties": {"category": {"type": "string"}}},
    _search_campus_events,
)

@mcp_router.post("")
async def handle_mcp_rpc(request: Request):
    """MCP JSON-RPC 2.0 endpoint."""
    try:
        body = await request.json()
        method = body.get("method")
        req_id = body.get("id", 1)

        if method == "tools/list":
            tools_list = [
                {"name": t["name"], "description": t["description"], "inputSchema": t["inputSchema"]}
                for t in MCP_TOOLS.values()
            ]
            return JSONResponse({"jsonrpc": "2.0", "result": {"tools": tools_list}, "id": req_id})

        if method == "tools/call":
            params = body.get("params", {})
            name = params.get("name")
            args = params.get("arguments", {})

            if name in MCP_TOOLS:
                result = MCP_TOOLS[name]["handler"](**args)
                return JSONResponse({"jsonrpc": "2.0", "result": {"content": [{"type": "text", "text": json.dumps(result)}]}, "id": req_id})
            
            return JSONResponse({"jsonrpc": "2.0", "error": {"code": -32601, "message": f"Tool '{name}' not found"}, "id": req_id})

        return JSONResponse({"jsonrpc": "2.0", "error": {"code": -32601, "message": f"Method '{method}' not supported"}, "id": req_id})

    except Exception as exc:
        return JSONResponse({"jsonrpc": "2.0", "error": {"code": -32603, "message": str(exc)}, "id": 1})
