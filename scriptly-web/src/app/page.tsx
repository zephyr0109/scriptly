"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, Archive, Folder, Plus, Info, Users, GitCommit, FileText, 
  PenTool, Settings, LogOut, ChevronRight, ChevronDown, Eye, EyeOff,
  Sun, Moon, Search, Trash2, CornerDownRight, Check, Save, 
  HelpCircle, ArrowRight, Filter, ExternalLink, Upload, Globe, File, Calendar, SortAsc, X, Flame, ShieldAlert,
  Compass, Bookmark, BookmarkCheck, RefreshCw, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

// 아토믹 서브 컴포넌트 임포트
import RightInsightPanel from "@/components/layout/RightInsightPanel";
import ScouterGrid from "@/components/features/curation/ScouterGrid";
import ArchiveFilterGrid from "@/components/features/archive/ArchiveFilterGrid";
import CharacterMapDualView from "@/components/features/insight/CharacterMapDualView";
import PlotTimeline from "@/components/features/insight/PlotTimeline";
import ScriptEditor from "@/components/features/editor/ScriptEditor";

// 신규 리팩토링 모달/토스트 컴포넌트 임포트
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

const cleanHtml = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/<[^>]*>/g, "") // 모든 HTML 태그 영구 척결
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .trim();
};

export default function IntegratedPrototype() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. 사용자 인증 및 로그인 가드 복원
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
    charAge, charGender, charOccupation,
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
    selectedSourceIds, setSelectedSourceIds,
    isUploading,
    fetchArchiveItems,
    handleFileUpload,
    handleUrlArchive,
    handleCreateNote,
    handleUpdateNote,
    handleDownloadFile,
    handleReanalyze,
    handleDeleteArchiveItem
  } = useArchive();

  // 4. 큐레이션 기사 검색(Curation) 실 데이터 Custom Hook 연동
  const {
    searchQuery, setSearchQuery,
    newsResults, setNewsResults,
    selectedNewsIndex, setSelectedNewsIndex,
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
    isLoadingProjects,
    fetchProjects,
    createProject,
    selectProject: hookSelectProject,
    updateProject,
    deleteProject,
    fetchCharacters,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    characters,
    events,
    isGeneratingPlot,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    reorderEvents,
    generatePlotDraft,
    generateLogline,
    generateSynopsis,
    exportProject,
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

  // selectedProjectId 변경 시 hookSelectProject 자동 호출 연동 (파라미터 안전성 및 로딩 보장)
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

  // 반응형 Index 동기화 훅: Zustand ID 변경 시 custom hooks의 active index 상태를 뒤에서 자동 매핑
  useEffect(() => {
    if (selectedInspirationId) {
      const idx = newsResults.findIndex(n => n.id === selectedInspirationId);
      if (idx !== -1 && idx !== selectedNewsIndex) {
        setSelectedNewsIndex(idx);
      }
    }
  }, [selectedInspirationId, newsResults, selectedNewsIndex, setSelectedNewsIndex]);

  useEffect(() => {
    if (selectedArchiveId) {
      const idx = archiveItems.findIndex(a => a.id === selectedArchiveId);
      if (idx !== -1 && idx !== selectedArchiveIndex) {
        setSelectedArchiveIndex(idx);
      }
    }
  }, [selectedArchiveId, archiveItems, selectedArchiveIndex, setSelectedArchiveIndex]);

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
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8100/api/v1"}/projects/${currentProject.id}/export/${format}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
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
      // 쿠키 로드 헬퍼
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

      // 쿠키 저장 헬퍼
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

  // 1단계 자유 대본 작성기 에디터 텍스트 상태
  const [scriptText, setScriptText] = useState<string>(
    `# 1. 서부지검 검사장실 - 낮\n\n대리석으로 마감된 널찍한 검사장실. 무거운 침묵이 방 안을 채운다.\n검사장 자리에 앉은 강원철이 골치 아프다는 듯 미간을 짚고 있다.\n그 앞에 단정히 서 있는 황시목(30대 후반, 검사).\n\n강원철\n(한숨을 푹 쉬며)\n또 네 녀석이군. 이번엔 청와대 수석비서관을 건드려? 제정신인가?\n\n황시목\n(표정의 변화 없이 냉정히)\n법 앞에 성역이 없다고 배우지 않았습니까.\n\n강원철\n(벌떡 일어선다)\n성역? 그 성역이 네 목을 칠 수도 있어! 적당히 타협하는 법을 배워라!\n\n황시목\n그럼 검사복을 벗어야지요. 법이 아닌 세력을 쫓을 거라면.\n\n강원철\n(말문이 막혀 씩씩대다가 다시 주저앉는다)\n나가 봐. 오늘부로 너에 대한 감찰 부서 내사가 시작될 거다.\n\n# 2. 강력계 회의실 - 밤\n\n화이트보드에 빼곡히 적힌 용의자 관계도.\n스탠드 불빛 아래 한여진(30대 후반, 경감)이 컵라면을 불며 자료를 노려보고 있다.\n이때, 문이 조용히 열리며 황시목이 들어선다.\n\n한여진\n(라면을 먹다 멈칫하고 웃음 띤 얼굴로)\n어, 검사님? 이 야밤에 강력반까지 웬일이에요? 또 쫓겨나기 직전인가 보죠?\n\n황시목\n(주머니에 손을 넣은 채 걸어온다)\n의문사가 발견된 USB의 암호 해석이 끝났습니다. 강남 유흥업소 비자금 리스트입니다.`
  );

  // Outline 실시간 파싱 씬 리스트
  const outline = useMemo(() => {
    return scriptText.split("\n")
      .filter(line => line.startsWith("#"))
      .map((line, idx) => ({
        id: `scene_${idx}`,
        title: line.replace(/^#+\s*/, ""),
        rawLine: line
      }));
  }, [scriptText]);

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
      occupation: char.occupation || ""
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
      occupation: charOccupation
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



  // 7. 실시간 뉴스 & 아카이브 데이터 퀵 인사이트 맵 바인딩 (더미 배제 및 Gemini 분석 1:1 맵핑)
  const analyzedProjectsMap = useMemo(() => {
    const map: Record<string, any> = {};

    // A. 실시간 검색 뉴스 매핑
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

    // B. 보관함 소스 매핑 (type: NEWS, FILE, NOTE 대응)
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

  // 8. 현재 활성화된 기사 및 보관함 자산 퀵 매핑 (URL 바인딩 및 안전 참조 보완)
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

  // 9. AI 분석 요청 수동 트리거 및 백엔드 1:1 연동 (Index 동기화 완벽 보완)
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

  // 보관함 필터 계산
  const computedArchives = useMemo(() => {
    let list = [...archiveItems];
    
    // 백엔드 SourceType NOTE, NEWS, FILE 완벽 분류 연동
    if (archiveFilter !== "all") {
      list = list.filter(item => {
        if (archiveFilter === "text") return item.type === "NOTE";
        if (archiveFilter === "url") return item.type === "NEWS";
        if (archiveFilter === "file") return item.type === "FILE";
        return true;
      });
    }

    list.sort((a, b) => {
      if (archiveSort === "name") {
        return a.title.localeCompare(b.title, "ko");
      } else {
        return new Date(b.ingested_at || b.created_at).getTime() - new Date(a.ingested_at || a.created_at).getTime();
      }
    });

    return list;
  }, [archiveItems, archiveFilter, archiveSort]);

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
        {/* 블러 처리된 메인화면 형태의 은은한 백그라운드 데코레이션 */}
        <div className="absolute inset-0 opacity-10 blur-[100px] pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-amber-500 rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600 rounded-full" />
        </div>

        {/* 중앙 로딩 스크린 */}
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
      
      {/* 1. Activity Bar (맨 왼쪽) - 최하단 margin을 조정하여 Next Indicator 겹침 방지 */}
      <aside className={cn(
        "w-[64px] flex flex-col items-center py-6 gap-8 border-r z-45 shrink-0",
        isDarkMode ? "bg-[#09090C] border-zinc-800/80" : "bg-[#F0F2F7] border-zinc-200"
      )}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
          <PenTool size={20} className="text-white" />
        </div>

        <nav className="flex flex-col gap-3 w-full px-2 flex-1">
          {[
            { id: "inspiration", icon: Sparkles, label: "영감 검색 & 보관" },
            { id: "workspace", icon: Folder, label: "작업 공간" }
          ].map(tab => {
            const isActive = activeActivity === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActivity(tab.id as any);
                }}
                title={tab.label}
                className={cn(
                  "relative group w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                  isActive 
                    ? (isDarkMode ? "bg-amber-500 text-black shadow-lg shadow-amber-500/10 font-bold" : "bg-[#1E202B] text-white shadow-md font-bold")
                    : (isDarkMode ? "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200" : "text-zinc-500 hover:bg-zinc-300/40 hover:text-zinc-900")
                )}
              >
                <tab.icon size={22} className="transition-transform group-hover:scale-105" />
                <div className={cn(
                  "absolute left-16 px-3 py-1.5 rounded-lg text-xs font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-xl whitespace-nowrap",
                  isDarkMode ? "bg-[#181822] text-zinc-100 border border-zinc-800" : "bg-white text-zinc-900 border border-zinc-200"
                )}>
                  {tab.label}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-4 w-full mb-24">
          <button 
            onClick={() => setDarkMode(!isDarkMode)}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
              isDarkMode ? "text-amber-400 hover:bg-zinc-900" : "text-zinc-600 hover:bg-zinc-200"
            )}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button 
            onClick={() => addToast("설정 패널은 정식 오픈 버전에서 활성화됩니다.", "info")}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
              isDarkMode ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200"
            )}
          >
            <Settings size={18} />
          </button>

          <div className="w-9 h-9 rounded-full bg-zinc-700/60 border border-zinc-500/30 overflow-hidden flex items-center justify-center shadow-md active:scale-95 transition-all">
            <span className="text-xs font-bold text-amber-500">작가</span>
          </div>
        </div>
      </aside>

      {/* 2. Explorer Sidebar (사이드바) - 작가님이 극찬하셨던 프리뷰 디자인 100% 완벽 복원 */}
      <aside 
        style={{ width: `${sidebarWidth}px` }}
        className={cn(
          "relative flex flex-col h-full border-r shrink-0 select-none transition-all duration-75 z-40",
          isDarkMode ? "bg-[#111115] border-zinc-800/80" : "bg-[#F5F6FA] border-zinc-200"
        )}
      >
        <div 
          onMouseDown={() => setIsResizingSidebar(true)}
          className={cn(
            "absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-amber-500/50 transition-colors z-50",
            isResizingSidebar ? "bg-amber-500 w-1.5" : ""
          )} 
        />
        
        {/* A. 영감 검색 & 보관 2단 탭 스위치 프리뷰 디자인 복원 */}
        {activeActivity === "inspiration" && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="p-5 border-b border-zinc-800/20 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black tracking-wider uppercase text-amber-500">영감 기획실</h3>
              </div>
              
              <div className={cn(
                "p-1 rounded-xl flex gap-1",
                isDarkMode ? "bg-zinc-900/80" : "bg-zinc-200/50"
              )}>
                <button
                  onClick={() => {
                    setInspirationSubTab("search");
                  }}
                  className={cn(
                    "flex-1 text-center py-2 text-[11px] font-bold rounded-lg transition-all",
                    inspirationSubTab === "search"
                      ? (isDarkMode ? "bg-zinc-800 text-amber-400 shadow-md" : "bg-white text-zinc-900 shadow-sm")
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  영감 검색
                </button>
                <button
                  onClick={() => {
                    setInspirationSubTab("archive");
                  }}
                  className={cn(
                    "flex-1 text-center py-2 text-[11px] font-bold rounded-lg transition-all",
                    inspirationSubTab === "archive"
                      ? (isDarkMode ? "bg-zinc-800 text-amber-400 shadow-md" : "bg-white text-zinc-900 shadow-sm")
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  영감 보관함
                </button>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-5 flex-1">
              {inspirationSubTab === "search" ? (
                <>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">검색 설정</span>
                  <div className="flex flex-col gap-3">
                    <form onSubmit={(e) => { 
                      e.preventDefault(); 
                      if (searchQuery.trim()) {
                        handleSearch(searchQuery, 1); 
                        addToRecentQueries(searchQuery);
                      }
                    }} className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all",
                      isDarkMode ? "bg-zinc-900/50 border-zinc-800 focus-within:border-amber-500/50" : "bg-white border-zinc-200 focus-within:border-amber-500"
                    )}>
                      <Search size={14} className="text-zinc-500" />
                      <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="사건 키워드 입력..." 
                        className="bg-transparent border-none outline-none text-xs w-full font-medium text-white"
                      />
                    </form>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] text-zinc-500 font-bold">최근 검색어</span>
                      <div className="flex flex-wrap gap-1.5">
                        {recentQueries.length > 0 ? (
                          recentQueries.map(tag => (
                            <span 
                              key={tag} 
                              onClick={() => { 
                                setSearchQuery(tag); 
                                handleSearch(tag, 1); 
                                addToRecentQueries(tag);
                              }}
                              className="text-[9px] bg-zinc-800 text-zinc-400 hover:text-amber-400 hover:bg-zinc-700/50 px-2.5 py-1 rounded-md cursor-pointer transition-all"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-[9px] text-zinc-650 font-bold italic px-1">최근 검색어가 없습니다.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* 필터 조건 및 정렬 조건을 명확히 이원화하여 분리 설계 */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-1">
                        <Filter size={10} />
                        필터 조건
                      </span>
                      <select 
                        value={archiveFilter}
                        onChange={(e) => {
                          setArchiveFilter(e.target.value);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-xs font-bold outline-none border rounded-xl appearance-none cursor-pointer",
                          isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-800"
                        )}
                      >
                        <option value="all">전체 자산 보기</option>
                        <option value="text">✍️ 직접 작성 극작 메모</option>
                        <option value="url">🔗 외부 링크 기사</option>
                        <option value="file">📁 첨부 파일 문서</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-1">
                        <SortAsc size={10} />
                        정렬 방식
                      </span>
                      <select 
                        value={archiveSort}
                        onChange={(e) => {
                          setArchiveSort(e.target.value);
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-xs font-bold outline-none border rounded-xl appearance-none cursor-pointer",
                          isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-800"
                        )}
                      >
                        <option value="date">⏳ 수집 날짜순</option>
                        <option value="name">🔤 제목 이름순</option>
                      </select>
                    </div>

                    {/* 신규 영감 수집 클릭 시 모달창 실행 버튼 */}
                    <button 
                      onClick={() => setModalOpen("collect", true)}
                      className="w-full py-3 bg-amber-500 text-black hover:bg-amber-400 text-xs font-black rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-md active:scale-95 mt-4"
                    >
                      <Plus size={14} />
                      <span>신규 영감 수집</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* B. 작업 공간 (Workspace) 사이드바 프리뷰 디자인 복원 */}
        {activeActivity === "workspace" && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            {/* 프로젝트 선택기 및 신설 헤더 */}
            <div className="p-5 border-b border-zinc-800/20 flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-wider uppercase text-zinc-500">ACTIVE WORKSPACE</span>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setIsProjectManageModalOpen(true)}
                    className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-all"
                    title="드라마 프로젝트 관리 (삭제/순서조정)"
                  >
                    <Settings size={14} />
                  </button>
                  <button 
                    onClick={() => setModalOpen("project", true)}
                    className="p-1.5 hover:bg-zinc-800 rounded text-amber-500 hover:text-amber-400 transition-all"
                    title="신규 드라마 프로젝트 기획"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div className="relative">
                <select 
                  value={selectedProjectId || ""}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    selectProject(nextId);
                  }}
                  className={cn(
                    "w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold outline-none appearance-none cursor-pointer pr-8 transition-all",
                    isDarkMode ? "bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800/50" : "bg-white border-zinc-200 text-zinc-900"
                  )}
                >
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.title}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* 프로젝트 세부 집필/기획 하위 메뉴 트리 */}
            <div className="flex-1 overflow-y-auto custom-scrollbar-dark p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 mb-2 block">드라마 기획 & 집필 도구</span>
                
                {[
                  { id: "info", label: "프로젝트 정보", icon: Info, color: "text-blue-400" },
                  { id: "characters", label: "캐릭터 맵", icon: Users, color: "text-emerald-400" },
                  { id: "plot", label: "플롯 이벤트", icon: GitCommit, color: "text-purple-400" },
                  { id: "draft", label: "초안 & 시놉시스", icon: FileText, color: "text-pink-400" },
                  { id: "editor", label: "대본 작성기", icon: PenTool, color: "text-amber-400" }
                ].map(menu => {
                  const isSelected = activeWorkspaceTab === menu.id;
                  return (
                    <button
                      key={menu.id}
                      onClick={() => {
                        setWorkspaceTab(menu.id as any);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-3.5 rounded-xl text-left transition-all active:scale-95 group",
                        isSelected
                          ? (isDarkMode ? "bg-[#252535] text-white border border-[#3b3b55] font-bold shadow-xl shadow-black/10" : "bg-[#EAEFFD] text-[#3b59f6] border border-[#d2dcfb] font-bold")
                          : (isDarkMode ? "text-zinc-400 hover:bg-zinc-900 hover:text-white" : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900")
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <menu.icon size={16} className={cn(menu.color, isSelected ? "scale-110" : "group-hover:scale-105 transition-transform")} />
                        <span className="text-xs font-semibold">{menu.label}</span>
                      </div>
                      <ChevronRight size={12} className={cn("text-zinc-600 group-hover:translate-x-0.5 transition-transform", isSelected ? "text-white" : "")} />
                    </button>
                  );
                })}
              </div>

              {activeWorkspaceTab === "editor" && (
                <div className="mt-4 border-t border-zinc-800/40 pt-4 flex flex-col gap-2 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">OUTLINE (실시간 파싱)</span>
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-black">{outline.length} Scenes</span>
                  </div>
                  <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto custom-scrollbar-dark p-1">
                    {outline.map((scene) => (
                      <div 
                        key={scene.id}
                        onClick={() => addToast(`선택된 '${scene.title}'로 에디터 스크롤을 이동(시뮬레이션)합니다.`, "info")}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg text-[11px] cursor-pointer hover:bg-zinc-800/30 transition-all min-w-0 group",
                          isDarkMode ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-600 hover:text-zinc-900"
                        )}
                      >
                        <CornerDownRight size={10} className="text-zinc-600 group-hover:text-amber-500" />
                        <span className="truncate font-medium">{scene.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* 3. Main Workspace (메인 캔버스 영역) - 100% 프리뷰 디자인 복원 및 실데이터 접합 */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* 상단 통합 헤더 */}
        <header className={cn(
          "h-16 border-b flex items-center justify-between px-8 z-40 shrink-0",
          isDarkMode ? "bg-[#0D0D11] border-zinc-800/80" : "bg-white border-zinc-200"
        )}>
          <div className="flex items-center gap-2.5 text-xs font-medium">
            {activeActivity === "inspiration" ? (
              <>
                <Sparkles size={14} className="text-amber-500" />
                <span className="font-bold">영감 기획실</span>
                <ChevronRight size={12} className="text-zinc-600" />
                <span className={cn("font-extrabold uppercase tracking-wide", isDarkMode ? "text-zinc-300" : "text-zinc-800")}>
                  {inspirationSubTab === "search" ? "영감 검색 (스카우터)" : "영감 보관함"}
                </span>
              </>
            ) : (
              <>
                <Folder size={14} className="text-amber-500" />
                <span className="font-bold">{currentProject?.title || "드라마 프로젝트"}</span>
                <ChevronRight size={12} className="text-zinc-600" />
                <span className={cn("font-extrabold uppercase tracking-wide", isDarkMode ? "text-zinc-300" : "text-zinc-800")}>
                  {activeWorkspaceTab === "info" && "프로젝트 정보"}
                  {activeWorkspaceTab === "characters" && "캐릭터 관계도"}
                  {activeWorkspaceTab === "plot" && "플롯 타임라인"}
                  {activeWorkspaceTab === "draft" && "AI 초안 & 시놉시스"}
                  {activeWorkspaceTab === "editor" && "대본 작성기 (Markdown)"}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setRightPanelOpen(!isRightPanelOpen);
              }}
              className={cn(
                "p-2 rounded-lg border transition-all",
                isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white" : "bg-white border-zinc-200 text-zinc-600 hover:text-zinc-950"
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
                    activeInspirations={newsResults.map(item => ({
                      id: item.id,
                      title: item.article?.title || item.title || "기사 제목",
                      desc: item.article?.description || item.content || "기사 요약 내용",
                      keyword: item.article?.keyword || item.main_keyword || "시사속보",
                      source: item.article?.link?.includes("google.com") ? "구글 뉴스" : "네이버 뉴스",
                      date: item.article?.pubDate || ""
                    }))} 
                    // 기사 클릭 시 custom hooks의 index 및 ID 상태 동기화 처리 (AI 분석 작동 완벽 대응)
                    selectInspiration={(id) => {
                      selectInspiration(id);
                      const idx = newsResults.findIndex(n => n.id === id);
                      if (idx !== -1) setSelectedNewsIndex(idx);
                    }}
                  />
                </div>
              )}

              {/* 2. 수집된 영감 보관함 메인 화면 */}
              {inspirationSubTab === "archive" && (
                <div className="flex-grow flex flex-col min-w-0 overflow-hidden">
                  <ArchiveFilterGrid 
                    filteredAndSortedArchives={computedArchives.map(item => ({
                      id: item.id,
                      title: item.title || "수집 파일",
                      desc: item.type === "NOTE" ? item.content : (cleanHtml(item.summary || item.content).substring(0, 120) + (cleanHtml(item.summary || item.content) ? "..." : "")),
                      type: item.type === "NOTE" ? "✍️ 직접 메모" : item.type === "NEWS" ? "🔗 뉴스기사" : "📁 문서파일",
                      rawType: item.type,
                      tension_score: item.tension_score,
                      analysis_status: item.analysis_status,
                      date: new Date(item.ingested_at || item.created_at).toISOString().split("T")[0]
                    }))} 
                    addToast={addToast}
                    selectArchive={(id) => {
                      selectArchive(id);
                      const idx = archiveItems.findIndex(a => a.id === id);
                      if (idx !== -1) setSelectedArchiveIndex(idx);
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
                  />
                </div>
              )}
            </div>
          )}

          {activeActivity === "workspace" && (
            <div className="flex-1 flex overflow-hidden animate-in fade-in duration-300">
              
              {activeWorkspaceTab === "info" && (
                <div className="flex-grow overflow-y-auto custom-scrollbar-dark p-8 flex flex-col gap-6">
                  <div className="max-w-2xl flex flex-col gap-5">
                    <h2 className="text-xl font-black">드라마 기획안 정보</h2>
                    
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">기획 타이틀</span>
                      <input 
                        value={editProjectTitle} 
                        onChange={(e) => setEditProjectTitle(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl w-full focus:border-amber-500/50 outline-none" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">장르 스타일</span>
                        <input 
                          value={editProjectGenre} 
                          onChange={(e) => setEditProjectGenre(e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl w-full focus:border-amber-500/50 outline-none" 
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">기본 편성 정보</span>
                        <div className="flex flex-col gap-2">
                          <select 
                            value={formatSelectMode} 
                            onChange={(e) => setFormatSelectMode(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl w-full focus:border-amber-500/50 outline-none cursor-pointer"
                          >
                            <option value="단막극 (1부작)">단막극 (1부작)</option>
                            <option value="2부작 단막극">2부작 단막극</option>
                            <option value="4부작 연작">4부작 연작</option>
                            <option value="8부작 시리즈">8부작 시리즈</option>
                            <option value="12부작 미니시리즈">12부작 미니시리즈</option>
                            <option value="16부작 미니시리즈">16부작 미니시리즈</option>
                            <option value="영화 (Feature)">영화 (Feature)</option>
                            <option value="custom">직접 입력 (커스텀)</option>
                          </select>
                          
                          {formatSelectMode === "custom" && (
                            <input 
                              value={customFormat} 
                              onChange={(e) => setCustomFormat(e.target.value)}
                              placeholder="원하는 편성 규격을 입력해 주세요... (예: 50부작 대하드라마)"
                              className="bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl w-full focus:border-amber-500/50 outline-none animate-in slide-in-from-top-1 duration-200" 
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">분위기 / 톤 (Atmosphere)</span>
                      <input 
                        value={editProjectAtmosphere} 
                        onChange={(e) => setEditProjectAtmosphere(e.target.value)}
                        placeholder="예: 차갑고 묵직한 하드보일드 수사극, 빠른 템포의 오피스 누아르 등"
                        className="bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl w-full focus:border-amber-500/50 outline-none" 
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">작품의 기획 의도 (Intended Purpose)</span>
                      <textarea 
                        value={editProjectIntendedPurpose} 
                        rows={4}
                        onChange={(e) => setEditProjectIntendedPurpose(e.target.value)}
                        placeholder="작품의 사회적 메시지, 집필 배경 및 기획 의도를 기술해 주세요..."
                        className="bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white px-4 py-3 rounded-xl w-full resize-none leading-relaxed focus:border-amber-500/50 outline-none" 
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">핵심 갈등 역학 (Core Conflict)</span>
                      <textarea 
                        value={editProjectCoreConflict} 
                        rows={3}
                        onChange={(e) => setEditProjectCoreConflict(e.target.value)}
                        placeholder="인물 간의 신념 대립이나 거대 세력과의 대립 구조 등 서사의 뼈대가 될 갈등 역학을 적어보세요..."
                        className="bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white px-4 py-3 rounded-xl w-full resize-none leading-relaxed focus:border-amber-500/50 outline-none" 
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">주제 및 인사이트 (Theme)</span>
                      <textarea 
                        value={editProjectTheme} 
                        rows={2}
                        onChange={(e) => setEditProjectTheme(e.target.value)}
                        placeholder="작품이 궁극적으로 전달하고자 하는 핵심 주제와 인간상에 대한 인사이트를 기록합니다..."
                        className="bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white px-4 py-3 rounded-xl w-full resize-none leading-relaxed focus:border-amber-500/50 outline-none" 
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">작품의 핵심 로그라인 (Logline)</span>
                      <textarea 
                        value={editProjectLogline} 
                        rows={4}
                        onChange={(e) => setEditProjectLogline(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white px-4 py-3 rounded-xl w-full resize-none leading-relaxed focus:border-amber-500/50 outline-none" 
                      />
                    </div>

                    <div className="flex justify-end mt-2">
                      <button onClick={handleSaveProjectInfo} className="px-5 py-2.5 bg-amber-500 text-black hover:bg-amber-400 text-xs font-black rounded-xl transition-all shadow-md active:scale-95">기획 저장 완료</button>
                    </div>
                  </div>
                </div>
              )}

              {activeWorkspaceTab === "characters" && (
                <CharacterMapDualView 
                  characters={characters} 
                  handleOpenCharacterAdd={handleOpenCharacterAdd} 
                  handleOpenCharacterEdit={handleOpenCharacterEdit} 
                  syncCharacters={syncCharacters}
                  project={currentProject}
                  isDarkMode={isDarkMode}
                  nodes={nodes}
                  setNodes={setNodes}
                  onNodesChange={onNodesChange}
                  edges={edges}
                  setEdges={setEdges}
                  onEdgesChange={onEdgesChange}
                  handleSaveLabSession={handleSaveLabSession}
                  addToast={addToast}
                />
              )}

              {activeWorkspaceTab === "plot" && (
                <PlotTimeline 
                  events={events}
                  projectId={selectedProjectId || undefined}
                  characters={characters}
                  isGenerating={isGeneratingPlot}
                  handleOpenEventAdd={handleOpenEventAdd}
                  handleOpenEventEdit={handleOpenEventEdit}
                  onDeleteEvent={deleteEvent}
                  onReorder={reorderEvents}
                  onGenerateDraft={generatePlotDraft}
                  addToast={addToast}
                />
              )}

              {activeWorkspaceTab === "draft" && (
                <div className="flex-grow overflow-y-auto custom-scrollbar-dark p-8 flex flex-col gap-6 select-none h-full min-h-0 animate-in fade-in duration-350">
                  
                  {/* 상단 타이틀 및 추출 제어 툴바 */}
                  <div className="flex items-center justify-between border-b border-zinc-800/10 pb-5 shrink-0">
                    <div className="flex flex-col gap-1.5">
                      <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                        📖 시놉시스 및 기획서 설계실
                      </h2>
                      <p className="text-xs text-zinc-500 font-medium">
                        드라마의 기획 정보, 캐릭터 프로필, 사건 타임라인을 최종 취합하고 최종 기획서로 배포합니다.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handleSaveSynopsis} 
                        className="px-5 py-2.5 text-xs font-black bg-amber-500 hover:bg-amber-400 text-black rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                        title="작성한 시놉시스(로그라인 및 전체 줄거리)를 데이터베이스에 저장합니다."
                      >
                        <span>시놉시스 저장</span>
                      </button>

                      <button 
                        onClick={() => handleExportDocument("word")}
                        className="px-4 py-2.5 text-xs font-black bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        title="기획서 Word(.docx) 다운로드"
                      >
                        <span>Word 다운로드</span>
                      </button>

                      <button 
                        onClick={() => handleExportDocument("pdf")}
                        className="px-4 py-2.5 text-xs font-black bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 cursor-pointer"
                        title="기획서 PDF(.pdf) 다운로드"
                      >
                        <span>PDF 다운로드</span>
                      </button>
                    </div>
                  </div>

                  {/* 2단 메인 컨텐츠 영역 */}
                  <div className="grid grid-cols-3 gap-6">
                    
                    {/* A. 좌측 영역 (Read-Only) - 기획 개요 및 등장인물 */}
                    <div className="col-span-1 flex flex-col gap-5">
                      
                      {/* 기획 요약 카드 */}
                      <div className="p-5 rounded-2xl border bg-zinc-900/40 border-zinc-800/80 flex flex-col gap-4">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">드라마 기획 개요</span>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">작품 제목</span>
                          <h3 className="text-sm font-black text-white">{currentProject?.title || "무제"}</h3>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">기획의도</span>
                          <p className="text-xs text-zinc-400 font-semibold leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto custom-scrollbar-dark select-text">
                            {currentProject?.intended_purpose || "등록된 기획의도가 없습니다."}
                          </p>
                        </div>
                      </div>

                      {/* 등장인물 리스트 */}
                      <div className="p-5 rounded-2xl border bg-zinc-900/40 border-zinc-800/80 flex flex-col gap-4">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">캐릭터 리포트 ({characters.length}명)</span>
                        <div className="flex flex-col gap-3 select-text">
                          {characters.map((char) => (
                            <div 
                              key={char.id} 
                              className="p-3.5 rounded-xl border bg-zinc-950/40 border-zinc-800 flex flex-col gap-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-black text-white">{char.name}</h4>
                                <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-black shrink-0">
                                  {char.role || "조연"}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-500 font-bold leading-none">
                                직업: {char.occupation || "미상"}
                              </p>
                              {char.desire && (
                                <div className="text-[9px] text-amber-450/90 font-extrabold leading-normal bg-amber-500/5 p-1.5 rounded-lg border border-amber-500/10">
                                  욕망: {char.desire}
                                </div>
                              )}
                              <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed">
                                {char.description || "등록된 인물 정보가 없습니다."}
                              </p>
                            </div>
                          ))}
                          {characters.length === 0 && (
                            <div className="text-center py-10 text-zinc-500 text-xs font-bold">
                              등록된 등장인물이 없습니다.
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* B. 우측 영역 (Editable) - 로그라인 & 전체 줄거리 */}
                    <div className="col-span-2 flex flex-col gap-5">
                      
                      {/* 로그라인 카드 */}
                      <div className="p-6 rounded-2xl border bg-zinc-900/40 border-zinc-800/85 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">작품의 핵심 로그라인 (Logline)</span>
                          <button 
                            onClick={handleGenerateLogline}
                            disabled={isGeneratingSynopsis}
                            className="px-3 py-1.5 text-[9px] font-black text-indigo-400 bg-indigo-950/20 border border-indigo-900/30 hover:bg-indigo-900/20 rounded-lg flex items-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isGeneratingSynopsis ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <Sparkles size={10} />
                            )}
                            <span>AI 생성</span>
                          </button>
                        </div>
                        
                        <textarea 
                          value={editProjectLogline}
                          onChange={(e) => setEditProjectLogline(e.target.value)}
                          rows={3}
                          placeholder="작품을 관통하는 한 줄의 강렬한 로그라인을 직접 작성하거나 AI를 통해 제안받아 보세요..."
                          className="bg-zinc-950 border border-zinc-800 text-xs font-semibold text-white px-4 py-3 rounded-xl w-full resize-none leading-relaxed focus:border-amber-500/40 outline-none select-text"
                        />
                      </div>

                      {/* 전체 줄거리 카드 */}
                      <div className="p-6 rounded-2xl border bg-zinc-900/40 border-zinc-800/85 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">전체 줄거리 (Synopsis)</span>
                          <button 
                            onClick={handleGenerateSynopsis}
                            disabled={isGeneratingSynopsis}
                            className="px-3 py-1.5 text-[9px] font-black text-indigo-400 bg-indigo-950/20 border border-indigo-900/30 hover:bg-indigo-900/20 rounded-lg flex items-center gap-1 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isGeneratingSynopsis ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <Sparkles size={10} />
                            )}
                            <span>AI 생성</span>
                          </button>
                        </div>

                        <textarea 
                          value={editProjectFullSynopsis}
                          onChange={(e) => setEditProjectFullSynopsis(e.target.value)}
                          rows={16}
                          placeholder="프로젝트의 타임라인 사건들을 융합하여 기승전결이 매끄러운 전체 스토리를 서술하거나, AI를 통해 일괄 합성 생성하세요..."
                          className="bg-zinc-950 border border-zinc-800 text-xs font-semibold text-white px-4 py-4 rounded-xl w-full resize-none leading-relaxed focus:border-amber-500/40 outline-none select-text min-h-[500px]"
                        />
                      </div>

                    </div>

                  </div>

                </div>
              )}

              {activeWorkspaceTab === "editor" && (
                <ScriptEditor 
                  projectId={selectedProjectId}
                  scripts={scripts}
                  currentScript={currentScript}
                  setCurrentScript={setCurrentScript}
                  createScript={createScript}
                  updateScript={updateScript}
                  deleteScript={deleteScript}
                  isLoading={isLoadingScripts}
                  addToast={addToast} 
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* 4. 우측 보조 패널 (피드백 반영: 영감 기획실 vs 작업 공간 활성 탭에 따른 컨텍스트 이원화 탑재 및 AI 분석 실데이터 100% 바인딩) */}
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
      
      {/* 1-2. 극작 메모 수정 모달 (신설) */}
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
                <X size={16} />
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
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">메모 상세 기술 (줄바꿈 포함 가능)</span>
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

      {/* 6. 영감-프로젝트 다중 연결 설정 모달 (신설) */}
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

      {/* 5. 프로젝트 관리 및 순서제어 모달 (신설) */}
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
                <X size={16} />
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
                      {/* 순서 조정 버튼 (화살표) */}
                      <div className="flex flex-col gap-1">
                        <button 
                          disabled={idx === 0}
                          onClick={() => {
                            const next = [...projects];
                            const temp = next[idx];
                            next[idx] = next[idx - 1];
                            next[idx - 1] = temp;
                            setProjects(next);
                            addToast("기획안 우선순위 배열이 조정되었습니다.", "success");
                          }}
                          className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ChevronDown size={14} className="rotate-180" />
                        </button>
                        <button 
                          disabled={idx === projects.length - 1}
                          onClick={() => {
                            const next = [...projects];
                            const temp = next[idx];
                            next[idx] = next[idx + 1];
                            next[idx + 1] = temp;
                            setProjects(next);
                            addToast("기획안 우선순위 배열이 조정되었습니다.", "success");
                          }}
                          className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ChevronDown size={14} />
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
                      <Trash2 size={14} />
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
