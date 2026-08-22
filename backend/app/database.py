from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import get_settings

settings = get_settings()

engine_kwargs = {"echo": False, "future": True}
if "sqlite" not in settings.database_url:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20
    })

async_engine = create_async_engine(
    settings.database_url,
    **engine_kwargs
)

AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

from sqlalchemy import text

async def init_db():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        if "sqlite" in settings.database_url:
            try:
                res = await conn.execute(text("PRAGMA table_info(farms);"))
                cols = [row[1] for row in res.fetchall()]
                if cols and "user_id" not in cols:
                    await conn.execute(text("ALTER TABLE farms ADD COLUMN user_id VARCHAR;"))
            except Exception:
                pass

