"""Pytest fixtures for backend tests."""

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.agents.registry import initialize_agents


@pytest.fixture(autouse=True)
def setup_agents():
    initialize_agents()


@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
