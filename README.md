# Scriptly: 드라마 작가를 위한 AI 집필 보조 도구

Scriptly는 드라마 작가들이 뉴스 기사에서 영감을 얻고, AI를 활용해 이를 매력적인 드라마적 자산으로 변환할 수 있도록 돕는 강력한 도구입니다.

## 🚀 시작하기

### 사전 요구 사항
- Docker 및 Docker Compose
- Node.js 18+
- Python 3.11+
- 네이버 API 자격 증명 (Client ID, Secret)
- Google Gemini API 키

### 인프라 설정
1. `.env.example` 파일을 `.env`로 복사하고 API 키를 입력합니다.
2. 데이터베이스와 Redis를 실행합니다:
   ```bash
   docker-compose up -d
   ```

### 백엔드 설정 (`scriptly-api/`)
1. 가상 환경을 생성합니다:
   ```bash
   cd scriptly-api
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```
2. 의존성 패키지를 설치합니다:
   ```bash
   pip install -r requirements.txt
   ```
3. 백엔드 서버를 실행합니다:
   ```bash
   python main.py
   ```

### 프론트엔드 설정 (`scriptly-web/`)
1. 의존성 패키지를 설치합니다:
   ```bash
   cd scriptly-web
   npm install
   ```
2. 개발 서버를 실행합니다:
   ```bash
   npm run dev
   ```

## 🏗 디렉토리 구조
- `scriptly-web/`: Next.js 프론트엔드 및 BFF(Backend For Frontend).
- `scriptly-api/`: AI 에이전트 로직을 위한 Python FastAPI 백엔드.
- `docker-compose.yml`: 로컬 PostgreSQL (pgvector 포함) 및 Redis 설정.

## 🛠 주요 기능
1. **CurationService**: 네이버 API를 사용하여 뉴스 데이터를 수집하고 드라마적 긴장감에 따라 점수를 매깁니다.
2. **InsightService**: Gemini LLM을 사용하여 인물 관계도와 숨겨진 욕망을 추출합니다.
3. **ArchivingService**: 사용자 메모 및 메타데이터와 함께 "영감 카드"를 저장합니다.
