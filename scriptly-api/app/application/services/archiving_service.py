"""
[Architecture Point: Application Layer - Service]
비즈니스 로직과 외부 서비스 오케스트레이션을 담당하는 서비스 계층입니다.
"""
import logging
import uuid
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException

from app.domain.schemas import InspirationCard, CardStatus, Source, AnalysisStatus
from app.domain.models import InspirationCardModel, SourceModel, ScouterArticleModel

logger = logging.getLogger(__name__)

class ArchivingService:
    async def create_file_source(self, db_session: AsyncSession, title: str, content: str, file_path: str, original_filename: str) -> SourceModel:
        """업로드된 파일을 보관함 자료로 즉시 저장합니다."""
        logger.info(f"Executing create_file_source: {title}...")
        try:
            new_source = SourceModel(
                type="FILE",
                title=title,
                summary=title,
                content=content,
                file_path=file_path,
                original_filename=original_filename,
                analysis_status=AnalysisStatus.PENDING.value
            )
            db_session.add(new_source)
            await db_session.commit()
            await db_session.refresh(new_source)
            return new_source
        except Exception as e:
            logger.error(f"Error in create_file_source: {e}", exc_info=True)
            raise

    async def create_url_source(self, db_session: AsyncSession, title: str, content: str, url: str) -> SourceModel:
        """외부 URL 링크를 보관함 자료로 즉시 저장합니다."""
        logger.info(f"Executing create_url_source: {title}...")
        try:
            new_source = SourceModel(
                type="NEWS",
                title=title,
                summary=title,
                content=content,
                source_url=url,
                analysis_status=AnalysisStatus.PENDING.value
            )
            db_session.add(new_source)
            await db_session.commit()
            await db_session.refresh(new_source)
            return new_source
        except Exception as e:
            logger.error(f"Error in create_url_source: {e}", exc_info=True)
            raise

    async def save_scouter_article_to_archive(self, db_session: AsyncSession, scouter_article_id: uuid.UUID) -> SourceModel:
        """스카우터의 데이터를 보관함으로 승격시킵니다."""
        logger.info(f"Executing save_scouter_article_to_archive: {scouter_article_id}...")
        try:
            stmt = select(ScouterArticleModel).where(ScouterArticleModel.id == scouter_article_id)
            result = await db_session.execute(stmt)
            article = result.scalar_one_or_none()
            
            if not article:
                raise HTTPException(status_code=404, detail="스카우터 데이터를 찾을 수 없습니다.")
                
            new_source = SourceModel(
                type="NEWS",
                title=article.title,
                summary=article.summary,
                content=article.content,
                source_url=article.source_url,
                tension_score=article.tension_score,
                tension_reason=article.tension_reason,
                analysis_status=article.analysis_status, # 스카우터 분석 상태 유지
                source_metadata=article.source_metadata
            )
            
            db_session.add(new_source)
            await db_session.commit()
            await db_session.refresh(new_source)
            return new_source
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in save_scouter_article_to_archive: {e}", exc_info=True)
            raise

    async def update_source_analysis(self, db_session: AsyncSession, source_id: uuid.UUID, score: int, reason: str, metadata: dict, status: AnalysisStatus):
        """AI 분석 결과를 소스 모델에 업데이트합니다."""
        logger.info(f"Executing update_source_analysis for source: {source_id}...")
        try:
            stmt = select(SourceModel).where(SourceModel.id == source_id)
            result = await db_session.execute(stmt)
            source = result.scalar_one_or_none()
            
            if source:
                source.tension_score = score
                source.tension_reason = reason
                source.source_metadata = metadata
                source.analysis_status = status.value
                await db_session.commit()
                return True
            return False
        except Exception as e:
            logger.error(f"Error in update_source_analysis: {e}", exc_info=True)
            raise

    async def get_sources(self, db_session: AsyncSession) -> List[SourceModel]:
        """보관함의 모든 소스를 가져옵니다."""
        logger.info("Executing get_sources...")
        try:
            stmt = select(SourceModel).order_by(SourceModel.ingested_at.desc())
            result = await db_session.execute(stmt)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error in get_sources: {e}", exc_info=True)
            raise

    async def delete_source(self, db_session: AsyncSession, source_id: uuid.UUID):
        """보관함 소스를 삭제합니다."""
        logger.info(f"Executing delete_source: {source_id}...")
        try:
            stmt = select(SourceModel).where(SourceModel.id == source_id)
            result = await db_session.execute(stmt)
            source = result.scalar_one_or_none()
            if source:
                await db_session.delete(source)
                await db_session.commit()
                return True
            return False
        except Exception as e:
            logger.error(f"Error in delete_source: {e}", exc_info=True)
            raise
