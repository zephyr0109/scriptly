"use client";

import React, { useState, useRef } from "react";
import { 
  Search, Filter, SortAsc, Plus, Settings, ChevronDown, ChevronRight, 
  Info, Users, GitCommit, FileText, PenTool, Upload, Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface SidebarPanelProps {
  /** 현재 활성화된 최상위 액티비티 */
  activeActivity: "inspiration" | "workspace";
  /** 영감 탭 내부 서브 탭 */
  inspirationSubTab: "search" | "archive";
  /** 영감 서브 탭 변경 핸들러 */
  setInspirationSubTab: (tab: "search" | "archive") => void;
  /** 워크스페이스 내부 활성 탭 */
  activeWorkspaceTab: string;
  /** 워크스페이스 활성 탭 변경 핸들러 */
  setWorkspaceTab: (tab: any) => void;
  /** 전체 드라마 프로젝트 목록 */
  projects: any[];
  /** 현재 선택된 프로젝트 ID */
  selectedProjectId: string | null;
  /** 프로젝트 선택 변경 핸들러 */
  selectProject: (id: string | null) => void;
  /** 글로벌 모달 제어 핸들러 */
  setModalOpen: (modalName: any, isOpen: boolean) => void;
  /** 프로젝트 관리 모달 오픈 제어 핸들러 */
  setIsProjectManageModalOpen: (isOpen: boolean) => void;
  /** 실시간 뉴스 검색 쿼리 */
  searchQuery: string;
  /** 검색 쿼리 상태 업데이트 핸들러 */
  setSearchQuery: (q: string) => void;
  /** 뉴스 검색 실행 핸들러 */
  handleSearch: (query: string, start: number) => Promise<void>;
  /** 최근 검색어 목록 */
  recentQueries: string[];
  /** 최근 검색어 추가 핸들러 */
  addToRecentQueries: (q: string) => void;
  /** 보관함 필터 조건 */
  archiveFilter: string;
  /** 보관함 필터 조건 업데이트 핸들러 */
  setArchiveFilter: (filter: string) => void;
  /** 보관함 정렬 조건 */
  archiveSort: string;
  /** 보관함 정렬 조건 업데이트 핸들러 */
  setArchiveSort: (sort: string) => void;
  /** 마우스 드래그를 통한 크기 조절 상태 */
  isResizingSidebar: boolean;
  /** 크기 조절 상태 핸들러 */
  setIsResizingSidebar: (val: boolean) => void;
  /** 사이드바 넓이 */
  sidebarWidth: number;
  /** 다크 모드 여부 */
  isDarkMode: boolean;
  /** 토스트 메시지 출력 핸들러 */
  addToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
  /** 프로젝트 목록 갱신 API 핸들러 */
  fetchProjects: () => Promise<void>;
}

/**
 * SidebarPanel 컴포넌트
 * 영감 탐색/검색 또는 워크스페이스의 드라마 기획 메뉴 트리를 렌더링하는 2단 사이드바 패널입니다.
 * 사이드바 리사이징 마우스 트리거 및 드래그 바를 포함합니다.
 */
export default function SidebarPanel({
  activeActivity,
  inspirationSubTab,
  setInspirationSubTab,
  activeWorkspaceTab,
  setWorkspaceTab,
  projects,
  selectedProjectId,
  selectProject,
  setModalOpen,
  setIsProjectManageModalOpen,
  searchQuery,
  setSearchQuery,
  handleSearch,
  recentQueries,
  addToRecentQueries,
  archiveFilter,
  setArchiveFilter,
  archiveSort,
  setArchiveSort,
  isResizingSidebar,
  setIsResizingSidebar,
  sidebarWidth,
  isDarkMode,
  addToast,
  fetchProjects,
}: SidebarPanelProps) {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * 프로젝트 백업 JSON 파일(.json) 업로드 및 복원을 진행합니다.
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backupData = JSON.parse(text);

        setIsImporting(true);
        addToast("프로젝트 백업 데이터 업로드 및 복원 중...", "info");

        const resp = await api.post("/backup/import", backupData);
        if (resp.data && resp.data.new_project_id) {
          addToast("프로젝트 백업 파일 복원이 완료되었습니다!", "success");
          
          // 1. 프로젝트 리스트 갱신
          await fetchProjects();
          
          // 2. 신규 생성된 프로젝트로 활성화 선택
          const newId = resp.data.new_project_id;
          selectProject(newId);
        } else {
          addToast("프로젝트 복원 결과가 올바르지 않습니다.", "error");
        }
      } catch (err: any) {
        console.error("Failed to restore project backup:", err);
        addToast("유효한 백업 파일(.json)이 아니거나 복원에 실패했습니다.", "error");
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <aside 
      style={{ width: `${sidebarWidth}px` }}
      className={cn(
        "relative flex flex-col h-full border-r shrink-0 select-none transition-all duration-75 z-45",
        isDarkMode ? "bg-[#111115] border-zinc-800/80" : "bg-[#F5F6FA] border-zinc-200"
      )}
    >
      {/* 리사이즈용 마우스 드래그 핸들 */}
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
                onClick={() => setInspirationSubTab("search")}
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
                onClick={() => setInspirationSubTab("archive")}
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
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-1">
                      <Filter size={10} />
                      필터 조건
                    </span>
                    <select 
                      value={archiveFilter}
                      onChange={(e) => setArchiveFilter(e.target.value)}
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
                      onChange={(e) => setArchiveSort(e.target.value)}
                      className={cn(
                        "w-full px-3 py-2 text-xs font-bold outline-none border rounded-xl appearance-none cursor-pointer",
                        isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-800"
                      )}
                    >
                      <option value="date">⏳ 수집 날짜순</option>
                      <option value="name">🔤 제목 이름순</option>
                    </select>
                  </div>

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
                  onClick={handleImportClick}
                  disabled={isImporting}
                  className="p-1.5 hover:bg-zinc-800 rounded text-amber-500 hover:text-amber-400 transition-all disabled:opacity-50"
                  title="백업 파일로 복원하기 (.json)"
                >
                  <Upload size={14} className={cn(isImporting && "animate-pulse")} />
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

          <div className="flex-1 overflow-y-auto custom-scrollbar-dark p-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 mb-2 block">드라마 기획 & 집필 도구</span>
              
              {[
                { id: "info", label: "프로젝트 정보", icon: Info, color: "text-blue-400" },
                { id: "world", label: "세계관 설정", icon: Globe, color: "text-cyan-400" },
                { id: "characters", label: "캐릭터 맵", icon: Users, color: "text-emerald-400" },
                { id: "plot", label: "플롯 이벤트", icon: GitCommit, color: "text-purple-400" },
                { id: "draft", label: "초안 & 시놉시스", icon: FileText, color: "text-pink-400" },                  
                { id: "editor", label: "대본 작성기", icon: PenTool, color: "text-amber-400" }                  
              ].map(menu => {
                const isSelected = activeWorkspaceTab === menu.id;
                return (
                  <button
                    key={menu.id}
                    onClick={() => setWorkspaceTab(menu.id as any)}
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
                    <ChevronRight size={12} className={cn("text-zinc-650 group-hover:translate-x-0.5 transition-transform", isSelected ? "text-white" : "")} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: "none" }} 
        accept=".json" 
      />
    </aside>
  );
}
