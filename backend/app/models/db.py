from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from motor.motor_asyncio import AsyncIOMotorClient
from ..config import settings

# PostgreSQL Setup
pg_engine = create_async_engine(settings.postgres_url, echo=False)
AsyncSessionLocal = sessionmaker(pg_engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

# MongoDB Setup
mongo_client = AsyncIOMotorClient(settings.mongo_url)
mongo_db = mongo_client[settings.mongo_db_name]
signals_collection = mongo_db["signals"]
