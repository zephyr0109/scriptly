"""
[Architecture Point: Interface Layer - API Router]
클라이언트의 요청을 처리하고 서비스 계층으로 전달하는 API 라우터 계층입니다.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
import uuid
import logging

from app.domain.schemas import CanvasBoard, CanvasNode, CanvasEdge
from app.infrastructure.database import get_db
from app.application.services.insight_service import InsightService

router = APIRouter(prefix="/insight", tags=["Insight Lab"])
logger = logging.getLogger(__name__)
insight_service = InsightService()

# --- Board ---
@router.post("/board", response_model=CanvasBoard, status_code=status.HTTP_201_CREATED)
async def create_board(board: CanvasBoard, db: AsyncSession = Depends(get_db)):
    """새로운 캔버스 보드(연구 세션) 생성"""
    logger.info(f"API Request: create_board called for project_id: {board.project_id}")
    db_obj = await insight_service.create_board(db, board)
    return CanvasBoard.model_validate(db_obj)

@router.get("/boards/{project_id}", response_model=List[CanvasBoard])
async def get_boards(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """특정 프로젝트의 캔버스 보드 목록 조회"""
    logger.info(f"API Request: get_boards called for project_id: {project_id}")
    boards = await insight_service.get_boards(db, project_id)
    return [CanvasBoard.model_validate(b) for b in boards]

# --- Node ---
@router.post("/node", response_model=CanvasNode, status_code=status.HTTP_201_CREATED)
async def create_node(node: CanvasNode, db: AsyncSession = Depends(get_db)):
    """보관함에서 드래그하여 캔버스에 노드 생성"""
    logger.info(f"API Request: create_node called for board_id: {node.board_id}")
    db_obj = await insight_service.create_node(db, node)
    return CanvasNode.model_validate(db_obj)

@router.get("/nodes/{board_id}", response_model=List[CanvasNode])
async def get_nodes(board_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """해당 보드의 모든 노드 포지션/데이터 조회"""
    logger.info(f"API Request: get_nodes called for board_id: {board_id}")
    nodes = await insight_service.get_nodes(db, board_id)
    return [CanvasNode.model_validate(n) for n in nodes]

@router.patch("/node/{node_id}", response_model=CanvasNode)
async def update_node(node_id: uuid.UUID, node_data: dict, db: AsyncSession = Depends(get_db)):
    """노드 이동, 리사이즈, 데이터 등 실시간 수정"""
    logger.info(f"API Request: update_node called for node_id: {node_id}")
    db_obj = await insight_service.update_node(db, node_id, node_data)
    if not db_obj: raise HTTPException(status_code=404, detail="Node not found")
    return CanvasNode.model_validate(db_obj)

@router.delete("/node/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_node(node_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """노드 삭제 (보관함 원본은 유지됨)"""
    logger.info(f"API Request: delete_node called for node_id: {node_id}")
    await insight_service.delete_node(db, node_id)
    return None

# --- Edge ---
@router.post("/edge", response_model=CanvasEdge, status_code=status.HTTP_201_CREATED)
async def create_edge(edge: CanvasEdge, db: AsyncSession = Depends(get_db)):
    """노드 간 수동 연결선(Edge) 생성"""
    logger.info(f"API Request: create_edge called for board_id: {edge.board_id}")
    db_obj = await insight_service.create_edge(db, edge)
    return CanvasEdge.model_validate(db_obj)

@router.get("/edges/{board_id}", response_model=List[CanvasEdge])
async def get_edges(board_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """해당 보드의 모든 연결선 조회"""
    logger.info(f"API Request: get_edges called for board_id: {board_id}")
    edges = await insight_service.get_edges(db, board_id)
    return [CanvasEdge.model_validate(e) for e in edges]

@router.patch("/edge/{edge_id}", response_model=CanvasEdge)
async def update_edge(edge_id: uuid.UUID, edge_data: dict, db: AsyncSession = Depends(get_db)):
    """Edge의 라벨(작가의 관계 메모) 등 수정"""
    logger.info(f"API Request: update_edge called for edge_id: {edge_id}")
    db_obj = await insight_service.update_edge(db, edge_id, edge_data)
    if not db_obj: raise HTTPException(status_code=404, detail="Edge not found")
    return CanvasEdge.model_validate(db_obj)

@router.delete("/edge/{edge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_edge(edge_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """연결선 삭제"""
    logger.info(f"API Request: delete_edge called for edge_id: {edge_id}")
    await insight_service.delete_edge(db, edge_id)
    return None

@router.post("/session/{board_id}")
async def save_session(board_id: uuid.UUID, payload: dict, db: AsyncSession = Depends(get_db)):
    """현재 캔버스의 모든 노드와 엣지 상태를 통째로 저장"""
    logger.info(f"API Request: save_session called for board_id: {board_id}")
    nodes_data = payload.get("nodes", [])
    edges_data = payload.get("edges", [])
    
    nodes = [CanvasNode(**n) for n in nodes_data]
    edges = [CanvasEdge(**e) for e in edges_data]
    
    await insight_service.save_session(db, board_id, nodes, edges)
    return {"status": "success"}

@router.post("/generate-map-draft/{project_id}")
async def generate_map_draft(project_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """AI를 사용하여 캐릭터와 관계도 초안을 한 번에 생성 및 DB 저장"""
    logger.info(f"API Request: generate_map_draft called for project_id: {project_id}")
    try:
        result = await insight_service.generate_map_draft(db, project_id)
        return result
    except Exception as e:
        logger.error(f"Error in generate_map_draft: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# --- On-Demand AI ---
@router.post("/synthesize-on-demand")
async def synthesize_on_demand(
    payload: dict, # { "node_ids": ["..."], "instruction": "..." }
    db: AsyncSession = Depends(get_db)
):
    """(작가의 명시적 호출 시) 선택한 카드들을 모아 AI 초안 생성"""
    logger.info("API Request: synthesize_on_demand called")
    node_ids = payload.get("node_ids", [])
    source_ids = payload.get("source_ids", [])
    instruction = payload.get("instruction", "")
    genre = payload.get("genre", "드라마")
    tone = payload.get("tone", "진지한")
    
    node_uuids = [uuid.UUID(nid) for nid in node_ids] if node_ids else None
    source_uuids = [uuid.UUID(sid) for sid in source_ids] if source_ids else None
        
    result = await insight_service.synthesize_on_demand(db, node_uuids, instruction, source_uuids, genre, tone)
    return result
