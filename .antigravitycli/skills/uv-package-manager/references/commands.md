# uv 주요 명령어 일람

## 프로젝트 관리
| 명령어 | 설명 |
| :--- | :--- |
| `uv init` | 새로운 Python 프로젝트 초기화 |
| `uv add <pkg>` | 의존성 추가 및 설치 |
| `uv remove <pkg>` | 의존성 제거 |
| `uv sync` | `pyproject.toml`에 맞춰 환경 동기화 |
| `uv lock` | `uv.lock` 파일 갱신 |

## 가상 환경 및 실행
| 명령어 | 설명 |
| :--- | :--- |
| `uv venv` | 가상 환경(`.venv`) 생성 |
| `uv run <cmd>` | 가상 환경 내에서 명령 실행 |
| `uv run python <file>` | 가상 환경에서 파이썬 스크립트 실행 |

## 패키지 검사
| 명령어 | 설명 |
| :--- | :--- |
| `uv pip list` | 설치된 패키지 목록 표시 |
| `uv pip tree` | 의존성 트리 표시 |
| `uv tree` | 프로젝트 의존성 구조 표시 |

## 캐시 및 툴링
| 명령어 | 설명 |
| :--- | :--- |
| `uv cache clean` | uv 캐시 삭제 |
| `uv tool install <pkg>` | 전역 도구로 설치 (예: ruff) |
