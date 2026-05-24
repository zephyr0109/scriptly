"""
[Architecture Point: Interface Layer - API Router]
클라이언트의 요청을 처리하고 서비스 계층으로 전달하는 API 라우터 계층입니다.
"""
import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.infrastructure.database import get_db
from app.domain.models import ProjectModel, UserModel, ProjectEventModel
from app.domain.schemas import ProjectEventRead, ProjectEventCreate, ProjectEventUpdate, UserRole
from app.application.services.event_service import EventService
from app.application.services.auth_service import AuthService

router = APIRouter(prefix="/projects", tags=["events"])
logger = logging.getLogger(__name__)
event_service = EventService()

# --- 권한 도우미 ---
async def verify_project_access(project_id: uuid.UUID, current_user: UserModel, db: AsyncSession):
    stmt = select(ProjectModel).where(ProjectModel.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project: raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role != UserRole.ADMIN and project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    return project

@router.get("/{project_id}/events", response_model=List[ProjectEventRead])
async def get_project_events(
    project_id: uuid.UUID, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """프로젝트별 모든 사건 리스트 조회"""
    await verify_project_access(project_id, current_user, db)
    return await event_service.get_events(db, project_id)

@router.post("/{project_id}/events", response_model=ProjectEventRead)
async def create_project_event(
    project_id: uuid.UUID,
    event_in: ProjectEventCreate,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """프로젝트에 새로운 사건 추가"""
    await verify_project_access(project_id, current_user, db)
    if project_id != event_in.project_id:
        raise HTTPException(status_code=400, detail="Project ID mismatch")
    return await event_service.create_event(db, event_in)

@router.patch("/events/{event_id}", response_model=ProjectEventRead)
async def update_project_event(
    event_id: uuid.UUID,
    event_in: ProjectEventUpdate,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """특정 사건 수정"""
    # 이벤트 -> 프로젝트 권한 확인
    stmt = select(ProjectEventModel).where(ProjectEventModel.id == event_id)
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()
    if not event: raise HTTPException(status_code=404, detail="Event not found")
    await verify_project_access(event.project_id, current_user, db)
    
    return await event_service.update_event(db, event_id, event_in)

@router.delete("/events/{event_id}")
async def delete_project_event(
    event_id: uuid.UUID, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """사건 삭제"""
    stmt = select(ProjectEventModel).where(ProjectEventModel.id == event_id)
    result = await db.execute(stmt)
    event = result.scalar_one_or_none()
    if not event: return {"status": "success"}
    await verify_project_access(event.project_id, current_user, db)
    
    await event_service.delete_event(db, event_id)
    return {"status": "success"}

@router.post("/{project_id}/events/reorder", response_model=List[ProjectEventRead])
async def reorder_project_events(
    project_id: uuid.UUID,
    event_ids: List[uuid.UUID],
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """사건 순서 일괄 조정"""
    await verify_project_access(project_id, current_user, db)
    return await event_service.reorder_events(db, project_id, event_ids)

@router.post("/{project_id}/events/generate-draft", response_model=List[ProjectEventRead])
async def generate_project_plot_draft(
    project_id: uuid.UUID,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """AI를 사용하여 플롯 초안 생성"""
    await verify_project_access(project_id, current_user, db)
    return await event_service.generate_plot_draft(db, project_id)
