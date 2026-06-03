/**
 * [Architecture Point: UI Layer - Custom Hook]
 * 컴포넌트에서 비즈니스 로직과 API 연동을 분리하여 재사용 가능하게 만든 Hook입니다.
 */
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/hooks/useAuth";

export function useArchive() {
  const { isAuthenticated } = useAuthStore();
  const [archiveItems, setArchiveItems] = useState<any[]>([]);
  const [selectedArchiveIndex, setSelectedArchiveIndex] = useState<number | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchArchiveItems = useCallback(async () => {
    try {
      const response = await api.get('/archive/sources');
      const data = response.data;
      setArchiveItems(data);
      if (data.length > 0 && selectedArchiveIndex === null) setSelectedArchiveIndex(0);
    } catch (e) { 
      console.error('Failed to fetch archive items:', e); 
    }
  }, [selectedArchiveIndex]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchArchiveItems();
  }, [fetchArchiveItems, isAuthenticated]);

  // 보관함 분석 상태 폴링
  useEffect(() => {
    if (!isAuthenticated) return;
    const hasPendingItems = archiveItems.some(item => item.analysis_status === "PENDING" || item.analysis_status === "PROCESSING");
    if (!hasPendingItems) return;
    const intervalId = setInterval(() => { fetchArchiveItems(); }, 5000);
    return () => clearInterval(intervalId);
  }, [archiveItems, fetchArchiveItems]);

  const handleFileUpload = async (file: File, onSuccess?: () => void, onFailure?: (msg: string) => void) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post('/archive/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (onSuccess) onSuccess(); 
      fetchArchiveItems(); 
    } catch (e: any) { 
      if (onFailure) onFailure(e.response?.data?.detail || "업로드 실패"); 
    } finally { 
      setIsUploading(false); 
    }
  };

  const handleUrlArchive = async (url: string, onSuccess?: () => void, onFailure?: (msg: string) => void) => {
    setIsUploading(true);
    try {
      await api.post('/archive/url', { url });
      if (onSuccess) onSuccess();
      fetchArchiveItems();
    } catch (e: any) { 
      if (onFailure) onFailure(e.response?.data?.detail || "분석 실패");
    } finally { 
      setIsUploading(false); 
    }
  };

  const handleDownloadFile = async (sourceId: string, filename: string, onFailure?: () => void) => {
    try {
      const response = await api.get(`/archive/source/${sourceId}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { 
      if (onFailure) onFailure(); 
    }
  };

  const handleReanalyze = async (sourceId: string, onSuccess?: () => void, onFailure?: (msg: string) => void) => {
    try {
      await api.post(`/archive/source/${sourceId}/reanalyze`);
      if (onSuccess) onSuccess(); 
      fetchArchiveItems(); 
    } catch (e: any) { 
      console.error('Failed to reanalyze:', e); 
      if (onFailure) onFailure(e.response?.data?.detail || "AI 재분석 요청에 실패했습니다.");
    }
  };

  const handleCreateNote = async (title: string, content: string, onSuccess?: () => void, onFailure?: (msg: string) => void) => {
    setIsUploading(true);
    try {
      await api.post('/archive/note', { title, content });
      if (onSuccess) onSuccess();
      fetchArchiveItems();
    } catch (e: any) { 
      if (onFailure) onFailure(e.response?.data?.detail || "메모 저장 실패");
    } finally { 
      setIsUploading(false); 
    }
  };

  const handleUpdateNote = async (id: string, title: string, content: string, onSuccess?: () => void, onFailure?: (msg: string) => void) => {
    setIsUploading(true);
    try {
      await api.patch(`/archive/note/${id}`, { title, content });
      if (onSuccess) onSuccess();
      fetchArchiveItems();
    } catch (e: any) {
      if (onFailure) onFailure(e.response?.data?.detail || "메모 수정 실패");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteArchiveItem = async (id: string, onSuccess?: () => void) => {
    try {
      await api.delete(`/archive/source/${id}`);
      setArchiveItems(prev => prev.filter(item => item.id !== id));
      setSelectedSourceIds(prev => prev.filter(i => i !== id));
      setSelectedArchiveIndex(null);
      if (onSuccess) onSuccess();
    } catch (e) { 
      console.error('Failed to delete source:', e); 
    }
  };

  return {
    archiveItems,
    selectedArchiveIndex, setSelectedArchiveIndex,
    selectedSourceIds, setSelectedSourceIds,
    isUploading,
    fetchArchiveItems,
    handleFileUpload,
    handleUrlArchive,
    handleCreateNote,
    handleUpdateNote,
    handleDownloadFile,
    handleReanalyze,
    handleDeleteArchiveItem,
    selectedArchiveItem: selectedArchiveIndex !== null ? archiveItems[selectedArchiveIndex] : null
  };
}
