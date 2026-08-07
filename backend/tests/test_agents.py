"""Agents API tests."""

import pytest


@pytest.mark.asyncio
async def test_list_agents(client):
    res = await client.get("/api/agents")
    assert res.status_code == 200
    agents = res.json()
    assert len(agents) >= 8
    agent_ids = [a["id"] for a in agents]
    assert "orchestrator" in agent_ids
    assert "placement" in agent_ids
    assert "academic" in agent_ids
