import asyncio
from sqlalchemy import text
from app.infrastructure.database import async_engine

async def check():
    async with async_engine.connect() as conn:
        result = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'projects'"))
        columns = [row[0] for row in result]
        print(f"Columns in 'projects' table: {columns}")
        if 'intended_purpose' in columns:
            print("SUCCESS: 'intended_purpose' exists.")
        else:
            print("FAILURE: 'intended_purpose' MISSING!")

if __name__ == "__main__":
    asyncio.run(check())
