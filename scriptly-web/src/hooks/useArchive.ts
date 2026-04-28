/**
 * [Architecture Point: UI Layer - Custom Hook]
 * 컴포넌트에서 비즈니스 로직과 API 연동을 분리하여 재사용 가능하게 만든 Hook입니다.
 * 필사 시 상태 변화와 비동기 처리 로직의 흐름을 파악하십시오.
 */
import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/lib/utils";

export function useArchive() {
  const [archiveItems, setArchiveItems] = useState<any[]>([]);
  const [selectedArchiveIndex, setSelectedArchiveIndex] = useState<number | null>(null);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchArchiveItems = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/archive/sources`);
      if (response.ok) {
        const data = await response.json();
        setArchiveItems(data);
        if (data.length > 0 && selectedArchiveIndex === null) setSelectedArchiveIndex(0);
      }
    } catch (e) { console.error(e); }
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
      const response = await fetch(`${API_BASE_URL}/api/v1/archive/upload`, { method: "POST", body: formData });
      if (response.ok) { 
        if (onSuccess) onSuccess(); 
        fetchArchiveItems(); 
      }
      else { 
        const err = await response.json(); 
        if (onFailure) onFailure(err.detail || "업로드 실패"); 
      }
    } catch (e) { if (onFailure) onFailure("네트워크 오류"); }
    finally { setIsUploading(false); }
  };

  const handleUrlArchive = async (url: string, onSuccess?: () => void, onFailure?: (msg: string) => void) => {
    setIsUploading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/archive/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      });
      if (response.ok) {
        if (onSuccess) onSuccess();
        fetchArchiveItems();
      } else {
        const err = await response.json();
        if (onFailure) onFailure(err.detail || "분석 실패");
      }
    } catch (e) { if (onFailure) onFailure("네트워크 오류"); }
    finally { setIsUploading(false); }
  };

  const handleDownloadFile = async (sourceId: string, filename: string, onFailure?: () => void) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/archive/source/${sourceId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); a.remove();
      }
    } catch (e) { if (onFailure) onFailure(); }
  };

  const handleReanalyze = async (sourceId: string, onSuccess?: () => void) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/archive/source/${sourceId}/reanalyze`, { method: "POST" });
      if (response.ok) { 
        if (onSuccess) onSuccess(); 
        fetchArchiveItems(); 
      }
    } catch (e) { console.error(e); }
  };

  const handleDeleteArchiveItem = async (id: string, onSuccess?: () => void) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/archive/source/${id}`, { method: "DELETE" });
      if (response.ok) {
        setArchiveItems(prev => prev.filter(item => item.id !== id));
        setSelectedSourceIds(prev => prev.filter(i => i !== id));
        setSelectedArchiveIndex(null);
        if (onSuccess) onSuccess();
      }
    } catch (e) { console.error(e); }
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
