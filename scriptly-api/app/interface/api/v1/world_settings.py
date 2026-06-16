from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from uuid import UUID
from typing import List

from app.infrastructure.database import get_db
from app.domain import models, schemas
from app.application.services.auth_service import AuthService

router = APIRouter()

# =========================================================================
# 권한 검증 및 보안 가드 헬퍼
# =========================================================================

async def verify_project_access(project_id: UUID, current_user: models.UserModel, db: AsyncSession):
    stmt = select(models.ProjectModel).where(models.ProjectModel.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if current_user.role != schemas.UserRole.ADMIN and project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="권한이 없습니다.")
    return project

async def verify_stage_access(id: UUID, current_user: models.UserModel, db: AsyncSession):
    stmt = select(models.WorldStageModel).where(models.WorldStageModel.id == id)
    result = await db.execute(stmt)
    stage = result.scalar_one_or_none()
    if not stage:
        raise HTTPException(status_code=404, detail="World stage not found")
    await verify_project_access(stage.project_id, current_user, db)
    return stage

async def verify_faction_access(id: UUID, current_user: models.UserModel, db: AsyncSession):
    stmt = select(models.WorldFactionModel).where(models.WorldFactionModel.id == id)
    result = await db.execute(stmt)
    faction = result.scalar_one_or_none()
    if not faction:
        raise HTTPException(status_code=404, detail="World faction not found")
    await verify_project_access(faction.project_id, current_user, db)
    return faction

async def verify_rule_access(id: UUID, current_user: models.UserModel, db: AsyncSession):
    stmt = select(models.WorldRuleCultureModel).where(models.WorldRuleCultureModel.id == id)
    result = await db.execute(stmt)
    rule = result.scalar_one_or_none()
    if not rule:
        raise HTTPException(status_code=404, detail="World rule/culture not found")
    await verify_project_access(rule.project_id, current_user, db)
    return rule

async def verify_glossary_access(id: UUID, current_user: models.UserModel, db: AsyncSession):
    stmt = select(models.WorldGlossaryModel).where(models.WorldGlossaryModel.id == id)
    result = await db.execute(stmt)
    glossary = result.scalar_one_or_none()
    if not glossary:
        raise HTTPException(status_code=404, detail="World glossary entry not found")
    await verify_project_access(glossary.project_id, current_user, db)
    return glossary

async def verify_note_access(id: UUID, current_user: models.UserModel, db: AsyncSession):
    stmt = select(models.WorldNoteModel).where(models.WorldNoteModel.id == id)
    result = await db.execute(stmt)
    note = result.scalar_one_or_none()
    if not note:
        raise HTTPException(status_code=404, detail="World note not found")
    await verify_project_access(note.project_id, current_user, db)
    return note


# =========================================================================
# 1. 시공간 무대 (World Stages)
# =========================================================================

@router.get("/projects/{project_id}/world-stages", response_model=List[schemas.WorldStageRead])
async def read_world_stages(
    project_id: UUID, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(project_id, current_user, db)
    stmt = select(models.WorldStageModel).where(models.WorldStageModel.project_id == project_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/projects/{project_id}/world-stages", response_model=schemas.WorldStageRead, status_code=status.HTTP_201_CREATED)
async def create_world_stage(
    project_id: UUID, 
    stage: schemas.WorldStageCreate, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(project_id, current_user, db)
    db_stage = models.WorldStageModel(**stage.model_dump())
    db_stage.project_id = project_id
    db.add(db_stage)
    await db.commit()
    await db.refresh(db_stage)
    return db_stage

@router.put("/world-stages/{id}", response_model=schemas.WorldStageRead)
async def update_world_stage(
    id: UUID, 
    stage: schemas.WorldStageUpdate, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_stage = await verify_stage_access(id, current_user, db)
    for key, value in stage.model_dump(exclude_unset=True).items():
        setattr(db_stage, key, value)
    await db.commit()
    await db.refresh(db_stage)
    return db_stage

@router.delete("/world-stages/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_world_stage(
    id: UUID, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_stage = await verify_stage_access(id, current_user, db)
    await db.delete(db_stage)
    await db.commit()
    return


# =========================================================================
# 2. 세력/집단 (World Factions)
# =========================================================================

@router.get("/projects/{project_id}/world-factions", response_model=List[schemas.WorldFactionRead])
async def read_world_factions(
    project_id: UUID, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(project_id, current_user, db)
    stmt = select(models.WorldFactionModel).where(models.WorldFactionModel.project_id == project_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/projects/{project_id}/world-factions", response_model=schemas.WorldFactionRead, status_code=status.HTTP_201_CREATED)
async def create_world_faction(
    project_id: UUID, 
    faction: schemas.WorldFactionCreate, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(project_id, current_user, db)
    db_faction = models.WorldFactionModel(**faction.model_dump())
    db_faction.project_id = project_id
    db.add(db_faction)
    await db.commit()
    await db.refresh(db_faction)
    return db_faction

@router.put("/world-factions/{id}", response_model=schemas.WorldFactionRead)
async def update_world_faction(
    id: UUID, 
    faction: schemas.WorldFactionUpdate, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_faction = await verify_faction_access(id, current_user, db)
    for key, value in faction.model_dump(exclude_unset=True).items():
        setattr(db_faction, key, value)
    await db.commit()
    await db.refresh(db_faction)
    return db_faction

@router.delete("/world-factions/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_world_faction(
    id: UUID, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_faction = await verify_faction_access(id, current_user, db)
    await db.delete(db_faction)
    await db.commit()
    return


# =========================================================================
# 3. 사회 제도 / 문화 관습 (World Rules & Cultures)
# =========================================================================

@router.get("/projects/{project_id}/world-rules-cultures", response_model=List[schemas.WorldRuleCultureRead])
async def read_world_rules_cultures(
    project_id: UUID, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(project_id, current_user, db)
    stmt = select(models.WorldRuleCultureModel).where(models.WorldRuleCultureModel.project_id == project_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/projects/{project_id}/world-rules-cultures", response_model=schemas.WorldRuleCultureRead, status_code=status.HTTP_201_CREATED)
async def create_world_rule_culture(
    project_id: UUID, 
    item: schemas.WorldRuleCultureCreate, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(project_id, current_user, db)
    db_item = models.WorldRuleCultureModel(**item.model_dump())
    db_item.project_id = project_id
    db.add(db_item)
    await db.commit()
    await db.refresh(db_item)
    return db_item

@router.put("/world-rules-cultures/{id}", response_model=schemas.WorldRuleCultureRead)
async def update_world_rule_culture(
    id: UUID, 
    item: schemas.WorldRuleCultureUpdate, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_item = await verify_rule_access(id, current_user, db)
    for key, value in item.model_dump(exclude_unset=True).items():
        setattr(db_item, key, value)
    await db.commit()
    await db.refresh(db_item)
    return db_item

@router.delete("/world-rules-cultures/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_world_rule_culture(
    id: UUID, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_item = await verify_rule_access(id, current_user, db)
    await db.delete(db_item)
    await db.commit()
    return


# =========================================================================
# 4. 작품 용어 사전 (World Glossary)
# =========================================================================

@router.get("/projects/{project_id}/world-glossary", response_model=List[schemas.WorldGlossaryRead])
async def read_world_glossary(
    project_id: UUID, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(project_id, current_user, db)
    stmt = select(models.WorldGlossaryModel).where(models.WorldGlossaryModel.project_id == project_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/projects/{project_id}/world-glossary", response_model=schemas.WorldGlossaryRead, status_code=status.HTTP_201_CREATED)
async def create_world_glossary(
    project_id: UUID, 
    glossary: schemas.WorldGlossaryCreate, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(project_id, current_user, db)
    db_glossary = models.WorldGlossaryModel(**glossary.model_dump())
    db_glossary.project_id = project_id
    db.add(db_glossary)
    await db.commit()
    await db.refresh(db_glossary)
    return db_glossary

@router.put("/world-glossary/{id}", response_model=schemas.WorldGlossaryRead)
async def update_world_glossary(
    id: UUID, 
    glossary: schemas.WorldGlossaryUpdate, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_glossary = await verify_glossary_access(id, current_user, db)
    for key, value in glossary.model_dump(exclude_unset=True).items():
        setattr(db_glossary, key, value)
    await db.commit()
    await db.refresh(db_glossary)
    return db_glossary

@router.delete("/world-glossary/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_world_glossary(
    id: UUID, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_glossary = await verify_glossary_access(id, current_user, db)
    await db.delete(db_glossary)
    await db.commit()
    return


# =========================================================================
# 5. 세계관 자유 메모 (World Notes)
# =========================================================================

@router.get("/projects/{project_id}/world-notes", response_model=List[schemas.WorldNoteRead])
async def read_world_notes(
    project_id: UUID, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(project_id, current_user, db)
    stmt = select(models.WorldNoteModel).where(models.WorldNoteModel.project_id == project_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/projects/{project_id}/world-notes", response_model=schemas.WorldNoteRead, status_code=status.HTTP_201_CREATED)
async def create_world_note(
    project_id: UUID, 
    note: schemas.WorldNoteCreate, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await verify_project_access(project_id, current_user, db)
    db_note = models.WorldNoteModel(**note.model_dump())
    db_note.project_id = project_id
    db.add(db_note)
    await db.commit()
    await db.refresh(db_note)
    return db_note

@router.put("/world-notes/{id}", response_model=schemas.WorldNoteRead)
async def update_world_note(
    id: UUID, 
    note: schemas.WorldNoteUpdate, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_note = await verify_note_access(id, current_user, db)
    for key, value in note.model_dump(exclude_unset=True).items():
        setattr(db_note, key, value)
    await db.commit()
    await db.refresh(db_note)
    return db_note

@router.delete("/world-notes/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_world_note(
    id: UUID, 
    current_user: models.UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    db_note = await verify_note_access(id, current_user, db)
    await db.delete(db_note)
    await db.commit()
    return
