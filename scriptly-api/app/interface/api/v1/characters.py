"""
[Architecture Point: Interface Layer - API Router]
클라이언트의 요청을 처리하고 서비스 계층으로 전달하는 API 라우터 계층입니다.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List
import uuid
import logging

from app.domain.schemas import CharacterCreate, CharacterRead, CharacterUpdate, UserRole
from app.infrastructure.database import get_db
from app.domain.models import CharacterModel, ProjectModel, UserModel
from app.application.services.character_service import CharacterService
from app.application.services.auth_service import AuthService

router = APIRouter(prefix="/characters", tags=["Character Map"])
logger = logging.getLogger(__name__)
char_service = CharacterService()

from pydantic import BaseModel

class SyncRequest(BaseModel):
    source_ids: List[uuid.UUID]

# --- 권한 도우미 ---
async def verify_project_access(project_id: uuid.UUID, current_user: UserModel, db: AsyncSession):
    stmt = select(ProjectModel).where(ProjectModel.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project: raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role != UserRole.ADMIN and project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    return project

@router.post("/sync-from-sources/{project_id}", response_model=List[CharacterRead])
async def sync_characters(
    project_id: uuid.UUID, 
    request: SyncRequest, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """연결된 영감 자료에서 캐릭터 자동 추출"""
    await verify_project_access(project_id, current_user, db)
    chars = await char_service.sync_from_sources(db, project_id, request.source_ids)
    return [CharacterRead.model_validate(c) for c in chars]

@router.post("", response_model=CharacterRead, status_code=status.HTTP_201_CREATED)
async def create_character(
    char: CharacterCreate, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """캐릭터 생성"""
    await verify_project_access(char.project_id, current_user, db)
    db_obj = CharacterModel(**char.model_dump())
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return CharacterRead.model_validate(db_obj)

@router.get("/project/{project_id}", response_model=List[CharacterRead])
async def get_project_characters(
    project_id: uuid.UUID, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """프로젝트 캐릭터 목록 조회"""
    await verify_project_access(project_id, current_user, db)
    stmt = select(CharacterModel).where(CharacterModel.project_id == project_id).order_by(CharacterModel.created_at.asc())
    result = await db.execute(stmt)
    return [CharacterRead.model_validate(c) for c in result.scalars().all()]

@router.patch("/{char_id}", response_model=CharacterRead)
async def update_character(
    char_id: uuid.UUID, 
    char_data: CharacterUpdate, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """캐릭터 수정"""
    db_obj = await db.get(CharacterModel, char_id)
    if not db_obj: raise HTTPException(status_code=404, detail="Character not found")
    await verify_project_access(db_obj.project_id, current_user, db)
    
    update_data = char_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    await db.commit()
    await db.refresh(db_obj)
    return CharacterRead.model_validate(db_obj)

@router.delete("/{char_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_character(
    char_id: uuid.UUID, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """캐릭터 삭제"""
    db_obj = await db.get(CharacterModel, char_id)
    if not db_obj: return None
    await verify_project_access(db_obj.project_id, current_user, db)
    
    await db.delete(db_obj)
    await db.commit()
    return None
