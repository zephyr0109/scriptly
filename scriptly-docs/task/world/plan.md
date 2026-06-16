# 세계관 설정 기능 개발 작업 계획서 (World-Building Setting Plan)

본 문서는 드라마의 시공간 무대(STAGE), 집단(FACTION), 규칙/문화(RULE_CULTURE), 용어(GLOSSARY), 자유 메모(NOTE)를 체계적으로 분류하고 정규화된 데이터로 관리하는 **세계관 설정** 기능의 세부 작업 계획을 기술합니다.

---

## 🎨 UI 예시 시안 (Mockup)

개발 및 디자인 참고를 위한 첫 화면 UI 예시 시안입니다.
* **[UI 시안 이미지 파일 열기](file:///e:/workspaces/scriptly/scriptly-docs/task/world/worldview_ui_mockup.png)**

---

## 💾 1. 정규화 및 느슨한 연동(Soft Relation) 데이터베이스 스키마 정의

`migrations_folder_world.sql`에 등재된 설계를 적용합니다. 작가의 원활한 사용을 보장하기 위해 외래키 제약조건을 느슨하게 처리하고(Soft Relation), 자유 메모 영역을 추가하였습니다.

```sql
-- 1. 시공간 무대 테이블 (World Stages)
CREATE TABLE IF NOT EXISTS world_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    era VARCHAR(100), -- 시대/시간적 배경 (예: '1990년대', '조선 영조기')
    parent_id UUID, -- Soft Relation: 상위 무대 ID (트리 구조)
    description TEXT,
    atmosphere TEXT, -- 공간의 분위기/무드
    technology_level VARCHAR(255), -- 기술/문명 수준 및 물리 환경
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_world_stages_project_id ON world_stages(project_id);

-- 2. 세력/집단 테이블 (World Factions)
CREATE TABLE IF NOT EXISTS world_factions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100), -- 집단 유형 (예: 기업, 귀족가문, 모임)
    ideology_goal TEXT, -- 집단이 추구하는 이념/목표
    base_stage_id UUID, -- Soft Relation: 주요 거점 시공간 무대 ID
    scale_status TEXT, -- 규모 및 사회적 위상
    hierarchy TEXT, -- 내부 조직 구조/직급 체계
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
    type VARCHAR(50) NOT NULL, -- 'RULE' (법률/규칙) 또는 'CULTURE' (비공식 관습/문화현상)
    scope_stage_id UUID, -- Soft Relation: 적용되는 시공간 무대 ID
    scope_faction_id UUID, -- Soft Relation: 적용되는 세력 ID
    content TEXT, -- 상세 규칙/관습 내용
    impact TEXT, -- 인물/사회에 미치는 영향
    exceptions TEXT, -- 예외 조항 / 허점
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_world_rules_cultures_project_id ON world_rules_cultures(project_id);

-- 4. 작품 용어 사전 테이블 (World Glossary)
CREATE TABLE IF NOT EXISTS world_glossary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    term VARCHAR(255) NOT NULL, -- 표제 용어
    definition TEXT, -- 상세 정의
    usage_example TEXT, -- 사용 예문
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
```

---

## 🛠️ 2. 단계별 세부 작업 계획 (Roadmap)

### [Phase 1] 백엔드 기반 구축
- [x] **DB 스키마 반영**:
  * 로컬 PostgreSQL DB에 정규화된 5개 테이블을 생성합니다. (FK 제약 조건은 느슨하게 생략하고 project_id CASCADE만 적용)
- [x] **SQLAlchemy ORM 도메인 모델 정의**:
  * `scriptly-api/app/domain/models.py`에 5개 테이블에 매핑될 ORM 클래스들을 선언합니다.
- [x] **Pydantic 스키마 설계**:
  * `scriptly-api/app/domain/schemas.py`에 각 모델에 대응하는 스키마 및 CRUD DTO들을 설계합니다.
- [x] **REST API 라우터 구현**:
  * `scriptly-api/app/interface/api/v1/world_settings.py`에 5개 도메인에 대한 각각의 CRUD API 엔드포인트를 구현합니다.

### [Phase 2] 프론트엔드 구조 확장
- [x] **익스플로러 사이드바 수정**:
  * `ExplorerSidebar.tsx` 내 `집필 관리 메뉴`에 "세계관 설정" 메뉴를 신규 추가하고 활성화합니다.
- [x] **전역 상태 및 라우팅 연동**:
  * `useUIStore.ts` 및 `page.tsx`에 `world-building` 탭 바인딩 로직을 적용합니다.
- [x] **데이터 통신 API 연동 훅 작성**:
  * `useWorldSettings.ts` 훅을 작성하여, 5개 정규화 테이블 데이터(stages, factions, rules, glossary, notes)를 각각 불러오고 상태를 변경하는 비동기 통신 액션을 관리합니다.

### [Phase 3] UI 컴포넌트 개발 (`WorldBuildingView.tsx`)
- [x] **좌측 계층형 익스플로러 구현**:
  * 5대 카테고리(`시공간 무대`, `세력/집단`, `제도/문화`, `용어 사전`, `자유 메모`) 아코디언 제공.
  * `world_stages`는 `parent_id`를 기반으로 무대 간 계층형 들여쓰기 렌더링.
  * 각 아코디언별 생성 단추 구성.
- [x] **우측 정규화 설정 폼 개발**:
  * 선택된 카테고리에 알맞은 정적/구조화 필드 렌더링:
    * **시공간 무대**: 시공간 이름, **시대/시점(Era)**, 분위기, 기술수준, 상세 설명.
    * **세력/집단**: 세력명, 집단유형, 이념/목표, 거점 시공간 선택(Soft UUID 매핑), 규모, 조직도.
    * **제도/문화**: 설정명, 구분(공식규칙/비공식관습), 적용 시공간/세력 선택 드롭다운, 내용, 영향, 예외사항.
    * **용어 사전**: 용어명, 정의, 사용례.
    * **자유 메모**: 메모 제목, 메모 상세 내용(자유 마크다운 텍스트).

### [Phase 4] 검증 및 최종 점검
- [x] **정적 컴파일 검증**: `npx tsc --noEmit`을 통과하는지 프론트엔드 컴파일을 수행합니다.
- [x] **백엔드 CRUD 시나리오 교차 검증**: API와 DB 데이터 동기화, 특히 외래키에 의한 연계 삭제 및 트리형 정렬 무결성을 집중 검수합니다.
