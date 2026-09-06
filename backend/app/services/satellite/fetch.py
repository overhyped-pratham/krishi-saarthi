import numpy as np
from datetime import datetime, timedelta

# Band resolution for mock data — produces sharper pipeline images
BAND_SIZE = 128


class SatelliteDataFetcher:
    def __init__(self, use_mock: bool = True):
        self.use_mock = use_mock
        
    async def fetch_time_series(
        self, 
        center_lat: float, 
        center_lon: float,
        start_date: str,
        end_date: str,
        n_observations: int = 12
    ) -> list[dict]:
        if self.use_mock:
            return self._generate_mock_data(
                center_lat, center_lon, start_date, end_date, n_observations
            )
        else:
            # Implement Sentinel Hub logic here
            return self._generate_mock_data(
                center_lat, center_lon, start_date, end_date, n_observations
            )

    @staticmethod
    def _spatial_texture(size: int, seed: int, scale: float = 0.08) -> np.ndarray:
        """Generate spatially coherent texture using smoothed noise.
        
        Args:
            size: Output array size (size x size)
            seed: Random seed for reproducibility
            scale: Controls fine noise amplitude (0.0-1.0)
        """
        rng = np.random.RandomState(seed)
        # Low-frequency base
        coarse = rng.uniform(0, 1, (size // 4, size // 4))
        # Upsample via bilinear-like repetition
        rows = np.repeat(coarse, 4, axis=0)[:size]
        cols = np.repeat(rows, 4, axis=1)[:, :size]
        # Add finer noise using the scale parameter
        fine = rng.uniform(0, 1, (size, size)) * scale
        return cols * (1.0 - scale) + fine

    def _generate_mock_data(
        self,
        center_lat: float,
        center_lon: float,
        start_date: str,
        end_date: str,
        n_observations: int,
    ) -> list[dict]:
        observations = []
        start = datetime.strptime(start_date, "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        step = (end - start) / max(1, n_observations - 1)

        # Deterministic seed from coordinates
        base_seed = int(abs(center_lat * 1000 + center_lon * 100)) % 100_000

        for i in range(n_observations):
            obs_date = start + step * i
            seed_i = base_seed + i * 7

            tex = self._spatial_texture(BAND_SIZE, seed_i)

            # Realistic reflectance values for vegetated agricultural land
            b02 = 0.03 + tex * 0.025   # Blue   ~0.03-0.055
            b03 = 0.05 + tex * 0.03    # Green  ~0.05-0.08
            b04 = 0.04 + tex * 0.03    # Red    ~0.04-0.07
            b08 = 0.30 + tex * 0.15    # NIR    ~0.30-0.45
            b11 = 0.12 + tex * 0.06    # SWIR1  ~0.12-0.18
            b12 = 0.06 + tex * 0.04    # SWIR2  ~0.06-0.10

            # Simulate vegetation stress / drought in last 3 observations
            if i >= n_observations - 3:
                stress = self._spatial_texture(BAND_SIZE, seed_i + 500, scale=0.12)
                # Higher red, lower NIR in stressed patches
                b04 = b04 + stress * 0.06
                b08 = b08 * (0.55 + stress * 0.15)
                b11 = b11 + stress * 0.04

            # Add a few synthetic cloud patches in some observations
            cloud_cover = float(np.random.RandomState(seed_i + 99).uniform(2, 18))

            observations.append({
                "date": obs_date.strftime("%Y-%m-%d"),
                "cloud_cover": cloud_cover,
                "bands": {
                    "B02": b02.astype(np.float32),
                    "B03": b03.astype(np.float32),
                    "B04": b04.astype(np.float32),
                    "B08": b08.astype(np.float32),
                    "B11": b11.astype(np.float32),
                    "B12": b12.astype(np.float32),
                }
            })
        return observations
