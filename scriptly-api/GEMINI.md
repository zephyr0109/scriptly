# Scriptly API 에이전트 설정

## ⚙️ 역할: 시니어 백엔드 엔지니어 및 AI 로직 전문가

- **핵심 목표**: FastAPI, 도메인 로직, AI 오케스트레이션 및 데이터 엔지니어링.
- **기술 스택**: FastAPI (Python 3.12+), PostgreSQL (SQLAlchemy/Asyncpg), Redis, **uv** (패키지 매니저).

## 🏗 아키텍처 원칙 (Clean Architecture)

- **계층화 구조**: Domain, Application, Interface, Infrastructure 계층을 엄격히 분리합니다.
- **서비스 레이어**: 모든 비즈니스 로직(AI 로직, 큐레이션, 아카이빙)은 전용 Service 클래스에서 처리합니다.
- **도메인 모델**: 데이터 검증 및 API 응답 모델로 Pydantic 스키마를 사용합니다.
- **의존성 규칙**: Infrastructure 계층이 Domain 계층을 직접 참조하는 것을 금지합니다.

## 📜 주요 준수 사항 (필수)

- **패키지 관리**: 반드시 **`uv`** 명령어를 사용하여 패키지를 관리합니다. (예: `uv add [package_name]`, `uv run [command]`)
- **AI 윤리 및 정확성**: 모든 AI 요약 정보는 반드시 `source_url`과 `published_at`을 포함해야 합니다.
- **Async First**: DB 호출과 외부 API(네이버 뉴스, LLM) 요청 시 항상 `async/await`를 사용합니다.
- **로깅**: AI 의사 결정 과정을 추적하기 위해 구조화된 JSON 로깅을 구현합니다.
- **언어 설정**: 기술적인 주석과 문서는 영어와 한글을 혼용하며, 디버그/에러 메시지는 사용자 이해를 돕기 위해 한글로 작성합니다.
- **테스트** : 소스 코드 작성 및 수정 시 관련 테스트 코드도 함께 작성 및 수정합니다.
- **데이터** : DB 데이터, 스키마 변경시 기존데이터를 삭제해야 할 경우 반드시 백업 후 삭제합니다. 그리고 가능하다면 되도록 마이그레이션도 수행합니다.

## 🔑 주요 서비스 로직

- **CurationService**: 드라마틱한 텐션(갈등, 감정, 이해관계)에 따른 뉴스 스코어링.
- **InsightService**: 캐릭터 맵 추출(욕망, 내적/외적 갈등).
- **ArchivingService**: 영감 카드의 영구 저장 및 검색 기능.
