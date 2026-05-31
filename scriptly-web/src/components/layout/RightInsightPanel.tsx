"use client";

import React, { useState } from "react";
import { 
  Sparkles, ShieldAlert, ArrowRight, Flame, UserCheck, CheckSquare, 
  Bookmark, ChevronDown, ChevronRight, BookmarkCheck, ExternalLink, RefreshCw,
  Compass, HelpCircle, Archive, Check, BookOpenCheck, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";

interface RightInsightPanelProps {
  currentInspiration: any;
  isAnalyzingQuick: boolean;
  analyzedProjects: Record<string, any>;
  handleTriggerQuickAnalysis: (id: string, isFromArchive?: boolean) => void;
  linkedReferenceItems: any[];
  projectLinkedInspirations: string[];
  setProjectLinkedInspirations: React.Dispatch<React.SetStateAction<string[]>>;
  handleSaveToArchive?: () => void;
  isSaving?: boolean;
  addToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
}

export default function RightInsightPanel({
  currentInspiration,
  isAnalyzingQuick,
  analyzedProjects,
  handleTriggerQuickAnalysis,
  linkedReferenceItems,
  projectLinkedInspirations,
  setProjectLinkedInspirations,
  handleSaveToArchive,
  isSaving,
  addToast
}: RightInsightPanelProps) {
  const {
    activeActivity,
    inspirationSubTab,
    isRightPanelOpen,
    isDarkMode,
    setModalOpen
  } = useUIStore();

  const [openReferenceAccordionId, setOpenReferenceAccordionId] = useState<string | null>("insp_1");

  if (!isRightPanelOpen) return null;

  const hasAnalysis = currentInspiration && analyzedProjects[currentInspiration.id];

  return (
    <aside className={cn(
      "w-[350px] border-l h-full flex flex-col shrink-0 overflow-y-auto custom-scrollbar-dark select-none",
      isDarkMode ? "bg-[#09090C] border-zinc-800/80" : "bg-[#F8F9FC] border-zinc-200"
    )}>
      
      {/* A. [대메뉴: 영감 기획실] 일 때 우측 패널 -> 개별 퀵 인사이트(Quick Insight) 모드 */}
      {activeActivity === "inspiration" && (
        <div className="flex-1 flex flex-col gap-6 p-6 min-h-0">
          <div className="flex items-center justify-between border-b border-zinc-800/20 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500 fill-amber-500/20" />
              <span className="text-xs font-black tracking-wide text-white">💡 퀵 인사이트 (Quick Insight)</span>
            </div>
            <button 
              onClick={() => {
                useUIStore.getState().setRightPanelOpen(false);
              }}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {currentInspiration ? (
            <div className="flex-grow flex flex-col gap-5 overflow-y-auto pr-1 min-h-0 custom-scrollbar-dark select-none">
              
              {/* 기사 헤더 영역 */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">Active Source Info</span>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-black leading-snug text-white">
                    {currentInspiration.title}
                  </h3>
                  
                  {!(currentInspiration.type === "NOTE" || currentInspiration.rawType === "NOTE" || !currentInspiration.url || currentInspiration.url === "#") && (
                    <a 
                      href={currentInspiration.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition-all cursor-pointer shrink-0 mt-0.5"
                      title="기사 원문 링크 바로가기"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-semibold mt-1">
                  <span>{currentInspiration.source || "직접 작성"}</span>
                  <span>•</span>
                  <span>{currentInspiration.date || "최근 수집"}</span>
                </div>

                {/* 극작 메모 직접 작성 자산인 경우 본문 표출 */}
                {(currentInspiration.type === "NOTE" || currentInspiration.rawType === "NOTE" || !currentInspiration.url || currentInspiration.url === "#") && (
                  <div className={cn(
                    "mt-2 p-3.5 rounded-xl border text-[11px] leading-relaxed font-semibold whitespace-pre-wrap select-text max-h-[180px] overflow-y-auto custom-scrollbar-dark",
                    isDarkMode ? "bg-zinc-950/40 border-zinc-800/60 text-zinc-300" : "bg-zinc-100/50 border-zinc-200 text-zinc-800"
                  )}>
                    {currentInspiration.content || currentInspiration.desc || "메모 내용이 없습니다."}
                  </div>
                )}
              </div>

              {/* AI 극화 분석 결과 리포트 */}
              <div className="flex flex-col gap-5 border-t border-zinc-800/30 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AI 극화 분석 리포트</span>
                  <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-black">
                    {currentInspiration.keyword || currentInspiration.main_keyword || "갈등자산"}
                  </span>
                </div>

                {/* 1. 분석 중 상태 */}
                {isAnalyzingQuick && (
                  <div className={cn(
                    "p-8 rounded-2xl border flex flex-col items-center justify-center gap-3 py-12 text-center",
                    isDarkMode ? "bg-[#14141E] border-zinc-800" : "bg-white border-zinc-200"
                  )}>
                    <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-bold text-amber-400 animate-pulse">드라마 갈등 가치 정밀 추출 중...</span>
                  </div>
                )}

                {/* 2. 분석 대기 상태 */}
                {!isAnalyzingQuick && !analyzedProjects[currentInspiration.id] && (
                  <div className={cn(
                    "p-8 rounded-2xl border text-center flex flex-col items-center gap-3 py-10",
                    isDarkMode ? "bg-[#14141E]/40 border-zinc-800/60" : "bg-white border-zinc-200"
                  )}>
                    <HelpCircle size={24} className="text-zinc-600" />
                    <span className="text-[11px] text-zinc-500 leading-relaxed font-semibold">
                      본 자료는 원문 그대로 수집된 상태입니다. 아래의 **[AI 분석 요청]** 버튼을 누르시면 긴장감 지수, 핵심 인물 욕망, 주요 사건 등 극화 핵심 요소가 실시간 설계됩니다.
                    </span>
                  </div>
                )}

                {/* 3. 분석 완료 리포트 노출 */}
                {!isAnalyzingQuick && analyzedProjects[currentInspiration.id] && (
                  <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                    
                    {/* A. Dramatic Tension 지수 게이지 */}
                    <div className={cn(
                      "p-4 rounded-xl border flex flex-col gap-3",
                      isDarkMode ? "bg-[#161622] border-zinc-800" : "bg-zinc-50 border-zinc-200"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                          <Flame size={14} className="fill-amber-500" />
                          <span>Dramatic Tension</span>
                        </div>
                        <span className="text-xs font-black text-white">
                          <span className="text-amber-400 text-sm font-black">
                            {analyzedProjects[currentInspiration.id].score > 0 ? analyzedProjects[currentInspiration.id].score : "-"}
                          </span> / 100
                        </span>
                      </div>
                      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full transition-all duration-1000"
                          style={{ width: `${analyzedProjects[currentInspiration.id].score || 0}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
                        {analyzedProjects[currentInspiration.id].scoreDesc}
                      </p>
                    </div>

                    {/* B. 핵심 갈등 구조 */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                        <ShieldAlert size={12} className="text-rose-400" />
                        핵심 갈등 구조
                      </span>
                      <div className={cn(
                        "p-4 rounded-xl border-l-4 border-amber-500 border text-[11px] text-zinc-300 leading-relaxed font-extrabold",
                        isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                      )}>
                        "{analyzedProjects[currentInspiration.id].conflictStructure}"
                      </div>
                    </div>

                    {/* C. 자료 요약 및 분위기 제안 */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Compass size={12} className="text-blue-400" />
                        자료 요약 및 분위기 제안
                      </span>
                      <div className={cn(
                        "p-4 rounded-xl border flex flex-col gap-3 text-[11px] text-zinc-400 leading-relaxed font-semibold",
                        isDarkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200"
                      )}>
                        <p>{analyzedProjects[currentInspiration.id].summaryAndVibe}</p>
                        <div className="border-t border-zinc-800/30 pt-2 flex flex-col gap-1">
                          <span className="text-[10px] text-amber-500 font-black">추천 분위기</span>
                          <span className="text-white font-extrabold">{analyzedProjects[currentInspiration.id].recommendedVibe}</span>
                        </div>
                      </div>
                    </div>

                    {/* D. 주요 키워드 해시태그 */}
                    <div className="flex flex-wrap gap-1.5">
                      {(analyzedProjects[currentInspiration.id].keywords || []).map((kw: string) => (
                        <span key={kw} className="text-[10px] bg-zinc-800/40 text-zinc-300 px-2.5 py-1.5 rounded-lg font-bold border border-zinc-700/30">
                          #{kw}
                        </span>
                      ))}
                    </div>

                    {/* E. Related People (인물 추출) */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                        <UserCheck size={12} className="text-emerald-400" />
                        Related People (인물 추출)
                      </span>
                      <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto custom-scrollbar-dark pr-1">
                        {(analyzedProjects[currentInspiration.id].relatedPeople || []).map((person: any, idx: number) => (
                          <div 
                            key={idx}
                            className={cn(
                              "p-3 rounded-xl border flex flex-col gap-1.5",
                              isDarkMode ? "bg-zinc-900 border-zinc-800/80" : "bg-white border-zinc-200"
                            )}
                          >
                            <span className="text-[11px] font-extrabold text-white">{person.role}</span>
                            <p className="text-[10px] text-zinc-400 leading-normal">{person.desc}</p>
                            <div className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-black border border-emerald-500/20 w-fit">
                              욕망: {person.desire}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* F. Key Events / Incidents (사건 재료) */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                        <CheckSquare size={12} className="text-purple-400" />
                        Key Events / Incidents
                      </span>
                      <div className="flex flex-col gap-2">
                        {(analyzedProjects[currentInspiration.id].keyEvents || []).map((evt: string, idx: number) => (
                          <div key={idx} className="flex gap-2.5 items-start">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 mt-1.5" />
                            <span className="text-[11px] text-zinc-400 leading-relaxed font-semibold">{evt}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* 하단 극작 자산화 제어 버튼 섹션 */}
              <div className="flex flex-col gap-3 border-t border-zinc-800/30 pt-4 shrink-0 mt-auto bg-[#09090C] z-10 sticky bottom-0">
                                
                <div className="flex gap-2">
                  {analyzedProjects[currentInspiration.id] ? (
                    <button 
                      disabled
                      className="flex-1 py-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 opacity-80"
                    >
                      <Check size={12} />
                      <span>분석 완료</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleTriggerQuickAnalysis(currentInspiration.id, inspirationSubTab === "archive")}
                      disabled={isAnalyzingQuick}
                      className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700/60 text-[11px] font-black rounded-lg transition-all text-center flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Sparkles size={12} />
                      <span>AI 분석 요청</span>
                    </button>
                  )}
                  
                  {inspirationSubTab === "archive" ? (
                    projectLinkedInspirations.includes(currentInspiration.id) ? (
                      <button 
                        onClick={() => {
                          setProjectLinkedInspirations(prev => prev.filter(id => id !== currentInspiration.id));
                          addToast("프로젝트 연동을 해제했습니다.", "info");
                        }}
                        className="flex-1 py-2.5 bg-amber-500 text-black text-[11px] font-black rounded-lg transition-all text-center flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                      >
                        <Check size={12} />
                        프로젝트 연결됨
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setProjectLinkedInspirations(prev => [...prev, currentInspiration.id]);
                          addToast("프로젝트에 참고 영감으로 연결했습니다!", "success");
                        }}
                        className="flex-1 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 text-[11px] font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                      >
                        프로젝트 연결
                      </button>
                    )
                  ) : (
                    handleSaveToArchive && (
                      <button 
                        onClick={handleSaveToArchive}
                        disabled={isSaving}
                        className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black rounded-lg transition-all text-center flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                      >
                        <Archive size={12} />
                        {isSaving ? "저장 중..." : "보관함 저장"}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-zinc-500 text-xs text-center py-20">
              <Sparkles size={24} className="text-zinc-700 mb-2 animate-pulse" />
              스카우터에서 분석할 기사를 선택해 주세요.
            </div>
          )}
        </div>
      )}

      {/* B. [대메뉴: 작업 공간] 일 때 우측 패널 -> 프로젝트 연동 참고 책장(Reference Shelf) 모드 */}
      {activeActivity === "workspace" && (
        <div className="flex-1 flex flex-col gap-6 p-6 min-h-0">
          <div className="flex items-center justify-between border-b border-zinc-800/20 pb-4">
            <div className="flex items-center gap-2">
              <BookmarkCheck size={16} className="text-amber-500" />
              <span className="text-xs font-black tracking-wide text-white">📚 프로젝트 참고 책장 (Inspiration Shelf)</span>
            </div>
            <button 
              onClick={() => setModalOpen("linkArchive", true)}
              className="px-2 py-1 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-400 text-[10px] font-black rounded-lg transition-all"
            >
              영감 불러오기
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
            {linkedReferenceItems.map(item => {
              const isOpen = openReferenceAccordionId === item.id;
              return (
                <div 
                  key={item.id}
                  className={cn(
                    "border rounded-2xl transition-all duration-300 overflow-hidden flex flex-col",
                    isOpen 
                      ? (isDarkMode ? "bg-[#14141E]/40 border-amber-500/30" : "bg-white border-zinc-300 shadow-sm")
                      : (isDarkMode ? "bg-zinc-900/10 border-zinc-800/80 hover:border-zinc-700" : "bg-zinc-50 border-zinc-200")
                  )}
                >
                  <div 
                    onClick={() => setOpenReferenceAccordionId(isOpen ? null : item.id)}
                    className="p-4 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex flex-col gap-1 min-w-0 pr-2">
                      <h4 className="text-xs font-black text-white leading-relaxed line-clamp-1">{item.title}</h4>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{item.type} • {item.source}</span>
                    </div>
                    {isOpen ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
                  </div>

                  {isOpen && (
                    <div className="px-4 pb-4 flex flex-col gap-3.5 border-t border-zinc-800/20 pt-3 animate-in slide-in-from-top-1 duration-200">
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
                        {item.desc}
                      </p>
                      <div className="flex items-center justify-between border-t border-zinc-800/10 pt-3 text-[10px] font-bold">
                        <span className="text-amber-500 flex items-center gap-1">✨ {item.vibe}</span>
                        <button 
                          onClick={() => {
                            setProjectLinkedInspirations(prev => prev.filter(id => id !== item.id));
                            addToast("참고 책장에서 자료를 언링크 해제했습니다.", "info");
                          }}
                          className="text-[9px] text-rose-400 hover:underline"
                        >
                          참고 책장 해제
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {linkedReferenceItems.length === 0 && (
              <div className="text-center py-16 flex flex-col items-center gap-2 text-zinc-500 text-xs">
                <Bookmark size={20} className="text-zinc-700" />
                <span>본 프로젝트에 연동된 영감이 없습니다.</span>
                <span className="text-[10px] text-zinc-600">우측 [영감 불러오기] 단추를 통해 보관함 자료를 이식해 보세요!</span>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
