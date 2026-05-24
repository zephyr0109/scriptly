"""
[Architecture Point: Interface Layer - API Router]
클라이언트의 요청을 처리하고 서비스 계층으로 전달하는 API 라우터 계층입니다.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any
import uuid
import logging

from app.domain.schemas import CanvasBoard, CanvasNode, CanvasEdge, UserRole
from app.infrastructure.database import get_db
from app.domain.models import ProjectModel, UserModel, CanvasBoardModel, CanvasNodeModel, CanvasEdgeModel, SourceModel
from app.application.services.insight_service import InsightService
from app.application.services.auth_service import AuthService

router = APIRouter(prefix="/insight", tags=["Insight Lab"])
logger = logging.getLogger(__name__)
insight_service = InsightService()

# --- 권한 도우미 ---
async def verify_project_access(project_id: uuid.UUID, current_user: UserModel, db: AsyncSession):
    """특정 프로젝트에 대한 사용자의 접근 권한을 확인합니다."""
    stmt = select(ProjectModel).where(ProjectModel.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if current_user.role != UserRole.ADMIN and project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="프로젝트에 대한 권한이 없습니다.")
    return project

async def verify_board_access(board_id: uuid.UUID, current_user: UserModel, db: AsyncSession):
    """보드 소유권을 확인합니다 (프로젝트를 통해)."""
    stmt = select(CanvasBoardModel).where(CanvasBoardModel.id == board_id)
    result = await db.execute(stmt)
    board = result.scalar_one_or_none()
    
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    await verify_project_access(board.project_id, current_user, db)
    return board

# --- Board ---
@router.post("/board", response_model=CanvasBoard, status_code=status.HTTP_201_CREATED)
async def create_board(
    board: CanvasBoard, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """새로운 캔버스 보드 생성"""
    await verify_project_access(board.project_id, current_user, db)
    db_obj = await insight_service.create_board(db, board)
    return CanvasBoard.model_validate(db_obj)

@router.get("/boards/{project_id}", response_model=List[CanvasBoard])
async def get_boards(
    project_id: uuid.UUID, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """프로젝트 보드 목록 조회"""
    await verify_project_access(project_id, current_user, db)
    boards = await insight_service.get_boards(db, project_id)
    return [CanvasBoard.model_validate(b) for b in boards]

# --- Node ---
@router.post("/node", response_model=CanvasNode, status_code=status.HTTP_201_CREATED)
async def create_node(
    node: CanvasNode, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """캔버스 노드 생성"""
    await verify_board_access(node.board_id, current_user, db)
    db_obj = await insight_service.create_node(db, node)
    return CanvasNode.model_validate(db_obj)

@router.get("/nodes/{board_id}", response_model=List[CanvasNode])
async def get_nodes(
    board_id: uuid.UUID, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """보드 노드 조회"""
    await verify_board_access(board_id, current_user, db)
    nodes = await insight_service.get_nodes(db, board_id)
    return [CanvasNode.model_validate(n) for n in nodes]

@router.patch("/node/{node_id}", response_model=CanvasNode)
async def update_node(
    node_id: uuid.UUID, 
    node_data: dict, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """노드 수정"""
    # 노드 -> 보드 -> 프로젝트 권한 확인
    stmt = select(CanvasNodeModel).where(CanvasNodeModel.id == node_id)
    result = await db.execute(stmt)
    node = result.scalar_one_or_none()
    if not node: raise HTTPException(status_code=404, detail="Node not found")
    await verify_board_access(node.board_id, current_user, db)
    
    db_obj = await insight_service.update_node(db, node_id, node_data)
    return CanvasNode.model_validate(db_obj)

@router.delete("/node/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_node(
    node_id: uuid.UUID, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """노드 삭제"""
    stmt = select(CanvasNodeModel).where(CanvasNodeModel.id == node_id)
    result = await db.execute(stmt)
    node = result.scalar_one_or_none()
    if not node: return None
    await verify_board_access(node.board_id, current_user, db)
    
    await insight_service.delete_node(db, node_id)
    return None

# --- Edge ---
@router.post("/edge", response_model=CanvasEdge, status_code=status.HTTP_201_CREATED)
async def create_edge(
    edge: CanvasEdge, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """연결선 생성"""
    await verify_board_access(edge.board_id, current_user, db)
    db_obj = await insight_service.create_edge(db, edge)
    return CanvasEdge.model_validate(db_obj)

@router.get("/edges/{board_id}", response_model=List[CanvasEdge])
async def get_edges(
    board_id: uuid.UUID, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """연결선 조회"""
    await verify_board_access(board_id, current_user, db)
    edges = await insight_service.get_edges(db, board_id)
    return [CanvasEdge.model_validate(e) for e in edges]

@router.patch("/edge/{edge_id}", response_model=CanvasEdge)
async def update_edge(
    edge_id: uuid.UUID, 
    edge_data: dict, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """연결선 수정"""
    stmt = select(CanvasEdgeModel).where(CanvasEdgeModel.id == edge_id)
    result = await db.execute(stmt)
    edge = result.scalar_one_or_none()
    if not edge: raise HTTPException(status_code=404, detail="Edge not found")
    await verify_board_access(edge.board_id, current_user, db)
    
    db_obj = await insight_service.update_edge(db, edge_id, edge_data)
    return CanvasEdge.model_validate(db_obj)

@router.delete("/edge/{edge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_edge(
    edge_id: uuid.UUID, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """연결선 삭제"""
    stmt = select(CanvasEdgeModel).where(CanvasEdgeModel.id == edge_id)
    result = await db.execute(stmt)
    edge = result.scalar_one_or_none()
    if not edge: return None
    await verify_board_access(edge.board_id, current_user, db)
    
    await insight_service.delete_edge(db, edge_id)
    return None

@router.post("/session/{board_id}")
async def save_session(
    board_id: uuid.UUID, 
    payload: dict, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """세션 저장"""
    await verify_board_access(board_id, current_user, db)
    nodes_data = payload.get("nodes", [])
    edges_data = payload.get("edges", [])
    nodes = [CanvasNode(**n) for n in nodes_data]
    edges = [CanvasEdge(**e) for e in edges_data]
    await insight_service.save_session(db, board_id, nodes, edges)
    return {"status": "success"}

@router.post("/generate-map-draft/{project_id}")
async def generate_map_draft(
    project_id: uuid.UUID, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """AI를 통한 초안 생성"""
    await verify_project_access(project_id, current_user, db)
    try:
        result = await insight_service.generate_map_draft(db, project_id)
        return result
    except Exception as e:
        logger.error(f"Error in generate_map_draft: {e}")
        raise HTTPException(status_code=500, detail="AI 초안 생성 실패")

@router.post("/synthesize-on-demand")
async def synthesize_on_demand(
    payload: dict,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """AI 합성 (선택된 노드 및 소스 권한 검증 포함)"""
    logger.info(f"API Request: synthesize_on_demand by user: {current_user.id}")
    node_ids = payload.get("node_ids", [])
    source_ids = payload.get("source_ids", [])
    instruction = payload.get("instruction", "")
    genre = payload.get("genre", "드라마")
    tone = payload.get("tone", "진지한")
    
    node_uuids = [uuid.UUID(nid) for nid in node_ids] if node_ids else None
    source_uuids = [uuid.UUID(sid) for sid in source_ids] if source_ids else None
    
    if current_user.role != UserRole.ADMIN:
        # 1. 노드 권한 확인 (각 노드가 속한 보드/프로젝트가 현재 사용자의 것인지 검증)
        if node_uuids:
            stmt = select(CanvasNodeModel).where(CanvasNodeModel.id.in_(node_uuids))
            res = await db.execute(stmt)
            nodes = res.scalars().all()
            if len(nodes) != len(node_uuids):
                raise HTTPException(status_code=404, detail="일부 노드를 찾을 수 없습니다.")
            
            board_ids = {n.board_id for n in nodes}
            for bid in board_ids:
                await verify_board_access(bid, current_user, db)
                
        # 2. 직접 전달된 소스 권한 확인
        if source_uuids:
            stmt = select(SourceModel).where(SourceModel.id.in_(source_uuids))
            res = await db.execute(stmt)
            sources = res.scalars().all()
            if len(sources) != len(source_uuids):
                raise HTTPException(status_code=404, detail="일부 영감 자료를 찾을 수 없습니다.")
            
            for s in sources:
                if s.user_id != current_user.id:
                    raise HTTPException(status_code=403, detail="요청한 영감 자료에 대한 권한이 없습니다.")
        
    result = await insight_service.synthesize_on_demand(db, node_uuids, instruction, source_uuids, genre, tone)
    return result
