import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from app.infrastructure.database import DATABASE_URL
from app.domain.models import Base

async def recreate_tables():
    print(f"Connecting to: {DATABASE_URL}")
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    async with engine.begin() as conn:
        print("Dropping all existing tables...")
        # 기존 테이블 삭제
        await conn.run_sync(Base.metadata.drop_all)
        
        print("Creating all tables defined in models...")
        # 최신 모델 기준으로 테이블 생성
        await conn.run_sync(Base.metadata.create_all)
    
    print("✅ Tables recreated successfully.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(recreate_tables())
