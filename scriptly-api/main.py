import logging
import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# 로깅 설정 최상단 배치 및 상세화
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    force=True
)
logger = logging.getLogger(__name__)
logger.info("🚀 Starting Scriptly API...")

from fastapi import FastAPI, Query, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn
import asyncio
from datetime import datetime, timedelta
from sqlalchemy import delete
from app.infrastructure.database import async_session
from app.domain.models import ScouterArticleModel
from app.application.services.curation_service import CurationService
from app.domain.schemas import CurationResult, NewsArticle, CharacterPersona
from app.interface.api.v1 import archive, news, insight, projects, characters, events, auth, scripts, world_settings, backup

app = FastAPI(title="Scriptly API")

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception caught: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)}
    )

async def cleanup_old_scouter_articles_loop():
    """3일이 경과한 임시 기사 데이터를 주기적으로 삭제하여 용량을 최적화합니다."""
    await asyncio.sleep(5)
    while True:
        try:
            logger.info("🧹 Starting Scouter articles cleanup background task...")
            three_days_ago = datetime.utcnow() - timedelta(days=3)
            async with async_session() as db:
                stmt = delete(ScouterArticleModel).where(ScouterArticleModel.ingested_at < three_days_ago)
                result = await db.execute(stmt)
                await db.commit()
                deleted_count = result.rowcount
                logger.info(f"🧹 Cleaned up {deleted_count} expired scouter articles.")
        except Exception as e:
            logger.error(f"🧹 Error during scouter articles cleanup: {e}", exc_info=True)
        
        await asyncio.sleep(12 * 3600)

@app.on_event("startup")
async def startup_event():
    logger.info("⚡ Application startup complete")
    asyncio.create_task(cleanup_old_scouter_articles_loop())
    # 등록된 라우트 로깅 (디버깅용)
    for route in app.routes:
        logger.info(f"Route: {route.path} -> {route.name}")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3100",
        "http://zephyr0109.duckdns.org:3000",
        "http://zephyr0109.duckdns.org:3100",
        "http://zephyr0109.duckdns.org",
        "https://zephyr0109.duckdns.org",
        "http://dangame.iptime.org:3100", # 기존 호스트 유지 (선택사항)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(auth.router, prefix="/api/v1")
app.include_router(archive.router, prefix="/api/v1")
app.include_router(news.router, prefix="/api/v1")
app.include_router(insight.router, prefix="/api/v1")
app.include_router(projects.router, prefix="/api/v1")
app.include_router(characters.router, prefix="/api/v1")
app.include_router(events.router, prefix="/api/v1")
app.include_router(scripts.router, prefix="/api/v1")
app.include_router(world_settings.router, prefix="/api/v1")
app.include_router(backup.router, prefix="/api/v1")

curation_service = CurationService()

@app.get("/")
async def root():
    logger.info("Root endpoint called")
    return {"message": "Scriptly Core API is running"}

@app.post("/api/v1/curation/persona", response_model=CharacterPersona)
async def extract_persona(article: NewsArticle):
    """
    뉴스 기사를 바탕으로 드라마틱한 캐릭터 페르소나를 추출합니다.
    """
    logger.info("API Request: extract_persona called")
    result = await curation_service.extract_persona(article)
    if not result:
        raise HTTPException(status_code=500, detail="Persona extraction failed")
    return result

@app.get("/api/v1/curation/search", response_model=List[CurationResult])
async def search_news(query: str = Query(..., min_length=1), limit: int = 5, start: int = 1):
    """
    네이버 뉴스를 검색하고 Gemini AI를 통해 드라마적 긴장도를 평가하여 반환합니다.
    start: 검색 시작 위치 (페이징용)
    """
    logger.info(f"API Request: search_news called with query: {query}")
    results = await curation_service.curate_news(query, limit=limit, start=start)
    return results

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
