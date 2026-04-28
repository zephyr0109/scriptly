import asyncio
from sqlalchemy import text
from app.infrastructure.database import async_engine

async def migrate():
    async with async_engine.begin() as conn:
        print("Adding 'intended_purpose' column to 'projects' table...")
        await conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS intended_purpose TEXT"))
        print("Done!")

if __name__ == "__main__":
    asyncio.run(migrate())
