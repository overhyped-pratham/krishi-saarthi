import pytest
from app.services.satellite.planet_service import PlanetInsightsService

@pytest.mark.asyncio
async def test_planet_insights_search():
    service = PlanetInsightsService()
    # Service initializes with or without API key (mock fallback)
    assert service.base_url is not None

    res = await service.search_scenes(
        center_lat=30.3398,
        center_lon=76.3869,
        start_date="2024-06-01",
        end_date="2024-12-01"
    )
    assert res is not None
    assert "provider" in res
    assert "Planet" in res["provider"]
    assert "features" in res

@pytest.mark.asyncio
async def test_planet_insights_time_series():
    service = PlanetInsightsService()
    obs = await service.get_high_res_time_series(
        center_lat=30.3398,
        center_lon=76.3869,
        n_points=6
    )
    assert len(obs) == 6
    assert obs[0]["resolution_m"] == 3.0
    assert "bands" in obs[0]
    assert "nir" in obs[0]["bands"]
