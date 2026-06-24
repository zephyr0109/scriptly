"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PenTool, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// 레이아웃 컴포넌트 임포트
import ActivityBar from "@/components/layout/ActivityBar";
import SidebarPanel from "@/components/layout/SidebarPanel";
import WorkspaceContainer from "@/components/layout/WorkspaceContainer";
import RightInsightPanel from "@/components/layout/RightInsightPanel";
import ScouterGrid from "@/components/features/curation/ScouterGrid";
import ArchiveFilterGrid from "@/components/features/archive/ArchiveFilterGrid";

// 글로벌 모달 및 공통 컴포넌트 임포트
import CollectModal from "@/components/features/modals/CollectModal";
import ProjectCreateModal from "@/components/features/modals/ProjectCreateModal";
import LinkArchiveModal from "@/components/features/modals/LinkArchiveModal";
import CharacterModal from "@/components/features/modals/CharacterModal";
import LinkInspirationProjectModal from "@/components/features/modals/LinkInspirationProjectModal";
import PlotEventModal from "@/components/features/modals/PlotEventModal";
import ToastContainer from "@/components/layout/ToastContainer";

// 커스텀 훅 및 상태 관리 저장소 임포트
import { useCuration } from "@/hooks/useCuration";
import { useArchive } from "@/hooks/useArchive";
import { useInsightLab } from "@/hooks/useInsightLab";
import { useAuthStore } from "@/hooks/useAuth";
import { useUIStore } from "@/store/useUIStore";
import api from "@/lib/api";

/**
 * IntegratedPrototype 컴포넌트 (Scriptly 메인 대시보드)
 * 사용자의 모든 창작 도구와 영감 탐색/분석 데이터를 집약하고 조율하는 최상위 오케스트레이션 페이지입니다.
 */
export default function IntegratedPrototype() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. 사용자 인증 및 로그인 가드
  const router = useRouter();
  const { user, isAuthenticated, logout, hasHydrated } = useAuthStore();

  // 2. Zustand 글로벌 UI 상태 연동
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

  // 3. 보관함(Archive) 실 데이터 Custom Hook 연동
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

  // 4. 큐레이션 기사 검색(Curation) 실 데이터 Custom Hook 연동
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

  // 5. 연구소(Insight Lab) 실 데이터 Custom Hook 연동
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

  // 6. 하이드레이션 마운트 및 로컬스토리지 복원이 완료되고 인증되지 않은 경우 강제 로그인 리다이렉트
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
  const prevStatusesRef = React.useRef<Record<string, string>>({});
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
      setFormatSelectMode("16부작 miniseries");
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

  // 12. 최종 인증 및 하이드레이션 대기 가드
  if (!isMounted || !hasHydrated || !isAuthenticated) {
    return (
      <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-[#0D0D11]">
        <div className="absolute inset-0 opacity-10 blur-[100px] pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-amber-500 rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600 rounded-full" />
        </div>

        <div className="flex flex-col items-center gap-4 z-10 select-none animate-in fade-in duration-500">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-xl shadow-amber-500/10 border border-amber-500/20 animate-pulse">
            <PenTool size={28} className="text-white" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-[#E4E4ED] font-black text-sm tracking-wider uppercase">Scriptly</h1>
            <p className="text-zinc-500 text-[10px] font-bold tracking-tight">드라마 집필 보조 에이전트 시스템</p>
          </div>
          <div className="flex items-center gap-1.5 mt-2 bg-zinc-900/60 border border-zinc-800/80 px-3 py-1.5 rounded-full">
            <Loader2 size={12} className="animate-spin text-amber-500" />
            <span className="text-zinc-400 text-[9px] font-black tracking-tight">인증 상태를 확인하고 있습니다...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex h-screen w-screen overflow-hidden font-sans transition-all duration-300 antialiased selection:bg-amber-500/30 selection:text-amber-200 relative", 
      isDarkMode ? "dark bg-[#0D0D11] text-[#E4E4ED]" : "bg-[#F8F9FC] text-[#1E202B]"
    )}>
      
      {/* 1. Activity Bar (맨 왼쪽) */}
      <ActivityBar
        activeActivity={activeActivity}
        setActivity={setActivity}
        isDarkMode={isDarkMode}
        setDarkMode={setDarkMode}
        user={user}
        logout={logout}
        router={router}
      />

      {/* 2. Explorer Sidebar (사이드바) */}
      <SidebarPanel
        activeActivity={activeActivity}
        inspirationSubTab={inspirationSubTab}
        setInspirationSubTab={setInspirationSubTab}
        activeWorkspaceTab={activeWorkspaceTab}
        setWorkspaceTab={setWorkspaceTab}
        projects={projects}
        selectedProjectId={selectedProjectId}
        selectProject={selectProject}
        setModalOpen={setModalOpen}
        setIsProjectManageModalOpen={setIsProjectManageModalOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        recentQueries={recentQueries}
        addToRecentQueries={addToRecentQueries}
        archiveFilter={archiveFilter}
        setArchiveFilter={setArchiveFilter}
        archiveSort={archiveSort}
        setArchiveSort={setArchiveSort}
        isResizingSidebar={isResizingSidebar}
        setIsResizingSidebar={setIsResizingSidebar}
        sidebarWidth={sidebarWidth}
        isDarkMode={isDarkMode}
        addToast={addToast}
        fetchProjects={fetchProjects}
      />

      {/* 3. Main Workspace (메인 캔버스 영역) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* 상단 통합 헤더 */}
        <header className={cn(
          "h-16 border-b flex items-center justify-between px-8 z-40 shrink-0",
          isDarkMode ? "bg-[#0D0D11] border-zinc-800/80" : "bg-white border-zinc-200"
        )}>
          <div className="flex items-center gap-2.5 text-xs font-medium">
            {activeActivity === "inspiration" ? (
              <>
                <span className="font-bold">영감 기획실</span>
                <span className="text-zinc-600">/</span>
                <span className={cn("font-extrabold uppercase tracking-wide", isDarkMode ? "text-zinc-300" : "text-zinc-800")}>
                  {inspirationSubTab === "search" ? "영감 검색 (스카우터)" : "영감 보관함"}
                </span>
              </>
            ) : (
              <>
                <span className="font-bold">{currentProject?.title || "드라마 프로젝트"}</span>
                <span className="text-zinc-600">/</span>
                <span className={cn("font-extrabold uppercase tracking-wide", isDarkMode ? "text-zinc-300" : "text-zinc-800")}>
                  {activeWorkspaceTab === "info" && "프로젝트 정보"}
                  {activeWorkspaceTab === "characters" && "캐릭터 관계도"}
                  {activeWorkspaceTab === "plot" && "플롯 타임라인"}
                  {activeWorkspaceTab === "draft" && "AI 초안 & 시놉시스"}
                  {activeWorkspaceTab === "editor" && "대본 작성기 (Markdown)"}
                  {activeWorkspaceTab === "world" && "세계관 설정"}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => toggleRightPanel()}
              className={cn(
                "p-2 rounded-lg border transition-all",
                isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white" : "bg-white border-zinc-200 text-zinc-600 hover:text-zinc-955"
              )}
              title="우측 참고 분할 뷰 토글"
            >
              {isRightPanelOpen ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </header>

        {/* 중앙 워크스페이스 컨텐츠 영역 */}
        <div className="flex-1 flex overflow-hidden">
          
          {activeActivity === "inspiration" && (
            <div className="flex-1 flex overflow-hidden animate-in fade-in duration-300">
              
              {/* 1. 영감 검색 (Scouter) 메인 화면 */}
              {inspirationSubTab === "search" && (
                <div className="flex-grow flex flex-col min-w-0 overflow-hidden">
                  <ScouterGrid 
                    isLoading={isLoading} 
                    isLoadingMore={isLoadingMore}
                    activeInspirations={newsResults.map(item => ({
                      id: item.id,
                      title: item.article?.title || item.title || "기사 제목",
                      desc: item.article?.description || item.content || "기사 요약 내용",
                      keyword: item.article?.keyword || item.main_keyword || "시사속보",
                      source: item.article?.link?.includes("google.com") ? "구글 뉴스" : "네이버 뉴스",
                      date: item.article?.pubDate || ""
                    }))} 
                    selectInspiration={(id) => {
                      selectInspiration(id);
                    }}
                    searchQuery={searchQuery}
                    handleLoadMore={() => handleSearch(searchQuery, currentStart + 10)}
                  />
                </div>
              )}

              {/* 2. 수집된 영감 보관함 메인 화면 */}
              {inspirationSubTab === "archive" && (
                <div className="flex-grow flex flex-col min-w-0 overflow-hidden">
                  <ArchiveFilterGrid 
                    rawArchiveItems={archiveItems}
                    localFolders={localFolders}
                    handleCreateLocalFolder={handleCreateLocalFolder}
                    handleMoveToFolder={handleMoveToFolder}
                    handleRenameFolder={handleRenameFolder}
                    handleDeleteFolder={handleDeleteFolder}
                    addToast={addToast}
                    selectArchive={(id) => {
                      selectArchive(id);
                    }}
                    onEditClick={(item) => {
                      const originalItem = archiveItems.find(a => a.id === item.id);
                      if (originalItem) {
                        setEditingNote(originalItem);
                        setEditTitle(originalItem.title);
                        setEditContent(originalItem.content);
                        setIsEditModalOpen(true);
                      }
                    }}
                    onDeleteClick={async (id) => {
                      if (confirm("정말 이 영감 자산을 삭제하시겠습니까?")) {
                        await handleDeleteArchiveItem(id, () => {
                          addToast("영감 자산이 영구히 삭제되었습니다.", "success");
                        });
                      }
                    }}
                    archiveFilter={archiveFilter}
                    archiveSort={archiveSort}
                  />
                </div>
              )}
            </div>
          )}

          {activeActivity === "workspace" && (
            <WorkspaceContainer
              selectedProjectId={selectedProjectId}
              currentProject={currentProject}
              activeWorkspaceTab={activeWorkspaceTab}
              isDarkMode={isDarkMode}
              setModalOpen={setModalOpen}
              addToast={addToast}
              
              // ProjectInfo
              editProjectTitle={editProjectTitle}
              setEditProjectTitle={setEditProjectTitle}
              editProjectGenre={editProjectGenre}
              setEditProjectGenre={setEditProjectGenre}
              formatSelectMode={formatSelectMode}
              setFormatSelectMode={setFormatSelectMode}
              customFormat={customFormat}
              setCustomFormat={setCustomFormat}
              editProjectAtmosphere={editProjectAtmosphere}
              setEditProjectAtmosphere={setEditProjectAtmosphere}
              editProjectIntendedPurpose={editProjectIntendedPurpose}
              setEditProjectIntendedPurpose={setEditProjectIntendedPurpose}
              editProjectCoreConflict={editProjectCoreConflict}
              setEditProjectCoreConflict={setEditProjectCoreConflict}
              editProjectTheme={editProjectTheme}
              setEditProjectTheme={setEditProjectTheme}
              editProjectLogline={editProjectLogline}
              setEditProjectLogline={setEditProjectLogline}
              handleSaveProjectInfo={handleSaveProjectInfo}

              // Characters
              characters={characters}
              handleOpenCharacterAdd={handleOpenCharacterAdd}
              handleOpenCharacterEdit={handleOpenCharacterEdit}
              syncCharacters={syncCharacters}
              deleteCharacter={deleteCharacter}
              handleGenerateMapDraft={handleGenerateMapDraft}
              nodes={nodes}
              setNodes={setNodes}
              onNodesChange={onNodesChange}
              edges={edges}
              setEdges={setEdges}
              onEdgesChange={onEdgesChange}
              handleSaveLabSession={handleSaveLabSession}

              // Plot Timeline
              events={events}
              isGeneratingPlot={isGeneratingPlot}
              handleOpenEventAdd={handleOpenEventAdd}
              handleOpenEventEdit={handleOpenEventEdit}
              deleteEvent={deleteEvent}
              reorderEvents={reorderEvents}
              generatePlotDraft={generatePlotDraft}

              // Synopsis
              editProjectFullSynopsis={editProjectFullSynopsis}
              setEditProjectFullSynopsis={setEditProjectFullSynopsis}
              isGeneratingSynopsis={isGeneratingSynopsis}
              handleGenerateLogline={handleGenerateLogline}
              handleGenerateSynopsis={handleGenerateSynopsis}
              handleSaveSynopsis={handleSaveSynopsis}
              handleExportDocument={handleExportDocument}

              // Scripts Editor
              scripts={scripts}
              currentScript={currentScript}
              setCurrentScript={setCurrentScript}
              createScript={createScript}
              updateScript={updateScript}
              deleteScript={deleteScript}
              isLoadingScripts={isLoadingScripts}
            />
          )}
        </div>
      </main>

      {/* 4. 우측 보조 패널 */}
      <RightInsightPanel 
        currentInspiration={currentInspiration}
        isAnalyzingQuick={isAnalyzingDetail || isUploading}
        analyzedProjects={analyzedProjectsMap}
        handleTriggerQuickAnalysis={handleTriggerQuickAnalysis}
        linkedReferenceItems={linkedReferenceItems}
        projects={projects}
        archiveItems={archiveItems}
        onOpenLinkProjectModal={handleOpenLinkInspirationProjectModal}
        onRemoveReference={(id) => handleToggleLinkInspiration(id, false)}
        handleSaveToArchive={() => handleSaveToArchive(() => addToast("수집 기사가 영감 보관함에 복사 완료되었습니다.", "success"), (msg) => addToast(msg, "error"))}
        isSaving={isSaving}
        addToast={addToast}
      />

      {/* --- 글로벌 팝업 & 모달 기획창 --- */}
      
      {/* 1-2. 극작 메모 수정 모달 */}
      {isEditModalOpen && editingNote && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300">
          <div className="bg-[#14141A] border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-zinc-800/40 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-black text-white">✍️ 극작 메모 수정</h3>
                <span className="text-[10px] text-zinc-500">기존에 작성한 수집 아이디어나 메모의 제목 및 내용을 수정합니다.</span>
              </div>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingNote(null);
                }} 
                className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all"
              >
                <span className="text-xs">✕</span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5 bg-[#0A0A0E]/30">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">메모 제목</span>
                <input 
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="갈등의 성격을 대표하는 제목을 지어주세요..."
                  className="w-full bg-[#0E0E12] border border-zinc-800 p-3 rounded-2xl text-xs font-bold text-white focus:border-amber-500/50 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">메모 상세 기술</span>
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  placeholder="뉴스에서 영감을 얻은 서사적 대립, 캐릭터 관계 변화 및 긴장감 연출 요소를 상세히 적어보세요..."
                  className="w-full bg-[#0E0E12] border border-zinc-800 p-4 rounded-2xl text-xs font-semibold text-zinc-300 focus:border-amber-500/50 outline-none leading-relaxed transition-all resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800/40 flex justify-end gap-2.5 bg-[#0A0A0E]/50">
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingNote(null);
                }}
                className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-bold rounded-xl transition-all"
              >
                취소
              </button>
              <button 
                onClick={async () => {
                  if (!editTitle.trim()) {
                    addToast("메모 제목을 기입해주세요.", "warning");
                    return;
                  }
                  if (!editContent.trim()) {
                    addToast("메모 상세 내용을 적어주세요.", "warning");
                    return;
                  }
                  
                  await handleUpdateNote(
                    editingNote.id,
                    editTitle,
                    editContent,
                    () => {
                      addToast("메모가 수정되었습니다.", "success");
                      setIsEditModalOpen(false);
                      setEditingNote(null);
                    },
                    (msg) => {
                      addToast(msg, "error");
                    }
                  );
                }}
                disabled={isUploading}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
              >
                {isUploading ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. 신규 영감 수집 모달 */}
      <CollectModal 
        isOpen={isCollectModalOpen}
        onClose={() => setModalOpen("collect", false)}
        handleUrlArchive={handleUrlArchive}
        handleFileUpload={handleFileUpload}
        handleCreateNote={handleCreateNote}
        addToast={addToast}
      />

      {/* 2. 신규 드라마 기획 생성 모달 */}
      <ProjectCreateModal 
        isOpen={isProjectModalOpen}
        onClose={() => setModalOpen("project", false)}
        createProject={createProject}
        addToast={addToast}
      />

      {/* 3. 영감 불러오기 책장 연동 모달 */}
      <LinkArchiveModal 
        isOpen={isLinkArchiveModalOpen}
        onClose={() => setModalOpen("linkArchive", false)}
        archiveItems={archiveItems}
        projectLinkedInspirations={projectLinkedInspirations}
        setProjectLinkedInspirations={setProjectLinkedInspirationsWrapper}
        addToast={addToast}
      />

      {/* 4. 캐릭터 인물 추가/수정 CRUD 모달 */}
      <CharacterModal 
        isOpen={isCharacterModalOpen}
        onClose={() => setModalOpen("character", false)}
        activeCharacterId={activeCharacterId}
        charName={charName}
        charRole={charRole}
        charDesc={charDesc}
        charDesire={charDesire}
        charColor={charColor}
        charAge={charAge}
        charGender={charGender}
        charOccupation={charOccupation}
        charIsLocked={charIsLocked}
        setCharacterForm={setCharacterForm}
        handleSaveCharacter={handleSaveCharacter}
        deleteCharacter={deleteCharacter}
        addToast={addToast}
      />

      {/* 4.5 플롯 에피소드 사건 추가/수정 CRUD 모달 */}
      <PlotEventModal 
        isOpen={isPlotEventModalOpen}
        onClose={() => setModalOpen("plotEvent", false)}
        activePlotEventId={activePlotEventId}
        plotEventTitle={plotEventTitle}
        plotEventTimeHint={plotEventTimeHint}
        plotEventContent={plotEventContent}
        plotEventCharacterIds={plotEventCharacterIds}
        characters={characters}
        setPlotEventForm={setPlotEventForm}
        handleSaveEvent={handleSaveEvent}
        deleteEvent={deleteEvent}
        addToast={addToast}
      />

      {/* 6. 영감-프로젝트 다중 연결 설정 모달 */}
      <LinkInspirationProjectModal 
        isOpen={isLinkInspirationProjectModalOpen}
        onClose={() => {
          setIsLinkInspirationProjectModalOpen(false);
          setActiveInspirationForLink(null);
        }}
        inspiration={activeInspirationForLink}
        projects={projects}
        onSave={handleSaveInspirationProjectLinks}
        addToast={addToast}
      />

      {/* 5. 프로젝트 관리 및 순서제어 모달 */}
      {isProjectManageModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300">
          <div className="bg-[#14141A] border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-zinc-800/40 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-black text-white">⚙️ 드라마 프로젝트 기획안 관리</h3>
                <span className="text-[10px] text-zinc-500">생성된 기획안들의 우선순위 배열(순서)을 조정하거나 삭제합니다.</span>
              </div>
              <button 
                onClick={() => setIsProjectManageModalOpen(false)} 
                className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all"
              >
                <span className="text-xs">✕</span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 bg-[#0A0A0E]/30 max-h-[350px] overflow-y-auto custom-scrollbar-dark">
              {projects.length > 0 ? (
                projects.map((proj, idx) => (
                  <div 
                    key={proj.id}
                    className={cn(
                      "p-4.5 rounded-2xl border flex items-center justify-between transition-all",
                      selectedProjectId === proj.id 
                        ? "bg-[#1E1E28]/60 border-amber-500/40"
                        : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* 순서 조정 버튼 */}
                      <div className="flex flex-col gap-1">
                        <button 
                          disabled={idx === 0}
                          onClick={() => {
                            const next = [...projects];
                            const temp = next[idx];
                            next[idx] = next[idx - 1];
                            next[idx - 1] = temp;
                            setProjects(next);
                          }}
                          className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                        >
                          <span className="text-[10px] rotate-180 block">▼</span>
                        </button>
                        <button 
                          disabled={idx === projects.length - 1}
                          onClick={() => {
                            const next = [...projects];
                            const temp = next[idx];
                            next[idx] = next[idx + 1];
                            next[idx + 1] = temp;
                            setProjects(next);
                          }}
                          className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                        >
                          <span className="text-[10px] block">▼</span>
                        </button>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black text-white">{proj.title}</span>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{proj.genre || "장르 미설정"} • {proj.format || "16부작 미니시리즈"}</span>
                      </div>
                    </div>

                    <button 
                      onClick={async () => {
                        if (confirm(`정말 이 프로젝트('${proj.title}')를 영구 삭제하시겠습니까?\n하위 대본, 인물 설정 등 기획된 모든 서사 데이터가 영구 삭제됩니다.`)) {
                          const success = await deleteProject(proj.id);
                          if (success) {
                            addToast("드라마 프로젝트가 영구 삭제되었습니다.", "success");
                            if (selectedProjectId === proj.id) {
                              const remaining = projects.filter(p => p.id !== proj.id);
                              if (remaining.length > 0) {
                                selectProject(remaining[0].id);
                              } else {
                                selectProject("");
                              }
                            }
                          } else {
                            addToast("프로젝트 삭제에 실패했습니다.", "error");
                          }
                        }
                      }}
                      className="p-2 hover:bg-rose-500/10 rounded-xl text-zinc-500 hover:text-rose-500 transition-all"
                      title="프로젝트 삭제"
                    >
                      <span className="text-xs">🗑️</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500 text-xs">생성된 드라마 기획안 프로젝트가 없습니다.</div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-800/40 flex justify-end bg-[#0A0A0E]/50">
              <button 
                onClick={() => setIsProjectManageModalOpen(false)}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl transition-all shadow-lg active:scale-95"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 실시간 알림 토스트 컨테이너 */}
      <ToastContainer 
        toasts={toasts}
        setToasts={setToasts}
      />
    </div>
  );
}
