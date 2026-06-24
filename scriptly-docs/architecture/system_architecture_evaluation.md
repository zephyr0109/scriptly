# Scriptly 프로젝트 아키텍처 및 서비스 평가 보고서 (v1.0)

본 보고서는 드라마 작가를 위한 AI 집필 보조 시스템 **Scriptly** 프로젝트의 전반적인 기술 아키텍처와 구현 형태를 분석하고, 평가 및 향후 개선 방향을 도출한 문서입니다.

---

## 📌 1. 아키텍처 관점 분석

### A. 프론트엔드 - 백엔드 역할 분담 (FE/BE Separation)
* **현황**:
  * **프론트엔드 (`scriptly-web`)**: Next.js 15 (App Router) 기반으로 사용자 인터페이스(UI), 하이드레이션, 라우팅 및 Zustand 기반 전역 상태 관리를 담당합니다. 클라이언트-서버 간 데이터 통신은 Axios를 활용하여 백엔드 REST API를 비동기 호출합니다.
  * **백엔드 (`scriptly-api`)**: FastAPI 기반으로 비동기 DB 처리(SQLAlchemy AsyncSession), 보안/인증(AuthService JWT), 외부 뉴스 연동(NaverNewsService), 실시간 웹 크롤러(CrawlingService), 그리고 Gemini AI 연동(AIService)을 총괄하는 비즈니스 핵심 로직 엔진 역할을 수행합니다.
* **평가**:
  * **관심사의 분리(SoC)**가 명확히 이루어져 있습니다. 프론트엔드는 프레젠테이션 레이어(UI/UX 및 클라이언트 상태 제어)에 집중하고, 백엔드는 자원 오케스트레이션 및 무거운 연산(AI 텍스트 처리, 파일 크롤링 등)을 전담하여 네트워크 대역폭과 프론트엔드 리소스를 절약하고 있습니다.

### B. 프론트엔드 컴포넌트 설계 (Component Architecture)
* **현황**:
  * **구조적 배치**: `src/components` 하위에 `features`, `layout`, `shared`로 폴더 구조가 체계화되어 있습니다.
    * `layout/`: 사이드바, 헤더, 퀵 인사이트 패널 등 화면 레이아웃 틀을 제공합니다.
    * `features/`: 세계관 설정실(`WorldBuildingView`), 플롯 카드, 에디터 등 비즈니스 도메인 밀착형 뷰 컴포넌트를 배치했습니다.
    * `shared/`: 범용 버튼, 인풋, 모달 등 재사용 가능한 아토믹(Atomic) 단위 컴포넌트가 모여 있습니다.
* **평가**:
  * **컨테이너/프레젠테셔널 분리 부족**: 화면 오케스트레이션 역할과 세부 마크업 렌더링이 하나의 거대한 파일에 묶여 있는 경향이 있습니다. 예를 들어, `RightInsightPanel.tsx`는 690라인이 넘는 단일 파일로, 탭 제어 상태 관리, 실시간 크롤링 API 연동, 게이지바 및 사건 목록 렌더링 마크업까지 모두 단일 파일 내에 포함되어 있어 단일 책임 원칙(SRP) 관점에서 결합도가 다소 높은 편입니다.

### C. 백엔드 DDD 및 클린 아키텍처 기반 설계 여부 (DDD & Clean Architecture)
* **현황**:
  * 백엔드 폴더 구조가 `app/domain`, `app/application`, `app/infrastructure`, `app/interface`의 4대 레이어로 완벽하게 분할되어 있습니다.
    * `domain/`: 비즈니스 엔티티 모델(`models.py`) 및 데이터 스키마 규칙(`schemas.py`)을 명세합니다.
    * `application/`: 비즈니스 유스케이스를 구현하는 서비스 계층(`services/`)이 AI 분석, 백업, 인증 등을 담당합니다.
    * `infrastructure/`: DB 세션 제공(`database.py`), 외부 연동 모듈(`external_api/`) 등 기술적 디테일을 숨깁니다.
    * `interface/`: 외부 클라이언트의 진입점인 라우터(`api/v1/`) 계층입니다.
* **평가**:
  * 전형적인 **클린 아키텍처 / 레이어드 아키텍처** 규칙을 매우 훌륭하게 따르고 있습니다. 상위 비즈니스 정책 계층(Domain, Application)이 하위 구현 기술 계층(Infrastructure, Interface)에 의존하지 않도록 의존성의 방향이 안쪽을 향하고 있습니다.
  * 단, 일부 서비스가 DB `AsyncSession`에 직접 접근하여 SQL을 처리하거나, DTO와 모델의 관계 맵핑이 라우터 레이어에 다소 파편화되어 있어 영속성 분리(Repository Pattern)의 고도화 여지가 있습니다.

### D. 테스트 커버리지 및 상세도 (Testing Infrastructure)
* **현황**:
  * `pyproject.toml`에 `pytest` 라이브러리가 명시되어 있지만, 백엔드 서비스나 프론트엔드 핵심 컴포넌트에 대한 자동화된 유닛/통합 테스트 코드(`tests/` 폴더)가 구축되어 있지 않습니다.
  * 주로 `scratch/` 폴더에 `test_crawl_manual.py`, `test_backup.py`와 같은 수동 동작 및 시뮬레이션 목적의 일회성/수동 테스트 스크립트 위주로 구현 검증을 진행해 왔습니다.
* **평가**:
  * 기능의 점진적 개발 단계에서는 수동 검증 스크립트가 유용했으나, 대형 리팩토링이나 서비스 규모 확장 시 **회귀 테스트(Regression Test)의 안정성**을 담보하기 어려워 CI/CD 파이프라인 연동에 한계가 있는 취약한 테스트 인프라 상태입니다.

---

## 🚀 2. 향후 아키텍처 개선 방향 (Roadmap)

1. **프론트엔드 컴포넌트 슬라이싱 및 SRP 고도화**
   * 거대 컴포넌트(예: `RightInsightPanel.tsx`)를 작은 컴포넌트 단위로 분할합니다.
   * `ArticleContentView.tsx` (기사 원문 탭), `AIAnalysisReportView.tsx` (AI 분석 결과 탭) 등으로 마크업과 탭 로직을 컴포넌트 단위로 격리하여 파일 가독성 및 재사용성을 높여야 합니다.
2. **백엔드 레포지토리 패턴 (Repository Pattern) 도입**
   * 서비스 계층(`application/services`)이 직접 SQLAlchemy `Session`을 사용해 데이터 조작 쿼리를 날리는 로직을 걷어내고, `domain/repositories` 인터페이스 및 `infrastructure/repositories` 구현체를 신설하여 데이터 영속성 계층을 한 단계 더 격리해야 합니다.
3. **Pytest 기반 자동화 테스트 세트 구축**
   * `app/tests/` 디렉토리를 공식 신설하고, SQLite In-Memory DB 또는 테스트용 DB 도커 컨테이너를 연동하는 Pytest Fixture를 제작해야 합니다.
   * AI 응답 등을 Mocking 처리하여, 주요 비즈니스 API(인증, 크롤링, 아카이빙, 백업/복원)의 안정성을 검증하는 **자동화된 통합 테스트 세트**를 구축해야 합니다.

---

## 🎯 3. 서비스적 관점에서의 종합 평가

* **비즈니스 핵심 가치 실현**:
  * 사실적 정보인 '뉴스 기사'를 드라마 기획의 씨앗인 '갈등 자산(Dramatic Tension)'으로 전환한다는 본질적 가치에 매우 충실합니다. 
* **사용자 경험(UX) 극대화**:
  * AI 정밀 분석의 태생적 한계인 속도 지연(10초 이상 소요)에 맞서, **기사 클릭 즉시 선 크롤링(Pre-crawling)하여 원문을 0.1초 만에 로딩하는 탭 레이아웃(Original Content First)**을 도입한 것은 작가의 몰입을 끊지 않는 훌륭한 비즈니스적 장치입니다.
* **시스템 인프라 효율성**:
  * 대량의 임시 데이터로 인해 스토리지가 폭증할 우려를 **3일 경과 미보관 기사 자동 클린업 스케줄러**를 통해 슬기롭게 해결하여, 호스팅 비용 제어와 안정적 AI 비동기 상태 유지를 함께 달성한 구조입니다.
