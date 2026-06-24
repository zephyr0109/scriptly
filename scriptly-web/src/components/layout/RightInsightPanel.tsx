"use client";
import React, { useState, useEffect } from "react";
import { 
  Sparkles, ShieldAlert, Bookmark, ChevronDown, ChevronRight, 
  BookmarkCheck, ExternalLink, Archive, X, Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import api from "@/lib/api";
import ArticleContentView from "@/components/features/insight/ArticleContentView";
import AIDramaticReportView from "@/components/features/insight/AIDramaticReportView";

interface RightInsightPanelProps {
  currentInspiration: any;
  isAnalyzingQuick: boolean;
  analyzedProjects: Record<string, any>;
  handleTriggerQuickAnalysis: (id: string, isFromArchive?: boolean) => void;
  linkedReferenceItems: any[];
  projects: any[];
  archiveItems?: any[];
  onOpenLinkProjectModal?: (inspiration: any) => void;
  onRemoveReference?: (id: string) => void;
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
  projects,
  archiveItems = [],
  onOpenLinkProjectModal,
  onRemoveReference,
  handleSaveToArchive,
  isSaving,
  addToast
}: RightInsightPanelProps) {
  const {
    rightPanelWidth,
    setRightPanelWidth,
    activeActivity,
    inspirationSubTab,
    isRightPanelOpen,
    isDarkMode,
    setModalOpen
  } = useUIStore();

  const [focusedInspiration, setFocusedInspiration] = useState<any | null>(null);
  const activeInspiration = focusedInspiration || currentInspiration;

  const [activeTab, setActiveTab] = useState<"content" | "report">("content");
  const [crawledContent, setCrawledContent] = useState<string>("");
  const [isCrawling, setIsCrawling] = useState<boolean>(false);

  useEffect(() => {
    if (!activeInspiration) {
      setCrawledContent("");
      return;
    }

    setActiveTab("content");
    setCrawledContent("");

    const isNews = activeInspiration.type === "NEWS" || activeInspiration.rawType === "NEWS" || (activeInspiration.url && activeInspiration.url !== "#");
    const isNote = activeInspiration.type === "NOTE" || activeInspiration.rawType === "NOTE";

    if (isNews && !isNote) {
      if (activeInspiration.content && activeInspiration.content !== activeInspiration.summary && activeInspiration.content !== activeInspiration.desc) {
        setCrawledContent(activeInspiration.content);
        return;
      }

      const startCrawling = async () => {
        setIsCrawling(true);
        try {
          const response = await api.post(`/news/${activeInspiration.id}/crawl`);
          setCrawledContent(response.data.content || "");
        } catch (err) {
          console.error("Failed to crawl article:", err);
          setCrawledContent(activeInspiration.summary || activeInspiration.desc || "");
        } finally {
          setIsCrawling(false);
        }
      };

      startCrawling();
    }
  }, [activeInspiration?.id]);

  const [openReferenceAccordionId, setOpenReferenceAccordionId] = useState<string | null>("insp_1");
  const [isResizing, setIsResizing] = useState(false);

  const getLinkedProjects = () => {
    if (!activeInspiration || !projects) return [];
    return projects.filter(
      (proj) => proj.linked_sources && proj.linked_sources.includes(activeInspiration.id)
    );
  };

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        const width = window.innerWidth - e.clientX;
        setRightPanelWidth(Math.max(250, Math.min(600, width)));
      }
    };
    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, setRightPanelWidth]);

  if (!isRightPanelOpen) return null;

  const hasAnalysis = activeInspiration && analyzedProjects[activeInspiration.id];
  const isSourceAnalyzing = isAnalyzingQuick || 
    (activeInspiration && 
      (activeInspiration.analysis_status === "PENDING" || 
       activeInspiration.analysis_status === "PROCESSING"));

  const getSourceDisplay = () => {
    if (!activeInspiration) return "";
    
    const type = activeInspiration.type || activeInspiration.rawType;
    if (type === "NOTE") {
      return "✍️ 직접 작성 메모";
    }
    if (type === "FILE") {
      return `📁 첨부 문서 (${activeInspiration.original_filename || "파일"})`;
    }
    if (type === "NEWS") {
      const url = activeInspiration.source_url || activeInspiration.url;
      if (url && url !== "#") {
        try {
          const host = new URL(url).hostname;
          return `🔗 뉴스 기사 (${host.replace("www.", "")})`;
        } catch (e) {}
      }
      return "🔗 뉴스 기사 링크";
    }
    
    const sourceName = activeInspiration.source || (activeInspiration.url?.includes("naver.com") ? "네이버 뉴스" : "구글 뉴스");
    return `📰 검색 뉴스 (${sourceName})`;
  };

  const getDateDisplay = () => {
    if (!activeInspiration) return "";
    
    const formatDate = (dateStr: string) => {
      if (!dateStr) return "";
      try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toISOString().split("T")[0];
      } catch (e) {
        return dateStr;
      }
    };

    const dateVal = activeInspiration.ingested_at || activeInspiration.created_at || activeInspiration.date || activeInspiration.article?.pubDate;
    const type = activeInspiration.type || activeInspiration.rawType;
    if (type === "NOTE" || type === "FILE" || (type === "NEWS" && activeInspiration.ingested_at)) {
      return dateVal ? `${formatDate(dateVal)} 수집됨` : "최근 수집";
    }
    return dateVal ? `${formatDate(dateVal)} 발행됨` : "최근 발행";
  };

  return (
    <aside 
      style={{ width: `${rightPanelWidth}px` }}
      className={cn(
        "border-l h-full flex flex-col shrink-0 overflow-hidden select-none relative",
        isDarkMode ? "bg-[#09090C] border-zinc-800/80" : "bg-[#F8F9FC] border-zinc-200"
      )}
    >
      {/* 리사이즈 드래그 핸들 */}
      <div 
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
        className="absolute top-0 left-0 w-1.5 h-full cursor-ew-resize hover:bg-amber-500/40 active:bg-amber-500 transition-all z-50 group flex items-center justify-center"
      >
        <div className="w-[1px] h-8 bg-zinc-800 group-hover:bg-amber-500/60 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      {/* A. [대메뉴: 영감 기획실] 일 때, 혹은 책장에서 개별 상세 조회를 한 경우 -> 개별 퀵 인사이트(Quick Insight) 모드 */}
      {(activeActivity === "inspiration" || focusedInspiration !== null) && (
        <div className="flex-1 flex flex-col gap-6 p-6 min-h-0">
          <div className="flex items-center justify-between border-b border-zinc-800/20 pb-4">
            <div className="flex items-center gap-2">
              {focusedInspiration ? (
                <button 
                  onClick={() => setFocusedInspiration(null)}
                  className="flex items-center gap-1.5 text-xs font-black text-amber-500 hover:text-amber-400 active:scale-95 transition-all"
                >
                  <span>← 책장으로 돌아가기</span>
                </button>
              ) : (
                <>
                  <Sparkles size={16} className="text-amber-500 fill-amber-500/20" />
                  <span className="text-xs font-black tracking-wide text-white">💡 퀵 인사이트 (Quick Insight)</span>
                </>
              )}
            </div>
            <button 
              onClick={() => {
                setFocusedInspiration(null);
                useUIStore.getState().setRightPanelOpen(false);
              }}
              className="p-1.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {activeInspiration ? (
            <div className="flex-grow flex flex-col gap-5 overflow-y-auto pr-1 min-h-0 custom-scrollbar-dark select-none">
              
              {/* 기사 헤더 영역 */}
              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">Active Source Info</span>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-black leading-snug text-white">
                    {activeInspiration.title}
                  </h3>
                  
                  {!(activeInspiration.type === "NOTE" || activeInspiration.rawType === "NOTE" || !activeInspiration.url || activeInspiration.url === "#") && (
                    <a 
                      href={activeInspiration.url}
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
                  <span>{getSourceDisplay()}</span>
                  <span>•</span>
                  <span>{getDateDisplay()}</span>
                </div>

                {/* 극작 메모 직접 작성 자산인 경우 본문 표출 */}
                {(activeInspiration.type === "NOTE" || activeInspiration.rawType === "NOTE" || !activeInspiration.url || activeInspiration.url === "#") && (
                  <div className={cn(
                    "mt-2 p-3.5 rounded-xl border text-[11px] leading-relaxed font-semibold whitespace-pre-wrap select-text max-h-[180px] overflow-y-auto custom-scrollbar-dark",
                    isDarkMode ? "bg-zinc-950/40 border-zinc-800/60 text-zinc-300" : "bg-zinc-100/50 border-zinc-200 text-zinc-800"
                  )}>
                    {activeInspiration.content || activeInspiration.desc || "메모 내용이 없습니다."}
                  </div>
                )}
              </div>

              {/* 탭 헤더 및 원문/AI 리포트 분기 영역 */}
              {(() => {
                const showTabs = activeInspiration && 
                  activeInspiration.type !== "NOTE" && 
                  activeInspiration.rawType !== "NOTE" && 
                  activeInspiration.url && 
                  activeInspiration.url !== "#";
                
                return (
                  <>
                    {showTabs && (
                      <div className="flex border-b border-zinc-800/30 pb-1 mb-2 shrink-0">
                        <button
                          onClick={() => setActiveTab("content")}
                          className={cn(
                            "flex-1 py-2 text-center text-xs font-black transition-all border-b-2",
                            activeTab === "content" 
                              ? "text-amber-500 border-amber-500 font-extrabold" 
                              : "text-zinc-500 border-transparent hover:text-zinc-300"
                          )}
                        >
                          📰 기사 원문
                        </button>
                        <button
                          onClick={() => setActiveTab("report")}
                          className={cn(
                            "flex-1 py-2 text-center text-xs font-black transition-all border-b-2",
                            activeTab === "report" 
                              ? "text-amber-500 border-amber-500 font-extrabold" 
                              : "text-zinc-500 border-transparent hover:text-zinc-300"
                          )}
                        >
                          💡 AI 극화 분석
                        </button>
                      </div>
                    )}

                    {/* 1. 기사 원문 탭 활성화 시 */}
                    {showTabs && activeTab === "content" && (
                      <ArticleContentView
                        activeInspiration={activeInspiration}
                        isDarkMode={isDarkMode}
                        isCrawling={isCrawling}
                        crawledContent={crawledContent}
                      />
                    )}

                    {/* 2. AI 극화 분석 리포트 탭 활성화 시 (또는 탭 미표시 시) */}
                    {(!showTabs || activeTab === "report") && (
                      <AIDramaticReportView
                        activeInspiration={activeInspiration}
                        analyzedProjects={analyzedProjects}
                        isDarkMode={isDarkMode}
                        isSourceAnalyzing={isSourceAnalyzing}
                        isAnalyzingQuick={isAnalyzingQuick}
                        linkedProjects={getLinkedProjects()}
                      />
                    )}
          </>
        );
      })()}

              {/* 하단 극작 자산화 제어 버튼 섹션 */}
              <div className="flex flex-col gap-3 border-t border-zinc-800/30 pt-4 shrink-0 mt-auto bg-[#09090C] z-10 sticky bottom-0">
                                
                <div className="flex gap-2">
                  {analyzedProjects[activeInspiration.id] ? (
                    <button 
                      onClick={() => handleTriggerQuickAnalysis(activeInspiration.id, inspirationSubTab === "archive")}
                      disabled={isAnalyzingQuick}
                      className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700/60 text-[11px] font-black rounded-lg transition-all text-center flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Sparkles size={12} className={cn(isSourceAnalyzing && "animate-spin")} />
                      <span>{isSourceAnalyzing ? "재분석 진행 중..." : "AI 재분석 요청"}</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleTriggerQuickAnalysis(activeInspiration.id, inspirationSubTab === "archive")}
                      disabled={isSourceAnalyzing}
                      className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700/60 text-[11px] font-black rounded-lg transition-all text-center flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <Sparkles size={12} className={cn(isSourceAnalyzing && "animate-spin")} />
                      <span>{isSourceAnalyzing ? "분석 진행 중..." : "AI 분석 요청"}</span>
                    </button>
                  )}
                  
                  {inspirationSubTab === "archive" ? (
                    <button 
                      onClick={() => {
                        if (onOpenLinkProjectModal) {
                          onOpenLinkProjectModal(activeInspiration);
                        }
                      }}
                      className="flex-1 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-750 hover:text-white text-[11px] font-black rounded-lg transition-all text-center flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <BookmarkCheck size={12} />
                      <span>기획안 연결 관리</span>
                    </button>
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
      {activeActivity === "workspace" && focusedInspiration === null && (
        <div className="flex-1 flex flex-col gap-6 p-6 min-h-0">
          <div className="flex flex-col gap-3 border-b border-zinc-800/20 pb-4">
            <div className="flex items-center gap-2">
              <BookmarkCheck size={16} className="text-amber-500" />
              <span className="text-sm font-black tracking-wide text-white">📚 프로젝트 참고 책장</span>
            </div>
            <button 
              onClick={() => setModalOpen("linkArchive", true)}
              className="w-full py-2.5 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-400 text-[11px] font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus size={12} />
              영감 불러오기
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar-dark">
            {linkedReferenceItems.map(item => {
              const isOpen = openReferenceAccordionId === item.id;
              return (
                <div 
                  key={item.id}
                  className={cn(
                    "border rounded-2xl transition-all duration-300 overflow-hidden flex flex-col shrink-0",
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
                      <div className="flex flex-col gap-2 border-t border-zinc-800/10 pt-3 text-[10px] font-bold">
                        <div className="flex items-center text-amber-500">
                          <span>✨ {item.vibe}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-zinc-800/5">
                          <button
                            onClick={() => {
                              setFocusedInspiration(item);
                              if (!analyzedProjects || !analyzedProjects[item.id]) {
                                handleTriggerQuickAnalysis(item.id, true);
                              }
                            }}
                            className="text-[9px] text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            상세 분석 리포트 보기 →
                          </button>
                          <button 
                            onClick={() => {
                              if (onRemoveReference) {
                                onRemoveReference(item.id);
                              }
                            }}
                            className="text-[9px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                          >
                            참고 책장 해제
                          </button>
                        </div>
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
