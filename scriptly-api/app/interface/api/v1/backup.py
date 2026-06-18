"""
[Architecture Point: Interface Layer - API Router]
프로젝트의 전체 데이터를 JSON 포맷으로 백업 내보내기 및 가져오기(복원)를 담당하는 라우터입니다.
"""
import logging
import uuid
from datetime import datetime
from typing import Dict, Any
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

from app.infrastructure.database import get_db
from app.domain import models
from app.domain.models import (
    ProjectModel, CharacterModel, CanvasBoardModel, CanvasNodeModel, CanvasEdgeModel,
    ProjectEventModel, ScriptModel, WorldStageModel, WorldFactionModel,
    WorldRuleCultureModel, WorldGlossaryModel, WorldNoteModel, UserModel
)
from app.application.services.auth_service import AuthService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/backup", tags=["Backup & Restore"])

async def verify_project_ownership(project_id: uuid.UUID, current_user: UserModel, db: AsyncSession) -> ProjectModel:
    stmt = select(ProjectModel).where(ProjectModel.id == project_id)
    res = await db.execute(stmt)
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다.")
    if project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="프로젝트에 대한 권한이 없습니다.")
    return project

@router.get("/export/{project_id}")
async def export_project_backup(
    project_id: uuid.UUID,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """프로젝트 전체 데이터(세계관, 캐릭터, 플롯, 대본 포함)를 단일 백업 JSON 파일로 내보냅니다."""
    logger.info(f"Executing export_backup for project_id: {project_id}...")
    project = await verify_project_ownership(project_id, current_user, db)
    
    try:
        # 1. 캐릭터 리스트 수집
        char_res = await db.execute(select(CharacterModel).where(CharacterModel.project_id == project_id))
        characters = char_res.scalars().all()
        
        # 2. 인물 관계도 보드 및 노드/엣지 수집
        board_res = await db.execute(select(CanvasBoardModel).where(CanvasBoardModel.project_id == project_id))
        board = board_res.scalar_one_or_none()
        
        nodes_list = []
        edges_list = []
        board_data = None
        if board:
            board_data = {
                "title": board.title,
                "created_at": board.created_at.isoformat() if board.created_at else None,
                "updated_at": board.updated_at.isoformat() if board.updated_at else None
            }
            nodes_res = await db.execute(select(CanvasNodeModel).where(CanvasNodeModel.board_id == board.id))
            nodes_list = [
                {
                    "id": str(n.id),
                    "type": n.type,
                    "position_x": n.position_x,
                    "position_y": n.position_y,
                    "data": n.data,
                    "width": n.width,
                    "height": n.height
                }
                for n in nodes_res.scalars().all()
            ]
            edges_res = await db.execute(select(CanvasEdgeModel).where(CanvasEdgeModel.board_id == board.id))
            edges_list = [
                {
                    "id": str(e.id),
                    "source": str(e.source_node_id),
                    "target": str(e.target_node_id),
                    "label": e.label,
                    "style": e.style,
                    "data": e.data
                }
                for e in edges_res.scalars().all()
            ]
            
        # 3. 플롯 사건 타임라인 수집
        event_res = await db.execute(
            select(ProjectEventModel).where(ProjectEventModel.project_id == project_id).order_by(ProjectEventModel.sequence.asc())
        )
        plot_events = event_res.scalars().all()
        
        # 4. 회차별 대본 수집
        script_res = await db.execute(
            select(ScriptModel).where(ScriptModel.project_id == project_id).order_by(ScriptModel.episode_number.asc())
        )
        scripts = script_res.scalars().all()
        
        # 5. 세계관 5대 테이블 데이터 수집
        stages_res = await db.execute(select(WorldStageModel).where(WorldStageModel.project_id == project_id))
        factions_res = await db.execute(select(WorldFactionModel).where(WorldFactionModel.project_id == project_id))
        rules_res = await db.execute(select(WorldRuleCultureModel).where(WorldRuleCultureModel.project_id == project_id))
        glossaries_res = await db.execute(select(WorldGlossaryModel).where(WorldGlossaryModel.project_id == project_id))
        notes_res = await db.execute(select(WorldNoteModel).where(WorldNoteModel.project_id == project_id))
        
        # JSON 직렬화용 패키징
        backup_data = {
            "backup_version": "1.0",
            "exported_at": datetime.utcnow().isoformat() + "Z",
            "project": {
                "title": project.title,
                "genre": project.genre,
                "logline": project.logline,
                "intended_purpose": project.intended_purpose,
                "core_conflict": project.core_conflict,
                "theme": project.theme,
                "atmosphere": project.atmosphere,
                "format": project.format,
                "linked_sources": project.linked_sources or []
            },
            "characters": [
                {
                    "id": str(c.id),
                    "name": c.name,
                    "role": c.role,
                    "description": c.description,
                    "internal_desire": c.internal_desire,
                    "external_conflict": c.external_conflict,
                    "age": c.age,
                    "gender": c.gender,
                    "occupation": c.occupation,
                    "is_locked": c.is_locked,
                    "image_url": c.image_url,
                    "char_metadata": c.char_metadata
                }
                for c in characters
            ],
            "canvas_board": board_data,
            "canvas_nodes": nodes_list,
            "canvas_edges": edges_list,
            "plot_events": [
                {
                    "sequence": ev.sequence,
                    "time_hint": ev.time_hint,
                    "title": ev.title,
                    "content": ev.content,
                    "related_character_ids": ev.related_character_ids or []
                }
                for ev in plot_events
            ],
            "scripts": [
                {
                    "title": sc.title,
                    "episode_number": sc.episode_number,
                    "content": sc.content
                }
                for sc in scripts
            ],
            "world_building": {
                "stages": [
                    {
                        "id": str(st.id),
                        "name": st.name,
                        "era": st.era,
                        "parent_id": str(st.parent_id) if st.parent_id else None,
                        "description": st.description,
                        "atmosphere": st.atmosphere,
                        "technology_level": st.technology_level
                    }
                    for st in stages_res.scalars().all()
                ],
                "factions": [
                    {
                        "id": str(fa.id),
                        "name": fa.name,
                        "type": fa.type,
                        "ideology_goal": fa.ideology_goal,
                        "base_stage_id": str(fa.base_stage_id) if fa.base_stage_id else None,
                        "scale_status": fa.scale_status,
                        "hierarchy": fa.hierarchy,
                        "description": fa.description
                    }
                    for fa in factions_res.scalars().all()
                ],
                "rules_cultures": [
                    {
                        "name": rc.name,
                        "type": rc.type,
                        "scope_stage_id": str(rc.scope_stage_id) if rc.scope_stage_id else None,
                        "scope_faction_id": str(rc.scope_faction_id) if rc.scope_faction_id else None,
                        "content": rc.content,
                        "impact": rc.impact,
                        "exceptions": rc.exceptions
                    }
                    for rc in rules_res.scalars().all()
                ],
                "glossaries": [
                    {
                        "term": gl.term,
                        "definition": gl.definition,
                        "usage_example": gl.usage_example
                    }
                    for gl in glossaries_res.scalars().all()
                ],
                "notes": [
                    {
                        "title": no.title,
                        "content": no.content
                    }
                    for no in notes_res.scalars().all()
                ]
            }
        }
        
        filename = f"scriptly_backup_{project.title}_{datetime.now().strftime('%Y%m%d')}.json"
        headers = {
            "Content-Disposition": f"attachment; filename*=UTF-8''{quote(filename)}"
        }
        return JSONResponse(content=backup_data, headers=headers)
    except Exception as e:
        logger.error(f"Error in export_project_backup: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"백업 내보내기 중 서버 오류가 발생했습니다: {str(e)}")

@router.post("/import", status_code=status.HTTP_201_CREATED)
async def import_project_backup(
    backup_data: Dict[str, Any],
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """업로드된 JSON 백업 데이터를 기반으로 새 프로젝트를 복원 생성합니다. 외래키 및 UUID는 정합성 있게 재매핑됩니다."""
    logger.info(f"Executing import_project_backup for user: {current_user.id}...")
    
    # 기본 스키마 검증
    if "project" not in backup_data or "backup_version" not in backup_data:
        raise HTTPException(status_code=400, detail="유효한 Scriptly 백업 데이터 파일이 아닙니다.")
        
    try:
        proj_data = backup_data["project"]
        
        # 1. 프로젝트 복원 생성
        new_project_id = uuid.uuid4()
        original_title = proj_data.get("title", "복원된 프로젝트")
        db_project = ProjectModel(
            id=new_project_id,
            user_id=current_user.id,
            title=f"{original_title} (복원됨)",
            genre=proj_data.get("genre"),
            logline=proj_data.get("logline"),
            intended_purpose=proj_data.get("intended_purpose"),
            core_conflict=proj_data.get("core_conflict"),
            theme=proj_data.get("theme"),
            atmosphere=proj_data.get("atmosphere"),
            format=proj_data.get("format"),
            linked_sources=proj_data.get("linked_sources", [])
        )
        db.add(db_project)
        await db.flush() # 부모 프로젝트를 즉시 플러시하여 외래키 부모 레코드를 확실히 존재하게 함

        
        # ID 재매핑용 딕셔너리 구성 (정합성 보장)
        char_id_map = {}      # {old_char_uuid_str: new_char_uuid}
        stage_id_map = {}     # {old_stage_uuid_str: new_stage_uuid}
        faction_id_map = {}   # {old_faction_uuid_str: new_faction_uuid}
        
        # 2. 캐릭터 리스트 복원 및 ID 매핑 수집
        for char in backup_data.get("characters", []):
            old_id_str = char.get("id")
            new_char_id = uuid.uuid4()
            if old_id_str:
                char_id_map[old_id_str.lower()] = new_char_id
                
            db_char = CharacterModel(
                id=new_char_id,
                project_id=new_project_id,
                name=char.get("name"),
                role=char.get("role", "주연"),
                description=char.get("description"),
                internal_desire=char.get("internal_desire"),
                external_conflict=char.get("external_conflict"),
                age=char.get("age", ""),
                gender=char.get("gender", ""),
                occupation=char.get("occupation", ""),
                is_locked=char.get("is_locked", False),
                image_url=char.get("image_url"),
                char_metadata=char.get("char_metadata", {})
            )
            db.add(db_char)
            
        # 3. 캔버스 보드 및 노드/엣지 복원 (매핑 처리)
        canvas_board_data = backup_data.get("canvas_board")
        if canvas_board_data:
            new_board_id = uuid.uuid4()
            db_board = CanvasBoardModel(
                id=new_board_id,
                project_id=new_project_id,
                title=canvas_board_data.get("title", "인물 관계도")
            )
            db.add(db_board)
            
            # 노드 복원
            for node in backup_data.get("canvas_nodes", []):
                old_node_id_str = node.get("id")
                # 캐릭터 노드의 경우 노드 ID가 구 캐릭터 ID와 일치할 수 있으므로 치환
                new_node_id = char_id_map.get(old_node_id_str.lower(), uuid.uuid4()) if old_node_id_str else uuid.uuid4()
                
                db_node = CanvasNodeModel(
                    id=new_node_id,
                    board_id=new_board_id,
                    type=node.get("type", "character"),
                    position_x=node.get("position_x", 0.0),
                    position_y=node.get("position_y", 0.0),
                    data=node.get("data", {}),
                    width=node.get("width"),
                    height=node.get("height")
                )
                db.add(db_node)
            
            # [CRITICAL FIX]: canvas_nodes를 먼저 확실히 flush하여 canvas_edges의 외래키 제약조건 위반을 예방
            await db.flush()
                
            # 엣지 복원 (source, target 치환)
            for edge in backup_data.get("canvas_edges", []):
                old_source_str = edge.get("source")
                old_target_str = edge.get("target")
                
                new_source = char_id_map.get(old_source_str.lower()) if old_source_str else None
                new_target = char_id_map.get(old_target_str.lower()) if old_target_str else None
                
                # 외래키 무결성 위반 방지를 위한 방어코드
                if not new_source or not new_target:
                    logger.warning(f"Skipping edge: source or target character not found in map. ({old_source_str} -> {old_target_str})")
                    continue
                
                db_edge = CanvasEdgeModel(
                    id=uuid.uuid4(),
                    board_id=new_board_id,
                    source_node_id=new_source,
                    target_node_id=new_target,
                    label=edge.get("label"),
                    style=edge.get("style", {}),
                    data=edge.get("data", {})
                )
                db.add(db_edge)
        else:
            # 보드 정보가 백업에 없어도 기본 관계도 보드는 자동 생성
            default_board = CanvasBoardModel(project_id=new_project_id, title="기본 인물 관계도")
            db.add(default_board)

        # 4. 플롯 타임라인 복원 (연동 캐릭터 ID 매핑 치환)
        for ev in backup_data.get("plot_events", []):
            old_char_ids = ev.get("related_character_ids", [])
            new_char_ids = []
            for ocid in old_char_ids:
                if ocid.lower() in char_id_map:
                    new_char_ids.append(str(char_id_map[ocid.lower()]))
                else:
                    new_char_ids.append(ocid)
                    
            db_event = ProjectEventModel(
                id=uuid.uuid4(),
                project_id=new_project_id,
                sequence=ev.get("sequence", 0),
                time_hint=ev.get("time_hint"),
                title=ev.get("title", "무제"),
                content=ev.get("content"),
                related_character_ids=new_char_ids
            )
            db.add(db_event)

        # 5. 회차별 대본 복원
        for sc in backup_data.get("scripts", []):
            db_script = ScriptModel(
                id=uuid.uuid4(),
                project_id=new_project_id,
                user_id=current_user.id,
                title=sc.get("title", "무제 회차"),
                episode_number=sc.get("episode_number", 1),
                content=sc.get("content", "")
            )
            db.add(db_script)

        # 6. 세계관 데이터 복원
        wb_data = backup_data.get("world_building", {})
        
        # A. 무대 복원
        for st in wb_data.get("stages", []):
            old_st_id = st.get("id")
            new_st_id = uuid.uuid4()
            if old_st_id:
                stage_id_map[old_st_id.lower()] = new_st_id
                
            db_stage = WorldStageModel(
                id=new_st_id,
                project_id=new_project_id,
                name=st.get("name"),
                era=st.get("era"),
                parent_id=None, # 아래에서 매핑 치환 예정
                description=st.get("description"),
                atmosphere=st.get("atmosphere"),
                technology_level=st.get("technology_level")
            )
            # parent_id 백업 상태 임시 기록용 (parent_id 복원은 아래 루프가 다 끝난 후 순차 처리 가능)
            db_stage.temp_old_parent_id = st.get("parent_id")
            db.add(db_stage)
            
        await db.flush() # stages의 ID 등록 보장을 위해 flush
        
        # B. 무대 parent_id 재매핑 처리
        stages_res = await db.execute(select(WorldStageModel).where(WorldStageModel.project_id == new_project_id))
        inserted_stages = stages_res.scalars().all()
        for ist in inserted_stages:
            old_parent = getattr(ist, "temp_old_parent_id", None)
            if old_parent and old_parent.lower() in stage_id_map:
                ist.parent_id = stage_id_map[old_parent.lower()]
            else:
                ist.parent_id = None
                
        # C. 세력 복원
        for fa in wb_data.get("factions", []):
            old_fa_id = fa.get("id")
            new_fa_id = uuid.uuid4()
            if old_fa_id:
                faction_id_map[old_fa_id.lower()] = new_fa_id
                
            old_base_stage = fa.get("base_stage_id")
            new_base_stage = stage_id_map.get(old_base_stage.lower()) if (old_base_stage and old_base_stage.lower() in stage_id_map) else None
            
            db_faction = WorldFactionModel(
                id=new_fa_id,
                project_id=new_project_id,
                name=fa.get("name"),
                type=fa.get("type"),
                ideology_goal=fa.get("ideology_goal"),
                base_stage_id=new_base_stage,
                scale_status=fa.get("scale_status"),
                hierarchy=fa.get("hierarchy"),
                description=fa.get("description")
            )
            db.add(db_faction)

        # D. 제도/문화 복원
        for rc in wb_data.get("rules_cultures", []):
            old_stage = rc.get("scope_stage_id")
            old_faction = rc.get("scope_faction_id")
            
            new_scope_stage = stage_id_map.get(old_stage.lower()) if (old_stage and old_stage.lower() in stage_id_map) else None
            new_scope_faction = faction_id_map.get(old_faction.lower()) if (old_faction and old_faction.lower() in faction_id_map) else None
            
            db_rc = WorldRuleCultureModel(
                id=uuid.uuid4(),
                project_id=new_project_id,
                name=rc.get("name"),
                type=rc.get("type"),
                scope_stage_id=new_scope_stage,
                scope_faction_id=new_scope_faction,
                content=rc.get("content"),
                impact=rc.get("impact"),
                exceptions=rc.get("exceptions")
            )
            db.add(db_rc)

        # E. 용어 사전 복원
        for gl in wb_data.get("glossaries", []):
            db_gl = WorldGlossaryModel(
                id=uuid.uuid4(),
                project_id=new_project_id,
                term=gl.get("term"),
                definition=gl.get("definition"),
                usage_example=gl.get("usage_example")
            )
            db.add(db_gl)

        # F. 자유 메모 복원
        for no in wb_data.get("notes", []):
            db_no = WorldNoteModel(
                id=uuid.uuid4(),
                project_id=new_project_id,
                title=no.get("title"),
                content=no.get("content")
            )
            db.add(db_no)

        await db.commit()
        return {"status": "success", "new_project_id": str(new_project_id)}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in import_project_backup: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"백업 데이터 복원 실패: {str(e)}")
