from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    postgres_url: str = "postgresql+asyncpg://ims_user:ims_password@localhost:5432/ims_db"
    mongo_url: str = "mongodb://root:example_password@localhost:27017"
    mongo_db_name: str = "ims_raw"
    redis_url: str = "redis://localhost:6379/0"
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"

    class Config:
        env_file = ".env"

settings = Settings()
