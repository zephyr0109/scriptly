"""
[Architecture Point: Interface Layer - API Router]
클라이언트의 요청을 처리하고 서비스 계층으로 전달하는 API 라우터 계층입니다.
"""
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.infrastructure.database import get_db
from app.domain.schemas import ProjectEventRead, ProjectEventCreate, ProjectEventUpdate
from app.application.services.event_service import EventService

router = APIRouter(prefix="/projects", tags=["events"])
logger = logging.getLogger(__name__)
event_service = EventService()

@router.get("/{project_id}/events", response_model=List[ProjectEventRead])
async def get_project_events(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """프로젝트별 모든 사건 리스트를 가져옵니다."""
    logger.info(f"API Request: get_project_events called for project_id: {project_id}")
    return await event_service.get_events(db, project_id)

@router.post("/{project_id}/events", response_model=ProjectEventRead)
async def create_project_event(
    project_id: uuid.UUID,
    event_in: ProjectEventCreate,
    db: AsyncSession = Depends(get_db)
):
    """프로젝트에 새로운 사건을 추가합니다."""
    logger.info(f"API Request: create_project_event called for project_id: {project_id}")
    if project_id != event_in.project_id:
        raise HTTPException(status_code=400, detail="Project ID mismatch")
    return await event_service.create_event(db, event_in)

@router.patch("/events/{event_id}", response_model=ProjectEventRead)
async def update_project_event(
    event_id: uuid.UUID,
    event_in: ProjectEventUpdate,
    db: AsyncSession = Depends(get_db)
):
    """특정 사건을 수정합니다."""
    logger.info(f"API Request: update_project_event called for event_id: {event_id}")
    return await event_service.update_event(db, event_id, event_in)

@router.delete("/events/{event_id}")
async def delete_project_event(event_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """사건을 삭제합니다."""
    logger.info(f"API Request: delete_project_event called for event_id: {event_id}")
    await event_service.delete_event(db, event_id)
    return {"status": "success"}

@router.post("/{project_id}/events/reorder", response_model=List[ProjectEventRead])
async def reorder_project_events(
    project_id: uuid.UUID,
    event_ids: List[uuid.UUID],
    db: AsyncSession = Depends(get_db)
):
    """사건의 순서를 일괄 조정합니다."""
    logger.info(f"API Request: reorder_project_events called for project_id: {project_id}")
    return await event_service.reorder_events(db, project_id, event_ids)

@router.post("/{project_id}/events/generate-draft", response_model=List[ProjectEventRead])
async def generate_project_plot_draft(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """AI를 사용하여 프로젝트의 플롯(사건 흐름) 초안을 생성합니다."""
    logger.info(f"API Request: generate_project_plot_draft called for project_id: {project_id}")
    return await event_service.generate_plot_draft(db, project_id)
