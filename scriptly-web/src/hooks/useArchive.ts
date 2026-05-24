/**
 * [Architecture Point: UI Layer - Custom Hook]
 * 컴포넌트에서 비즈니스 로직과 API 연동을 분리하여 재사용 가능하게 만든 Hook입니다.
 */
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export function useArchive() {
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
    fetchArchiveItems();
  }, [fetchArchiveItems]);

  // 보관함 분석 상태 폴링
  useEffect(() => {
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

  const handleReanalyze = async (sourceId: string, onSuccess?: () => void) => {
    try {
      await api.post(`/archive/source/${sourceId}/reanalyze`);
      if (onSuccess) onSuccess(); 
      fetchArchiveItems(); 
    } catch (e) { 
      console.error('Failed to reanalyze:', e); 
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
    handleDownloadFile,
    handleReanalyze,
    handleDeleteArchiveItem,
    selectedArchiveItem: selectedArchiveIndex !== null ? archiveItems[selectedArchiveIndex] : null
  };
}
