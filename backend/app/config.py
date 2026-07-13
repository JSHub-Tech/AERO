"""
Central configuration. Every other module imports `settings` from here —
never call os.getenv() directly elsewhere in the app.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # --- Postgres (Supabase) ---
    DATABASE_URL: str  # postgresql+asyncpg://... (see note in db/postgres.py)

    # --- Neo4j (Aura) ---
    NEO4J_URI: str
    NEO4J_USERNAME: str
    NEO4J_PASSWORD: str
    NEO4J_DATABASE: str = "neo4j"

    # --- MongoDB (Atlas) ---
    MONGODB_URI: str
    MONGODB_DB_NAME: str = "aero_adms"

    # --- Upstash Redis ---
    UPSTASH_REDIS_REST_URL: str
    UPSTASH_REDIS_REST_TOKEN: str
    # Optional: TCP endpoint (rediss://default:<password>@<host>:<port>) if you
    # want to use redis.asyncio instead of the REST client. Get it from the
    # Upstash console -> "Connect" -> "Redis" (not the REST tab).
    UPSTASH_REDIS_TCP_URL: str | None = None

    # --- Gemini ---
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"

    # --- App ---
    ENV: str = "development"
    APP_NAME: str = "AERO ADMS"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
