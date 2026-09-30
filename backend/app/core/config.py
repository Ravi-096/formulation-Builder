from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json


class Settings(BaseSettings):
    # MySQL Database Settings
    MYSQL_HOST: str = "mysql-3ca6d5ac-ravissahane05-73b4.g.aivencloud.com"
    MYSQL_PORT: int = 12153
    MYSQL_USER: str = "avnadmin"
    MYSQL_PASSWORD: str = ""
    MYSQL_DB: str = "defaultdb"
    MYSQL_SSL_MODE: str = "REQUIRED"
    MYSQL_SSL_CA: Union[str, None] = None

    MYSQL_URL: str = "mysql+aiomysql://root@localhost:3306/ks_portal_db"
    MYSQL_SYNC_URL: str = "mysql+pymysql://root@localhost:3306/ks_portal_db"

    @field_validator("MYSQL_URL", mode="before")
    @classmethod
    def assemble_mysql_url(cls, v: str) -> str:
        if not v:
            return v
        # Strip query params like ssl-mode which aiomysql driver doesn't accept as kwargs
        if "?" in v:
            base_url, query = v.split("?", 1)
            params = [p for p in query.split("&") if not p.lower().startswith("ssl-mode") and not p.lower().startswith("ssl_mode")]
            v = base_url + ("?" + "&".join(params) if params else "")
        # Ensure async driver prefix
        if v.startswith("mysql://"):
            v = "mysql+aiomysql://" + v[len("mysql://"):]
        elif v.startswith("mysql+pymysql://"):
            v = "mysql+aiomysql://" + v[len("mysql+pymysql://"):]
        return v

    @field_validator("MYSQL_SYNC_URL", mode="before")
    @classmethod
    def assemble_mysql_sync_url(cls, v: str) -> str:
        if not v:
            return v
        if "?" in v:
            base_url, query = v.split("?", 1)
            params = [p for p in query.split("&") if not p.lower().startswith("ssl-mode") and not p.lower().startswith("ssl_mode")]
            v = base_url + ("?" + "&".join(params) if params else "")
        if v.startswith("mysql://"):
            v = "mysql+pymysql://" + v[len("mysql://"):]
        elif v.startswith("mysql+aiomysql://"):
            v = "mysql+pymysql://" + v[len("mysql+aiomysql://"):]
        return v

    # JWT & Cryptography Settings
    SECRET_KEY: str = "supersecretjwtkey_enterprise_portal_jwt_token_2026_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS Settings
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    # Application Settings
    PROJECT_NAME: str = "Enterprise Portal API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
