from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    postgres_url: str = "postgresql+asyncpg://ims_user:ims_password@postgres:5432/ims_db"
    mongo_url: str = "mongodb://root:example_password@mongodb:27017"
    mongo_db_name: str = "ims_raw"
    redis_url: str = "redis://redis:6379/0"
    kafka_bootstrap_servers: str = "kafka:29092"

    class Config:
        env_file = ".env"

settings = Settings()
