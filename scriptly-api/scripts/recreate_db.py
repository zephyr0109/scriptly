import asyncio
import os
import sys
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.infrastructure.database import async_engine, Base
from app.domain.models import *

async def recreate_tables():
    async with async_engine.begin() as conn:
        print("Dropping old legacy tables...")
        # Drop old tables with CASCADE to ensure no foreign key issues
        await conn.execute(text("DROP TABLE IF EXISTS character_relationships CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS dramatic_elements CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS characters CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS lab_sessions CASCADE"))
        
        print("Dropping current metadata tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating all tables...")
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables recreated successfully.")

if __name__ == "__main__":
    asyncio.run(recreate_tables())
