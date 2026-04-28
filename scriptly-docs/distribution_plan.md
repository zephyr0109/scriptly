# Scriptly 배포 및 네트워크 구성 계획 (Distribution Plan) v3

본 문서는 Oracle Cloud 환경(zephyr0109.duckdns.org)으로의 배포를 위한 네트워크 아키텍처 및 환경 설정 최적화 계획을 정의합니다.

## 1. 환경별 프로필(Profile) 전략

| 구분 | Local Profile (로컬 개발) | PRD Profile (도커 운영 - Oracle Cloud) |
| :--- | :--- | :--- |
| **API → DB** | `localhost:5432` | `scriptly-db:5432` |
| **API → Cache** | `localhost:6379` | `scriptly-cache:6379` |
| **Web → API** | `http://localhost:8000` | `http://zephyr0109.duckdns.org:8100` |
| **실행 방식** | `uv run`, `npm run dev` | `docker-compose up` |

## 2. 세부 네트워크 구성

### A. 인프라 계층 (Internal)
- **Database**: `scriptly-db` (Postgres/pgvector)
- **Cache**: `scriptly-cache` (Redis)
- **Backend**: `scriptly-api`

### B. 서비스 외부 노출 (External)
- **Web**: `http://zephyr0109.duckdns.org:3100`
- **API**: `http://zephyr0109.duckdns.org:8100`

## 3. 구현 방식 (Profile 기반)

### [Backend: scriptly-api]
- `docker-compose.yml`에서 `POSTGRES_HOST=scriptly-db`, `REDIS_URL=redis://scriptly-cache:6379/0` 주입.
- `main.py`의 CORS 허용 목록에 `http://zephyr0109.duckdns.org:3100` 추가.

### [Frontend: scriptly-web]
- PRD 빌드 시 `NEXT_PUBLIC_API_URL`을 `http://zephyr0109.duckdns.org:8100`으로 주입.

## 4. 실행 및 검증 절차

1.  **Step 1: docker-compose.yml 업데이트**
    - 컨테이너 이름을 `scriptly-db`, `scriptly-cache`, `scriptly-api` 등으로 명시.
    - `api` 환경 변수에 `POSTGRES_HOST=scriptly-db`, `REDIS_URL=redis://scriptly-cache:6379/0` 주입.
2.  **Step 2: API 소스 코드 유연화**
    - `database.py` 및 Redis 연동 로직에서 환경 변수 기반 호스트 로드 확인.
3.  **Step 3: Web 빌드 인자(ARG) 적용**
    - `docker-compose.yml` 내 `args`에 `NEXT_PUBLIC_API_URL=http://dangame.iptime.org:8100` 설정.
4.  **Step 4: 통합 테스트**
    - 로컬 개발 환경(localhost) 정상 동작 확인.
    - 도커 환경(PRD)에서 외부 DDNS를 통한 API 호출 및 DB 연동 성공 확인.

---
**최종 수정일**: 2026-04-26
**상태**: v2 업데이트 완료 (승인 대기)

**상태**: 승인 대기 중 (Draft)
