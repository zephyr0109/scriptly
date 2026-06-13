"""
[Architecture Point: Interface Layer - API Router]
클라이언트의 요청을 처리하고 서비스 계층으로 전달하는 API 라우터 계층입니다.
"""
import os
import uuid
import logging
import httpx
from bs4 import BeautifulSoup
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks, Body
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.domain.schemas import InspirationCard, Source, AnalysisStatus, UserRole
from app.infrastructure.database import get_db
from app.domain.models import SourceModel, UserModel
from app.application.services.archiving_service import ArchivingService
from app.application.services.file_service import FileService
from app.application.services.ai_service import AIService
from app.application.services.auth_service import AuthService

from pydantic import BaseModel

class NoteCreateRequest(BaseModel):
    title: str
    content: str

class NoteUpdateRequest(BaseModel):
    title: str
    content: str

router = APIRouter(prefix="/archive", tags=["Archive"])
logger = logging.getLogger(__name__)

archiving_service = ArchivingService()
file_service = FileService()
ai_service = AIService()

# --- 권한 도우미 ---
async def get_source_for_user(source_id: uuid.UUID, current_user: UserModel, db: AsyncSession) -> SourceModel:
    """사용자 권한에 맞는 소스를 조회하거나 403을 발생시킵니다."""
    stmt = select(SourceModel).where(SourceModel.id == source_id)
    result = await db.execute(stmt)
    source = result.scalar_one_or_none()
    
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    
    if current_user.role != UserRole.ADMIN and source.user_id != current_user.id:
        logger.warning(f"Unauthorized access: User {current_user.id} tried to access Source {source_id}")
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    
    return source

# --- 백그라운드 분석 엔진 (시스템 전용) ---
async def process_source_analysis(source_id: uuid.UUID):
    """보관함 소스(파일/뉴스)에 대한 상세 분석을 비동기로 수행합니다."""
    from app.infrastructure.database import async_session
    async with async_session() as db:
        stmt = select(SourceModel).where(SourceModel.id == source_id)
        result = await db.execute(stmt)
        source = result.scalar_one_or_none()
        
        if not source: return

        source.analysis_status = AnalysisStatus.PROCESSING.value
        await db.commit()

        try:
            content = source.content or source.title
            detail_result = await ai_service.analyze_detail(source.title, content)
            
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

@router.post("/note", response_model=Source, status_code=status.HTTP_201_CREATED)
async def create_note_source(
    background_tasks: BackgroundTasks,
    request: NoteCreateRequest,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """직접 작성한 극작 메모를 보관함에 저장합니다."""
    logger.info(f"API Request: create_note_source from user: {current_user.id}")
    source = await archiving_service.create_note_source(
        db_session=db,
        title=request.title,
        content=request.content,
        user_id=current_user.id
    )
    background_tasks.add_task(process_source_analysis, source.id)
    return Source.model_validate(source)

@router.post("/upload", response_model=Source, status_code=status.HTTP_201_CREATED)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """파일을 업로드하고 보관함에 저장합니다."""
    logger.info(f"API Request: upload_file from user: {current_user.id}")
    content_bytes = await file.read()
    file_path, unique_name = await file_service.save_file(content_bytes, file.filename)
    
    try:
        extracted_text = file_service.extract_text(file_path)
    except Exception as e:
        logger.error(f"Error in upload_file extraction: {e}")
        raise HTTPException(status_code=400, detail=f"파일 텍스트 추출 실패: {str(e)}")
        
    source = await archiving_service.create_file_source(
        db_session=db,
        title=file.filename,
        content=extracted_text,
        file_path=unique_name,
        original_filename=file.filename,
        user_id=current_user.id # 유저 할당
    )
    
    background_tasks.add_task(process_source_analysis, source.id)
    return Source.model_validate(source)

@router.post("/url", response_model=Source, status_code=status.HTTP_201_CREATED)
async def archive_url(
    background_tasks: BackgroundTasks,
    url: str = Body(..., embed=True),
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """외부 URL 내용을 추출하여 보관함에 저장합니다."""
    logger.info(f"API Request: archive_url from user: {current_user.id}")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, follow_redirects=True, timeout=10.0)
            response.raise_for_status()
            
        soup = BeautifulSoup(response.text, 'html.parser')
        title = soup.title.string if soup.title else url
        for script in soup(["script", "style"]):
            script.decompose()
        content = soup.get_text(separator='\n', strip=True)
        
        source = await archiving_service.create_url_source(
            db_session=db,
            title=title,
            content=content[:10000],
            url=url,
            user_id=current_user.id # 유저 할당
        )
        
        background_tasks.add_task(process_source_analysis, source.id)
        return Source.model_validate(source)
    except Exception as e:
        logger.error(f"Error in archive_url: {e}")
        raise HTTPException(status_code=400, detail="URL 분석 실패")

@router.get("/source/{source_id}/download")
async def download_file(
    source_id: uuid.UUID, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """보관된 원본 파일을 다운로드합니다."""
    source = await get_source_for_user(source_id, current_user, db)
    if not source.file_path:
        raise HTTPException(status_code=404, detail="파일이 존재하지 않는 소스입니다.")
        
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
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """AI 분석을 수동으로 재요청합니다."""
    source = await get_source_for_user(source_id, current_user, db)
    source.analysis_status = AnalysisStatus.PENDING.value
    await db.commit()
    
    background_tasks.add_task(process_source_analysis, source.id)
    return {"message": "AI 분석 재요청이 접수되었습니다."}

@router.post("/scouter/{scouter_article_id}", response_model=Source)
async def archive_scouter_article(
    scouter_article_id: uuid.UUID, 
    background_tasks: BackgroundTasks,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """스카우터 데이터를 보관함으로 복사합니다."""
    source = await archiving_service.save_scouter_article_to_archive(
        db, scouter_article_id, user_id=current_user.id
    )
    if source.analysis_status == AnalysisStatus.PENDING.value:
        background_tasks.add_task(process_source_analysis, source.id)
    return Source.model_validate(source)

@router.get("/sources", response_model=List[Source])
async def get_sources(
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """보관함 목록 조회 (데이터 격리 적용)"""
    stmt = select(SourceModel)
    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(SourceModel.user_id == current_user.id)
    
    stmt = stmt.order_by(SourceModel.ingested_at.desc())
    result = await db.execute(stmt)
    return [Source.model_validate(s) for s in result.scalars().all()]

@router.delete("/source/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_source(
    source_id: uuid.UUID, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """영감 삭제"""
    source = await get_source_for_user(source_id, current_user, db)
    await db.delete(source)
    await db.commit()
    return None

@router.patch("/note/{source_id}", response_model=Source)
async def update_note_source(
    source_id: uuid.UUID,
    request: NoteUpdateRequest,
    background_tasks: BackgroundTasks,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """직접 작성한 극작 메모를 수정하고 AI 상세 분석을 재활성화합니다."""
    source = await get_source_for_user(source_id, current_user, db)
    
    if source.type != "NOTE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="메모(NOTE) 타입의 영감만 수정이 가능합니다."
        )
    
    # 수정 반영
    source.title = request.title
    source.content = request.content
    
    # 극작 내용이 변경되었으므로 분석 결과를 리셋 및 대기 상태로 회수
    source.analysis_status = AnalysisStatus.PENDING.value
    source.tension_score = 0
    source.tension_reason = "내용 변경에 따른 재분석 대기 중"
    if source.source_metadata:
        new_metadata = dict(source.source_metadata)
        new_metadata.pop("detailed_analysis", None)
        source.source_metadata = new_metadata
    
    await db.commit()
    await db.refresh(source)
    
    # 비동기로 AI 재분석 기동
    background_tasks.add_task(process_source_analysis, source.id)
    
    return Source.model_validate(source)


class SourceFolderUpdateRequest(BaseModel):
    folder: Optional[str] = None

class FolderRenameRequest(BaseModel):
    old_name: str
    new_name: str

class FolderDeleteRequest(BaseModel):
    folder_name: str

@router.patch("/source/{source_id}/folder", response_model=Source)
async def update_source_folder(
    source_id: uuid.UUID,
    request: SourceFolderUpdateRequest,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """영감의 폴더 분류를 업데이트합니다."""
    source = await get_source_for_user(source_id, current_user, db)
    source.folder = request.folder
    await db.commit()
    await db.refresh(source)
    return Source.model_validate(source)

@router.put("/folder/rename")
async def rename_folder(
    request: FolderRenameRequest,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """특정 사용자의 영감 폴더명을 일괄 변경합니다."""
    if not request.old_name.strip():
        raise HTTPException(status_code=400, detail="Old folder name cannot be empty")
    
    from sqlalchemy import update
    stmt = update(SourceModel).where(
        SourceModel.user_id == current_user.id,
        SourceModel.folder == request.old_name
    ).values(folder=request.new_name)
    
    await db.execute(stmt)
    await db.commit()
    return {"status": "success", "message": f"Folder renamed from {request.old_name} to {request.new_name}"}

@router.post("/folder/delete")
async def delete_folder(
    request: FolderDeleteRequest,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """특정 폴더를 삭제하고, 해당 폴더 내 영감들을 미분류(folder=None)로 이동시킵니다."""
    if not request.folder_name.strip():
        raise HTTPException(status_code=400, detail="Folder name cannot be empty")
        
    from sqlalchemy import update
    stmt = update(SourceModel).where(
        SourceModel.user_id == current_user.id,
        SourceModel.folder == request.folder_name
    ).values(folder=None)
    
    await db.execute(stmt)
    await db.commit()
    return {"status": "success", "message": f"Folder '{request.folder_name}' deleted. Sources moved to unclassified."}
