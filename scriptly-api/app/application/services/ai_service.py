"""
[Architecture Point: Application Layer - Service]
비즈니스 로직과 외부 서비스 오케스트레이션을 담당하는 서비스 계층입니다.
"""
import os
import json
import logging
from typing import List
from google import genai
from google.genai import types
from fastapi import HTTPException
from app.domain.schemas import BatchEvaluationResult
from app.application.services.prompt_templates import LIGHTWEIGHT_SCORING_PROMPT

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        self.model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-2.0-flash")
        
        if api_key:
            self.client = genai.Client(api_key=api_key)
        else:
            self.client = None

    async def _safe_generate_content(self, model: str, contents: str, config: types.GenerateContentConfig = None, max_retries: int = 2):
        """Gemini API 호출 시 429/503 에러에 대한 재시도 및 예외 처리를 수행하는 헬퍼"""
        import asyncio
        for attempt in range(max_retries + 1):
            try:
                return await self.client.aio.models.generate_content(
                    model=model,
                    contents=contents,
                    config=config
                )
            except Exception as e:
                error_msg = str(e).lower()
                is_retryable = "503" in error_msg or "unavailable" in error_msg or "temporarily" in error_msg
                is_quota = "429" in error_msg or "quota" in error_msg
                
                if is_retryable and attempt < max_retries:
                    wait_time = (attempt + 1) * 2 # 2s, 4s...
                    logger.warning(f"Gemini API 503 error, retrying in {wait_time}s... (Attempt {attempt + 1}/{max_retries})")
                    await asyncio.sleep(wait_time)
                    continue
                
                if is_quota:
                    logger.warning(f"Gemini API Quota exceeded: {e}")
                    raise HTTPException(status_code=429, detail="AI 일당 사용량이 초과되었거나 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.")
                
                if is_retryable:
                    logger.error(f"Gemini API is currently unavailable after retries: {e}")
                    raise HTTPException(status_code=503, detail="현재 AI 모델 사용량이 급증하여 응답이 지연되고 있습니다. 1~2분 후 다시 시도해주세요.")
                
                logger.error(f"Gemini API Error: {e}")
                raise HTTPException(status_code=500, detail=f"AI 생성 중 오류가 발생했습니다: {str(e)}")

    async def analyze_batch(self, articles: List[dict]) -> List[BatchEvaluationResult]:
        logger.info(f"Executing analyze_batch with {len(articles)} articles...")
        if not self.client:
            raise ValueError("Gemini API not configured")

        # UUID truncation 방지를 위해 임시 정수 ID 매핑 사용
        id_map = {str(i+1): item["id"] for i, item in enumerate(articles)}
        temp_articles = [
            {"id": str(i+1), "title": item["title"], "content": item["content"]}
            for i, item in enumerate(articles)
        ]

        batch_json = json.dumps(temp_articles, ensure_ascii=False)
        prompt = LIGHTWEIGHT_SCORING_PROMPT.format(batch_json=batch_json)

        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            
            result_json = response.text.strip()
            if result_json.startswith("```json"): result_json = result_json[7:]
            elif result_json.startswith("```"): result_json = result_json[3:]
            if result_json.endswith("```"): result_json = result_json[:-3]
            result_json = result_json.strip()

            results_data = json.loads(result_json)
            
            final_results = []
            for item in results_data:
                temp_id = str(item.get("id"))
                if temp_id in id_map:
                    # 원래의 UUID로 복구
                    item["id"] = id_map[temp_id]
                    final_results.append(BatchEvaluationResult(**item))
                
            return final_results
        except json.JSONDecodeError as e:
            logger.error(f"Error in analyze_batch (JSON Decode): {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="AI 응답을 해석하는 중 오류가 발생했습니다.")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in analyze_batch: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="기사 분석 중 서버 오류가 발생했습니다.")

    async def analyze_detail(self, title: str, content: str) -> dict:
        """기사/파일 상세 분석 (Quick Insight + World Building) 수행"""
        logger.info(f"Executing analyze_detail for title: {title[:30]}...")
        if not self.client:
            raise ValueError("Gemini API not configured")

        from app.application.services.prompt_templates import DETAILED_INSIGHT_PROMPT
        prompt = DETAILED_INSIGHT_PROMPT.format(title=title, content=content[:8000]) # 텍스트 제한 완화

        try:
            response = await self._safe_generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            return json.loads(response.text.strip())
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in analyze_detail: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="심층 분석 중 서버 오류가 발생했습니다.")

    async def analyze_synthesis(self, sources: List[dict], creative_direction: dict) -> dict:
        """여러 소스를 하나의 드라마 서사로 합성 (Phase 2 핵심 기능)"""
        logger.info(f"Executing analyze_synthesis with {len(sources)} sources...")
        if not self.client:
            raise ValueError("Gemini API not configured")

        # 소스 데이터 포맷팅
        sources_text = ""
        for i, s in enumerate(sources):
            sources_text += f"\n[자료 {i+1}: {s['title']}]\n{s['content'][:2000]}\n"

        genre = creative_direction.get("genre", "드라마")
        tone = creative_direction.get("tone", "진지한")
        instruction = creative_direction.get("instruction", "")
        keywords = ", ".join(creative_direction.get("keywords", []))

        prompt = f"""
        당신은 세계적인 드라마 작가이자 크리에이티브 디렉터입니다. 
        제시된 {len(sources)}개의 서로 다른 자료들을 융합하여 하나의 강렬한 드라마 기획 초안을 만드세요.
        
        [창작 가이드라인]
        - 목표 장르: {genre}
        - 전체 톤: {tone}
        - 작가 지시사항: {instruction}
        - 핵심 키워드: {keywords}
        
        [분석할 자료들]
        {sources_text}
        
        위 자료들을 바탕으로 다음 JSON 형식으로만 응답하세요:
        {{
            "integrated_world_building": "자료들을 통합하여 설정한 드라마의 고유한 세계관 및 배경 설명",
            "intended_purpose": "작가의 창작 의도 및 기획 의도 제안 (강렬하고 드라마틱하게)",
            "core_conflict": "작품의 핵심 갈등이자 이야기의 원동력",
            "theme": "작품의 주요 주제 및 핵심 인사이트",
            "characters": [
                {{
                    "name": "인물명",
                    "role": "역할",
                    "internal_desire": "캐릭터의 핵심 욕망",
                    "external_conflict": "외부 갈등",
                    "description": "상세 설정"
                }}
            ],
            "relationships": [
                {{
                    "source_character": "인물 A",
                    "target_character": "인물 B",
                    "relation_type": "ENEMY | ALLY | LOVER | FAMILY | NEUTRAL",
                    "description": "관계 설명"
                }}
            ],
            "suggested_logline": "자료들을 관통하는 드라마의 핵심 로그라인 (한 문장)"
        }}
        """
        try:
            response = await self._safe_generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            return json.loads(response.text.strip())
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in analyze_synthesis: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="창작 합성 중 서버 오류가 발생했습니다.")

    async def generate_map_draft(self, project_context: dict, sources_context: List[dict], fixed_characters: List[dict] = None) -> dict:
        """기획안 및 영감 기반으로 캐릭터 맵 초안 생성 (Phase 7 핵심 기능)"""
        logger.info(f"Executing generate_map_draft for project: {project_context.get('title')}...")
        if not self.client:
            raise ValueError("Gemini API not configured")

        sources_info = ""
        for i, s in enumerate(sources_context):
            people_str = ", ".join(s.get("people_found", [])) if s.get("people_found") else s.get("summary", "정보 없음")
            sources_info += f"- [영감 {i+1}: {s['source_title']}] 발견된 주요 키워드/인물: {people_str}\n"

        fixed_chars_info = ""
        if fixed_characters:
            fixed_chars_info = "\n[고정 캐릭터 (Fixed Characters - 반드시 유지)]\n"
            for c in fixed_characters:
                fixed_chars_info += f"- {c['name']} ({c['role']}): {c['description']}\n"

        prompt = f"""
        당신은 베테랑 드라마 작가입니다. 
        사용자의 [작품 기획안]과 [수집된 영감 자료], 그리고 [고정된 핵심 인물]을 분석하여, 드라마틱하고 개성 넘치는 '인물 관계도 초안'을 완성하세요.
        
        [작품 기획안 Context]
        - 제목: {project_context.get('title')}
        - 형식/장르: {project_context.get('format')} / {project_context.get('genre')}
        - 분위기: {project_context.get('atmosphere')}
        - 핵심 갈등: {project_context.get('core_conflict')}
        - 주제: {project_context.get('theme')}
        
        [영감 자료 Context]
        {sources_info}
        {fixed_chars_info}
        
        [작업 지시사항]
        1. '고정 캐릭터'가 있다면 이들의 설정은 절대 변경하지 마세요. 이들을 중심으로 새로운 인물을 추가하거나 관계를 확장하세요.
        2. 등장인물은 '고정 캐릭터'를 포함하여 총 4명에서 10명 사이로 구성하세요.
        3. 각 인물은 '역할(role)'을 반드시 가져야 합니다 (역할 종류: 주연, 주조연, 조연, 단역, 카메오).
        4. 관계(relationships)는 두 인물을 잇는 '요약어(relation)'와 '상세 묘사(description)'를 포함해야 합니다.
           - relation: "연인", "적대", "숨겨진 가족" 등 5자 이내의 짧은 카테고리.
           - description: 관계에 얽힌 드라마틱한 상세 문장.
        
        반드시 다음 JSON 형식으로만 응답하세요:
        {{
            "characters": [
                {{
                    "name": "인물 이름",
                    "age": "나이(또는 30대 초반 등)",
                    "gender": "남성/여성/기타",
                    "role": "주연/주조연/조연/단역/카메오 중 택일",
                    "occupation": "이 캐릭터의 직업 (예: 형사, 변호사, 백수 등)",
                    "description": "이 캐릭터의 배경, 성격, 작품 내 위치 등 상세 설명",
                    "internal_desire": "캐릭터의 내밀한 욕망 (예: 인정받고 싶은 욕구, 복수심 등)",
                    "external_conflict": "캐릭터가 직면한 외부적 갈등 (예: 가난, 정치적 억압, 라이벌과의 경쟁 등)"
                }}
            ],
            "relationships": [
                {{
                    "source": "인물 A 이름",
                    "target": "인물 B 이름",
                    "relation": "요약어(5자 이내)",
                    "description": "드라마틱한 상세 묘사 문장"
                }}
            ]
        }}
        """

        try:
            response = await self._safe_generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            return json.loads(response.text.strip())
        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "quota" in error_msg.lower():
                logger.warning(f"Quota exceeded during map draft generation: {e}")
                # 맵 초안은 빈 결과보다는 429 에러를 올려보냄
                raise HTTPException(status_code=429, detail="AI 할당량 초과: 인물맵 생성은 잠시 후에 시도해주십시오.")
            logger.error(f"Error in generate_map_draft: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="인물맵 생성 중 서버 오류가 발생했습니다.")

    async def generate_plot_draft(self, project_context: dict, characters_context: List[dict], sources_context: List[dict]) -> dict:
        """기획안, 캐릭터, 영감을 기반으로 전체 플롯 타임라인 초안 생성"""
        logger.info(f"Executing generate_plot_draft for project: {project_context.get('title')}...")
        if not self.client:
            raise ValueError("Gemini API not configured")

        # 캐릭터 정보 포맷팅
        chars_info = ""
        for i, c in enumerate(characters_context):
            chars_info += f"- {c['name']} ({c.get('role', '조연')}, {c.get('occupation', '미설정')}): {c.get('description', '')}\n"

        # 영감 자료 정보 포맷팅
        sources_info = ""
        for i, s in enumerate(sources_context):
            # 상세 분석 결과가 있다면 주요 사건(incidents)을 추출
            analysis = s.get("source_metadata", {}).get("detailed_analysis", {})
            incidents = analysis.get("incidents", [])
            incidents_str = ", ".join(incidents) if incidents else s.get("summary", "상세 정보 없음")
            sources_info += f"- [영감 {i+1}: {s.get('title', '제목 없음')}] 주요 사건/단서: {incidents_str}\n"

        prompt = f"""
        당신은 실력 있는 드라마 작가이자 스토리보드 아티스트입니다. 
        사용자의 [작품 기획안], [캐릭터 설정], [수집된 영감 자료]를 바탕으로, 드라마틱한 '플롯 타임라인(사건 흐름) 초안'을 작성하세요.
        
        [작품 기획안 Context]
        - 제목: {project_context.get('title')}
        - 형식/장르: {project_context.get('format')} / {project_context.get('genre')}
        - 분위기: {project_context.get('atmosphere')}
        - 핵심 갈등: {project_context.get('core_conflict')}
        - 주제: {project_context.get('theme')}
        
        [캐릭터 Context]
        {chars_info}
        
        [영감 자료 Context]
        {sources_info}
        
        [작업 지시사항]
        1. 전체 이야기를 관통하는 주요 사건(Events)을 최소 5개에서 최대 12개 사이로 구성하세요.
        2. 각 사건은 반드시 'sequence', 'time_hint', 'title', 'content', 'related_characters'를 포함해야 합니다.
        3. 'time_hint'는 "오전 10시", "며칠 뒤 밤", "과거 회상", "결말부" 등 자유롭되 직관적인 표현을 사용하세요.
        4. 'content'는 사건의 핵심적인 행동과 대사, 감정적 전환점이 포함되도록 풍부하게 서술하세요.
        5. 'related_characters'는 위 [캐릭터 Context]에 명시된 인물들 중에서 해당 사건에 참여하는 인물들의 '이름'을 리스트 형태로 적으세요.
        6. 전체적인 흐름이 기획안의 '핵심 갈등'과 유기적으로 연결되도록 드라마틱하게 구성하세요.
        
        반드시 다음 JSON 형식으로만 응답하세요:
        {{
            "events": [
                {{
                    "sequence": 0,
                    "time_hint": "사건 발생 시각/시점",
                    "title": "사건 제목",
                    "content": "사건의 상세한 전개 내용 (풍부하게 서술)",
                    "related_characters": ["인물1 이름", "인물2 이름"]
                }}
            ]
        }}
        """

        try:
            response = await self._safe_generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            return json.loads(response.text.strip())
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in generate_plot_draft: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="플롯 초안 생성 중 서버 오류가 발생했습니다.")

    async def generate_logline(self, project_context: dict, events_context: List[dict]) -> str:
        """플롯 이벤트를 기반으로 드라마틱한 로그라인(1~3줄) 생성"""
        logger.info(f"Executing generate_logline for project: {project_context.get('title')}...")
        if not self.client:
            raise ValueError("Gemini API not configured")

        events_info = ""
        for i, e in enumerate(events_context):
            events_info += f"- {e.get('title')}: {e.get('content')}\n"

        prompt = f"""
        당신은 베테랑 작가입니다. 아래의 [사건 흐름]을 분석하여, 이 작품의 정체성을 한 눈에 보여줄 수 있는 '드라마틱한 로그라인'을 작성하세요.
        
        [작품 기본 정보]
        - 제목: {project_context.get('title')}
        - 기획의도: {project_context.get('intended_purpose')}
        - 핵심 갈등: {project_context.get('core_conflict')}
        
        [주요 사건 흐름]
        {events_info}
        
        [작업 지시사항]
        1. 전체 이야기를 1~3문장 사이로 강렬하게 요약하세요.
        2. 주인공의 목표와 이를 가로막는 장애물, 그리고 핵심적인 아이러니가 포함되도록 하세요.
        3. 단순한 나열이 아닌, 매력적인 한 문장(또는 수식어 포함 2-3문장)으로 작성하세요.
        
        로그라인 텍스트만 응답하세요.
        """
        try:
            response = await self._safe_generate_content(
                model=self.model_name,
                contents=prompt
            )
            return response.text.strip()
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in generate_logline: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="로그라인 생성 중 서버 오류가 발생했습니다.")

    async def generate_synopsis(self, project_context: dict, events_context: List[dict]) -> str:
        """플롯 이벤트를 기반으로 매끄러운 전체 줄거리 생성"""
        logger.info(f"Executing generate_synopsis for project: {project_context.get('title')}...")
        if not self.client:
            raise ValueError("Gemini API not configured")

        events_info = ""
        for i, e in enumerate(events_context):
            events_info += f"[{e.get('time_hint', f'사건 {i+1}')}] {e.get('title')}: {e.get('content')}\n\n"

        prompt = f"""
        당신은 실력 있는 소설가이자 시나리오 작가입니다. 아래의 [개별 사건들]을 유기적으로 연결하여, 독자가 읽기에 매끄럽고 흥미진진한 '전체 줄거리(Synopsis)'를 작성하세요.
        
        [작품 기본 정보]
        - 제목: {project_context.get('title')}
        - 기획의도: {project_context.get('intended_purpose')}
        - 핵심 갈등: {project_context.get('core_conflict')}
        - 주제: {project_context.get('theme')}
        
        [개별 사건들 (플롯)]
        {events_info}
        
        [작업 지시사항]
        1. 단순한 사건의 나열이 아니라, 인물의 감정과 사건의 인과관계가 잘 드러나도록 하나의 리드미컬한 서사로 재구성하세요.
        2. 문단 구분을 적절히 하여 가독성을 높이세요.
        3. 전체적인 주제 의식과 기획 의도가 자연스럽게 스며들도록 하세요.
        4. 분량은 사건의 중요도에 따라 조절하되, 전체 이야기를 온전히 담아내세요.
        
        재구성된 줄거리 텍스트만 응답하세요. 문단 구분(Enter)을 포함하여 완성된 형태로 작성하세요.
        """
        try:
            response = await self._safe_generate_content(
                model=self.model_name,
                contents=prompt
            )
            return response.text.strip()
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error in generate_synopsis: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="줄거리 생성 중 서버 오류가 발생했습니다.")
