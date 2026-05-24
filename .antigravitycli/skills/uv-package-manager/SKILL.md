---
name: uv-package-manager
description: 'uv'를 사용하여 Python 의존성 및 가상환경을 관리합니다. 'scriptly-api' 프로젝트에서 패키지 추가, 환경 동기화, 스크립트 실행이 필요할 때 사용합니다.
---

# Uv 패키지 매니저 (Uv Package Manager)

## 개요
이 스킬은 `uv`를 사용하여 Python 패키지와 가상 환경을 일관되게 관리하기 위한 표준 워크플로우를 제공합니다. `scriptly-api` 프로젝트의 의존성을 빠르고 효율적으로 관리하며, 프로젝트 설정(`pyproject.toml`, `uv.lock`)의 무결성을 유지합니다.

## 퀵 스타트 (Quick Start)
`scriptly-api` 디렉토리에서 다음 명령어를 주로 사용합니다:

- **패키지 추가**: `uv add <package_name>`
- **애플리케이션 실행**: `uv run python main.py`
- **환경 동기화**: `uv sync`
- **의존성 잠금**: `uv lock`

## 주요 작업 가이드

### 1. 의존성 관리
- **패키지 설치**: 새로운 라이브러리가 필요할 때 반드시 `uv add`를 사용하세요. 이는 `pyproject.toml`과 `uv.lock`을 자동으로 업데이트합니다.
- **개발용 의존성**: 테스트 도구(pytest)나 린터(ruff) 등은 `uv add --dev <package_name>`으로 추가합니다.
- **동기화**: `pyproject.toml` 설정과 실제 설치된 환경이 다를 경우 `uv sync`를 실행하여 일치시킵니다.

### 2. 환경 및 실행
- **스크립트 실행**: 모든 Python 명령어는 `uv run`을 접두어로 붙여 실행하여, 관리되는 가상 환경 내에서 동작하도록 합니다.
- **가상 환경 확인**: `uv`는 가상 환경을 자동으로 관리하지만, 필요한 경우 `uv venv`로 명시적으로 생성하거나 갱신할 수 있습니다.

### 3. 검증 및 문제 해결
- 설치된 패키지 목록 확인: `uv pip list`
- 패키지 인식 오류 발생 시: 먼저 `uv sync`를 실행하여 환경을 재정렬합니다.
- 상세 명령어는 `references/commands.md`를 참고하세요.

## 프로젝트 규칙
- **Scriptly API**: 명령어를 실행하기 전 반드시 `scriptly-api/` 루트 디렉토리에 `pyproject.toml`이 있는지 확인합니다.
- **재현성 유지**: 패키지를 수정한 후에는 반드시 `uv.lock`이 생성/업데이트되었는지 확인하여 Docker 빌드 및 타 환경에서의 재현성을 보장합니다.
