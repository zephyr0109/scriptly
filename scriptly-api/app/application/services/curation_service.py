"""
[Architecture Point: Application Layer - Service]
비즈니스 로직과 외부 서비스 오케스트레이션을 담당하는 서비스 계층입니다.
"""
import os
import json
import html
import re
import logging
from typing import List, Optional
from google import genai
from google.genai import types
from app.infrastructure.external_api.naver_api import NaverNewsService
from app.domain.schemas import NewsArticle, DramaticTensionScore, CurationResult, CharacterPersona

logger = logging.getLogger(__name__)

class CurationService:
    def __init__(self):
        self.naver_service = NaverNewsService()
        api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-2.0-flash")
        
        if api_key:
            self.client = genai.Client(api_key=api_key)
            logger.info(f"✅ Gemini client initialized with model: {self.model_name}")
        else:
            self.client = None
            logger.warning("⚠️ Gemini API Key not found")

    def _clean_html(self, text: str) -> str:
        """HTML 태그 제거 및 엔티티 디코딩"""
        if not text:
            return ""
        # HTML 태그 제거
        clean_text = re.sub(r'<[^>]*>', '', text)
        # HTML 엔티티 디코딩 (&quot; -> ")
        return html.unescape(clean_text)

    async def curate_news(self, query: str, limit: int = 5, start: int = 1) -> List[CurationResult]:
        logger.info(f"Executing curate_news with query: {query}, limit: {limit}...")
        try:
            # 1. Fetch news from Naver with start parameter
            raw_news = await self.naver_service.search_news(query, display=limit, start=start)
            
            results = []
            for item in raw_news:
                article = NewsArticle(
                    title=self._clean_html(item.get("title", "")),
                    link=item.get("link", ""),
                    description=self._clean_html(item.get("description", "")),
                    pubDate=item.get("pubDate", "")
                )
                
                # 2. Evaluate dramatic tension with Gemini
                evaluation = await self._evaluate_tension(article)
                
                # AI 분석 실패 시 기본값 제공
                if not evaluation:
                    evaluation = DramaticTensionScore(
                        score=0,
                        reason="AI 분석 실패 (API 키 누락 또는 기타 오류)",
                        potential_conflict="AI 분석 실패 (갈등 구조를 추출할 수 없습니다)"
                    )
                
                results.append(CurationResult(article=article, tension_evaluation=evaluation))

            # 3. Sort by tension score (highest first)
            results.sort(key=lambda x: x.tension_evaluation.score, reverse=True)
            return results
        except Exception as e:
            logger.error(f"Error in curate_news: {e}", exc_info=True)
            return []

    async def _evaluate_tension(self, article: NewsArticle) -> Optional[DramaticTensionScore]:
        if not self.client:
            return None

        prompt = f"""
        당신은 드라마 전문 기획자(Creative Producer)입니다. 다음 뉴스 기사를 분석하여, 이 사건이 드라마의 소재로 쓰일 때의 '드라마적 긴장감(Dramatic Tension)'을 평가해주세요.

        기사 제목: {article.title}
        기사 요약: {article.description}

        반드시 다음 JSON 형식으로만 응답하세요:
        {{
            "score": <1부터 10 사이의 정수>,
            "reason": "<해당 점수를 부여한 이유. 1~2문장>",
            "potential_conflict": "<핵심 인물 간의 갈등 구조>"
        }}
        """
        
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            
            data = json.loads(response.text)
            return DramaticTensionScore(
                score=data.get("score", 0),
                reason=data.get("reason", "AI 분석 실패 (JSON 데이터 부족)"),
                potential_conflict=data.get("potential_conflict", "AI 분석 실패 (갈등 구조 분석 실패)")
            )
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg:
                return DramaticTensionScore(
                    score=0,
                    reason="AI 분석 실패 (무료 티어 API 할당량 초과)",
                    potential_conflict="AI 분석 실패 (할당량 초과로 분석 불가)"
                )
            logger.error(f"Error in _evaluate_tension: {e}", exc_info=True)
            return DramaticTensionScore(
                score=0,
                reason=f"AI 분석 실패 (사유: {error_msg})",
                potential_conflict=f"AI 분석 실패 (사유: {error_msg})"
            )

    async def extract_persona(self, article: NewsArticle) -> Optional[CharacterPersona]:
        """뉴스 기사에서 드라마틱한 캐릭터 페르소나를 추출합니다."""
        logger.info(f"Executing extract_persona for article: {article.title[:30]}...")
        if not self.client:
            return None

        prompt = f"""
        당신은 드라마 캐릭터 디자이너입니다. 다음 뉴스 기사에서 캐릭터 페르소나를 추출하세요.

        기사 제목: {article.title}
        기사 요약: {article.description}

        반드시 다음 JSON 형식으로만 응답하세요:
        {{
            "name": "<이름>",
            "role": "<직업 및 역할>",
            "description": "<특징>",
            "internal_desire": "<내밀한 욕망>",
            "external_conflict": "<외부적 갈등>"
        }}
        """
        
        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            
            data = json.loads(response.text)
            return CharacterPersona(
                name=data.get("name", "미정"),
                role=data.get("role", "미정"),
                description=data.get("description", "AI 분석 실패"),
                internal_desire=data.get("internal_desire", "AI 분석 실패"),
                external_conflict=data.get("external_conflict", "AI 분석 실패")
            )
        except Exception as e:
            logger.error(f"Error in extract_persona: {e}", exc_info=True)
            return None
