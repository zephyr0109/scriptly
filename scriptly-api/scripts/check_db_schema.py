import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

DB_USER = os.getenv("POSTGRES_USER", "scriptly_user")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "scriptly_password")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "scriptly_db")

DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

async def main():
    engine = create_async_engine(DATABASE_URL)
    async with engine.connect() as conn:
        # PostgreSQL specific query to list columns
        result = await conn.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'characters';
        """))
        columns = result.fetchall()
        print("Columns in 'characters' table:")
        for col in columns:
            print(f"- {col[0]} ({col[1]})")

if __name__ == "__main__":
    asyncio.run(main())
