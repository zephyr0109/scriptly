"""
[Architecture Point: Infrastructure Layer - External API]
외부 시스템(Naver API)과의 통신을 전담하는 인프라 계층입니다.
"""
import httpx
from typing import List, Dict
import os
from dotenv import load_dotenv

load_dotenv()

class NaverNewsService:
    def __init__(self):
        self.client_id = os.getenv("NAVER_CLIENT_ID")
        self.client_secret = os.getenv("NAVER_CLIENT_SECRET")
        self.base_url = "https://openapi.naver.com/v1/search/news.json"
        
        # Validate environment variables early to provide better error messages
        if not self.client_id or not self.client_secret:
            print("⚠️ [WARNING] NAVER_CLIENT_ID or NAVER_CLIENT_SECRET is missing in environment.")
            print("Ensure you have a .env file with NAVER_CLIENT_ID=... and NAVER_CLIENT_SECRET=...")

    async def search_news(self, query: str, display: int = 10, start: int = 1) -> List[Dict]:
        if not self.client_id or not self.client_secret:
            raise ValueError("Naver API credentials not set. Check your .env file.")

        headers = {
            "X-Naver-Client-Id": self.client_id,
            "X-Naver-Client-Secret": self.client_secret
        }
        params = {
            "query": query,
            "display": display,
            "start": start,
            "sort": "sim"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.base_url, headers=headers, params=params)
            response.raise_for_status()
            return response.json().get("items", [])

if __name__ == "__main__":
    import asyncio
    
    async def test():
        service = NaverNewsService()
        # Note: This will fail if NAVER_CLIENT_ID is not set in .env
        try:
            results = await service.search_news("드라마 소재")
            print(results)
        except Exception as e:
            print(f"Error: {e}")

    asyncio.run(test())
