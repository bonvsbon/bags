from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database — SQLite for local dev; swap to managed Postgres via DATABASE_URL
    database_url: str = "sqlite:///./ngernthon.db"

    # Auth
    jwt_secret: str = "dev-insecure-secret-change-me"
    jwt_alg: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 30

    # Google OAuth (optional until Phase 1)
    google_client_id: str = ""

    # CORS — explicit localhost origins, plus a regex that allows any
    # private-LAN origin on the dev port so a phone at http://10.x.x.x:5173
    # can call the API. Tighten/remove cors_origin_regex in production.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    cors_origin_regex: str = (
        r"^http://(?:10|127|192\.168|172\.(?:1[6-9]|2\d|3[01]))"
        r"(?:\.\d{1,3}){1,3}:5173$"
    )

    # Background jobs (APScheduler) — opt-in so tests/dev don't spawn a thread
    enable_scheduler: bool = False

    # --- AI (Phase 9) ---
    # Provider "pools" as comma-separated chains. Providers without a key are
    # skipped when the pool is built, so you only list what you've signed up for.
    ai_free_chain: str = "gemini,groq,openrouter,cerebras"
    ai_paid_chain: str = ""
    ai_allow_paid: bool = False        # hard gate: free users never hit paid providers
    ai_daily_message_limit: int = 20   # per-user free cap (enforced in Phase 9.6)

    # Provider API keys (blank = provider skipped)
    gemini_api_key: str = ""
    groq_api_key: str = ""
    openrouter_api_key: str = ""
    cerebras_api_key: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @staticmethod
    def _chain(value: str) -> list[str]:
        return [p.strip() for p in value.split(",") if p.strip()]

    @property
    def ai_free_list(self) -> list[str]:
        return self._chain(self.ai_free_chain)

    @property
    def ai_paid_list(self) -> list[str]:
        return self._chain(self.ai_paid_chain)


@lru_cache
def get_settings() -> Settings:
    return Settings()
