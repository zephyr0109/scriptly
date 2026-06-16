-- =========================================================================
-- Scriptly Production DB Migration History
-- =========================================================================
-- 이 파일은 운영 데이터베이스에 적용해야 하는 스키마 변경(DDL) 쿼리를 순차적으로 기록합니다.
-- 새로운 기능 개발로 인해 DB 스키마가 변경될 때마다 하단에 추가해 주세요.
-- =========================================================================

-- -------------------------------------------------------------------------
-- [Migration #1] 2026-06-13: 영감 보관함 폴더 단위 관리 기능 지원
-- -------------------------------------------------------------------------
-- Description: 원천 자료(sources) 테이블에 소속 폴더명을 저장할 folder 컬럼 추가
-- Apply Command (Docker):
--   docker exec -it db psql -U postgres -d scriptly -c "ALTER TABLE sources ADD COLUMN IF NOT EXISTS folder VARCHAR(100);"

ALTER TABLE sources ADD COLUMN IF NOT EXISTS folder VARCHAR(100);


-- -------------------------------------------------------------------------
-- [Migration #2] 2026-06-13: 세계관 설정 기능 지원 (정규화된 설계)
-- -------------------------------------------------------------------------
-- Description: 세계관 설정을 영역별로 나누어 관리하기 위한 4대 테이블 생성

-- 1. 시공간 무대 테이블 (World Stages)
CREATE TABLE IF NOT EXISTS world_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    era VARCHAR(100), -- 시대/시간적 배경
    parent_id UUID, -- Soft Relation: 상위 무대 ID (계층형 트리)
    description TEXT,
    atmosphere TEXT, -- 분위기
    technology_level VARCHAR(255), -- 물리적 특징/기술수준
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_world_stages_project_id ON world_stages(project_id);

-- 2. 세력/집단 테이블 (World Factions)
CREATE TABLE IF NOT EXISTS world_factions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- 집단 유형
    ideology_goal TEXT, -- 이념 및 목표
    base_stage_id UUID, -- Soft Relation: 주요 거점 시공간 ID (느슨한 연동)
    scale_status TEXT, -- 규모 및 위상
    hierarchy TEXT, -- 내부 조직/구조
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_world_factions_project_id ON world_factions(project_id);

-- 3. 사회 제도 / 문화 관습 테이블 (World Rules & Cultures)
CREATE TABLE IF NOT EXISTS world_rules_cultures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'RULE' (법령/규칙) 또는 'CULTURE' (비공식 관습/현상)
    scope_stage_id UUID, -- Soft Relation: 적용 시공간 ID (느슨한 연동)
    scope_faction_id UUID, -- Soft Relation: 적용 집단 ID (느슨한 연동)
    content TEXT, -- 상세 규칙/관습 내용
    impact TEXT, -- 인물/사회에 미치는 영향
    exceptions TEXT, -- 예외 사항 / 틈새
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_world_rules_cultures_project_id ON world_rules_cultures(project_id);

-- 4. 작품 용어 사전 테이블 (World Glossary)
CREATE TABLE IF NOT EXISTS world_glossary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    term VARCHAR(255) NOT NULL,
    definition TEXT,
    usage_example TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_world_glossary_project_id ON world_glossary(project_id);

-- 5. 세계관 자유 메모 테이블 (World Notes - 신규 추가)
CREATE TABLE IF NOT EXISTS world_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL, -- 메모 제목
    content TEXT, -- 메모 상세 내용
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_world_notes_project_id ON world_notes(project_id);

