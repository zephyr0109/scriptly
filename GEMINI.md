# 프로젝트 Scriptly: 극작가를 위한 AI 집필 보조 시스템

## 🎯 프로젝트 개요

- **목표**: 드라마 작가들이 뉴스에서 영감을 찾고 극작 과정을 돕는 AI 도구.
- **대상**: 전문/지망 드라마 작가 (비기술자 중심).
- **핵심 가치**: 사실적 뉴스를 드라마틱한 갈등 자산으로 변환.

## 🛠 기술 스택 및 전용 스킬

- **프론트엔드**: Next.js 15+ (App Router) -> `tailwind-v4-master`, `react-hook-auditor` 스킬 활용
- **백엔드**: FastAPI (Python 3.12+) -> `uv-package-manager`, `db-migration-helper` 스킬 활용
- **공통/도메인**: `drama-structure-analyzer`, `prompt-eval-tester` 스킬 활용

## 📂 디렉토리 가이드라인

- `scriptly-web/`: Next.js 프론트엔드 및 BFF. (UI/UX 관련 스킬 집중 활용)
- `scriptly-api/`: FastAPI 백엔드 및 AI 에이전트 로직. (인프라/데이터 관련 스킬 집중 활용)

## 📜 공통 코딩 규칙

- **사실 관계 확인**: 모든 AI 요약은 `source_url`과 `published_at`을 포함해야 함. (`ai-output-validator` 활용)
- **비동기 우선**: 모든 I/O 작업(API, DB)에 `async/await` 사용.
- **언어 설정**: UI와 주석 등은 기본적으로 **한글**을 사용. (`korean-a11y-checker` 활용)
- **도메인 품질**: 극작 보조 도구로서의 품질 유지를 위해 `drama-structure-analyzer` 및 `prompt-eval-tester` 스킬을 상시 적용함.
- **기본 원칙**:
  - 기존 코드 보존 (Preserve Existing Code) 및 기능 단위 점진적 수정 (Incremental Changes).
  - 전체 컨텍스트 유지 (No Omissions) 및 임의 판단 금지.
  - 클래스/함수 단위 주석 필수 작성 및 소스 분할 검토 (300라인 기준).
