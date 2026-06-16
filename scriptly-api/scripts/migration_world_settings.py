import asyncio
import logging
import sys
import os

# app 모듈 경로 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.infrastructure.database import async_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DDL_QUERIES = [
    # 1. world_stages (시공간 무대)
    """
    CREATE TABLE IF NOT EXISTS world_stages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        era VARCHAR(100),
        parent_id UUID,
        description TEXT,
        atmosphere TEXT,
        technology_level VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_world_stages_project_id ON world_stages(project_id);",
    
    # 2. world_factions (세력/집단)
    """
    CREATE TABLE IF NOT EXISTS world_factions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100),
        ideology_goal TEXT,
        base_stage_id UUID,
        scale_status TEXT,
        hierarchy TEXT,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_world_factions_project_id ON world_factions(project_id);",

    # 3. world_rules_cultures (사회 제도 / 문화 관습)
    """
    CREATE TABLE IF NOT EXISTS world_rules_cultures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        scope_stage_id UUID,
        scope_faction_id UUID,
        content TEXT,
        impact TEXT,
        exceptions TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_world_rules_cultures_project_id ON world_rules_cultures(project_id);",

    # 4. world_glossary (작품 용어 사전)
    """
    CREATE TABLE IF NOT EXISTS world_glossary (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        term VARCHAR(255) NOT NULL,
        definition TEXT,
        usage_example TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_world_glossary_project_id ON world_glossary(project_id);",

    # 5. world_notes (세계관 자유 메모)
    """
    CREATE TABLE IF NOT EXISTS world_notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """,
    "CREATE INDEX IF NOT EXISTS idx_world_notes_project_id ON world_notes(project_id);"
]

async def migrate():
    logger.info("Running database migration for worldview settings...")
    try:
        async with async_engine.begin() as conn:
            for q in DDL_QUERIES:
                await conn.execute(text(q))
            logger.info("Migration queries executed successfully.")
    except Exception as e:
        logger.error(f"Migration failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(migrate())
