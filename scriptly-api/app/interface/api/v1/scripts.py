"""
[Architecture Point: Interface Layer - API Router]
클라이언트의 요청을 처리하고 서비스 계층으로 전달하는 API 라우터 계층 중 대본(Script) 영역입니다.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional
import uuid
import logging

from app.domain.schemas import ScriptCreate, ScriptRead, ScriptUpdate, UserRole
from app.infrastructure.database import get_db
from app.domain.models import ScriptModel, ProjectModel, UserModel
from app.application.services.auth_service import AuthService

router = APIRouter(prefix="/scripts", tags=["Scripts"])
logger = logging.getLogger(__name__)

# --- 권한 도우미 ---
async def get_script_for_user(script_id: uuid.UUID, current_user: UserModel, db: AsyncSession) -> ScriptModel:
    """특정 대본을 가져오고 소유권을 검증합니다."""
    stmt = select(ScriptModel).where(ScriptModel.id == script_id)
    result = await db.execute(stmt)
    script = result.scalar_one_or_none()
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="대본을 찾을 수 없습니다."
        )
    
    # 관리자가 아니며 소유자가 다른 경우
    if current_user.role != UserRole.ADMIN and script.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="해당 대본에 대한 권한이 없습니다."
        )
    return script

async def verify_project_access(project_id: uuid.UUID, current_user: UserModel, db: AsyncSession) -> ProjectModel:
    """프로젝트가 존재하고 현재 로그인 사용자의 소유인지 확인합니다."""
    stmt = select(ProjectModel).where(ProjectModel.id == project_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="프로젝트를 찾을 수 없습니다."
        )
    if current_user.role != UserRole.ADMIN and project.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="프로젝트에 대한 권한이 없습니다."
        )
    return project

# --- API Endpoints ---

@router.post("", response_model=ScriptRead, status_code=status.HTTP_201_CREATED)
async def create_script(
    script_in: ScriptCreate, 
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    신규 대본 생성
    
    해당 프로젝트의 존재 유무 및 사용자 소유권을 확인한 후,
    신규 대본 정보를 DB에 보관합니다. 작성자(user_id) 정보는 로그인 정보에서 자동 매핑됩니다.
    """
    await verify_project_access(script_in.project_id, current_user, db)
    
    db_obj = ScriptModel(
        project_id=script_in.project_id,
        user_id=current_user.id,
        title=script_in.title,
        episode_number=script_in.episode_number,
        content=script_in.content
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return ScriptRead.model_validate(db_obj)

@router.get("", response_model=List[ScriptRead])
async def list_scripts(
    project_id: Optional[uuid.UUID] = None,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    대본 목록 조회
    
    현재 로그인한 작가의 전체 대본 목록을 조회하며,
    특정 프로젝트 아이디(project_id)가 제공되면 해당 프로젝트 대본만 필터링하여 반환합니다.
    회차(episode_number) 오름차순으로 우선 정렬됩니다.
    """
    stmt = select(ScriptModel).where(ScriptModel.user_id == current_user.id)
    if project_id:
        # 입력된 project_id가 본인 것인지 먼저 검증
        await verify_project_access(project_id, current_user, db)
        stmt = stmt.where(ScriptModel.project_id == project_id)
        
    stmt = stmt.order_by(ScriptModel.episode_number.asc(), ScriptModel.created_at.asc())
    result = await db.execute(stmt)
    return [ScriptRead.model_validate(s) for s in result.scalars().all()]

@router.get("/{script_id}", response_model=ScriptRead)
async def get_script(
    script_id: uuid.UUID,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    단일 대본 상세 조회
    
    지정한 대본의 상세 정보를 불러옵니다.
    타인의 대본을 훔쳐보는 행위는 권한 검증에 의해 403 Forbidden 차단됩니다.
    """
    script = await get_script_for_user(script_id, current_user, db)
    return ScriptRead.model_validate(script)

@router.patch("/{script_id}", response_model=ScriptRead)
async def update_script(
    script_id: uuid.UUID,
    script_in: ScriptUpdate,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    대본 수정
    
    대본의 제목, 회차 번호, 혹은 본문 Markdown 텍스트를 실시간으로 부분 또는 전체 수정합니다.
    """
    db_obj = await get_script_for_user(script_id, current_user, db)
    
    update_data = script_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_obj, key, value)
        
    await db.commit()
    await db.refresh(db_obj)
    return ScriptRead.model_validate(db_obj)

@router.delete("/{script_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_script(
    script_id: uuid.UUID,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    대본 영구 삭제
    
    해당 대본을 보관함 및 프로젝트 데이터베이스에서 영구 소멸시킵니다.
    """
    db_obj = await get_script_for_user(script_id, current_user, db)
    
    await db.delete(db_obj)
    await db.commit()
    return None

@router.get("/{script_id}/export")
async def export_script(
    script_id: uuid.UUID,
    format: str,
    current_user: UserModel = Depends(AuthService.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    대본 내보내기 (Word/PDF)
    
    지정한 형식(format)에 맞게 대본 데이터를 docx 또는 pdf 파일로 인코딩하여 즉시 다운로드 응답을 리턴합니다.
    """
    script = await get_script_for_user(script_id, current_user, db)
    
    from app.application.services.export_service import ExportService
    export_service = ExportService()
    
    if format.lower() in ["word", "docx"]:
        file_stream = export_service.generate_script_docx(script.title, script.content)
        filename = f"{script.title}.docx"
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif format.lower() == "pdf":
        file_stream = export_service.generate_script_pdf(script.title, script.content)
        filename = f"{script.title}.pdf"
        media_type = "application/pdf"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="지원하지 않는 내보내기 포맷입니다."
        )
        
    import urllib.parse
    from fastapi.responses import StreamingResponse
    
    encoded_filename = urllib.parse.quote(filename)
    headers = {
        "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"
    }
    return StreamingResponse(file_stream, media_type=media_type, headers=headers)

