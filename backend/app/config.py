from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from pathlib import Path
import json

class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./agriproof.db"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    planet_user_id: str = ""
    planet_api_key: str = ""
    planet_base_url: str = "https://api.planet.com/data/v1"
    sentinel_hub_client_id: str = ""
    sentinel_hub_client_secret: str = ""
    sentinel_hub_instance_id: str = ""
    open_meteo_base_url: str = "https://api.open-meteo.com/v1"
    open_meteo_api_key: str = ""
    circuits_dir: str = "../circuits"
    app_env: str = "development"
    cors_origins: str = '["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173"]'
    storage_dir: str = "./storage"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        try:
            return json.loads(self.cors_origins)
        except Exception:
            return ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

    @property
    def uploads_dir(self) -> Path:
        p = Path(self.storage_dir) / "uploads"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def results_dir(self) -> Path:
        p = Path(self.storage_dir) / "results"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def zk_proofs_dir(self) -> Path:
        p = Path(self.storage_dir) / "zk_proofs"
        p.mkdir(parents=True, exist_ok=True)
        return p

@lru_cache()
def get_settings():
    return Settings()
