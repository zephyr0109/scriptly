"""
[Architecture Point: Infrastructure Layer - Database]
데이터베이스 연결 및 세션 관리를 담당하는 인프라 계층입니다.
"""
import os
import json
from uuid import UUID
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base

# PostgreSQL Connection from docker-compose.yml
# In a real app, use environment variables. We are using hardcoded values based on docker-compose for the local test environment.
DB_USER = os.getenv("POSTGRES_USER", "scriptly_user")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "scriptly_password")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "scriptly_db")

DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def sqlalchemy_json_serializer(obj):
    """SQLAlchemy JSON 컬럼 직렬화 시 UUID 등을 처리하기 위한 커스텀 함수"""
    if isinstance(obj, UUID):
        return str(obj)
    raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")

async_engine = create_async_engine(
    DATABASE_URL, 
    echo=False,
    json_serializer=lambda obj: json.dumps(obj, default=sqlalchemy_json_serializer)
)
async_session = async_sessionmaker(async_engine, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with async_session() as session:
        yield session
