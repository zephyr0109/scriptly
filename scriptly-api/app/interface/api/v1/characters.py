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

from app.domain.schemas import CharacterCreate, CharacterRead, CharacterUpdate
from app.infrastructure.database import get_db
from app.domain.models import CharacterModel
from app.application.services.character_service import CharacterService

router = APIRouter(prefix="/characters", tags=["Character Map"])
logger = logging.getLogger(__name__)
char_service = CharacterService()

from pydantic import BaseModel

class SyncRequest(BaseModel):
    source_ids: List[uuid.UUID]

@router.post("/sync-from-sources/{project_id}", response_model=List[CharacterRead])
async def sync_characters(project_id: uuid.UUID, request: SyncRequest, db: AsyncSession = Depends(get_db)):
    """연결된 영감 자료(소스)에서 캐릭터 정보를 자동으로 추출하여 동기화"""
    logger.info(f"API Request: sync_characters called for project_id: {project_id}")
    chars = await char_service.sync_from_sources(db, project_id, request.source_ids)
    return [CharacterRead.model_validate(c) for c in chars]

@router.post("", response_model=CharacterRead, status_code=status.HTTP_201_CREATED)
async def create_character(char: CharacterCreate, db: AsyncSession = Depends(get_db)):
    """새로운 캐릭터 생성 (수동 추가)"""
    logger.info(f"API Request: create_character called with name: {char.name}")
    db_obj = CharacterModel(**char.model_dump())
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return CharacterRead.model_validate(db_obj)

@router.get("/project/{project_id}", response_model=List[CharacterRead])
async def get_project_characters(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """특정 프로젝트의 모든 캐릭터 조회"""
    logger.info(f"API Request: get_project_characters called for project_id: {project_id}")
    stmt = select(CharacterModel).where(CharacterModel.project_id == project_id).order_by(CharacterModel.created_at.asc())
    result = await db.execute(stmt)
    return [CharacterRead.model_validate(c) for c in result.scalars().all()]

@router.patch("/{char_id}", response_model=CharacterRead)
async def update_character(char_id: uuid.UUID, char_data: CharacterUpdate, db: AsyncSession = Depends(get_db)):
    """캐릭터 설정 수정"""
    logger.info(f"API Request: update_character called for char_id: {char_id}")
    db_obj = await db.get(CharacterModel, char_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Character not found")
    
    update_data = char_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
    
    await db.commit()
    await db.refresh(db_obj)
    return CharacterRead.model_validate(db_obj)

@router.delete("/{char_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_character(char_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """캐릭터 삭제"""
    logger.info(f"API Request: delete_character called for char_id: {char_id}")
    db_obj = await db.get(CharacterModel, char_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Character not found")
    
    await db.delete(db_obj)
    await db.commit()
    return None
