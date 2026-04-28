"""
[Architecture Point: Interface Layer - API Router]
클라이언트의 요청을 처리하고 서비스 계층으로 전달하는 API 라우터 계층입니다.
"""
import logging
from typing import List
from urllib.parse import quote
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.infrastructure.database import get_db
from app.domain.models import ProjectModel, CanvasBoardModel, ProjectEventModel, CharacterModel
from app.domain.schemas import ProjectCreate, ProjectRead, ProjectUpdate
from app.application.services.ai_service import AIService
from app.application.services.export_service import ExportService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["Projects"])
ai_service = AIService()
export_service = ExportService()

@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate, db: AsyncSession = Depends(get_db)):
    db_project = ProjectModel(**project.model_dump())
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    
    # 프로젝트당 기본 인물 관계도(보드) 하나 생성
    default_board = CanvasBoardModel(project_id=db_project.id, title="기본 인물 관계도")
    db.add(default_board)
    await db.commit()
    
    return ProjectRead.model_validate(db_project)

@router.get("/", response_model=List[ProjectRead])
async def list_projects(db: AsyncSession = Depends(get_db)):
    stmt = select(ProjectModel).order_by(ProjectModel.updated_at.desc())
    result = await db.execute(stmt)
    return [ProjectRead.model_validate(p) for p in result.scalars().all()]

@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(ProjectModel).where(ProjectModel.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectRead.model_validate(project)

@router.patch("/{project_id}", response_model=ProjectRead)
async def update_project(project_id: UUID, project_update: ProjectUpdate, db: AsyncSession = Depends(get_db)):
    logger.info(f"API Request: update_project for project_id: {project_id}")
    stmt = select(ProjectModel).where(ProjectModel.id == project_id)
    result = await db.execute(stmt)
    db_project = result.scalar_one_or_none()
    if not db_project:
        logger.warning(f"Project {project_id} not found for update")
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_data = project_update.model_dump(exclude_unset=True)
    logger.info(f"Updating project {project_id} with keys: {list(update_data.keys())}")
    
    for key, value in update_data.items():
        setattr(db_project, key, value)
    
    await db.commit()
    await db.refresh(db_project)
    return ProjectRead.model_validate(db_project)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    logger.info(f"API Request: delete_project for project_id: {project_id}")
    stmt = select(ProjectModel).where(ProjectModel.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.delete(project)
    await db.commit()
    return None

@router.post("/{project_id}/generate-logline", response_model=ProjectRead)
async def generate_project_logline(project_id: UUID, db: AsyncSession = Depends(get_db)):
    """플롯 이벤트를 기반으로 로그라인을 생성합니다."""
    logger.info(f"API Request: generate_project_logline for project_id: {project_id}")
    # 1. 프로젝트 정보 및 이벤트 조회
    stmt = select(ProjectModel).where(ProjectModel.id == project_id)
    result = await db.execute(stmt)
    db_project = result.scalar_one_or_none()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    event_stmt = select(ProjectEventModel).where(ProjectEventModel.project_id == project_id).order_by(ProjectEventModel.sequence.asc())
    event_result = await db.execute(event_stmt)
    events = event_result.scalars().all()

    if not events:
        raise HTTPException(status_code=400, detail="로그라인을 생성할 플롯 이벤트가 없습니다. 먼저 이벤트를 추가해주세요.")

    # 2. AI 호출
    try:
        project_context = {
            "title": db_project.title,
            "intended_purpose": db_project.intended_purpose,
            "core_conflict": db_project.core_conflict
        }
        events_context = [
            {"title": e.title, "content": e.content} for e in events
        ]

        logline = await ai_service.generate_logline(project_context, events_context)

        # 3. 데이터 업데이트 및 저장
        db_project.logline = logline
        await db.commit()
        await db.refresh(db_project)
        
        return ProjectRead.model_validate(db_project)
    except Exception as e:
        logger.error(f"Error in generate_project_logline: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI 로그라인 생성 중 오류가 발생했습니다: {str(e)}")

@router.post("/{project_id}/generate-synopsis", response_model=ProjectRead)
async def generate_project_synopsis(project_id: UUID, db: AsyncSession = Depends(get_db)):
    """플롯 이벤트를 기반으로 전체 줄거리(시놉시스)를 생성합니다."""
    logger.info(f"API Request: generate_project_synopsis for project_id: {project_id}")
    # 1. 프로젝트 정보 및 이벤트 조회
    stmt = select(ProjectModel).where(ProjectModel.id == project_id)
    result = await db.execute(stmt)
    db_project = result.scalar_one_or_none()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    event_stmt = select(ProjectEventModel).where(ProjectEventModel.project_id == project_id).order_by(ProjectEventModel.sequence.asc())
    event_result = await db.execute(event_stmt)
    events = event_result.scalars().all()

    if not events:
        raise HTTPException(status_code=400, detail="시놉시스를 생성할 플롯 이벤트가 없습니다. 먼저 이벤트를 추가해주세요.")

    # 2. AI 호출
    try:
        project_context = {
            "title": db_project.title,
            "intended_purpose": db_project.intended_purpose,
            "core_conflict": db_project.core_conflict,
            "theme": db_project.theme
        }
        events_context = [
            {"title": e.title, "content": e.content, "time_hint": e.time_hint} for e in events
        ]

        synopsis = await ai_service.generate_synopsis(project_context, events_context)

        # 3. 데이터 업데이트 및 저장
        db_project.full_synopsis = synopsis
        await db.commit()
        await db.refresh(db_project)
        
        return ProjectRead.model_validate(db_project)
    except Exception as e:
        logger.error(f"Error in generate_project_synopsis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"AI 시놉시스 생성 중 오류가 발생했습니다: {str(e)}")

@router.get("/{project_id}/export/{export_format}")
async def export_project_document(project_id: UUID, export_format: str, db: AsyncSession = Depends(get_db)):
    """프로젝트 데이터를 Word 또는 PDF(추후 지원)로 내보냅니다."""
    # 1. 시놉시스 구성을 위한 모든 데이터 수집
    project_stmt = select(ProjectModel).where(ProjectModel.id == project_id)
    project_res = await db.execute(project_stmt)
    project = project_res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    char_stmt = select(CharacterModel).where(CharacterModel.project_id == project_id)
    char_res = await db.execute(char_stmt)
    characters = char_res.scalars().all()

    event_stmt = select(ProjectEventModel).where(ProjectEventModel.project_id == project_id).order_by(ProjectEventModel.sequence.asc())
    event_res = await db.execute(event_stmt)
    events = event_res.scalars().all()

    # 데이터 직렬화
    project_data = project.__dict__
    char_list = [c.__dict__ for c in characters]
    event_list = [e.__dict__ for e in events]

    if export_format.lower() == "word" or export_format.lower() == "docx":
        file_stream = export_service.generate_docx(project_data, char_list, event_list)
        filename = f"{project.title}_synopsis.docx"
        content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif export_format.lower() == "pdf":
        raise HTTPException(status_code=501, detail="PDF export is currently being developed. Please use Word export.")
    else:
        raise HTTPException(status_code=400, detail="Invalid export format. Use 'word' or 'pdf'.")

    # filename URL encoding for non-ASCII (Korean) characters
    encoded_filename = quote(filename)
    return StreamingResponse(
        file_stream,
        media_type=content_type,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
    )

