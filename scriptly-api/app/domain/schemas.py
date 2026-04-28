"""
[Architecture Point: Domain Layer - Schema]
데이터의 구조와 유효성 검사를 정의하는 Pydantic 스키마 계층입니다. 필사 시 데이터 검증(validator) 로직을 중점적으로 보십시오.
"""
from pydantic import BaseModel, HttpUrl, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID, uuid4
from enum import Enum

# --- Enums ---

class SourceType(str, Enum):
    NEWS = "NEWS"
    FILE = "FILE"
    NOTE = "NOTE"

class AnalysisStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class CardStatus(str, Enum):
    DRAFTING = "DRAFTING"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"

class ElementType(str, Enum):
    CONFLICT = "CONFLICT"
    DESIRE = "DESIRE"
    EVENT = "EVENT"

class RelationType(str, Enum):
    ENEMY = "ENEMY"
    ALLY = "ALLY"
    LOVER = "LOVER"
    FAMILY = "FAMILY"
    NEUTRAL = "NEUTRAL"

# --- Base Schemas ---

class DomainModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# --- Source & Elements ---

class Source(DomainModel):
    id: UUID = Field(default_factory=uuid4)
    type: SourceType
    title: str
    summary: Optional[str] = None
    content: str
    source_url: Optional[HttpUrl] = None
    file_path: Optional[str] = None
    original_filename: Optional[str] = None
    tension_score: int = Field(default=0, ge=0, le=100)
    tension_reason: Optional[str] = None
    analysis_status: AnalysisStatus = Field(default=AnalysisStatus.PENDING)
    published_at: Optional[datetime] = None
    ingested_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    source_metadata: Dict[str, Any] = Field(default_factory=dict)

class CanvasBoard(DomainModel):
    id: UUID = Field(default_factory=uuid4)
    project_id: UUID
    title: str
    updated_at: datetime = Field(default_factory=datetime.now)

class CanvasNode(DomainModel):
    id: UUID = Field(default_factory=uuid4)
    board_id: UUID
    type: str = "SOURCE_CARD"
    ref_source_id: Optional[UUID] = None
    position_x: int = 0
    position_y: int = 0
    width: Optional[int] = None
    height: Optional[int] = None
    data: Dict[str, Any] = Field(default_factory=dict)
    updated_at: datetime = Field(default_factory=datetime.now)

class CanvasEdge(DomainModel):
    id: UUID = Field(default_factory=uuid4)
    board_id: UUID
    source_node_id: UUID
    target_node_id: UUID
    label: Optional[str] = None
    style: Dict[str, Any] = Field(default_factory=dict)
    data: Dict[str, Any] = Field(default_factory=dict)
    updated_at: datetime = Field(default_factory=datetime.now)

# --- Legacy/Service Compatibility ---

class DetailedAnalysisResult(BaseModel):
    summary: str
    keywords: List[str]
    incidents: List[str]
    people: List[Dict[str, str]] 
    core_conflict: str
    atmosphere: str
    tension_score: int
    tension_reason: str
    world_building: Optional[str] = None # Legacy support

class NewsArticle(BaseModel):
    title: str
    link: HttpUrl
    description: str
    pubDate: str

class DramaticTensionScore(BaseModel):
    score: int
    reason: str
    potential_conflict: str

class CurationResult(BaseModel):
    article: NewsArticle
    tension_evaluation: DramaticTensionScore

class CharacterPersona(BaseModel):
    name: str
    role: str
    description: str
    internal_desire: str
    external_conflict: str

# --- AI Workflows (Batching & Status) ---

class BatchEvaluationResult(BaseModel):
    id: UUID
    tension_score: int
    tension_reason: str
    potential_conflict: str

class NewsStatusInfo(BaseModel):
    id: UUID
    analysis_status: AnalysisStatus
    tension_score: Optional[int] = None
    tension_reason: Optional[str] = None
    potential_conflict: Optional[str] = None
    detail_analysis: Optional[DetailedAnalysisResult] = None

class NewsStatusResponse(BaseModel):
    results: List[NewsStatusInfo]

# --- Projects & Cards ---

class InspirationCard(DomainModel):
    id: UUID = Field(default_factory=uuid4)
    project_id: UUID
    title: str
    status: CardStatus = CardStatus.DRAFTING
    genres: List[str] = Field(default_factory=list)
    creative_direction: Dict[str, Any] = Field(default_factory=dict)
    logline: Optional[str] = None
    full_synopsis: Optional[str] = None
    user_note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    linked_sources: List[UUID] = Field(default_factory=list)
    linked_nodes: List[UUID] = Field(default_factory=list)

# --- Projects & Events (New V2 Structure) ---

class ProjectBase(DomainModel):
    title: str
    format: Optional[str] = None
    genre: Optional[str] = None
    atmosphere: Optional[str] = None
    intended_purpose: Optional[str] = None
    core_conflict: Optional[str] = None
    theme: Optional[str] = None
    logline: Optional[str] = None
    full_synopsis: Optional[str] = None
    linked_sources: List[UUID] = Field(default_factory=list)

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    format: Optional[str] = None
    genre: Optional[str] = None
    atmosphere: Optional[str] = None
    intended_purpose: Optional[str] = None
    core_conflict: Optional[str] = None
    theme: Optional[str] = None
    logline: Optional[str] = None
    full_synopsis: Optional[str] = None
    linked_sources: Optional[List[UUID]] = None

class ProjectRead(ProjectBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

class ProjectEventBase(DomainModel):
    sequence: int = 0
    time_hint: Optional[str] = None
    title: str
    content: Optional[str] = None
    related_character_ids: List[UUID] = Field(default_factory=list)
    event_metadata: Dict[str, Any] = Field(default_factory=dict)

class ProjectEventCreate(ProjectEventBase):
    project_id: UUID

class ProjectEventUpdate(BaseModel):
    sequence: Optional[int] = None
    time_hint: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    related_character_ids: Optional[List[UUID]] = None
    event_metadata: Optional[Dict[str, Any]] = None

class ProjectEventRead(ProjectEventBase):
    id: UUID
    project_id: UUID
    created_at: datetime
    updated_at: datetime

class NewsSearchRequest(BaseModel):
    query: str
    limit: int = Field(default=10, ge=1, le=50)

class CharacterBase(DomainModel):
    name: str
    age: Optional[str] = None
    gender: Optional[str] = None
    role: Optional[str] = None
    occupation: Optional[str] = None
    description: Optional[str] = None
    internal_desire: Optional[str] = None
    external_conflict: Optional[str] = None
    is_locked: bool = False
    image_url: Optional[str] = None
    char_metadata: Dict[str, Any] = Field(default_factory=dict)

class CharacterCreate(CharacterBase):
    project_id: UUID

class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[str] = None
    gender: Optional[str] = None
    role: Optional[str] = None
    occupation: Optional[str] = None
    description: Optional[str] = None
    internal_desire: Optional[str] = None
    external_conflict: Optional[str] = None
    is_locked: Optional[bool] = None
    image_url: Optional[str] = None
    char_metadata: Optional[Dict[str, Any]] = None

class CharacterRead(CharacterBase):
    id: UUID
    project_id: UUID
    created_at: datetime
    updated_at: datetime
