"""
[Architecture Point: Domain Layer - Entity]
데이터베이스 엔티티를 정의하는 도메인 계층입니다. 필사 시 각 클래스의 관계(Relationship) 설정을 주의 깊게 확인하십시오.
"""
from sqlalchemy import Column, String, DateTime, func, JSON, Enum as SQLEnum, Text, Integer, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
import uuid
from app.infrastructure.database import Base
from app.domain.schemas import CardStatus, AnalysisStatus

class UserModel(Base):
    """시스템 사용자 정보"""
    __tablename__ = "users"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    role = Column(String(50), default="USER") # ADMIN, USER
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ScouterArticleModel(Base):
    """영감 스카우터(검색/트렌딩)용 임시 저장소 (공용 또는 사용자 필터링 가능)"""
    __tablename__ = "scouter_articles"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String(50), default="NEWS")
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    source_url = Column(String(1024), nullable=True)
    
    tension_score = Column(Integer, default=0)
    tension_reason = Column(Text, nullable=True)
    analysis_status = Column(String(50), default=AnalysisStatus.PENDING.value)
    
    source_metadata = Column(JSON, default=dict)
    
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class SourceModel(Base):
    """영감 보관함(Archive) 전용 테이블"""
    __tablename__ = "sources"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True) # 기존 데이터 호환을 위해 일단 nullable=True
    
    type = Column(String(50), nullable=False) # NEWS, FILE, NOTE
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    source_url = Column(String(1024), nullable=True)
    
    file_path = Column(String(512), nullable=True)
    original_filename = Column(String(255), nullable=True)
    
    tension_score = Column(Integer, default=0)
    tension_reason = Column(Text, nullable=True)
    analysis_status = Column(String(50), default=AnalysisStatus.PENDING.value)
    
    published_at = Column(DateTime(timezone=True), nullable=True)
    folder = Column(String(100), nullable=True)
    source_metadata = Column(JSON, default=dict)
    
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ProjectModel(Base):
    """드라마/영화 창작 프로젝트의 핵심 단위"""
    __tablename__ = "projects"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True) # 기존 데이터 호환을 위해 일단 nullable=True
    
    title = Column(String(255), nullable=False)
    
    # 1. 기획 메타데이터
    format = Column(String(100), nullable=True) # 단막극, 16부작, 영화 등
    genre = Column(String(100), nullable=True)
    atmosphere = Column(String(255), nullable=True)
    
    # 2. 핵심 설정
    intended_purpose = Column(Text, nullable=True) # 기획의도
    core_conflict = Column(Text, nullable=True)
    theme = Column(Text, nullable=True)
    
    # 3. 작품 결과물 (시놉시스)
    logline = Column(Text, nullable=True)
    full_synopsis = Column(Text, nullable=True)
    
    # 4. 연결된 데이터
    linked_sources = Column(JSON, default=list) # [UUID, UUID, ...]
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class CanvasBoardModel(Base):
    """인사이트 연구소 캔버스 (인물 관계도 용도)"""
    __tablename__ = "canvas_boards"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(PG_UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), default="인물 관계도")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class CanvasNodeModel(Base):
    """캔버스 위의 개별 노드"""
    __tablename__ = "canvas_nodes"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    board_id = Column(PG_UUID(as_uuid=True), ForeignKey("canvas_boards.id", ondelete="CASCADE"), nullable=False)
    
    type = Column(String(50), default="SOURCE_CARD")
    ref_source_id = Column(PG_UUID(as_uuid=True), ForeignKey("sources.id"), nullable=True)
    
    position_x = Column(Integer, default=0)
    position_y = Column(Integer, default=0)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    
    data = Column(JSON, default=dict)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ProjectEventModel(Base):
    """프로젝트 내 주요 사건 (표/타임라인 형식용)"""
    __tablename__ = "project_events"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(PG_UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    sequence = Column(Integer, default=0) # 드래그 앤 드롭 순서
    time_hint = Column(String(100), nullable=True) # 사건 발생 시간 (e.g. 오전, 1일차 등)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True) # 사건 상세 내용
    
    related_character_ids = Column(JSON, default=list) # 관련 인물 ID 리스트 [UUID, ...]
    event_metadata = Column(JSON, default=dict)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class CanvasEdgeModel(Base):
    """캔버스 위의 노드 간 연결선"""
    __tablename__ = "canvas_edges"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    board_id = Column(PG_UUID(as_uuid=True), ForeignKey("canvas_boards.id", ondelete="CASCADE"), nullable=False)
    
    source_node_id = Column(PG_UUID(as_uuid=True), ForeignKey("canvas_nodes.id", ondelete="CASCADE"), nullable=False)
    target_node_id = Column(PG_UUID(as_uuid=True), ForeignKey("canvas_nodes.id", ondelete="CASCADE"), nullable=False)
    
    label = Column(String(255), nullable=True)
    style = Column(JSON, default=dict)
    data = Column(JSON, default=dict)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class InspirationCardModel(Base):
    """드라마 기획안 고도화 버전 (이전 버전 호용용 또는 시놉시스 최종본)"""
    __tablename__ = "inspiration_cards"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(PG_UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    status = Column(String(50), default=CardStatus.DRAFTING.value)
    
    # ... 이전 코드와 호환을 위해 남겨둠 (필요시 통합)
    creative_direction = Column(JSON, default=dict)
    logline = Column(Text, nullable=True)
    full_synopsis = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class CharacterModel(Base):
    """프로젝트 내 캐릭터 설정"""
    __tablename__ = "characters"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(PG_UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(100), nullable=False)
    age = Column(String(50), nullable=True)
    gender = Column(String(50), nullable=True)
    role = Column(String(50), nullable=True) # 주연, 단역 등
    occupation = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    
    internal_desire = Column(Text, nullable=True)
    external_conflict = Column(Text, nullable=True)
    is_locked = Column(Boolean, default=False)
    
    # UI 구성을 위한 추가 메타데이터
    image_url = Column(String(512), nullable=True)
    char_metadata = Column(JSON, default=dict)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class ScriptModel(Base):
    """드라마 프로젝트 회차별 대본 데이터"""
    __tablename__ = "scripts"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(PG_UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    title = Column(String(255), nullable=False)
    episode_number = Column(Integer, default=1)
    content = Column(Text, nullable=False, default="")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class WorldStageModel(Base):
    """시공간 무대 엔티티"""
    __tablename__ = "world_stages"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(PG_UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    era = Column(String(100), nullable=True)
    parent_id = Column(PG_UUID(as_uuid=True), nullable=True) # Soft Relation
    description = Column(Text, nullable=True)
    atmosphere = Column(Text, nullable=True)
    technology_level = Column(String(255), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class WorldFactionModel(Base):
    """세력/집단 엔티티"""
    __tablename__ = "world_factions"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(PG_UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=True)
    ideology_goal = Column(Text, nullable=True)
    base_stage_id = Column(PG_UUID(as_uuid=True), nullable=True) # Soft Relation
    scale_status = Column(Text, nullable=True)
    hierarchy = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class WorldRuleCultureModel(Base):
    """사회 제도 / 문화 관습 엔티티"""
    __tablename__ = "world_rules_cultures"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(PG_UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False) # 'RULE', 'CULTURE'
    scope_stage_id = Column(PG_UUID(as_uuid=True), nullable=True) # Soft Relation
    scope_faction_id = Column(PG_UUID(as_uuid=True), nullable=True) # Soft Relation
    content = Column(Text, nullable=True)
    impact = Column(Text, nullable=True)
    exceptions = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class WorldGlossaryModel(Base):
    """작품 용어 사전 엔티티"""
    __tablename__ = "world_glossary"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(PG_UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    term = Column(String(255), nullable=False)
    definition = Column(Text, nullable=True)
    usage_example = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class WorldNoteModel(Base):
    """세계관 자유 메모 엔티티"""
    __tablename__ = "world_notes"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(PG_UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
