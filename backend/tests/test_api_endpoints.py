import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db

@pytest.mark.asyncio
async def test_api_health():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_get_farms_and_ledger():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Check farms list
        res = await ac.get("/api/farms")
        assert res.status_code == 200
        farms = res.json()
        assert len(farms) >= 3

        # Check seeded claim
        claim_res = await ac.get("/api/claims/CLM-4821")
        assert claim_res.status_code == 200
        claim = claim_res.json()
        assert claim["claim_id"] == "CLM-4821"
        assert claim["eligible"] is True

        # Check ledger chain
        ledger_res = await ac.get("/api/ledger")
        assert ledger_res.status_code == 200
        chain = ledger_res.json()
        assert len(chain) >= 1

        # Check ledger integrity
        verify_res = await ac.get("/api/ledger/verify")
        assert verify_res.status_code == 200
        assert verify_res.json()["valid"] is True

@pytest.mark.asyncio
async def test_anonymous_farm_registration_without_name():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Register farm with empty name
        res = await ac.post("/api/farms", json={
            "crop_type": "wheat",
            "sowing_date": "2024-11-01",
            "policy_id": "POLICY-001",
            "polygon_coordinates": [
                [31.100, 75.100],
                [31.100, 75.105],
                [31.095, 75.105],
                [31.095, 75.100]
            ]
        })
        assert res.status_code == 200
        data = res.json()
        assert "Anonymous Farm" in data["name"]
        assert len(data["commitment_hash"]) == 64
