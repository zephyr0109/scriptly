import httpx
from bs4 import BeautifulSoup
import re
import logging
import asyncio

logger = logging.getLogger(__name__)

class CrawlingService:
    @staticmethod
    async def crawl_article(url: str) -> str:
        """주어진 뉴스 기사 URL로부터 본문 텍스트를 크롤링하여 정밀 추출합니다."""
        logger.info(f"Crawling article content from URL: {url}")
        
        # Google News RSS URL 디코딩 처리
        if "news.google.com" in url:
            try:
                from googlenewsdecoder import gnewsdecoder
                decoded_res = await asyncio.to_thread(gnewsdecoder, url, 1)
                if decoded_res.get("status"):
                    url = decoded_res["decoded_url"]
                    logger.info(f"Successfully decoded Google News URL to original: {url}")
            except Exception as gnews_err:
                logger.warning(f"Failed to decode Google News URL: {gnews_err}. Proceeding with original URL.")
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                # 인코딩이 정상적이지 않은 경우 apparent_encoding 으로 강제 복원하여 한글 깨짐 방지
                if response.encoding is None or response.encoding.upper() == 'ISO-8859-1':
                    response.encoding = response.apparent_encoding
                html_content = response.text
        except Exception as e:
            logger.error(f"Failed to download article html from {url}: {e}")
            raise Exception(f"기사 원문 다운로드 실패: {str(e)}")
            
        try:
            soup = BeautifulSoup(html_content, "html.parser")
            
            # 1. 대형 포털 뉴스 전용 파서
            # 네이버 뉴스
            if "news.naver.com" in url or "naver.me" in url:
                article_body = soup.find("div", id="dic_area") or soup.find("div", id="articleBodyContents")
                if article_body:
                    return CrawlingService._clean_extracted_text(article_body.get_text(separator="\n"))
            
            # 다음 뉴스
            if "news.daum.net" in url or "v.daum.net" in url:
                article_body = soup.find("div", class_="article_view") or soup.find("section", class_="box_view")
                if article_body:
                    return CrawlingService._clean_extracted_text(article_body.get_text(separator="\n"))

            # 2. 일반 언론사 대응용 범용 보일러플레이트 제거 알고리즘
            # 불필요한 메타/내비게이션 태그 전면 제거
            for tag in soup(["script", "style", "head", "title", "meta", "link", "noscript", "header", "footer", "nav", "aside", "iframe", "form", "button"]):
                tag.decompose()
                
            body_content = ""
            article_tag = soup.find("article")
            if article_tag:
                body_content = article_tag.get_text(separator="\n")
            else:
                # 텍스트 밀도가 높은 주요 div 컨테이너 후보 선별
                candidates = []
                pattern = re.compile(r"article|body|contents|content|text|detail|view", re.I)
                for div in soup.find_all("div"):
                    div_id = div.get("id", "")
                    div_class = " ".join(div.get("class", [])) if div.get("class") else ""
                    if pattern.search(div_id) or pattern.search(div_class):
                        candidates.append((div, len(div.get_text(strip=True))))
                
                if candidates:
                    candidates.sort(key=lambda x: x[1], reverse=True)
                    best_div = candidates[0][0]
                    body_content = best_div.get_text(separator="\n")
                else:
                    body_content = soup.body.get_text(separator="\n") if soup.body else soup.get_text(separator="\n")
                    
            cleaned_text = CrawlingService._clean_extracted_text(body_content)
            if len(cleaned_text.strip()) < 100:
                # 추출된 글자수가 너무 적으면 body 전체 텍스트로 보조 폴백
                fallback_text = soup.body.get_text(separator="\n") if soup.body else soup.get_text(separator="\n")
                cleaned_text = CrawlingService._clean_extracted_text(fallback_text)
                
            return cleaned_text
            
        except Exception as e:
            logger.error(f"Failed to parse article body from {url}: {e}")
            raise Exception(f"기사 본문 파싱 실패: {str(e)}")

    @staticmethod
    def _clean_extracted_text(text: str) -> str:
        """추출된 원문에서 불필요한 줄바꿈, 무의미한 저작권/공유라인 필터링"""
        if not text:
            return ""
            
        # 연속된 개행 및 다중 공백 압축
        text = re.sub(r"\n+", "\n", text)
        text = re.sub(r"[ \t]+", " ", text)
        
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        
        filtered_lines = []
        for line in lines:
            if len(line) < 5:  # 너무 짧은 네비게이션 라인 스킵
                continue
            # 저작권, 기자 이메일, 무단배포 광고 라인 필터링
            if re.search(r"googlesyndication|adservice|copyright|저작권자|무단전재|배포금지|기사제보|ⓒ|Copyrights", line, re.I):
                continue
            filtered_lines.append(line)
            
        return "\n".join(filtered_lines)
