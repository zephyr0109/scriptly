import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.infrastructure.database import DATABASE_URL
from app.domain.models import Base

async def create_script_table():
    print(f"Connecting to: {DATABASE_URL}")
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("Creating scripts table (and other missing tables if any)...")
        # 기존 데이터를 보호하기 위해 drop_all을 하지 않고, create_all만 수행
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ scripts table checked/created successfully.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_script_table())
