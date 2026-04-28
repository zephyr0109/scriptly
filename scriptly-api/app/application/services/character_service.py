"""
[Architecture Point: Application Layer - Service]
비즈니스 로직과 외부 서비스 오케스트레이션을 담당하는 서비스 계층입니다.
"""
import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.domain.models import CharacterModel, SourceModel, ProjectModel
from app.domain.schemas import CharacterCreate, CharacterRead

logger = logging.getLogger(__name__)

class CharacterService:
    async def get_characters(self, db: AsyncSession, project_id: uuid.UUID) -> List[CharacterModel]:
        logger.info(f"Executing get_characters for project: {project_id}...")
        try:
            stmt = select(CharacterModel).where(CharacterModel.project_id == project_id).order_by(CharacterModel.created_at.asc())
            result = await db.execute(stmt)
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Error in get_characters: {e}", exc_info=True)
            raise

    async def sync_from_sources(self, db: AsyncSession, project_id: uuid.UUID, source_ids: List[uuid.UUID]) -> List[CharacterModel]:
        """주어진 영감 자료(소스) 리스트로부터 캐릭터 정보를 추출하여 프로젝트에 동기화합니다."""
        logger.info(f"Executing sync_from_sources for project: {project_id} with {len(source_ids)} sources...")
        try:
            if not source_ids:
                return []
                
            # 2. 소스들에서 캐릭터 정보(people) 추출
            stmt = select(SourceModel).where(SourceModel.id.in_(source_ids))
            result = await db.execute(stmt)
            sources = result.scalars().all()
            
            # 3. 현재 존재하는 캐릭터들 (중복 방지용)
            existing_chars_stmt = select(CharacterModel).where(CharacterModel.project_id == project_id)
            existing_chars_res = await db.execute(existing_chars_stmt)
            existing_names = {c.name for c in existing_chars_res.scalars().all()}
            
            new_chars = []
            for s in sources:
                analysis = s.source_metadata.get("detailed_analysis", {})
                people = analysis.get("people", [])
                
                for p in people:
                    name = p.get("name", "이름 없음")
                    if name not in existing_names:
                        char = CharacterModel(
                            project_id=project_id,
                            name=name,
                            occupation=p.get("role", ""),
                            description=p.get("description", ""),
                            char_metadata={"source_id": str(s.id), "source_title": s.title}
                        )
                        db.add(char)
                        new_chars.append(char)
                        existing_names.add(name)
            
            if new_chars:
                await db.commit()
                for c in new_chars:
                    await db.refresh(c)
                    
            return await self.get_characters(db, project_id)
        except Exception as e:
            logger.error(f"Error in sync_from_sources: {e}", exc_info=True)
            raise
