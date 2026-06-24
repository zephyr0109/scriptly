'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/hooks/useAuth";
import { useUIStore } from "@/store/useUIStore";
import { useArchive } from "@/hooks/useArchive";
import { useCuration } from "@/hooks/useCuration";
import { useInsightLab } from "@/hooks/useInsightLab";
import api from "@/lib/api";

/**
 * useMainDashboard 커스텀 훅
 * 메인 대시보드(IntegratedPrototype)에 필요한 모든 글로벌 상태, 훅 연동,
 * 로컬 UI 모달 및 CRUD 이벤트 핸들러 비즈니스 로직을 중앙 집약적으로 관리합니다.
 */
export function useMainDashboard() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();
  const { user, isAuthenticated, logout, hasHydrated } = useAuthStore();

  const {
    activeActivity, setActivity,
    inspirationSubTab, setInspirationSubTab,
    activeWorkspaceTab, setWorkspaceTab,
    isRightPanelOpen, toggleRightPanel, setRightPanelOpen,
    isDarkMode, setDarkMode,
    sidebarWidth, setSidebarWidth,
    selectedProjectId, selectProject,
    selectedInspirationId, selectInspiration,
    selectedArchiveId, selectArchive,
    isCollectModalOpen, isProjectModalOpen, isLinkArchiveModalOpen, isCharacterModalOpen, isPlotEventModalOpen,
    setModalOpen,
    
    // 캐릭터 폼 상태
    activeCharacterId, charName, charRole, charDesc, charDesire, charColor,
    charAge, charGender, charOccupation, charIsLocked,
    setCharacterForm, resetCharacterForm,

    // 플롯 사건 폼 상태
    activePlotEventId,
    plotEventTitle,
    plotEventTimeHint,
    plotEventContent,
    plotEventCharacterIds,
    setPlotEventForm,
    resetPlotEventForm
  } = useUIStore();

  const {
    archiveItems,
    selectedArchiveIndex, setSelectedArchiveIndex,
    isUploading,
    fetchArchiveItems,
    handleFileUpload,
    handleUrlArchive,
    handleCreateNote,
    handleUpdateNote,
    handleReanalyze,
    handleDeleteArchiveItem,
    localFolders,
    handleCreateLocalFolder,
    handleMoveToFolder,
    handleRenameFolder,
    handleDeleteFolder
  } = useArchive();

  const {
    searchQuery, setSearchQuery,
    newsResults, setSelectedNewsIndex,
    isLoading, isLoadingMore,
    isSaving, currentStart,
    isAnalyzingDetail,
    handleSearch,
    handleAnalyzeDetail,
    handleSaveToArchive,
    selectedNews
  } = useCuration(fetchArchiveItems);

  const {
    projects,
    setProjects,
    currentProject,
    fetchProjects,
    createProject,
    selectProject: hookSelectProject,
    updateProject,
    deleteProject,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    characters,
    events,
    isGeneratingPlot,
    createEvent,
    updateEvent,
    deleteEvent,
    reorderEvents,
    generatePlotDraft,
    generateLogline,
    generateSynopsis,
    isGeneratingSynopsis,
    
    // Scripts 추가 연동
    scripts,
    currentScript,
    setCurrentScript,
    isLoadingScripts,
    fetchScripts,
    createScript,
    updateScript,
    deleteScript,

    // React Flow 캔버스 & 캐릭터 동기화 상태/핸들러 추가
    nodes,
    setNodes,
    edges,
    setEdges,
    onNodesChange,
    onEdgesChange,
    syncCharacters,
    handleGenerateMapDraft,
    handleSaveLabSession
  } = useInsightLab(isDarkMode);

  // 1. 하이드레이션 마운트 및 로컬스토리지 복원이 완료되고 인증되지 않은 경우 강제 로그인 리다이렉트
  useEffect(() => {
    if (isMounted && hasHydrated && !isAuthenticated) {
      router.push("/login");
    }
  }, [isMounted, hasHydrated, isAuthenticated, router]);

  // 프로젝트 로드 및 싱크 초기화
  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, fetchProjects]);

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      selectProject(projects[0].id);
    }
  }, [projects, selectedProjectId, selectProject]);

  // selectedProjectId 변경 시 hookSelectProject 자동 호출 연동
  useEffect(() => {
    if (selectedProjectId) {
      const proj = projects.find(p => p.id === selectedProjectId);
      if (proj) {
        hookSelectProject(proj);
      }
    }
  }, [selectedProjectId, projects, hookSelectProject]);

  // 에디터 탭 진입 시 대본 목록 자동 동기화
  useEffect(() => {
    if (activeWorkspaceTab === "editor" && selectedProjectId) {
      fetchScripts(selectedProjectId);
    }
  }, [activeWorkspaceTab, selectedProjectId, fetchScripts]);

  // 반응형 Index 동기화 훅: Zustand ID 변경 시 custom hooks의 active index 상태를 자동 매핑
  useEffect(() => {
    if (selectedInspirationId) {
      const idx = newsResults.findIndex(n => n.id === selectedInspirationId);
      if (idx !== -1) {
        setSelectedNewsIndex(idx);
      }
    }
  }, [selectedInspirationId, newsResults, setSelectedNewsIndex]);

  useEffect(() => {
    if (selectedArchiveId) {
      const idx = archiveItems.findIndex(a => a.id === selectedArchiveId);
      if (idx !== -1) {
        setSelectedArchiveIndex(idx);
      }
    }
  }, [selectedArchiveId, archiveItems, setSelectedArchiveIndex]);

  // Toast 알림 헬퍼
  const [toasts, setToasts] = useState<any[]>([]);
  const addToast = useCallback((message: string, type: "success" | "info" | "warning" | "error" = "success") => {
    const id = Date.now();
    setToasts(prev => [{ id, message, type }, ...prev]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // 보관함 비동기 분석 상태 변화 감지 및 토스트 알림 연동
  const prevStatusesRef = useRef<Record<string, string>>({});
  useEffect(() => {
    if (!archiveItems || archiveItems.length === 0) return;
    archiveItems.forEach(item => {
      const prevStatus = prevStatusesRef.current[item.id];
      const currentStatus = item.analysis_status;
      if (prevStatus && prevStatus !== currentStatus) {
        if (prevStatus === "PENDING" || prevStatus === "PROCESSING") {
          if (currentStatus === "COMPLETED") {
            addToast("AI 분석이 완료되었습니다.", "success");
          } else if (currentStatus === "FAILED") {
            addToast("AI 분석에 실패했습니다.", "error");
          }
        }
      }
      prevStatusesRef.current[item.id] = currentStatus;
    });
  }, [archiveItems, addToast]);

  // 사이드바 리사이즈 제어
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
  
  // 프로젝트 참고 책장에 연결할 리스트 상태 (실제 백엔드 동기화와 병합 연동)
  const [projectLinkedInspirations, setProjectLinkedInspirations] = useState<string[]>([]);
  
  // 프로젝트 정보 수정 전용 로컬 상태 (Controlled Input 타이핑 렉 원천 해결)
  const [editProjectTitle, setEditProjectTitle] = useState("");
  const [editProjectGenre, setEditProjectGenre] = useState("");
  const [formatSelectMode, setFormatSelectMode] = useState("16부작 미니시리즈");
  const [customFormat, setCustomFormat] = useState("");
  const [editProjectAtmosphere, setEditProjectAtmosphere] = useState("");
  const [editProjectIntendedPurpose, setEditProjectIntendedPurpose] = useState("");
  const [editProjectCoreConflict, setEditProjectCoreConflict] = useState("");
  const [editProjectTheme, setEditProjectTheme] = useState("");
  const [editProjectLogline, setEditProjectLogline] = useState("");
  const [editProjectFullSynopsis, setEditProjectFullSynopsis] = useState("");

  const [isProjectManageModalOpen, setIsProjectManageModalOpen] = useState(false);
  const [isLinkInspirationProjectModalOpen, setIsLinkInspirationProjectModalOpen] = useState(false);
  const [activeInspirationForLink, setActiveInspirationForLink] = useState<any>(null);

  const handleOpenLinkInspirationProjectModal = useCallback((inspiration: any) => {
    setActiveInspirationForLink(inspiration);
    setIsLinkInspirationProjectModalOpen(true);
  }, []);

  const handleSaveInspirationProjectLinks = useCallback(async (inspirationId: string, selectedProjectIds: string[]) => {
    try {
      const updatePromises = projects.map(async (proj) => {
        const linkedSources = proj.linked_sources || [];
        const isCurrentlyLinked = linkedSources.includes(inspirationId);
        const shouldBeLinked = selectedProjectIds.includes(proj.id);

        if (shouldBeLinked && !isCurrentlyLinked) {
          const nextSources = [...linkedSources, inspirationId];
          return updateProject(proj.id, { linked_sources: nextSources });
        } else if (!shouldBeLinked && isCurrentlyLinked) {
          const nextSources = linkedSources.filter((id: string) => id !== inspirationId);
          return updateProject(proj.id, { linked_sources: nextSources });
        }
        return null;
      });

      await Promise.all(updatePromises);
      await fetchProjects();
    } catch (e) {
      console.error("Failed to batch update inspiration project links:", e);
      throw e;
    }
  }, [projects, updateProject, fetchProjects]);

  // 활성 프로젝트 변경 시 정보 로컬 상태 및 연결 영감 목록 동기화
  useEffect(() => {
    if (currentProject) {
      setEditProjectTitle(currentProject.title || "");
      setEditProjectGenre(currentProject.genre || "");
      
      const currentFormat = currentProject.format || "";
      const standardFormats = [
        "단막극 (1부작)",
        "2부작 단막극",
        "4부작 연작",
        "8부작 시리즈",
        "12부작 미니시리즈",
        "16부작 미니시리즈",
        "영화 (Feature)"
      ];
      if (standardFormats.includes(currentFormat)) {
        setFormatSelectMode(currentFormat);
        setCustomFormat("");
      } else if (currentFormat === "") {
        setFormatSelectMode("16부작 미니시리즈");
        setCustomFormat("");
      } else {
        setFormatSelectMode("custom");
        setCustomFormat(currentFormat);
      }

      setEditProjectAtmosphere(currentProject.atmosphere || "");
      setEditProjectIntendedPurpose(currentProject.intended_purpose || "");
      setEditProjectCoreConflict(currentProject.core_conflict || "");
      setEditProjectTheme(currentProject.theme || "");
      setEditProjectLogline(currentProject.logline || "");
      setEditProjectFullSynopsis(currentProject.full_synopsis || "");
      setProjectLinkedInspirations(currentProject.linked_sources || []);
    } else {
      setEditProjectTitle("");
      setEditProjectGenre("");
      setFormatSelectMode("16부작 미니시리즈");
      setCustomFormat("");
      setEditProjectAtmosphere("");
      setEditProjectIntendedPurpose("");
      setEditProjectCoreConflict("");
      setEditProjectTheme("");
      setEditProjectLogline("");
      setEditProjectFullSynopsis("");
      setProjectLinkedInspirations([]);
    }
  }, [currentProject]);

  // 기획 저장 단추 클릭 시 일괄 업데이트 핸들러
  const handleSaveProjectInfo = useCallback(async () => {
    if (!currentProject) return;
    if (!editProjectTitle.trim()) {
      addToast("기획 제목은 필수 항목입니다.", "warning");
      return;
    }
    
    const finalFormat = formatSelectMode === "custom" ? customFormat : formatSelectMode;
    
    try {
      await updateProject(currentProject.id, {
        title: editProjectTitle,
        genre: editProjectGenre,
        format: finalFormat,
        atmosphere: editProjectAtmosphere,
        intended_purpose: editProjectIntendedPurpose,
        core_conflict: editProjectCoreConflict,
        theme: editProjectTheme,
        logline: editProjectLogline
      });
      addToast("기획 정보가 저장되었습니다.", "success");
      await fetchProjects();
    } catch (e) {
      addToast("기획 저장에 실패했습니다.", "error");
    }
  }, [currentProject, editProjectTitle, editProjectGenre, formatSelectMode, customFormat, editProjectAtmosphere, editProjectIntendedPurpose, editProjectCoreConflict, editProjectTheme, editProjectLogline, updateProject, fetchProjects, addToast]);

  // 시놉시스 수동 저장 핸들러
  const handleSaveSynopsis = useCallback(async () => {
    if (!currentProject) return;
    try {
      await updateProject(currentProject.id, {
        logline: editProjectLogline,
        full_synopsis: editProjectFullSynopsis
      });
      addToast("시놉시스가 성공적으로 저장되었습니다.", "success");
      await fetchProjects();
    } catch (e) {
      addToast("시놉시스 저장에 실패했습니다.", "error");
    }
  }, [currentProject, editProjectLogline, editProjectFullSynopsis, updateProject, fetchProjects, addToast]);

  // AI 로그라인 생성 연동 핸들러
  const handleGenerateLogline = useCallback(async () => {
    if (!currentProject) return;
    try {
      const updated = await generateLogline(currentProject.id);
      if (updated) {
        setEditProjectLogline(updated.logline || "");
        addToast("AI 로그라인 생성에 성공했습니다.", "success");
      }
    } catch (err) {
      addToast("AI 로그라인 생성에 실패했습니다.", "error");
    }
  }, [currentProject, generateLogline, addToast]);

  // AI 시놉시스 생성 연동 핸들러
  const handleGenerateSynopsis = useCallback(async () => {
    if (!currentProject) return;
    try {
      const updated = await generateSynopsis(currentProject.id);
      if (updated) {
        setEditProjectFullSynopsis(updated.full_synopsis || "");
        addToast("AI 시놉시스 줄거리 생성에 성공했습니다.", "success");
      }
    } catch (err) {
      addToast("AI 시놉시스 줄거리 생성에 실패했습니다.", "error");
    }
  }, [currentProject, generateSynopsis, addToast]);

  // Word/PDF 기획서 다운로드 핸들러
  const handleExportDocument = useCallback(async (format: "word" | "pdf") => {
    if (!currentProject) return;
    try {
      const response = await api.get(`/projects/${currentProject.id}/export/${format}`, {
        responseType: "blob"
      });
      
      const blob = new Blob([response.data], {
        type: format === "word" 
          ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
          : "application/pdf"
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentProject.title}_synopsis.${format === "word" ? "docx" : "pdf"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addToast(`${format.toUpperCase()} 기획서가 성공적으로 다운로드되었습니다.`, "success");
    } catch (err) {
      console.error(err);
      addToast("기획서 내보내기 다운로드에 실패했습니다.", "error");
    }
  }, [currentProject, addToast]);

  // 영감 연결/해제 토글 핸들러 (백엔드 linked_sources 동기화)
  const handleToggleLinkInspiration = useCallback(async (inspirationId: string, shouldLink: boolean) => {
    if (!currentProject) {
      addToast("연결할 활성화 프로젝트가 없습니다.", "warning");
      return;
    }
    
    let nextIds = [...projectLinkedInspirations];
    if (shouldLink) {
      if (!nextIds.includes(inspirationId)) nextIds.push(inspirationId);
    } else {
      nextIds = nextIds.filter(id => id !== inspirationId);
    }
    
    try {
      await updateProject(currentProject.id, { linked_sources: nextIds });
      setProjectLinkedInspirations(nextIds);
      addToast(shouldLink ? "프로젝트에 연결되었습니다." : "연결이 해제되었습니다.", "success");
      await fetchProjects();
    } catch (e) {
      addToast("연결 처리에 실패했습니다.", "error");
    }
  }, [currentProject, projectLinkedInspirations, updateProject, fetchProjects, addToast]);

  // 기존 컴포넌트 프롭스 호환을 위한 상태 래퍼 오버라이드
  const setProjectLinkedInspirationsWrapper = useCallback((valOrFunc: any) => {
    if (typeof valOrFunc === "function") {
      setProjectLinkedInspirations(prev => {
        const next = valOrFunc(prev);
        const added = next.filter((x: string) => !prev.includes(x));
        const removed = prev.filter((x: string) => !next.includes(x));
        if (added.length > 0) {
          handleToggleLinkInspiration(added[0], true);
        } else if (removed.length > 0) {
          handleToggleLinkInspiration(removed[0], false);
        }
        return next;
      });
    } else {
      setProjectLinkedInspirations(valOrFunc);
    }
  }, [projectLinkedInspirations, handleToggleLinkInspiration]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) {
        setSidebarWidth(Math.max(200, Math.min(450, e.clientX - 64))); 
      }
    };
    const handleMouseUp = () => setIsResizingSidebar(false);
    
    if (isResizingSidebar) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingSidebar, setSidebarWidth]);

  // 최근 검색어 (쿠키 기반 최근 5개 유지, 초기값 추천 태그 탑재)
  const [recentQueries, setRecentQueries] = useState<string[]>(["비자금", "납치", "딥페이크", "로비"]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const getCookie = (name: string): string | null => {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) === ' ') c = c.substring(1, c.length);
          if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
      };

      const saved = getCookie("scriptly-recent-searches");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRecentQueries(parsed);
          }
        } catch (e) {}
      }
    }
  }, []);

  const addToRecentQueries = useCallback((query: string) => {
    if (!query.trim()) return;
    setRecentQueries(prev => {
      const filteredPrev = prev.filter(q => q !== query);
      const next = [query, ...filteredPrev].slice(0, 5);

      const setCookie = (name: string, value: string, days = 30) => {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "; expires=" + date.toUTCString();
        document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/; SameSite=Lax";
      };

      setCookie("scriptly-recent-searches", JSON.stringify(next));
      return next;
    });
  }, []);

  // 보관함 필터 및 정렬용 Local State
  const [archiveFilter, setArchiveFilter] = useState<string>("all");
  const [archiveSort, setArchiveSort] = useState<string>("date");

  // 직접 극작 메모(NOTE) 수정을 위한 Local State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editContent, setEditContent] = useState<string>("");

  // 캐릭터 CRUD 핸들러
  const handleOpenCharacterAdd = () => {
    resetCharacterForm();
    setModalOpen("character", true);
  };

  const handleOpenCharacterEdit = (char: any) => {
    setCharacterForm({
      id: char.id,
      name: char.name,
      role: char.role || "주연",
      desc: char.description || char.desc || "",
      desire: char.internal_desire || char.desire || "",
      color: char.color || "bg-blue-500/20 text-blue-400 border-blue-500/50",
      age: char.age || "",
      gender: char.gender || "",
      occupation: char.occupation || "",
      isLocked: char.is_locked || false
    });
    setModalOpen("character", true);
  };

  const handleSaveCharacter = async () => {
    if (!charName.trim()) {
      addToast("인물의 이름을 입력해주세요.", "error");
      return;
    }
    
    const payload = {
      name: charName,
      role: charRole,
      description: charDesc,
      internal_desire: charDesire,
      color: charColor || "bg-blue-500/20 text-blue-400 border-blue-500/50",
      age: charAge,
      gender: charGender,
      occupation: charOccupation,
      is_locked: charIsLocked
    };

    if (activeCharacterId) {
      await updateCharacter(activeCharacterId, payload);
      addToast(`인물 '${charName}'의 설정이 수정되었습니다.`, "success");
    } else {
      if (!selectedProjectId) {
        addToast("프로젝트가 선택되지 않았습니다.", "error");
        return;
      }
      await createCharacter({
        ...payload,
        project_id: selectedProjectId
      });
      addToast(`신규 인물 '${charName}'이(가) 등록되었습니다!`, "success");
    }
    setModalOpen("character", false);
  };

  // 플롯 에피소드 사건 이벤트 핸들러 정의
  const handleOpenEventAdd = () => {
    resetPlotEventForm();
    setModalOpen("plotEvent", true);
  };

  const handleOpenEventEdit = (evt: any) => {
    setPlotEventForm({
      id: evt.id,
      title: evt.title || "",
      timeHint: evt.time_hint || "",
      content: evt.content || "",
      characterIds: evt.related_character_ids || []
    });
    setModalOpen("plotEvent", true);
  };

  const handleSaveEvent = async () => {
    if (!plotEventTitle.trim()) {
      addToast("사건의 제목을 입력해주세요.", "error");
      return;
    }
    if (!selectedProjectId) {
      addToast("선택된 프로젝트가 없습니다.", "error");
      return;
    }

    const payload = {
      title: plotEventTitle,
      time_hint: plotEventTimeHint,
      content: plotEventContent,
      related_character_ids: plotEventCharacterIds
    };

    if (activePlotEventId) {
      await updateEvent(activePlotEventId, payload);
      addToast(`사건 '${plotEventTitle}'의 내용이 수정되었습니다.`, "success");
    } else {
      await createEvent({
        ...payload,
        project_id: selectedProjectId
      });
      addToast(`신규 사건 '${plotEventTitle}'이(가) 등록되었습니다!`, "success");
    }
    setModalOpen("plotEvent", false);
  };

  // 7. 실시간 뉴스 & 아카이브 데이터 퀵 인사이트 맵 바인딩
  const analyzedProjectsMap = useMemo(() => {
    const map: Record<string, any> = {};

    newsResults.forEach(item => {
      if (item.detail_analysis) {
        let da = item.detail_analysis;
        if (typeof da === "string") {
          try {
            da = JSON.parse(da);
          } catch (e) {
            console.error("Failed to parse detail_analysis:", e);
            return;
          }
        }

        if (da) {
          const peopleSource = da.people || da.related_people || da.characters || [];
          const keyEventsSource = da.incidents || da.key_events || da.events || [];
          map[item.id] = {
            score: da.tension_score || 0,
            scoreDesc: da.tension_reason || "실시간 분석 완료",
            conflictStructure: da.core_conflict || da.potential_conflict || da.conflict_structure || "대립 갈등 구도 분석 완료",
            summaryAndVibe: da.summary || da.summary_and_vibe || da.tension_reason || "줄거리 분석 완료",
            recommendedVibe: da.atmosphere || da.recommended_vibe || "리얼리즘 수사/법정 드라마",
            keywords: da.keywords || [],
            relatedPeople: Array.isArray(peopleSource) ? peopleSource.map((p: any) => ({
              role: p.role || p.name || "미상",
              desc: p.description || p.desc || "정보 분석",
              desire: p.desire || p.internal_desire || p.description || p.desc || "욕망"
            })) : [],
            keyEvents: Array.isArray(keyEventsSource) ? keyEventsSource : []
          };
        }
      }
    });

    archiveItems.forEach(item => {
      const meta = item.source_metadata || {};
      let da = meta.detailed_analysis || item.detailed_analysis;
      if (da) {
        if (typeof da === "string") {
          try {
            da = JSON.parse(da);
          } catch (e) {
            console.error("Failed to parse detailed_analysis from archive:", e);
            return;
          }
        }

        if (da) {
          const peopleSource = da.people || da.related_people || da.characters || [];
          const keyEventsSource = da.incidents || da.key_events || da.events || [];
          map[item.id] = {
            score: da.tension_score || item.tension_score || 0,
            scoreDesc: da.tension_reason || item.tension_reason || "보관 데이터 분석 완료",
            conflictStructure: da.core_conflict || da.potential_conflict || da.conflict_structure || "수집된 갈등 역학 구조",
            summaryAndVibe: da.summary || da.summary_and_vibe || da.tension_reason || "상세 내러티브 요약",
            recommendedVibe: da.atmosphere || da.recommended_vibe || "서스펜스 사회 스릴러",
            keywords: da.keywords || [],
            relatedPeople: Array.isArray(peopleSource) ? peopleSource.map((p: any) => ({
              role: p.role || p.name || "미상",
              desc: p.description || p.desc || "정보 프로필",
              desire: p.desire || p.internal_desire || p.description || p.desc || "내면적 욕망"
            })) : [],
            keyEvents: Array.isArray(keyEventsSource) ? keyEventsSource : []
          };
        }
      }
    });

    return map;
  }, [newsResults, archiveItems]);

  // 8. 현재 활성화된 기사 및 보관함 자산 퀵 매핑
  const currentInspiration = useMemo(() => {
    let item = null;
    if (inspirationSubTab === "search") {
      item = selectedNews;
    } else {
      item = selectedArchiveId ? archiveItems.find(a => a.id === selectedArchiveId) : null;
    }

    if (item) {
      return {
        ...item,
        url: item.source_url || item.url || item.article?.link || "#"
      };
    }
    return null;
  }, [selectedNews, selectedArchiveId, inspirationSubTab, archiveItems]);

  // 9. AI 분석 요청 수동 트리거 및 백엔드 1:1 연동
  const handleTriggerQuickAnalysis = async (id: string, isFromArchive = false) => {
    if (isFromArchive) {
      await handleReanalyze(
        id, 
        () => {
          addToast("AI 분석 요청이 접수되었습니다.", "info");
        },
        (msg) => {
          addToast(msg || "AI 분석에 실패했습니다.", "error");
        }
      );
    } else {
      await handleAnalyzeDetail(
        () => {
          addToast("AI 분석이 완료되었습니다.", "success");
        }, 
        (msg) => {
          addToast(msg || "AI 분석에 실패했습니다.", "error");
        }
      );
    }
  };

  // 프로젝트 참고 서랍 리스트
  const linkedReferenceItems = useMemo(() => {
    const list: any[] = [];
    archiveItems.forEach(item => {
      if (projectLinkedInspirations.includes(item.id)) {
        list.push({
          id: item.id,
          title: item.title,
          desc: item.summary || item.content.substring(0, 100) + "...",
          type: item.type === "NOTE" ? "✍️ 직접 메모" : item.type === "NEWS" ? "🔗 뉴스기사" : "📁 문서파일",
          date: new Date(item.ingested_at).toISOString().split("T")[0],
          source: item.original_filename || "극작 보관함 소스",
          vibe: item.source_metadata?.detailed_analysis?.recommended_vibe || "서스펜스 사회 스릴러"
        });
      }
    });
    return list;
  }, [projectLinkedInspirations, archiveItems]);

  return {
    isMounted,
    hasHydrated,
    isAuthenticated,
    isDarkMode,
    setDarkMode,
    router,
    user,
    logout,
    activeActivity,
    setActivity,
    inspirationSubTab,
    setInspirationSubTab,
    activeWorkspaceTab,
    setWorkspaceTab,
    isRightPanelOpen,
    toggleRightPanel,
    setRightPanelOpen,
    sidebarWidth,
    setSidebarWidth,
    selectedProjectId,
    selectProject,
    selectedInspirationId,
    selectInspiration,
    selectedArchiveId,
    selectArchive,
    isCollectModalOpen,
    isProjectModalOpen,
    isLinkArchiveModalOpen,
    isCharacterModalOpen,
    isPlotEventModalOpen,
    setModalOpen,
    
    // 캐릭터 폼 상태
    activeCharacterId,
    charName,
    charRole,
    charDesc,
    charDesire,
    charColor,
    charAge,
    charGender,
    charOccupation,
    charIsLocked,
    setCharacterForm,
    resetCharacterForm,

    // 플롯 사건 폼 상태
    activePlotEventId,
    plotEventTitle,
    plotEventTimeHint,
    plotEventContent,
    plotEventCharacterIds,
    setPlotEventForm,
    resetPlotEventForm,

    // 아카이브 데이터
    archiveItems,
    selectedArchiveIndex,
    setSelectedArchiveIndex,
    isUploading,
    fetchArchiveItems,
    handleFileUpload,
    handleUrlArchive,
    handleCreateNote,
    handleUpdateNote,
    handleReanalyze,
    handleDeleteArchiveItem,
    localFolders,
    handleCreateLocalFolder,
    handleMoveToFolder,
    handleRenameFolder,
    handleDeleteFolder,

    // 큐레이션 기사 검색
    searchQuery,
    setSearchQuery,
    newsResults,
    setSelectedNewsIndex,
    isLoading,
    isLoadingMore,
    isSaving,
    currentStart,
    isAnalyzingDetail,
    handleSearch,
    handleAnalyzeDetail,
    handleSaveToArchive,
    selectedNews,

    // 연구소
    projects,
    setProjects,
    currentProject,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    characters,
    events,
    isGeneratingPlot,
    createEvent,
    updateEvent,
    deleteEvent,
    reorderEvents,
    generatePlotDraft,
    generateLogline,
    generateSynopsis,
    isGeneratingSynopsis,
    
    // 대본 작성기
    scripts,
    currentScript,
    setCurrentScript,
    isLoadingScripts,
    fetchScripts,
    createScript,
    updateScript,
    deleteScript,

    // React Flow 캔버스
    nodes,
    setNodes,
    edges,
    setEdges,
    onNodesChange,
    onEdgesChange,
    syncCharacters,
    handleGenerateMapDraft,
    handleSaveLabSession,

    // 토스트 및 리사이즈
    toasts,
    setToasts,
    addToast,
    isResizingSidebar,
    setIsResizingSidebar,
    projectLinkedInspirations,
    setProjectLinkedInspirationsWrapper,
    editProjectTitle,
    setEditProjectTitle,
    editProjectGenre,
    setEditProjectGenre,
    formatSelectMode,
    setFormatSelectMode,
    customFormat,
    setCustomFormat,
    editProjectAtmosphere,
    setEditProjectAtmosphere,
    editProjectIntendedPurpose,
    setEditProjectIntendedPurpose,
    editProjectCoreConflict,
    setEditProjectCoreConflict,
    editProjectTheme,
    setEditProjectTheme,
    editProjectLogline,
    setEditProjectLogline,
    editProjectFullSynopsis,
    setEditProjectFullSynopsis,

    // 추가 모달 제어 상태
    isProjectManageModalOpen,
    setIsProjectManageModalOpen,
    isLinkInspirationProjectModalOpen,
    setIsLinkInspirationProjectModalOpen,
    activeInspirationForLink,
    handleOpenLinkInspirationProjectModal,
    handleSaveInspirationProjectLinks,

    // 극작 메모 수정용 로컬 상태
    isEditModalOpen,
    setIsEditModalOpen,
    editingNote,
    setEditingNote,
    editTitle,
    setEditTitle,
    editContent,
    setEditContent,

    // 캐릭터 및 이벤트 모달 트리거
    handleOpenCharacterAdd,
    handleOpenCharacterEdit,
    handleSaveCharacter,
    handleOpenEventAdd,
    handleOpenEventEdit,
    handleSaveEvent,

    // 추가 누락 함수들
    handleSaveProjectInfo,
    handleSaveSynopsis,
    handleGenerateLogline,
    handleGenerateSynopsis,
    handleExportDocument,
    handleToggleLinkInspiration,
    setActiveInspirationForLink,

    // 데이터 가공 맵 & 메모 목록
    analyzedProjectsMap,
    currentInspiration,
    linkedReferenceItems,
    handleTriggerQuickAnalysis,
    recentQueries,
    addToRecentQueries,
    archiveFilter,
    setArchiveFilter,
    archiveSort,
    setArchiveSort,
  };
}
