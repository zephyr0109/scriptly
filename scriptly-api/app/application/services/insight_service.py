"""
[Architecture Point: Application Layer - Service]
비즈니스 로직과 외부 서비스 오케스트레이션을 담당하는 서비스 계층입니다.
"""
import uuid
import math
import logging
from typing import List, Optional, Any, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, not_
from fastapi import HTTPException

from app.domain.schemas import CanvasBoard, CanvasNode, CanvasEdge
from app.domain.models import CanvasBoardModel, CanvasNodeModel, CanvasEdgeModel, CharacterModel, ProjectModel

logger = logging.getLogger(__name__)

class InsightService:
    # --- Canvas Board ---
    async def create_board(self, db_session: AsyncSession, board: CanvasBoard) -> CanvasBoardModel:
        logger.info(f"Executing create_board for project_id: {board.project_id}...")
        try:
            db_obj = CanvasBoardModel(
                id=board.id,
                project_id=board.project_id,
                title=board.title
            )
            db_session.add(db_obj)
            await db_session.commit()
            await db_session.refresh(db_obj)
            return db_obj
        except Exception as e:
            logger.error(f"Error in create_board: {e}", exc_info=True)
            raise

    async def get_boards(self, db_session: AsyncSession, project_id: uuid.UUID) -> List[CanvasBoardModel]:
        logger.info(f"Executing get_boards for project_id: {project_id}...")
        try:
            stmt = select(CanvasBoardModel).where(CanvasBoardModel.project_id == project_id).order_by(CanvasBoardModel.updated_at.desc())
            result = await db_session.execute(stmt)
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Error in get_boards: {e}", exc_info=True)
            raise

    # --- Canvas Node ---
    async def create_node(self, db_session: AsyncSession, node: CanvasNode) -> CanvasNodeModel:
        logger.info(f"Executing create_node for board_id: {node.board_id}...")
        try:
            db_obj = CanvasNodeModel(
                id=node.id,
                board_id=node.board_id,
                type=node.type,
                ref_source_id=node.ref_source_id,
                position_x=node.position_x,
                position_y=node.position_y,
                width=node.width,
                height=node.height,
                data=node.data
            )
            db_session.add(db_obj)
            await db_session.commit()
            await db_session.refresh(db_obj)
            return db_obj
        except Exception as e:
            logger.error(f"Error in create_node: {e}", exc_info=True)
            raise
        
    async def get_nodes(self, db_session: AsyncSession, board_id: uuid.UUID) -> List[CanvasNodeModel]:
        logger.info(f"Executing get_nodes for board_id: {board_id}...")
        try:
            stmt = select(CanvasNodeModel).where(CanvasNodeModel.board_id == board_id)
            result = await db_session.execute(stmt)
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Error in get_nodes: {e}", exc_info=True)
            raise

    async def update_node(self, db_session: AsyncSession, node_id: uuid.UUID, node_data: dict) -> Optional[CanvasNodeModel]:
        logger.info(f"Executing update_node for node_id: {node_id}...")
        try:
            stmt = select(CanvasNodeModel).where(CanvasNodeModel.id == node_id)
            result = await db_session.execute(stmt)
            db_obj = result.scalar_one_or_none()
            if db_obj:
                for k, v in node_data.items():
                    if hasattr(db_obj, k):
                        setattr(db_obj, k, v)
                await db_session.commit()
                await db_session.refresh(db_obj)
            return db_obj
        except Exception as e:
            logger.error(f"Error in update_node: {e}", exc_info=True)
            raise

    async def delete_node(self, db_session: AsyncSession, node_id: uuid.UUID):
        logger.info(f"Executing delete_node for node_id: {node_id}...")
        try:
            stmt = delete(CanvasNodeModel).where(CanvasNodeModel.id == node_id)
            await db_session.execute(stmt)
            await db_session.commit()
        except Exception as e:
            logger.error(f"Error in delete_node: {e}", exc_info=True)
            raise

    # --- Canvas Edge ---
    async def create_edge(self, db_session: AsyncSession, edge: CanvasEdge) -> CanvasEdgeModel:
        logger.info(f"Executing create_edge for board_id: {edge.board_id}...")
        try:
            db_obj = CanvasEdgeModel(
                id=edge.id,
                board_id=edge.board_id,
                source_node_id=edge.source_node_id,
                target_node_id=edge.target_node_id,
                label=edge.label,
                style=edge.style
            )
            db_session.add(db_obj)
            await db_session.commit()
            await db_session.refresh(db_obj)
            return db_obj
        except Exception as e:
            logger.error(f"Error in create_edge: {e}", exc_info=True)
            raise

    async def get_edges(self, db_session: AsyncSession, board_id: uuid.UUID) -> List[CanvasEdgeModel]:
        logger.info(f"Executing get_edges for board_id: {board_id}...")
        try:
            stmt = select(CanvasEdgeModel).where(CanvasEdgeModel.board_id == board_id)
            result = await db_session.execute(stmt)
            return list(result.scalars().all())
        except Exception as e:
            logger.error(f"Error in get_edges: {e}", exc_info=True)
            raise

    async def update_edge(self, db_session: AsyncSession, edge_id: uuid.UUID, edge_data: dict) -> Optional[CanvasEdgeModel]:
        logger.info(f"Executing update_edge for edge_id: {edge_id}...")
        try:
            stmt = select(CanvasEdgeModel).where(CanvasEdgeModel.id == edge_id)
            result = await db_session.execute(stmt)
            db_obj = result.scalar_one_or_none()
            if db_obj:
                for k, v in edge_data.items():
                    if hasattr(db_obj, k):
                        setattr(db_obj, k, v)
                await db_session.commit()
                await db_session.refresh(db_obj)
            return db_obj
        except Exception as e:
            logger.error(f"Error in update_edge: {e}", exc_info=True)
            raise

    async def delete_edge(self, db_session: AsyncSession, edge_id: uuid.UUID):
        logger.info(f"Executing delete_edge for edge_id: {edge_id}...")
        try:
            stmt = delete(CanvasEdgeModel).where(CanvasEdgeModel.id == edge_id)
            await db_session.execute(stmt)
            await db_session.commit()
        except Exception as e:
            logger.error(f"Error in delete_edge: {e}", exc_info=True)
            raise

    async def save_session(self, db_session: AsyncSession, board_id: uuid.UUID, nodes: List[CanvasNode], edges: List[CanvasEdge]):
        """보드의 모든 노드와 엣지를 한 번에 저장 (기존 데이터 삭제 후 재삽입)"""
        logger.info(f"Executing save_session for board_id: {board_id}...")
        try:
            # 1. 기존 데이터 삭제
            await db_session.execute(delete(CanvasEdgeModel).where(CanvasEdgeModel.board_id == board_id))
            await db_session.execute(delete(CanvasNodeModel).where(CanvasNodeModel.board_id == board_id))
            
            # 2. 노드 삽입
            for node in nodes:
                db_node = CanvasNodeModel(
                    id=node.id,
                    board_id=board_id,
                    type=node.type,
                    ref_source_id=node.ref_source_id,
                    position_x=node.position_x,
                    position_y=node.position_y,
                    width=node.width,
                    height=node.height,
                    data=node.data
                )
                db_session.add(db_node)
            
            # 노드를 먼저 DB에 반영 (엣지의 외래키 제약조건 방지)
            await db_session.flush()
                
            # 3. 엣지 삽입
            for edge in edges:
                db_edge = CanvasEdgeModel(
                    id=edge.id,
                    board_id=board_id,
                    source_node_id=edge.source_node_id,
                    target_node_id=edge.target_node_id,
                    label=edge.label,
                    style=edge.style,
                    data=edge.data
                )
                db_session.add(db_edge)
                
            await db_session.commit()
            return True
        except Exception as e:
            logger.error(f"Error in save_session: {e}", exc_info=True)
            raise
        
    # --- On-Demand Synthesis ---
    async def synthesize_on_demand(
        self, 
        db_session: AsyncSession, 
        node_ids: List[uuid.UUID] = None, 
        instruction: str = "", 
        source_ids: List[uuid.UUID] = None,
        genre: str = "드라마",
        tone: str = "진지한"
    ):
        logger.info(f"Executing synthesize_on_demand...")
        try:
            from app.domain.models import SourceModel, CanvasNodeModel
            from app.application.services.ai_service import AIService
            
            all_source_ids = set()
            
            # 1. 노드가 주어졌을 경우 노드에서 소스 ID 추출
            if node_ids:
                stmt = select(CanvasNodeModel).where(CanvasNodeModel.id.in_(node_ids))
                result = await db_session.execute(stmt)
                nodes = result.scalars().all()
                for n in nodes:
                    if n.ref_source_id:
                        all_source_ids.add(n.ref_source_id)
                        
            # 2. 직접 소스 ID가 주어졌을 경우 추가
            if source_ids:
                for sid in source_ids:
                    all_source_ids.add(sid)
            
            if not all_source_ids:
                return {"error": "No sources selected for synthesis"}
                
            sources_data = []
            s_stmt = select(SourceModel).where(SourceModel.id.in_(list(all_source_ids)))
            s_res = await db_session.execute(s_stmt)
            sources = s_res.scalars().all()
            sources_data = [{"title": s.title, "content": s.content, "summary": s.summary} for s in sources]
                
            ai_service = AIService()
            creative_direction = {
                "instruction": instruction,
                "genre": genre,
                "tone": tone
            }
            # AI 분석 호출
            res = await ai_service.analyze_synthesis(sources_data, creative_direction)
            return res
        except Exception as e:
            logger.error(f"Error in synthesize_on_demand: {e}", exc_info=True)
            raise

    async def generate_map_draft(self, db_session: AsyncSession, project_id: uuid.UUID):
        """AI를 사용하여 캐릭터와 관계도 초안을 한 번에 생성"""
        logger.info(f"Executing generate_map_draft for project_id: {project_id}...")
        try:
            from app.domain.models import ProjectModel, SourceModel, CharacterModel, CanvasBoardModel, CanvasNodeModel, CanvasEdgeModel
            from app.application.services.ai_service import AIService
            
            # 1. 프로젝트 정보 가져오기
            stmt = select(ProjectModel).where(ProjectModel.id == project_id)
            result = await db_session.execute(stmt)
            project = result.scalar_one_or_none()
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
            
            # 2. 연결된 소스에서 인물 정보 추출 (최대한 토큰 아끼기)
            sources_context = []
            if project.linked_sources:
                s_stmt = select(SourceModel).where(SourceModel.id.in_(project.linked_sources))
                s_res = await db_session.execute(s_stmt)
                sources = s_res.scalars().all()
                for s in sources:
                    # 메타데이터에 추출된 인물 정보가 있다면 그것만 사용
                    people = s.source_metadata.get("people", [])
                    if people:
                        sources_context.append({"source_title": s.title, "people_found": people})
                    else:
                        # 없으면 요약이라도 활용
                        sources_context.append({"source_title": s.title, "summary": s.summary})

            # 3. AI 서비스 호출 준비 (컨텍스트 구성)
            project_context = {
                "title": project.title,
                "format": project.format,
                "genre": project.genre,
                "atmosphere": project.atmosphere,
                "intended_purpose": project.intended_purpose,
                "core_conflict": project.core_conflict,
                "theme": project.theme
            }
            
            # 4. 보드 확인 및 고정 데이터 조회
            b_res = await db_session.execute(select(CanvasBoardModel).where(CanvasBoardModel.project_id == project_id))
            board = b_res.scalar_one_or_none()
            if not board:
                board = CanvasBoardModel(project_id=project_id, title="인물 관계도")
                db_session.add(board)
                await db_session.flush()

            # 고정된 캐릭터 조회
            locked_chars_query = select(CharacterModel).where(
                CharacterModel.project_id == project_id,
                CharacterModel.is_locked == True
            )
            locked_chars_result = await db_session.execute(locked_chars_query)
            locked_chars = locked_chars_result.scalars().all()
            locked_ids = [c.id for c in locked_chars]
            
            # 삭제 대상 정리
            # 고정되지 않은 캐릭터 삭제
            await db_session.execute(
                delete(CharacterModel).where(
                    CharacterModel.project_id == project_id,
                    CharacterModel.is_locked == False
                )
            )
            # 모든 엣지 삭제 (관계는 매번 새로 생성)
            await db_session.execute(delete(CanvasEdgeModel).where(CanvasEdgeModel.board_id == board.id))
            # 고정되지 않은 캐릭터 노드 및 관계 노드 삭제
            from sqlalchemy import not_
            await db_session.execute(
                delete(CanvasNodeModel).where(
                    CanvasNodeModel.board_id == board.id,
                    not_(CanvasNodeModel.id.in_(locked_ids))
                )
            )
            await db_session.flush()
            
            # 5. AI 호출 (고정 캐릭터 컨텍스트 포함)
            fixed_chars_dict = [
                {"name": c.name, "role": c.role, "description": c.description} 
                for c in locked_chars
            ]
            
            from app.application.services.ai_service import AIService
            ai_service = AIService()
            ai_result = await ai_service.generate_map_draft(
                project_context=project_context,
                sources_context=sources_context,
                fixed_characters=fixed_chars_dict
            )
            
            # 6. 캐릭터 생성 및 매핑
            char_map = {c.name.strip(): c for c in locked_chars}
            nodes_info = [] # 최종 반환용 노드 리스트
            
            # 기존 고정 노드 정보 nodes_info 리스트에 먼저 추가
            locked_nodes_query = select(CanvasNodeModel).where(CanvasNodeModel.id.in_(locked_ids))
            locked_nodes_result = await db_session.execute(locked_nodes_query)
            for ln in locked_nodes_result.scalars().all():
                char = next((c for c in locked_chars if c.id == ln.id), None)
                nodes_info.append({
                    "id": str(ln.id),
                    "type": ln.type,
                    "position": {"x": ln.position_x, "y": ln.position_y},
                    "data": {**ln.data, "isLocked": char.is_locked if char else True}
                })

            for i, c_data in enumerate(ai_result.get("characters", [])):
                name = c_data.get("name", "").strip()
                if not name: continue
                
                # 이미 고정된 캐릭터라면 건너뜀 (이미 char_map에 있음)
                if name in char_map:
                    continue
                    
                new_char = CharacterModel(
                    id=uuid.uuid4(),
                    project_id=project_id,
                    name=name,
                    age=c_data.get("age"),
                    gender=c_data.get("gender", "미설정"),
                    role=c_data.get("role", "조연"),
                    occupation=c_data.get("occupation"),
                    description=c_data.get("description"),
                    internal_desire=c_data.get("internal_desire"),
                    external_conflict=c_data.get("external_conflict"),
                    is_locked=False
                )
                db_session.add(new_char)
                char_map[name] = new_char
                
                # 새 캐릭터 노드 배치 (원형 배치)
                angle = (i * 2 * math.pi) / max(len(ai_result.get("characters", [])), 1)
                radius = 300
                px = 500 + radius * math.cos(angle)
                py = 300 + radius * math.sin(angle)
                
                node = CanvasNodeModel(
                    id=new_char.id,
                    board_id=board.id,
                    type="characterNode",
                    position_x=px,
                    position_y=py,
                    data={"label": new_char.name, "isLocked": False, "isDarkMode": False}
                )
                db_session.add(node)
                nodes_info.append({
                    "id": str(node.id),
                    "type": node.type,
                    "position": {"x": node.position_x, "y": node.position_y},
                    "data": node.data
                })
                
            await db_session.flush()
                
            # 7. 직접적인 인물 간 엣지 생성 (라벨 포함)
            edges_info = []
            
            for r_data in ai_result.get("relationships", []):
                source_name = r_data.get("source", "").strip()
                target_name = r_data.get("target", "").strip()
                relation_label = r_data.get("relation", "관계").strip()
                description = r_data.get("description", "").strip()
                
                if source_name in char_map and target_name in char_map:
                    source_char = char_map[source_name]
                    target_char = char_map[target_name]
                    
                    edge_id = uuid.uuid4()
                    # 새 방식: 중간 노드 없이 직접 연결하고 데이터에 설명 포함
                    db_edge = CanvasEdgeModel(
                        id=edge_id,
                        board_id=board.id,
                        source_node_id=source_char.id,
                        target_node_id=target_char.id,
                        label=relation_label,
                        data={"label": relation_label, "description": description, "curvature": 0}
                    )
                    db_session.add(db_edge)
                    
                    edges_info.append({
                        "id": str(edge_id),
                        "source": str(source_char.id),
                        "target": str(target_char.id),
                        "type": "relationshipEdge", # 프론트엔드의 커스텀 엣지 타입
                        "label": relation_label,
                        "data": {"label": relation_label, "description": description, "curvature": 0},
                        "style": {"strokeWidth": 2, "stroke": "#a1a1aa"}
                    })
            
            await db_session.commit()
            
            return {
                "nodes": nodes_info,
                "edges": edges_info
            }
        except Exception as e:
            logger.error(f"Error in generate_map_draft: {e}", exc_info=True)
            raise
