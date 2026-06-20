"use client";

import React, { useState, useRef } from "react";
import { 
  Sparkles, Archive, Plus, Folder, Info, Users, GitCommit, FileText, ChevronDown, Globe, Upload 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import api from "@/lib/api";

interface ExplorerSidebarProps {
  projects: any[];
  hookSelectProject: (id: string) => void;
  addToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
  fetchProjects: () => Promise<void>;
}

export default function ExplorerSidebar({ projects, hookSelectProject, addToast, fetchProjects }: ExplorerSidebarProps) {
  const {
    activeActivity,
    inspirationSubTab,
    setInspirationSubTab,
    activeWorkspaceTab,
    setWorkspaceTab,
    isDarkMode,
    selectedProjectId,
    selectProject,
    sidebarWidth,
    setModalOpen
  } = useUIStore();

  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // input 값 초기화
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
          
          // projects 목록을 새로 불러왔으므로 useInsightLab의 selectProject에 newProj 오브젝트를 전달하거나
          // simple하게 selectProject(newId)를 호출할 수 있는데,
          // useUIStore의 selectProject는 ID(string)를 인자로 받고 있습니다.
          // useInsightLab의 hookSelectProject는 ID(string)를 인자로 받고 있으며 내부적으로 projects에서 찾아 select합니다.
          // 확인을 위해 projects에서 방금 가져온 프로젝트를 찾아서 hookSelectProject에 넘겨야할 수 있습니다.
          // 하지만 fetchProjects()가 완료된 시점에 projects 배열이 업데이트 되었을 것이므로 비동기적으로 projects를 리프레시한 뒤
          // hookSelectProject(newId) 와 selectProject(newId)를 연동하면 상태가 동기화됩니다.
          selectProject(newId);
          hookSelectProject(newId);
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
        "flex flex-col border-r h-full shrink-0 min-w-[200px] select-none",
        isDarkMode ? "bg-[#0D0D11] border-zinc-800/80" : "bg-[#F8F9FC] border-zinc-200"
      )}
    >
      {/* A. 영감 기획실 대메뉴 탭일 때의 익스플로러 메뉴 */}
      {activeActivity === "inspiration" && (
        <div className="flex flex-col gap-6 p-6 flex-1">
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">영감 탐색실</span>
            <button 
              onClick={() => setModalOpen("collect", true)}
              className="p-1 hover:bg-zinc-800 rounded text-amber-500 hover:text-amber-400 transition-all"
              title="새 영감 수집"
            >
              <Plus size={14} />
            </button>
          </div>
          <nav className="flex flex-col gap-1.5">
            {[
              { id: "search", icon: Sparkles, label: "영감 스카우터", desc: "실시간 뉴스 속보 탐색" },
              { id: "archive", icon: Archive, label: "영감 보관함", desc: "수집 완료된 극작 원천 자산" }
            ].map(sub => {
              const isActive = inspirationSubTab === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setInspirationSubTab(sub.id as any)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
                    isActive 
                      ? (isDarkMode ? "bg-[#1E1E28] text-amber-400 font-extrabold border border-amber-500/10 shadow-lg" : "bg-white text-zinc-950 font-extrabold border border-zinc-200 shadow-sm")
                      : (isDarkMode ? "text-zinc-400 hover:bg-[#14141A]/50 hover:text-white" : "text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-950")
                  )}
                >
                  <sub.icon size={16} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs">{sub.label}</span>
                    <span className="text-[9px] text-zinc-500 font-medium line-clamp-1">{sub.desc}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* B. 작업 공간 대메뉴 탭일 때의 익스플로러 메뉴 */}
      {activeActivity === "workspace" && (
        <div className="flex flex-col gap-6 p-6 flex-1 overflow-hidden">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">드라마 기획안</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleImportClick}
                  disabled={isImporting}
                  className="p-1 hover:bg-zinc-800 rounded text-amber-500 hover:text-amber-400 transition-all disabled:opacity-50"
                  title="백업 파일로 복원하기 (.json)"
                >
                  <Upload size={14} className={cn(isImporting && "animate-pulse")} />
                </button>
                <button 
                  onClick={() => setModalOpen("project", true)}
                  className="p-1 hover:bg-zinc-800 rounded text-amber-500 hover:text-amber-400 transition-all"
                  title="신규 드라마 프로젝트 기획"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            
            <div className="relative">
              <select 
                value={selectedProjectId || ""}
                onChange={(e) => {
                  const nextId = e.target.value;
                  selectProject(nextId);
                  hookSelectProject(nextId);
                  const targetProj = projects.find(p => p.id === nextId);
                  if (targetProj) {
                    addToast(`'${targetProj.title}' 기획실이 활성화되었습니다.`, "success");
                  }
                }}
                className={cn(
                  "w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold outline-none appearance-none cursor-pointer pr-8 transition-all",
                  isDarkMode ? "bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800/50" : "bg-white border-zinc-200 text-zinc-900"
                )}
              >
                {projects.map(proj => (
                  <option key={proj.id} value={proj.id}>{proj.title}</option>
                ))}
                {projects.length === 0 && (
                  <option value="">개설된 프로젝트 없음</option>
                )}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto custom-scrollbar-dark pr-1">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">집필 관리 메뉴</span>
            <nav className="flex flex-col gap-1">
              {[
                { id: "info", icon: Info, label: "기획 정보", desc: "작품 주제, 로그라인, 줄거리" },
                { id: "characters", icon: Users, label: "캐릭터 맵", desc: "좌측 리스트 및 다이어그램 관계도" },
                { id: "plot", icon: GitCommit, label: "플롯 타임라인", desc: "핵심 극화 사건 타임라인" },
                { id: "draft", icon: FileText, label: "초안 생성실", desc: "AI 시놉시스 및 트리트먼트" },
                { id: "editor", icon: FileText, label: "대본 작성기", desc: "Outline 실시간 대본 집필실" },
                { id: "world", icon: Globe, label: "세계관 설정", desc: "시공간 무대, 집단, 규칙 및 문화" }
              ].map(sub => {
                const isActive = activeWorkspaceTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setWorkspaceTab(sub.id as any)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
                      isActive 
                        ? (isDarkMode ? "bg-[#1E1E28] text-amber-400 font-extrabold border border-amber-500/10 shadow-lg" : "bg-white text-zinc-950 font-extrabold border border-zinc-200 shadow-sm")
                        : (isDarkMode ? "text-zinc-400 hover:bg-[#14141A]/50 hover:text-white" : "text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-950")
                    )}
                  >
                    <sub.icon size={15} />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs">{sub.label}</span>
                      <span className="text-[9px] text-zinc-500 font-medium line-clamp-1">{sub.desc}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
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
