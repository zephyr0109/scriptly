/**
 * [Architecture Point: UI Layer - Custom Hook]
 * 컴포넌트에서 비즈니스 로직과 API 연동을 분리하여 재사용 가능하게 만든 Hook입니다.
 */
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/hooks/useAuth";

export function useCuration(fetchArchiveItems: () => void) {
  const { isAuthenticated } = useAuthStore();
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
    if (!isAuthenticated) return;
    const fetchTrendingNews = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/news/trending');
        const data = response.data;
        setNewsResults(data);
        if (data.length > 0) setSelectedNewsIndex(0);
      } catch (e) {
        console.error('Failed to fetch trending news:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrendingNews();
  }, [isAuthenticated]);

  // 스카우터 상태 폴링 로직 (자동 일괄 분석 비활성화 및 수동 개별 동기 분석으로 변경되어 제거됨)
  // useEffect(() => {
  //   if (!isAuthenticated) return;
  //   const pendingItems = newsResults.filter(r => r.analysis_status === "PENDING" || r.analysis_status === "PROCESSING");
  //   if (pendingItems.length === 0) return;
  //   const intervalId = setInterval(async () => {
  //     try {
  //       const ids = pendingItems.map(item => item.id).join(",");
  //       const response = await api.get(`/news/status?ids=${ids}`);
  //       const data = response.data;
  //       
  //       setNewsResults(prevResults => {
  //         const nextResults = [...prevResults];
  //         let changed = false;
  //         data.results.forEach((statusData: any) => {
  //           const idx = nextResults.findIndex(r => r.id === statusData.id);
  //           if (idx !== -1 && statusData.analysis_status !== "PENDING" && statusData.analysis_status !== "PROCESSING") {
  //             nextResults[idx] = {
  //               ...nextResults[idx],
  //               analysis_status: statusData.analysis_status,
  //               detail_analysis: nextResults[idx].detail_analysis || statusData.detail_analysis,
  //               tension_evaluation: {
  //                 score: statusData.tension_score || 0,
  //                 reason: statusData.tension_reason || "분석 완료",
  //                 potential_conflict: statusData.potential_conflict || "확인 중"
  //               }
  //             };
  //             changed = true;
  //           }
  //         });
  //         return changed ? nextResults : prevResults;
  //       });
  //     } catch (e) { console.error('Failed to fetch analysis status:', e); }
  //   }, 3000);
  //   return () => clearInterval(intervalId);
  // }, [newsResults]);

  const handleSearch = async (query: string, start: number = 1, onSearchSuccess?: () => void) => {
    if (!query.trim()) return;
    if (start === 1) { setIsLoading(true); setNewsResults([]); } else { setIsLoadingMore(true); }
    try {
      const response = await api.post('/news/analyze', { query, limit: 10, start });
      const data = response.data;
      if (start === 1) { setNewsResults(data); setSelectedNewsIndex(data.length > 0 ? 0 : null); }
      else { setNewsResults(prev => [...prev, ...data]); }
      setCurrentStart(start);
      if (onSearchSuccess) onSearchSuccess();
    } catch (error) { 
      console.error('Search failed:', error); 
    } finally { 
      setIsLoading(false); 
      setIsLoadingMore(false); 
    }
  };

  const handleAnalyzeDetail = async (onSuccess?: () => void, onFailure?: (msg?: string) => void) => {
    if (selectedNewsIndex === null || !newsResults[selectedNewsIndex]) return;
    const targetNews = newsResults[selectedNewsIndex];
    setIsAnalyzingDetail(true);
    try {
      const response = await api.post(`/news/${targetNews.id}/analyze-detail`);
      const detailData = response.data;
      setNewsResults(prev => {
        const next = [...prev];
        next[selectedNewsIndex] = { ...next[selectedNewsIndex], detail_analysis: detailData };
        return next;
      });
      if (onSuccess) onSuccess();
    } catch (e) { 
      if (onFailure) onFailure(); 
    } finally { 
      setIsAnalyzingDetail(false); 
    }
  };

  const handleSaveToArchive = async (onSuccess?: () => void, onFailure?: (msg: string) => void) => {
    if (selectedNewsIndex === null || !newsResults[selectedNewsIndex]) return;
    const targetNews = newsResults[selectedNewsIndex];
    setIsSaving(true);
    try {
      await api.post(`/archive/scouter/${targetNews.id}`);
      if (onSuccess) onSuccess(); 
      fetchArchiveItems(); 
    } catch (e: any) { 
      if (onFailure) onFailure(e.response?.data?.detail || "저장 실패");
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
