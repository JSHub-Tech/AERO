"""
Async Postgres connection (Supabase) via SQLAlchemy 2.0 + asyncpg.

Supabase gives you a connection string like:
    postgresql://postgres.xxxx:PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres

SQLAlchemy's async engine needs the `postgresql+asyncpg://` scheme, and
Supabase's PgBouncer (port 6543, transaction pooling) does not support
prepared statements, so we disable them explicitly. If you connect on the
direct port (5432) instead, statement_cache_size is unnecessary but harmless.
"""
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


def _to_async_dsn(dsn: str) -> str:
    """Normalize any postgres DSN into the asyncpg-driver form SQLAlchemy expects."""
    if dsn.startswith("postgresql+asyncpg://"):
        return dsn
    if dsn.startswith("postgresql://"):
        return dsn.replace("postgresql://", "postgresql+asyncpg://", 1)
    if dsn.startswith("postgres://"):
        return dsn.replace("postgres://", "postgresql+asyncpg://", 1)
    return dsn


class Base(DeclarativeBase):
    """Shared declarative base for all SQLAlchemy ORM models."""
    pass


_ASYNC_DSN = _to_async_dsn(settings.DATABASE_URL)
_USING_POOLER = ":6543" in _ASYNC_DSN  # Supabase's PgBouncer (transaction mode) port

engine = create_async_engine(
    _ASYNC_DSN,
    echo=settings.DB_ECHO,
    pool_pre_ping=True,          # avoids stale-connection errors on free-tier Supabase
    # Only disable asyncpg's prepared-statement cache when going through the
    # 6543 PgBouncer pooler, which doesn't support them. On the direct 5432
    # connection (what this project currently uses) prepared statements work
    # fine and are faster, so we leave the default cache enabled.
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    } if _USING_POOLER else {},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency: `db: AsyncSession = Depends(get_db)`."""
    async with AsyncSessionLocal() as session:
        yield session


@asynccontextmanager
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Context manager for use outside of FastAPI routes (scripts, services)."""
    async with AsyncSessionLocal() as session:
        yield session


async def dispose_engine() -> None:
    await engine.dispose()
