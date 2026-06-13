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

async def migrate():
    logger.info("Running database migration to add 'folder' column to 'sources' table...")
    try:
        async with async_engine.begin() as conn:
            await conn.execute(text("ALTER TABLE sources ADD COLUMN IF NOT EXISTS folder VARCHAR(100);"))
            logger.info("Migration query executed successfully.")
    except Exception as e:
        logger.error(f"Migration failed: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(migrate())
