# Scriptly: 드라마 작가를 위한 AI 집필 보조 시스템

Scriptly는 뉴스 데이터에서 드라마틱한 영감을 추출하고, 이를 캐릭터 중심의 갈등 구조와 시놉시스로 발전시킬 수 있도록 돕는 작가 전용 AI 워크스테이션입니다.

## 핵심 가치
- **사실 기반의 영감**: 실제 뉴스 사건에서 드라마틱한 갈등 요소(점수화)를 포착합니다.
- **캐릭터 중심의 통찰**: 사건 이면에 숨겨진 인물의 욕망과 관계를 AI로 분석합니다.
- **집필 중심의 워크플로우**: 영감 수집부터 인물 관계도 구성, 시놉시스 작성까지 하나의 흐름으로 연결합니다.

## 시스템 아키텍처
- **Front-end**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Back-end**: FastAPI (Python 3.12+), SQLModel (SQLAlchemy)
- **Database**: PostgreSQL 16 (pgvector), Redis (Cache)
- **AI Engine**: Google Gemini 1.5 Pro/Flash, OpenAI (Optional)
- **Infrastructure**: Docker, Docker Compose

## 설치 및 시작하기

### 1. 환경 설정
루트 디렉토리의 `.env.example` 파일을 복사하여 `.env` 파일을 생성하고 필요한 API 키를 입력합니다.
- 네이버 API (뉴스 검색용)
- Google Gemini API (AI 분석용)

### 2. 인프라 실행 (Docker)
PostgreSQL 및 Redis를 실행합니다.
```powershell
docker-compose up -d
```

### 3. 백엔드 설정 (scriptly-api)
본 프로젝트는 Python 패키지 매니저로 **uv**를 사용합니다.
```powershell
cd scriptly-api
# 가상환경 생성 및 패키지 설치
uv sync
# 서버 실행
uv run main.py
```

### 4. 프론트엔드 설정 (scriptly-web)
```powershell
cd scriptly-web
npm install
npm run dev
```

## 주요 기능

### 1. 큐레이션 (Curation)
- 실시간 뉴스 검색 및 드라마틱 스코어링 (긴장감, 갈등, 사회적 맥락 분석)
- 작가의 관심 키워드 기반 개인화된 영감 피드 제공

### 2. 아카이빙 (Archive)
- 영감 카드를 프로젝트와 연결하여 영구 저장
- 태그 및 카테고리별 체계적 관리

### 3. 인사이트 랩 (Insight Lab)
- **프로젝트 워크스페이스**: 작품별 독립된 집필 환경 관리
- **캐릭터 보드**: 인물 간의 관계, 욕망, 갈등 구조를 시각화한 인터랙티브 보드
- **시나리오 타임라인**: 주요 사건의 흐름을 관리하고 시각화
- **시놉시스 빌더**: 수집된 영감과 캐릭터 정보를 바탕으로 AI와 협업하여 시놉시스 초안 생성

### 4. 내보내기 (Export)
- 작성된 프로젝트 정보를 텍스트, PDF 등 다양한 형식으로 내보내기

## 라이선스
개인 및 내부 개발 용도로만 사용 가능합니다.
