/**
 * [Architecture Point: UI Layer - Custom Hook]
 * 컴포넌트에서 비즈니스 로직과 API 연동을 분리하여 재사용 가능하게 만든 Hook입니다.
 * 필사 시 상태 변화와 비동기 처리 로직의 흐름을 파악하십시오.
 */
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/utils";

export function useCuration(fetchArchiveItems: () => void) {
  const [searchQuery, setSearchQuery] = useState("");
  const [newsResults, setNewsResults] = useState<any[]>([]);
  const [selectedNewsIndex, setSelectedNewsIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStart, setCurrentStart] = useState(1);
  const [isAnalyzingDetail, setIsAnalyzingDetail] = useState(false);

  // 트렌딩 뉴스 최초 로드
  useEffect(() => {
    const fetchTrendingNews = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/news/trending`);
        if (response.ok) {
          const data = await response.json();
          setNewsResults(data);
          if (data.length > 0) setSelectedNewsIndex(0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrendingNews();
  }, []);

  // 스카우터 상태 폴링 로직
  useEffect(() => {
    const pendingItems = newsResults.filter(r => r.analysis_status === "PENDING" || r.analysis_status === "PROCESSING");
    if (pendingItems.length === 0) return;
    const intervalId = setInterval(async () => {
      try {
        const ids = pendingItems.map(item => item.id).join(",");
        const res = await fetch(`${API_BASE_URL}/api/v1/news/status?ids=${ids}`);
        if (res.ok) {
          const data = await res.json();
          setNewsResults(prevResults => {
            const nextResults = [...prevResults];
            let changed = false;
            data.results.forEach((statusData: any) => {
              const idx = nextResults.findIndex(r => r.id === statusData.id);
              if (idx !== -1 && statusData.analysis_status !== "PENDING" && statusData.analysis_status !== "PROCESSING") {
                nextResults[idx] = {
                  ...nextResults[idx],
                  analysis_status: statusData.analysis_status,
                  detail_analysis: statusData.detail_analysis,
                  tension_evaluation: {
                    score: statusData.tension_score || 0,
                    reason: statusData.tension_reason || "분석 완료",
                    potential_conflict: statusData.potential_conflict || "확인 중"
                  }
                };
                changed = true;
              }
            });
            return changed ? nextResults : prevResults;
          });
        }
      } catch (e) { console.error(e); }
    }, 3000);
    return () => clearInterval(intervalId);
  }, [newsResults]);

  const handleSearch = async (query: string, start: number = 1, onSearchSuccess?: () => void) => {
    if (!query.trim()) return;
    if (start === 1) { setIsLoading(true); setNewsResults([]); } else { setIsLoadingMore(true); }
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/news/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 10, start })
      });
      if (response.ok) {
        const data = await response.json();
        if (start === 1) { setNewsResults(data); setSelectedNewsIndex(data.length > 0 ? 0 : null); }
        else { setNewsResults(prev => [...prev, ...data]); }
        setCurrentStart(start);
        if (onSearchSuccess) onSearchSuccess();
      }
    } catch (error) { console.error(error); } finally { setIsLoading(false); setIsLoadingMore(false); }
  };

  const handleAnalyzeDetail = async (onSuccess?: () => void, onFailure?: (msg?: string) => void) => {
    if (selectedNewsIndex === null || !newsResults[selectedNewsIndex]) return;
    const targetNews = newsResults[selectedNewsIndex];
    setIsAnalyzingDetail(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/news/${targetNews.id}/analyze-detail`, { method: "POST" });
      if (response.ok) {
        const detailData = await response.json();
        setNewsResults(prev => {
          const next = [...prev];
          next[selectedNewsIndex] = { ...next[selectedNewsIndex], detail_analysis: detailData };
          return next;
        });
        if (onSuccess) onSuccess();
      } else {
        if (onFailure) onFailure();
      }
    } catch (e) { if (onFailure) onFailure(); } finally { setIsAnalyzingDetail(false); }
  };

  const handleSaveToArchive = async (onSuccess?: () => void, onFailure?: (msg: string) => void) => {
    if (selectedNewsIndex === null || !newsResults[selectedNewsIndex]) return;
    const targetNews = newsResults[selectedNewsIndex];
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/archive/scouter/${targetNews.id}`, { method: "POST" });
      if (response.ok) { 
        if (onSuccess) onSuccess(); 
        fetchArchiveItems(); 
      }
      else { 
        const err = await response.json(); 
        if (onFailure) onFailure(err.detail || "저장 실패");
      }
    } catch (e) { 
      if (onFailure) onFailure("네트워크 오류");
    } finally { 
      setIsSaving(false); 
    }
  };

  return {
    searchQuery, setSearchQuery,
    newsResults, setNewsResults,
    selectedNewsIndex, setSelectedNewsIndex,
    isLoading, isLoadingMore,
    isSaving, currentStart,
    isAnalyzingDetail,
    handleSearch,
    handleAnalyzeDetail,
    handleSaveToArchive,
    selectedNews: selectedNewsIndex !== null ? newsResults[selectedNewsIndex] : null
  };
}
