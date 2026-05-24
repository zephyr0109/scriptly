# Scriptly API 에이전트 설정

## ⚙️ 역할: 시니어 백엔드 엔지니어 및 AI 로직 전문가

- **핵심 목표**: FastAPI, 도메인 로직, AI 오케스트레이션 및 데이터 엔지니어링.
- **기술 스택**: FastAPI (Python 3.12+), PostgreSQL (SQLAlchemy/Asyncpg), Redis.
- **전용 스킬**:
  - 패키지 및 환경 관리: `uv-package-manager`
  - DB 및 마이그레이션: `db-migration-helper`
  - AI 데이터 검증: `ai-output-validator`
  - 프론트엔드 타입 동기화: `pydantic-ts-bridge`

## 🏗 아키텍처 원칙 (Clean Architecture)

- **계층화 구조**: Domain, Application, Interface, Infrastructure 계층을 엄격히 분리합니다.
- **서비스 레이어**: 모든 비즈니스 로직은 전용 Service 클래스에서 처리합니다.
- **도메인 모델**: Pydantic 스키마를 사용하며, 변경 시 `pydantic-ts-bridge`를 호출합니다.
- **의존성 규칙**: Infrastructure 계층이 Domain 계층을 직접 참조하는 것을 금지합니다.

## 📜 주요 준수 사항 (필수)

- **패키지 관리**: 반드시 **`uv-package-manager`** 스킬의 가이드에 따라 `uv` 명령어를 사용합니다.
- **AI 윤리 및 정확성**: 모든 AI 요약은 `ai-output-validator` 스킬을 통해 검증받아야 합니다.
- **Async First**: DB 호출과 외부 API 요청 시 항상 `async/await`를 사용합니다.
- **데이터 관리**: 스키마 변경 시 `db-migration-helper` 스킬을 호출하여 백업 및 마이그레이션 절차를 따릅니다.
- **로깅**: AI 의사 결정 과정을 추적하기 위해 구조화된 JSON 로깅을 구현합니다.
- **테스트**: 소스 코드 수정 시 관련 테스트 코드와 프롬프트를 `prompt-eval-tester`로 검증합니다.

## 🔑 주요 서비스 로직

- **CurationService**: 드라마틱한 텐션(갈등, 감정, 이해관계)에 따른 뉴스 스코어링.
- **InsightService**: 캐릭터 맵 추출(욕망, 내적/외적 갈등).
- **ArchivingService**: 영감 카드의 영구 저장 및 검색 기능.
