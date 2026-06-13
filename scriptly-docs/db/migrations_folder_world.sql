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
-- [Migration #2] 2026-06-13: 세계관 설정 기능 지원
-- -------------------------------------------------------------------------
-- Description: 세계관 설정(위치, 집단, 규칙 등) 데이터 관리를 위한 world_settings 테이블 추가
-- Apply Command (Docker):
--   docker exec -it db psql -U postgres -d scriptly -c "CREATE TABLE IF NOT EXISTS world_settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE, category VARCHAR(50) NOT NULL, name VARCHAR(255) NOT NULL, parent_id UUID REFERENCES world_settings(id) ON DELETE SET NULL, description TEXT, custom_attributes JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP); CREATE INDEX IF NOT EXISTS idx_world_settings_project_id ON world_settings(project_id);"

CREATE TABLE IF NOT EXISTS world_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'LOCATION', 'FACTION', 'SYSTEM'
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES world_settings(id) ON DELETE SET NULL,
    description TEXT,
    custom_attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_world_settings_project_id ON world_settings(project_id);

