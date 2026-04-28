"""
[Architecture Point: Application Layer - Service]
비즈니스 로직과 외부 서비스 오케스트레이션을 담당하는 서비스 계층입니다.
"""
import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from typing import List, Dict, Any

from app.domain.models import ProjectEventModel, ProjectModel, CharacterModel, SourceModel
from app.domain.schemas import ProjectEventCreate, ProjectEventUpdate
from app.application.services.ai_service import AIService

logger = logging.getLogger(__name__)

class EventService:
    def __init__(self):
        self.ai_service = AIService()
    async def get_events(self, db: AsyncSession, project_id: uuid.UUID) -> List[ProjectEventModel]:
        """프로젝트에 속한 모든 사건을 가져옵니다. sequence 순으로 정렬합니다."""
        logger.info(f"Executing get_events for project_id: {project_id}...")
        try:
            stmt = select(ProjectEventModel).where(ProjectEventModel.project_id == project_id).order_by(ProjectEventModel.sequence.asc())
            result = await db.execute(stmt)
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Error in get_events: {e}", exc_info=True)
            raise

    async def create_event(self, db: AsyncSession, event_in: ProjectEventCreate) -> ProjectEventModel:
        """새로운 사건을 생성합니다."""
        logger.info(f"Executing create_event for project_id: {event_in.project_id}...")
        try:
            # 기본 sequence 값 결정 (현재 가장 마지막 번호 + 1)
            stmt = select(ProjectEventModel.sequence).where(ProjectEventModel.project_id == event_in.project_id).order_by(ProjectEventModel.sequence.desc()).limit(1)
            res = await db.execute(stmt)
            max_seq = res.scalar() or 0
            
            db_event = ProjectEventModel(
                id=uuid.uuid4(),
                project_id=event_in.project_id,
                sequence=event_in.sequence or (max_seq + 1),
                time_hint=event_in.time_hint,
                title=event_in.title,
                content=event_in.content,
                related_character_ids=[str(cid) for cid in event_in.related_character_ids],
                event_metadata=event_in.event_metadata
            )
            db.add(db_event)
            await db.commit()
            await db.refresh(db_event)
            return db_event
        except Exception as e:
            logger.error(f"Error in create_event: {e}", exc_info=True)
            raise

    async def update_event(self, db: AsyncSession, event_id: uuid.UUID, event_in: ProjectEventUpdate) -> ProjectEventModel:
        """사건 정보를 수정합니다."""
        logger.info(f"Executing update_event for event_id: {event_id}...")
        try:
            update_data = event_in.model_dump(exclude_unset=True)
            
            # UUID 리스트를 문자열 리스트로 변환 (JSONB 대응)
            if "related_character_ids" in update_data and update_data["related_character_ids"] is not None:
                update_data["related_character_ids"] = [str(cid) for cid in update_data["related_character_ids"]]
                
            stmt = update(ProjectEventModel).where(ProjectEventModel.id == event_id).values(**update_data)
            await db.execute(stmt)
            await db.commit()
            
            # 결과 반환
            res = await db.execute(select(ProjectEventModel).where(ProjectEventModel.id == event_id))
            return res.scalar_one()
        except Exception as e:
            logger.error(f"Error in update_event: {e}", exc_info=True)
            raise

    async def delete_event(self, db: AsyncSession, event_id: uuid.UUID) -> bool:
        """사건을 삭제합니다."""
        logger.info(f"Executing delete_event for event_id: {event_id}...")
        try:
            stmt = delete(ProjectEventModel).where(ProjectEventModel.id == event_id)
            await db.execute(stmt)
            await db.commit()
            return True
        except Exception as e:
            logger.error(f"Error in delete_event: {e}", exc_info=True)
            raise

    async def reorder_events(self, db: AsyncSession, project_id: uuid.UUID, event_ids: List[uuid.UUID]) -> List[ProjectEventModel]:
        """드래그 앤 드롭 등으로 변경된 순서를 일괄 적용합니다."""
        logger.info(f"Executing reorder_events for project_id: {project_id}...")
        try:
            for idx, event_id in enumerate(event_ids):
                stmt = update(ProjectEventModel).where(
                    ProjectEventModel.id == event_id,
                    ProjectEventModel.project_id == project_id
                ).values(sequence=idx)
                await db.execute(stmt)
            
            await db.commit()
            return await self.get_events(db, project_id)
        except Exception as e:
            logger.error(f"Error in reorder_events: {e}", exc_info=True)
            raise

    async def generate_plot_draft(self, db: AsyncSession, project_id: uuid.UUID) -> List[ProjectEventModel]:
        """AI를 사용하여 프로젝트의 플롯 초안을 생성합니다. 기존 사건들은 삭제됩니다."""
        logger.info(f"Executing generate_plot_draft for project_id: {project_id}...")
        try:
            # 1. 컨텍스트 수집
            # 프로젝트 정보
            project_res = await db.execute(select(ProjectModel).where(ProjectModel.id == project_id))
            project = project_res.scalar_one_or_none()
            if not project:
                raise ValueError("Project not found")
                
            # 캐릭터 정보
            char_res = await db.execute(select(CharacterModel).where(CharacterModel.project_id == project_id))
            characters = char_res.scalars().all()
            
            # 영감 자료 정보
            sources = []
            if project.linked_sources:
                source_res = await db.execute(select(SourceModel).where(SourceModel.id.in_(project.linked_sources)))
                sources = source_res.scalars().all()
                
            # 2. AI 호출
            project_context = {
                "title": project.title,
                "format": project.format,
                "genre": project.genre,
                "atmosphere": project.atmosphere,
                "intended_purpose": project.intended_purpose,
                "core_conflict": project.core_conflict,
                "theme": project.theme
            }
            chars_context = [
                {"name": c.name, "role": c.role, "occupation": c.occupation, "description": c.description}
                for c in characters
            ]
            sources_context = [
                {"title": s.title, "summary": s.summary, "source_metadata": s.source_metadata}
                for s in sources
            ]
            
            ai_result = await self.ai_service.generate_plot_draft(
                project_context, chars_context, sources_context
            )
            
            # 3. 기존 사건 삭제
            await db.execute(delete(ProjectEventModel).where(ProjectEventModel.project_id == project_id))
            
            # 4. 새 사건 저장
            char_name_to_id = {c.name: c.id for c in characters}
            
            new_events = []
            for item in ai_result.get("events", []):
                related_ids = []
                for name in item.get("related_characters", []):
                    if name in char_name_to_id:
                        related_ids.append(char_name_to_id[name])
                
                db_event = ProjectEventModel(
                    id=uuid.uuid4(),
                    project_id=project_id,
                    sequence=item.get("sequence", 0),
                    time_hint=item.get("time_hint"),
                    title=item.get("title", "무제"),
                    content=item.get("content"),
                    related_character_ids=[str(rid) for rid in related_ids]
                )
                db.add(db_event)
                new_events.append(db_event)
                
            await db.commit()
            return await self.get_events(db, project_id)
        except Exception as e:
            logger.error(f"Error in generate_plot_draft: {e}", exc_info=True)
            raise
