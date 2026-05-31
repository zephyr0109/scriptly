"""
[Architecture Point: Interface Layer - API Router]
클라이언트의 요청을 처리하고 서비스 계층으로 전달하는 API 라우터 계층입니다.
"""
import asyncio
import logging
import feedparser
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from datetime import datetime

from app.infrastructure.database import get_db
from app.infrastructure.external_api.naver_api import NaverNewsService
from app.domain.models import ScouterArticleModel, UserModel
from app.domain.schemas import AnalysisStatus, NewsSearchRequest, NewsStatusResponse, NewsStatusInfo
from app.application.services.ai_service import AIService
from app.application.services.auth_service import AuthService

logger = logging.getLogger(__name__)

import html, re
def _clean(text: str) -> str:
    if not text: return ""
    return html.unescape(re.sub(r'<[^>]*>', '', text))

router = APIRouter(prefix="/news", tags=["News Analysis"])

@router.get("/trending")
async def get_trending_news(
    background_tasks: BackgroundTasks,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Google News RSS를 통해 현재 트렌딩 뉴스를 가져와 분석 (로그인 필수)"""
    logger.info(f"API Request: get_trending_news by user: {current_user.id}")
    RSS_URL = "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko"
    try:
        feed = feedparser.parse(RSS_URL)
    except Exception as e:
        logger.error(f"Error parsing Google News RSS: {e}")
        return []
    
    articles = []
    for entry in feed.entries[:10]:
        try:
            summary_raw = entry.summary if hasattr(entry, 'summary') else entry.title
            summary_clean = _clean(summary_raw)[:500]
            article = ScouterArticleModel(
                title=_clean(entry.title),
                summary=summary_clean,
                content=summary_clean,
                source_url=entry.link,
                analysis_status=AnalysisStatus.PENDING.value,
                source_metadata={"original_pubDate": entry.published if hasattr(entry, 'published') else ""}
            )
            db.add(article)
            articles.append(article)
        except Exception:
            continue
    
    if articles:
        await db.commit()
        for a in articles: await db.refresh(a)
        background_tasks.add_task(process_news_batch, [a.id for a in articles])

    results = []
    for a in articles:
        results.append({
            "id": a.id,
            "article": {
                "title": a.title,
                "description": a.summary,
                "link": a.source_url,
                "pubDate": a.source_metadata.get("original_pubDate")
            },
            "analysis_status": a.analysis_status,
            "tension_evaluation": {"score": 0, "reason": "분석 예약됨", "potential_conflict": "분석 대기 중"}
        })
    return results

async def process_news_batch(article_ids: List[UUID]):
    """Background task to process a batch of scouter articles."""
    from app.infrastructure.database import async_session
    async with async_session() as db:
        stmt = select(ScouterArticleModel).where(ScouterArticleModel.id.in_(article_ids))
        result = await db.execute(stmt)
        articles = result.scalars().all()
        if not articles: return
            
        for article in articles:
            article.analysis_status = AnalysisStatus.PROCESSING.value
        await db.commit()

        articles_data = [{"id": str(a.id), "title": a.title, "content": a.content or a.summary} for a in articles]
        ai_service = AIService()
        
        try:
            evaluated_results = await ai_service.analyze_batch(articles_data)
            for eval_res in evaluated_results:
                meta_update = {"potential_conflict": eval_res.potential_conflict}
                update_stmt = (
                    update(ScouterArticleModel)
                    .where(ScouterArticleModel.id == eval_res.id)
                    .values(
                        tension_score=eval_res.tension_score,
                        tension_reason=eval_res.tension_reason,
                        source_metadata=meta_update,
                        analysis_status=AnalysisStatus.COMPLETED.value,
                        updated_at=datetime.utcnow()
                    )
                )
                await db.execute(update_stmt)
            await db.commit()
        except Exception as e:
            logger.error(f"Failed to process batch: {str(e)}")
            fail_stmt = (
                update(ScouterArticleModel)
                .where(ScouterArticleModel.id.in_(article_ids))
                .values(analysis_status=AnalysisStatus.FAILED.value, updated_at=datetime.utcnow())
            )
            await db.execute(fail_stmt)
            await db.commit()

@router.post("/analyze", status_code=202)
async def trigger_analysis(
    request: NewsSearchRequest, 
    background_tasks: BackgroundTasks,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """네이버 뉴스 검색 및 스카우터 임시 저장 (로그인 필수)"""
    logger.info(f"API Request: trigger_analysis query: {request.query} by user: {current_user.id}")
    naver_service = NaverNewsService()
    try:
        raw_news = await naver_service.search_news(query=request.query, display=request.limit)
    except Exception as e:
        logger.error(f"Error in naver search: {e}")
        raise HTTPException(status_code=500, detail="Naver Search Failed")

    if not raw_news: return []

    new_articles = []
    for item in raw_news:
        summary_clean = _clean(item.get("description", ""))
        article = ScouterArticleModel(
            title=_clean(item.get("title", "")),
            summary=summary_clean,
            content=summary_clean,
            source_url=item.get("link", ""),
            analysis_status=AnalysisStatus.PENDING.value
        )
        db.add(article)
        new_articles.append(article)

    await db.commit()
    for a in new_articles: await db.refresh(a)
    background_tasks.add_task(process_news_batch, [a.id for a in new_articles])

    articles_response = []
    for a, item in zip(new_articles, raw_news):
        articles_response.append({
            "id": str(a.id),
            "article": {
                "title": _clean(item.get("title", "")),
                "description": _clean(item.get("description", "")),
                "link": item.get("link", ""),
                "pubDate": item.get("pubDate", "")
            },
            "tension_evaluation": {"score": 0, "reason": "AI 분석 진행 중...", "potential_conflict": "분석 중..."},
            "analysis_status": AnalysisStatus.PENDING.value
        })
    return articles_response

@router.post("/{article_id}/analyze-detail")
async def analyze_news_detail(
    article_id: UUID,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """스카우터 기사 상세 분석 (로그인 필수)"""
    stmt = select(ScouterArticleModel).where(ScouterArticleModel.id == article_id)
    result = await db.execute(stmt)
    article = result.scalars().first()

    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    if article.source_metadata and "detailed_analysis" in article.source_metadata:
        return article.source_metadata["detailed_analysis"]

    ai_service = AIService()
    try:
        content = article.content or article.summary or article.title
        detail_result = await ai_service.analyze_detail(article.title, content)
        
        new_metadata = dict(article.source_metadata or {})
        new_metadata["detailed_analysis"] = detail_result
        article.tension_score = detail_result.get("tension_score", article.tension_score)
        article.tension_reason = detail_result.get("tension_reason", article.tension_reason)
        article.source_metadata = new_metadata
        await db.commit()
        return detail_result
    except Exception as e:
        logger.error(f"Detail analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail="AI 분석 오류")

@router.get("/status", response_model=NewsStatusResponse)
async def get_analysis_status(
    ids: str = Query(..., description="Comma-separated UUIDs"),
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """분석 상태 조회 (로그인 필수)"""
    try:
        uuid_list = [UUID(id_str.strip()) for id_str in ids.split(",")]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")

    stmt = select(ScouterArticleModel).where(ScouterArticleModel.id.in_(uuid_list))
    result = await db.execute(stmt)
    articles = result.scalars().all()

    response_items = []
    for a in articles:
        info = NewsStatusInfo(
            id=a.id,
            analysis_status=AnalysisStatus(a.analysis_status),
            tension_score=a.tension_score if a.analysis_status == AnalysisStatus.COMPLETED.value else None,
            tension_reason=a.tension_reason if a.analysis_status == AnalysisStatus.COMPLETED.value else None,
            potential_conflict=a.source_metadata.get("potential_conflict") if a.source_metadata else None,
            detail_analysis=a.source_metadata.get("detailed_analysis") if a.source_metadata else None
        )
        response_items.append(info)
    return NewsStatusResponse(results=response_items)
