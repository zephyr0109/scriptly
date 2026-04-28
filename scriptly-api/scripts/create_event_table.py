import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

# 데이터베이스 연결 URL (환경 변수 또는 기본값)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://scriptly_user:scriptly_password@localhost:5432/scriptly_db")

async def migrate():
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("Dropping existing project_events table if it exists...")
        await conn.execute(text("DROP TABLE IF EXISTS project_events CASCADE"))
        
        print("Recreating project_events table with new schema...")
        await conn.execute(text("""
            CREATE TABLE project_events (
                id UUID PRIMARY KEY,
                project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                sequence INTEGER DEFAULT 0,
                time_hint VARCHAR(100),
                title VARCHAR(255) NOT NULL,
                content TEXT,
                related_character_ids JSONB DEFAULT '[]'::jsonb,
                event_metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))
        print("Migration completed successfully.")

if __name__ == "__main__":
    asyncio.run(migrate())
