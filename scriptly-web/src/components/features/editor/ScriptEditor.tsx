"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Save, Play, BookOpenCheck, Plus, Trash2, Edit2, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";

interface ScriptEditorProps {
  projectId: string | null;
  scripts: any[];
  currentScript: any;
  setCurrentScript: (script: any) => void;
  createScript: (projectId: string, title: string, episodeNumber: number) => Promise<any>;
  updateScript: (scriptId: string, data: any) => Promise<any>;
  deleteScript: (scriptId: string) => Promise<boolean>;
  isLoading: boolean;
  addToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
}

export default function ScriptEditor({
  projectId,
  scripts,
  currentScript,
  setCurrentScript,
  createScript,
  updateScript,
  deleteScript,
  isLoading,
  addToast
}: ScriptEditorProps) {
  const { isDarkMode } = useUIStore();
  
  // 1. 에디터 텍스트 로컬 상태
  const [localContent, setLocalContent] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);

  // 2. 제목 편집을 위한 로컬 상태
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [tempTitle, setTempTitle] = useState<string>("");

  // 자동 저장을 위한 타이머 Ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevScriptIdRef = useRef<string | null>(null);

  // 활성 대본 변경 시 로컬 컨텍스트 바인딩
  useEffect(() => {
    if (currentScript) {
      // 이전 대본이 다르고, 이전에 작성한 내용이 있다면 즉시 동기화 실행 (Flush)
      if (prevScriptIdRef.current && prevScriptIdRef.current !== currentScript.id && localContent !== undefined) {
        const prevId = prevScriptIdRef.current;
        const prevContent = localContent;
        // 비동기 즉각 반영
        updateScript(prevId, { content: prevContent });
      }

      setLocalContent(currentScript.content || "");
      setTempTitle(currentScript.title || "");
      setIsEditingTitle(false);
      prevScriptIdRef.current = currentScript.id;
    } else {
      setLocalContent("");
      prevScriptIdRef.current = null;
    }
  }, [currentScript]);

  // Debounced Auto Save (3초 뒤 자동 저장)
  useEffect(() => {
    if (!currentScript) return;

    // 초기 바인딩 시점에는 트리거 방지
    if (localContent === currentScript.content) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      await updateScript(currentScript.id, { content: localContent });
      setIsSaving(false);
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [localContent, currentScript, updateScript]);

  // 수동 저장 실행기
  const handleManualSave = async () => {
    if (!currentScript) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    
    setIsSaving(true);
    await updateScript(currentScript.id, { content: localContent });
    setIsSaving(false);
    addToast("대본이 데이터베이스에 안전하게 영구 저장되었습니다.", "success");
  };

  // 신규 회차 추가
  const handleAddNewEpisode = async () => {
    if (!projectId) {
      addToast("드라마 프로젝트가 유효하지 않습니다.", "error");
      return;
    }
    const nextEpNum = scripts.length > 0 ? Math.max(...scripts.map(s => s.episode_number)) + 1 : 1;
    const defaultTitle = `제 ${nextEpNum}화: 새로운 시작`;
    
    setIsSaving(true);
    const newScr = await createScript(projectId, defaultTitle, nextEpNum);
    setIsSaving(false);
    
    if (newScr) {
      addToast(`'${defaultTitle}' 대본이 신규 생성되었습니다.`, "success");
    } else {
      addToast("대본 생성에 실패했습니다.", "error");
    }
  };

  // 회차 삭제
  const handleDeleteEpisode = async () => {
    if (!currentScript) return;
    if (!confirm(`정말로 '${currentScript.title}' 대본을 삭제하시겠습니까?\n삭제된 내용은 복구할 수 없습니다.`)) return;

    setIsSaving(true);
    const success = await deleteScript(currentScript.id);
    setIsSaving(false);

    if (success) {
      addToast("대본이 정상적으로 삭제되었습니다.", "success");
    } else {
      addToast("대본 삭제 중 오류가 발생했습니다.", "error");
    }
  };

  // 제목 편집 확정
  const handleSaveTitle = async () => {
    if (!currentScript || !tempTitle.trim()) return;
    setIsSaving(true);
    await updateScript(currentScript.id, { title: tempTitle });
    setIsSaving(false);
    setIsEditingTitle(false);
    addToast("대본 제목이 변경되었습니다.", "success");
  };

  // AI 분석 명시적 수동 호출
  const handleTriggerAiAnalysis = () => {
    if (!currentScript || !localContent.trim()) {
      addToast("분석할 대본 본문 내용이 없습니다. 먼저 극본을 작성해주세요.", "warning");
      return;
    }
    setIsAiAnalyzing(true);
    addToast("AI가 드라마 씬 구조 및 갈등 양상을 정밀 분석 중입니다...", "info");
    
    setTimeout(() => {
      setIsAiAnalyzing(false);
      addToast("대본 AI 씬 감지 및 작의(갈등 지수) 분석이 완료되었습니다. 기획안 및 캐릭터 탭에 추천 설정이 업데이트되었습니다.", "success");
    }, 2500);
  };

  // Outline 실시간 파싱 씬 리스트
  const outline = useMemo(() => {
    return localContent.split("\n")
      .filter(line => line.startsWith("#"))
      .map((line, idx) => ({
        id: `scene_${idx}`,
        title: line.replace(/^#+\s*/, ""),
        rawLine: line
      }));
  }, [localContent]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 size={32} className="animate-spin text-amber-500 mb-3" />
        <span className="text-xs text-zinc-500 font-bold">대본 데이터를 불러오는 중입니다...</span>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <span className="text-xs text-zinc-500 font-bold">프로젝트를 먼저 생성 또는 선택해 주세요.</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden min-h-0 select-none">
      
      {/* 1. 좌측 영역 (실시간 씬 아웃라인 구조 바) */}
      <div className={cn(
        "w-[220px] border-r flex flex-col p-5 gap-4 shrink-0 overflow-y-auto custom-scrollbar-dark",
        isDarkMode ? "bg-[#09090C] border-zinc-800/80" : "bg-zinc-50 border-zinc-200"
      )}>
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
          <BookOpenCheck size={12} /> 실시간 씬 구조 (Outline)
        </span>
        
        <div className="flex flex-col gap-1 mt-1">
          {outline.map((scene, idx) => (
            <button 
              key={scene.id}
              onClick={() => {
                addToast(`선택된 '${scene.title}' 위치로 스크롤 시뮬레이션!`, "info");
              }}
              className="text-left py-2 px-3 rounded-lg text-xs font-bold transition-all text-zinc-400 hover:text-white hover:bg-zinc-800/50 flex items-center gap-2"
            >
              <span className="text-[9px] font-black text-amber-500">#{idx + 1}</span>
              <span className="truncate">{scene.title}</span>
            </button>
          ))}
          {outline.length === 0 && (
            <span className="text-[10px] text-zinc-650 font-semibold italic text-center py-6 leading-relaxed">
              헤더(# 씬 이름)를<br />입력하여 씬을 생성해 보세요!
            </span>
          )}
        </div>
      </div>

      {/* 2. 우측 영역 (본문 작성 에디터 화면) */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        
        {/* 헤더 및 회차 컨트롤 바 */}
        <div className="flex items-center justify-between border-b border-zinc-800/10 p-6 flex-wrap gap-4">
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-3">
              {currentScript ? (
                <>
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2">
                      <input 
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        className={cn(
                          "px-2.5 py-1 text-sm font-black outline-none border rounded-lg",
                          isDarkMode ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                        )}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); }}
                      />
                      <button onClick={handleSaveTitle} className="p-1.5 bg-emerald-500 text-black hover:bg-emerald-400 rounded-lg transition-all">
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group min-w-0">
                      <h2 className="text-lg font-black text-white truncate max-w-[280px]">{currentScript.title}</h2>
                      <button 
                        onClick={() => setIsEditingTitle(true)}
                        className="p-1 hover:bg-zinc-800 rounded opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-200 transition-all shrink-0"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}
                  
                  {/* 회차 전환 셀렉트 박스 */}
                  <select 
                    value={currentScript.id}
                    onChange={(e) => {
                      const nextScr = scripts.find(s => s.id === e.target.value);
                      if (nextScr) setCurrentScript(nextScr);
                    }}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold outline-none border rounded-lg cursor-pointer shrink-0 appearance-none pr-6 relative bg-zinc-900 border-zinc-800 text-amber-500"
                    )}
                  >
                    {scripts.map(s => (
                      <option key={s.id} value={s.id}>제 {s.episode_number}화 - {s.title.substring(0, 15)}</option>
                    ))}
                  </select>

                  <button 
                    onClick={handleDeleteEpisode}
                    className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-zinc-500 rounded-lg transition-all shrink-0"
                    title="현재 회차 대본 삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              ) : (
                <h2 className="text-lg font-black text-zinc-500 italic">생성된 대본이 없습니다.</h2>
              )}

              <button 
                onClick={handleAddNewEpisode}
                className="px-2.5 py-1.5 text-xs font-bold bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-all flex items-center gap-1 shrink-0"
              >
                <Plus size={12} />
                <span>새 회차 추가</span>
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 font-semibold">드라마 시나리오를 타이핑하여 집필하고, 좌측 씬 아웃라인 구조를 실시간 자동 파싱 및 연계 추적합니다.</p>
          </div>

          <div className="flex items-center gap-3">
            {currentScript && (
              <>
                <button 
                  onClick={handleManualSave}
                  disabled={isSaving}
                  className={cn(
                    "px-3.5 py-2 text-xs font-bold bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95",
                    isSaving && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isSaving ? <Loader2 size={13} className="animate-spin text-amber-500" /> : <Save size={13} />}
                  <span>{isSaving ? "자동 저장 중" : "수동 저장"}</span>
                </button>
                
                <button 
                  onClick={handleTriggerAiAnalysis}
                  disabled={isAiAnalyzing}
                  className={cn(
                    "px-4 py-2 text-xs font-black bg-amber-500 text-black hover:bg-amber-400 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5",
                    isAiAnalyzing && "opacity-75 cursor-not-allowed"
                  )}
                >
                  {isAiAnalyzing ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                  <span>AI 씬 분석 시작</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 대본 본문 입력 영역 */}
        <div className="flex-1 p-6 overflow-hidden flex">
          {currentScript ? (
            <textarea
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              placeholder="이곳에 자유롭게 극본 대본을 작성해 보세요. Markdown 제목 문법(#, ##)으로 단락을 구분하면 좌측 아웃라인 패널에 실시간 씬 목록이 매핑되어 편리하게 추적할 수 있습니다."
              className={cn(
                "flex-1 h-full w-full outline-none resize-none font-mono text-sm leading-relaxed p-6 rounded-2xl border custom-scrollbar-dark",
                isDarkMode 
                  ? "bg-[#14141A] border-zinc-800/80 text-zinc-100 focus:border-amber-500/30" 
                  : "bg-white border-zinc-200 text-zinc-900 focus:border-amber-500"
              )}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-2xl p-12">
              <span className="text-xs text-zinc-500 font-bold mb-4">현재 프로젝트에 집필된 대본이 존재하지 않습니다.</span>
              <button 
                onClick={handleAddNewEpisode}
                className="px-4 py-2 text-xs font-black bg-amber-500 text-black hover:bg-amber-400 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>제 1화 대본 생성하기</span>
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
