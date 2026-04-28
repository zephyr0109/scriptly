"""
[Architecture Point: Interface Layer - API Router]
클라이언트의 요청을 처리하고 서비스 계층으로 전달하는 API 라우터 계층입니다.
"""
import os
import uuid
import logging
import httpx
from bs4 import BeautifulSoup
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Body
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.domain.schemas import InspirationCard, Source, AnalysisStatus
from app.infrastructure.database import get_db
from app.domain.models import SourceModel
from app.application.services.archiving_service import ArchivingService
from app.application.services.file_service import FileService
from app.application.services.ai_service import AIService

router = APIRouter(prefix="/archive", tags=["Archive"])
logger = logging.getLogger(__name__)

archiving_service = ArchivingService()
file_service = FileService()
ai_service = AIService()

# --- 백그라운드 분석 엔진 ---
async def process_source_analysis(source_id: uuid.UUID):
    """보관함 소스(파일/뉴스)에 대한 상세 분석을 비동기로 수행합니다."""
    from app.infrastructure.database import async_session
    async with async_session() as db:
        stmt = select(SourceModel).where(SourceModel.id == source_id)
        result = await db.execute(stmt)
        source = result.scalar_one_or_none()
        
        if not source: return

        # 상태 업데이트: PROCESSING
        source.analysis_status = AnalysisStatus.PROCESSING.value
        await db.commit()

        try:
            # 통합 상세 분석 (Summary, Keywords, Incidents, People, Core Conflict, Atmosphere, Tension Score/Reason 포함)
            content = source.content or source.title
            detail_result = await ai_service.analyze_detail(source.title, content)
            
            # 분석 결과 통합 및 텐션 정보 동기화 (One-call Policy)
            new_metadata = dict(source.source_metadata or {})
            new_metadata["detailed_analysis"] = detail_result
            
            source.tension_score = detail_result.get("tension_score", 0)
            source.tension_reason = detail_result.get("tension_reason", "분석 완료")
            source.source_metadata = new_metadata
            source.analysis_status = AnalysisStatus.COMPLETED.value
            
            await db.commit()
            logger.info(f"AI 통합 분석 완료: {source_id}")
            
        except Exception as e:
            logger.error(f"AI 분석 실패: {str(e)}")
            source.analysis_status = AnalysisStatus.FAILED.value
            await db.commit()

# --- API 엔드포인트 ---

@router.post("/upload", response_model=Source, status_code=status.HTTP_201_CREATED)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(get_db)
):
    """파일을 업로드하고 보관함에 저장합니다. (분석은 비동기로 진행)"""
    logger.info(f"API Request: upload_file called with filename: {file.filename}")
    content_bytes = await file.read()
    
    # 1. 파일 디스크 저장
    file_path, unique_name = await file_service.save_file(content_bytes, file.filename)
    
    # 2. 텍스트 추출
    try:
        extracted_text = file_service.extract_text(file_path)
    except Exception as e:
        logger.error(f"Error in upload_file extraction: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"파일 텍스트 추출 실패: {str(e)}")
        
    # 3. DB 기본 정보 저장 (분석 전이라도 즉시 보존)
    source = await archiving_service.create_file_source(
        db_session=db,
        title=file.filename,
        content=extracted_text,
        file_path=unique_name,
        original_filename=file.filename
    )
    
    # 4. 백그라운드 AI 분석 예약
    background_tasks.add_task(process_source_analysis, source.id)
    
    return Source.model_validate(source)

@router.post("/url", response_model=Source, status_code=status.HTTP_201_CREATED)
async def archive_url(
    background_tasks: BackgroundTasks,
    url: str = Body(..., embed=True),
    db: AsyncSession = Depends(get_db)
):
    """외부 URL 내용을 추출하여 보관함에 저장합니다."""
    logger.info(f"API Request: archive_url called with url: {url}")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, follow_redirects=True, timeout=10.0)
            response.raise_for_status()
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 제목 추출
        title = soup.title.string if soup.title else url
        
        # 본문 추출 (script, style 제거 후 텍스트만)
        for script in soup(["script", "style"]):
            script.decompose()
        content = soup.get_text(separator='\n', strip=True)
        
        # 3. DB 저장
        source = await archiving_service.create_url_source(
            db_session=db,
            title=title,
            content=content[:10000], # 너무 긴 경우 절삭
            url=url
        )
        
        # 4. 분석 예약
        background_tasks.add_task(process_source_analysis, source.id)
        
        return Source.model_validate(source)
    except Exception as e:
        logger.error(f"Error in archive_url: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=f"URL 분석 실패: {str(e)}")

@router.get("/source/{source_id}/download")
async def download_file(source_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """보관된 원본 파일을 다운로드합니다."""
    logger.info(f"API Request: download_file called with source_id: {source_id}")
    stmt = select(SourceModel).where(SourceModel.id == source_id)
    result = await db.execute(stmt)
    source = result.scalar_one_or_none()
    
    if not source or not source.file_path:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
        
    file_path = file_service.get_file_path(source.file_path)
    return FileResponse(
        path=file_path,
        filename=source.original_filename,
        media_type="application/octet-stream"
    )

@router.post("/source/{source_id}/reanalyze", status_code=status.HTTP_202_ACCEPTED)
async def reanalyze_source(
    source_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """분석이 실패했거나 필요한 경우 AI 분석을 수동으로 재요청합니다."""
    logger.info(f"API Request: reanalyze_source called with source_id: {source_id}")
    stmt = select(SourceModel).where(SourceModel.id == source_id)
    result = await db.execute(stmt)
    source = result.scalar_one_or_none()
    
    if not source:
        raise HTTPException(status_code=404, detail="소스를 찾을 수 없습니다.")
        
    # 상태 초기화 후 예약
    source.analysis_status = AnalysisStatus.PENDING.value
    await db.commit()
    
    background_tasks.add_task(process_source_analysis, source.id)
    return {"message": "AI 분석 재요청이 접수되었습니다."}

@router.post("/scouter/{scouter_article_id}", response_model=Source)
async def archive_scouter_article(
    scouter_article_id: uuid.UUID, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """스카우터 데이터를 보관함으로 복사하고 필요시 분석을 예약합니다."""
    logger.info(f"API Request: archive_scouter_article called with scouter_article_id: {scouter_article_id}")
    source = await archiving_service.save_scouter_article_to_archive(db, scouter_article_id)
    
    # 이미 분석이 완료된 경우(스카우터에서 상세분석 함) 중복 호출 방지
    if source.analysis_status == AnalysisStatus.PENDING.value:
        background_tasks.add_task(process_source_analysis, source.id)
        
    return Source.model_validate(source)

@router.get("/sources", response_model=List[Source])
async def get_sources(db: AsyncSession = Depends(get_db)):
    """보관함 목록 조회"""
    logger.info("API Request: get_sources called")
    sources = await archiving_service.get_sources(db)
    return [Source.model_validate(s) for s in sources]

@router.delete("/source/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_source(source_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """영감 삭제"""
    logger.info(f"API Request: delete_source called with source_id: {source_id}")
    success = await archiving_service.delete_source(db, source_id)
    if not success:
        raise HTTPException(status_code=404, detail="Source not found")
    return None
