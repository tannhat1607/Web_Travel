from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str | None = None
    DATABASE_USERNAME: str = "postgres"
    DATABASE_PASSWORD: str = "postgres"
    DATABASE_HOSTNAME: str = "localhost"
    DATABASE_PORT: int = 5432
    DATABASE_NAME: str = "travel_db"
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CHROMA_COLLECTION_NAME: str = "travel_knowledge"
    CHROMA_API_KEY: str | None = None
    CHROMA_TENANT: str | None = None
    CHROMA_DATABASE: str | None = None
    RAG_TOP_K: int = 4
    GOOGLE_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-2.5-flash-lite"
    GEMINI_EMBEDDING_MODEL: str = "models/gemini-embedding-001"
    LANGSMITH_TRACING: str | None = "true"
    LANGSMITH_ENDPOINT: str | None = None
    LANGSMITH_API_KEY: str | None = None
    LANGSMITH_PROJECT: str = "travel-rag"
    MAX_UPLOAD_IMAGE_SIZE_MB: int = 5
    SUPABASE_URL: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None
    SUPABASE_STORAGE_BUCKET: str = "tour-images"
    SUPABASE_STORAGE_FOLDER: str = "tours"

    model_config = SettingsConfigDict(env_file=ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    @property
    def database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            "postgresql+psycopg2://"
            f"{self.DATABASE_USERNAME}:{self.DATABASE_PASSWORD}"
            f"@{self.DATABASE_HOSTNAME}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
        )


settings = Settings()
