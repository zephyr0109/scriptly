# Scriptly 프로젝트 현황 및 학습 적합성 분석 리포트

요청하신 `@[scriptly-docs/핵심 목표]`를 기준으로 현재 프로젝트의 구현 현황을 살펴보고, 이 프로젝트가 "필사(필타)"를 통해 학습하기에 적합한 수준인지 분석한 결과입니다.

## 1. 핵심 목표 대비 구현 현황 분석

| 핵심 목표 및 유즈케이스 | 구현 여부 | 현재 구현 상태 및 주요 파일 |
| :--- | :---: | :--- |
| **1. News Curation**<br>(실시간 뉴스 수집/점수화) | ✅ | **[백엔드]** `news.py`에서 Google News RSS 및 네이버 뉴스 API 연동. FastAPI `BackgroundTasks` 활용하여 비동기로 Gemini AI 기반의 `tension_score`, `tension_reason`, `potential_conflict` 추출 완료.<br>**[프론트]** `CurationFeed.tsx`, `CurationDetailPanel.tsx` 구성 완료. |
| **2. External Asset Ingestion**<br>(외부 자료 업로드 및 구조화) | ✅ | **[백엔드]** `archive.py` 등을 통한 아카이브 자료 관리.<br>**[프론트]** `ArchiveImportModal.tsx`, `ArchiveView.tsx`를 통해 사용자가 보유한 자료들을 보관소(Archive)에 등록하고 확인할 수 있는 UI 구축. |
| **3. Multi-source Synthesis**<br>(복합 소재 생성) | ✅ | **[프론트]** Insight Lab 내 `InspirationDrawer.tsx`, `ProjectWorkspace.tsx`를 구비하여 스카우터(뉴스) 및 보관소(외부자료)의 영감을 한 곳에 모아 새로운 프로젝트로 기획할 수 있는 워크스페이스 제공. |
| **4. Conflict Analysis**<br>(갈등 및 욕망 추출) | ✅ | **[백엔드]** AI Service를 통해 뉴스 인입 시, 그리고 기사 상세 분석 시 인물/상황의 '잠재적 갈등(potential conflict)'을 자동 추출하는 로직(`analyze_detail`) 구현 완료. |
| **5. Character Mapping**<br>(인물 관계도 변환) | ✅ | **[백엔드]** `characters.py` API.<br>**[프론트]** `CharacterBoard.tsx`, `CharacterNode.tsx`, `RelationshipEdge.tsx`를 활용하여 React Flow 기반의 시각적이고 인터랙티브한 인물 관계도 구현. |
| **6. Scene Drafting**<br>(로그라인 및 씬 초안 생성) | ✅ | **[백엔드]** `events.py` 등 API 제공.<br>**[프론트]** `PlotTimeline.tsx` 및 `SynopsisView.tsx`에서 이야기의 흐름(Plot)과 시놉시스(로그라인 등)를 편집할 수 있도록 구현. |
| **7. Bi-directional Archiving**<br>(양방향 연동 및 보관) | ✅ | **[프론트/백엔드]** 프로젝트(Insight Lab)에서 만든 결과물이나 수집한 영감 카드가 다시 Archive와 연동되는 양방향 데이터 흐름 정립. |

**👉 [종합 평가]** `핵심 목표` 문서에 선언되었던 7가지의 주요 유즈케이스가 **빠짐없이 아키텍처 상에 안착**되었으며, 시스템이 의도한 "뉴스/자료 수집 → 영감화 → 소재 도출 → 관계도/타임라인 기획" 이라는 파이프라인이 정상적으로 동작할 수 있도록 뼈대가 완벽하게 갖추어졌습니다.

---

## 2. '필사(필타)' 및 학습 적합성 판단

**결론부터 말씀드리면, 현재 Scriptly 프로젝트는 기술 스택을 마스터하고 아키텍처를 학습하기 위해 "필사(필타)" 하기에 압도적으로 훌륭한 교보재입니다.** 그 이유는 다음과 같습니다.

### 🎯 이유 1. 교과서적인 Clean Architecture 구현 (Python 백엔드)
현재 `scriptly-api`는 `domain`, `application`, `infrastructure`, `interface`라는 4계층 클린 아키텍처를 완벽하게 분리하여 구현하고 있습니다.
* **장점**: SQLAlchemy 모델(ORM)과 Pydantic 스키마(Domain), 비즈니스 로직(Application), API 라우터(Interface)가 서로 철저히 분리된 코드를 따라 치다 보면, **"왜 코드를 분리해야 유지보수가 쉬운가?"**에 대한 시스템 설계 능력을 자연스럽게 습득할 수 있습니다.
* **학습 포인트**: FastAPI와 Async SQLAlchemy 연동 패턴, `BackgroundTasks`를 활용한 비동기 AI 처리.

### 🎯 이유 2. 프론트엔드의 관심사 분리 및 모던 React/Next.js 패턴
`scriptly-web`은 `app`(라우팅), `components/features`(도메인 특화 UI), `components/shared`(공통 UI), `hooks`(상태 관리)로 디렉토리가 우수하게 정돈되어 있습니다.
* **장점**: 최근 진행한 리팩토링 덕분에 한 파일에 너무 많은 로직이 몰려있지 않습니다(300라인 이하 원칙). 코드를 필사하면서 "이 기능의 상태 관리는 컴포넌트 내부에 둘 것인가, Custom Hook으로 뺄 것인가?"를 고민하기에 매우 좋은 스케일입니다.
* **학습 포인트**: Next.js App Router의 구조, React Flow를 이용한 복잡한 상태 다루기, `useCallback`/`useEffect`를 이용한 렌더링 최적화(무한 루프 방지 등).

### 🎯 이유 3. 실무 수준의 AI Integration
단순히 "OpenAI API 한 번 호출하고 끝" 나는 토이 프로젝트가 아닙니다.
* **장점**: 뉴스 RSS 파싱 ➡️ 백그라운드 워커 ➡️ AI(Gemini) Chunking 분석 ➡️ 데이터베이스 결과 업데이트 등 실무에서 실제 AI 툴을 백엔드에 통합할 때 사용하는 패턴(비동기 로직 및 예외처리, 배치 처리)이 고스란히 담겨 있습니다.
* **학습 포인트**: AI의 응답 지연을 프론트엔드에서 기다리지 않고 어떻게 비동기로 우아하게 처리하는지(Polling이나 Pending 상태 관리) 훈련할 수 있습니다.

### 🎯 이유 4. 프로젝트의 사이즈 (Too Big vs Too Small)
* 너무 거대해서 어디서부터 손대야 할지 모를 방대한 MSA 구조도 아니고, 그렇다고 Todo App처럼 너무 단순하지도 않습니다.
* **개인이 전체 풀스택(BFF + API DB 설계 + 외부 프롬프팅)을 머릿속에 담고 1바퀴 온전히 클론 코딩/필사하기에 가장 최적의 "골디락스(Goldilocks) 스케일"**입니다.

## 💡 필사(필타) 진행 시 추천 가이드라인
1. **Domain & DB 먼저**: 백엔드의 `app/domain` (스키마/모델) 코드를 가장 먼저 치면서 전체 데이터의 흐름(Entity)을 머릿속에 그립니다.
2. **Infrastructure 연동**: `database.py`나 `naver_api.py`, RSS 연동 부분 등을 작성해 봅니다. (외부와 통신하는 부분)
3. **Application & Interface**: `ai_service.py`와 `router/api` 부분을 작성하며 조립합니다.
4. **Front-End Hooks**: UI를 그리기 전에 데이터를 가져오고 상태를 관리하는 `src/hooks` 부분의 코드를 칩니다.
5. **Front-End UI Assembly**: 마지막으로 `components/features` 단의 시각적 요소들을 치면서 화면에 어떻게 Binding 되는지 확인합니다.
