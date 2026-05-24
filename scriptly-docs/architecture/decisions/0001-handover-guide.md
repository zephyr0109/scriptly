# 📘 Scriptly 인수인계 가이드 (Handover Guide)

이 문서는 **Scriptly 프로젝트**의 전체 아키텍처, 핵심 로직, 그리고 개발 환경 구성을 설명합니다. 드라마 작가를 위한 AI 집필 보조 시스템인 이 프로젝트는 사용자의 영감을 구체화하기 위한 기술적 토대를 제공합니다.

---

## 🏗 전체 시스템 아키텍처

본 프로젝트는 **Clean Architecture** 원칙에 따라 관심사를 분리하며, 프론트엔드와 백엔드가 명확한 역할 분담을 가집니다.

### 🌐 Frontend (scriptly-web)
- **Framework**: Next.js 15+ (App Router)
- **Main Goal**: 반응형 UI/UX 제공 및 BFF(Backend for Frontend) 역할 수행.
- **Key Layers**:
    - `src/app/`: 라우팅 및 서버 컴포넌트 데이터 페칭.
    - `src/components/features/`: 기능별 비즈니스 로직 중심 컴포넌트 (Archive, Curation, Insight).
    - `src/components/shared/`: 재사용 가능한 UI 아토믹 컴포넌트.
    - `src/hooks/`: 복잡한 상태 및 API 연동 로직 추출.

### ⚙️ Backend (scriptly-api)
- **Framework**: FastAPI (Python 3.12+)
- **Main Goal**: AI 오케스트레이션, 데이터 저장, 도메인 비즈니스 로직 실행.
- **Key Layers**:
    - `app/domain`: 엔티티(DB 모델) 및 데이터 검증(Pydantic 스키마).
    - `app/application/services`: AI 엔진, 뉴스 큐레이션, 인사이트 추출 등 핵심 비즈니스 로직.
    - `app/infrastructure`: 데이터베이스 연동, 외부 API(Naver News) 클라이언트.
    - `app/interface`: 클라이언트와 통신하는 API 라우터.

---

## 🛠 주요 비즈니스 프로세스

### 1. 뉴스 큐레이션 (CurationService)
- **동작**: 네이버 뉴스를 통해 작가가 관심 있는 키워드를 검색하고, AI를 활용해 드라마적 가치가 높은 기사를 선별하여 점수를 매깁니다.
- **핵심**: 사실 관계(`source_url`, `published_at`)가 명확한 정보를 바탕으로 요약 및 갈등 지수 분석을 수행합니다.

### 2. 영감 보관소 (ArchivingService)
- **동작**: 선별된 뉴스를 '영감 카드' 형태로 보관하며, 사용자의 메모와 함께 프로젝트 자산으로 관리합니다.
- **핵심**: 비정형 텍스트 데이터를 정형화된 DB 데이터로 변환하여 검색 및 연계를 용이하게 합니다.

### 3. 인사이트 랩 (InsightService)
- **동작**: 영감 카드들을 분석하여 인물 간의 관계망(Character Map), 사건의 전개(Plot Timeline), 그리고 시놉시스를 생성합니다.
- **핵심**: LLM을 활용한 고도의 텍스트 생성 엔진을 사용하여 창작자의 상상력을 보조합니다.

---

## 💻 개발 및 실행 환경

### 패키지 관리
- **Backend**: `uv`를 사용하여 가상환경 및 패키지를 관리합니다. (`uv run`, `uv add`)
- **Frontend**: `npm` 또는 `yarn`을 사용합니다.

### 실행 방법
1. **Docker 기반**: `docker-compose up --build` 명령어로 전체 환경(API, Web, DB, Redis)을 일괄 실행할 수 있습니다.
2. **로컬 실행 (개발)**:
    - API: `scriptly-api/`에서 `uv run fastapi dev main.py`
    - Web: `scriptly-web/`에서 `npm run dev`

---

## ✍️ 필사를 위한 가이드 (Transcription Guide)
사용자님께서 필사를 진행하실 때 각 파일 상단에 기재된 **[Architecture Point]** 주석을 확인해 주십시오. 
- 이 주석은 해당 코드가 클린 아키텍처의 어느 계층에 속하는지, 
- 왜 이런 패턴으로 구현되었는지, 
- 필사할 때 어떤 논리적 흐름에 집중해야 하는지를 설명합니다.

### 추천 필사 순서:
1. **Domain Layer**: 데이터의 구조를 먼저 파악합니다. (`app/domain/models.py`, `app/domain/schemas.py`)
2. **Infrastructure Layer**: 데이터가 어떻게 외부와 연결되는지 이해합니다. (`app/infrastructure/database.py`, `naver_api.py`)
3. **Application Layer**: 핵심 비즈니스 로직(AI 서비스)을 필사하며 시스템의 '뇌'를 이해합니다. (`app/application/services/*.py`)
4. **Interface Layer**: API가 어떻게 외부 노출되는지 확인합니다. (`app/interface/api/v1/*.py`)
5. **UI Layer**: 위 계층들이 어떻게 사용자에게 시각화되는지 필사합니다. (`src/hooks/*.ts`, `src/components/features/**/*.tsx`)
