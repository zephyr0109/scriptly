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
                
            # 1. 프로젝트 정보 조회 (AI Context 참고용)
            project_stmt = select(ProjectModel).where(ProjectModel.id == project_id)
            project_res = await db.execute(project_stmt)
            project = project_res.scalar_one_or_none()
            
            project_context = None
            if project:
                project_context = {
                    "title": project.title,
                    "genre": project.genre,
                    "atmosphere": project.atmosphere,
                    "intended_purpose": project.intended_purpose,
                    "core_conflict": project.core_conflict,
                    "theme": project.theme
                }
                
            # 2. 소스들에서 캐릭터 정보(people) 추출
            stmt = select(SourceModel).where(SourceModel.id.in_(source_ids))
            result = await db.execute(stmt)
            sources = result.scalars().all()
            
            # 3. 현재 존재하는 캐릭터들 (중복 방지용)
            existing_chars_stmt = select(CharacterModel).where(CharacterModel.project_id == project_id)
            existing_chars_res = await db.execute(existing_chars_stmt)
            existing_names = {c.name for c in existing_chars_res.scalars().all()}
            
            from app.application.services.ai_service import AIService
            ai_service = AIService()
            
            new_chars = []
            for s in sources:
                metadata = dict(s.source_metadata or {})
                analysis = metadata.get("detailed_analysis")
                
                # 만약 상세 분석이 없거나 비어있는 경우 실시간 AI 분석 수행 (프로젝트 컨텍스트 주입)
                if not analysis or (isinstance(analysis, dict) and not analysis.get("people")):
                    try:
                        logger.info(f"Source {s.id} has no detailed analysis or empty people list. Analyzing in real-time with project context...")
                        content = s.content or s.title
                        analysis = await ai_service.analyze_detail(s.title, content, project_context)
                        metadata["detailed_analysis"] = analysis
                        s.source_metadata = metadata
                        s.tension_score = analysis.get("tension_score", 0)
                        s.tension_reason = analysis.get("tension_reason", "분석 완료")
                        s.analysis_status = "COMPLETED"
                        db.add(s)
                    except Exception as ae:
                        logger.error(f"Realtime analysis failed for source {s.id}: {ae}", exc_info=True)
                        analysis = {}
                elif isinstance(analysis, str):
                    try:
                        import json
                        analysis = json.loads(analysis)
                    except Exception:
                        analysis = {}
                
                if not isinstance(analysis, dict):
                    analysis = {}

                people = analysis.get("people", [])
                for p in people:
                    name = p.get("name", "이름 없음")
                    if name not in existing_names:
                        # 역할 비중 파싱 및 매핑
                        raw_role = p.get("role", "조연")
                        role = "조연"
                        if raw_role in ["주연", "주조연", "조연", "단역", "카메오"]:
                            role = raw_role
                        else:
                            # 유사어 매핑 Fallback
                            if "주인공" in raw_role or "주연" in raw_role or "대립자" in raw_role or "빌런" in raw_role or "주역" in raw_role:
                                role = "주연"
                            elif "주조연" in raw_role or "조주연" in raw_role:
                                role = "주조연"
                            elif "조연" in raw_role or "조력자" in raw_role:
                                role = "조연"
                            elif "단역" in raw_role or "엑스트라" in raw_role or "카메오" in raw_role:
                                role = "단역"

                        # 직업 파싱 (occupation 우선, 없을 경우 옛날 규격 하위호환을 위해 role을 fallback으로 활용)
                        occupation = p.get("occupation", p.get("role", ""))
                        if occupation == role:  # 만약 직업 란에 역할명만 복제되었다면 비워줌
                            occupation = ""

                        char = CharacterModel(
                            project_id=project_id,
                            name=name,
                            role=role,
                            occupation=occupation,
                            description=p.get("description", ""),
                            char_metadata={"source_id": str(s.id), "source_title": s.title}
                        )
                        db.add(char)
                        new_chars.append(char)
                        existing_names.add(name)
            
            if new_chars or any(s in db.dirty for s in sources):
                await db.commit()
                for c in new_chars:
                    await db.refresh(c)
                    
            return await self.get_characters(db, project_id)
        except Exception as e:
            logger.error(f"Error in sync_from_sources: {e}", exc_info=True)
            raise
