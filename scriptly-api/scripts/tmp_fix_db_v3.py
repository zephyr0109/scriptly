import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

# DB_URL can be imported but safer to reconstruct to avoid import errors in a quick script
DB_USER = os.getenv("POSTGRES_USER", "scriptly_user")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "scriptly_password")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "scriptly_db")

DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

async def main():
    engine = create_async_engine(DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        print("Checking for is_locked column...")
        try:
            # We use a try-except block because adding a column that already exists will throw an error
            await conn.execute(text("ALTER TABLE characters ADD COLUMN is_locked BOOLEAN DEFAULT FALSE;"))
            print("Successfully added is_locked column.")
        except Exception as e:
            print(f"Notice: is_locked column might already exist or another error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main())
