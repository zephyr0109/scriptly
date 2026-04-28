/**
 * [Architecture Point: UI Layer - Feature Component]
 * 특정 도메인(영감 보관소)의 상세 정보를 보여주는 패널 컴포넌트입니다.
 */
import React from "react";
import { Bookmark, Brain, Wand2, Download, ExternalLink, FileText, ArrowRightLeft, X, Zap } from "lucide-react";
import AnalysisUnifiedView from "../../shared/AnalysisUnifiedView";
import { cn } from "@/lib/utils";

const ArchiveDetailPanel = ({ 
  selectedItem, 
  isDarkMode, 
  setActiveTab,
  handleDownload,
  handleReanalyze,
  onSendToLab
}: any) => {
  return (
    <aside className={cn("w-[420px] border-l flex flex-col transition-colors", isDarkMode ? "bg-[#0C0C0C] border-zinc-800/50" : "bg-zinc-50/50 border-zinc-200")}>
      <div className="p-8 pb-4 flex items-center justify-between">
        <h2 className={cn("text-lg font-bold flex items-center gap-2", isDarkMode ? "text-white" : "text-zinc-900")}>
          <Bookmark size={18} className="text-amber-500 fill-amber-500" /> 영감 상세 정보
        </h2>
      </div>

      <div className={cn(
        "flex-1 overflow-y-auto px-8 py-4 font-sans space-y-8",
        isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar-light"
      )}>
        {selectedItem ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
             {/* 액션 버튼 */}
             <div className="flex gap-2">
                <button 
                  onClick={() => handleReanalyze(selectedItem.id)}
                  className={cn(
                    "flex-1 py-4.5 rounded-2xl border transition-all flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest",
                    isDarkMode ? "bg-zinc-800 border-zinc-700 text-amber-500 hover:text-amber-400" : "bg-white border-zinc-200 text-amber-600 hover:bg-amber-50 shadow-sm"
                  )}
                  title="AI 분석 재요청"
                >
                   <Wand2 size={14} /> 분석 재요청
                </button>

                <div className="flex gap-2 flex-1">
                  {selectedItem.type === "FILE" && (
                    <button className={cn("flex-1 py-4.5 font-black flex items-center justify-center gap-2 rounded-2xl text-[11px] uppercase tracking-widest", isDarkMode ? "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white" : "bg-white border border-zinc-100 text-zinc-600 hover:bg-zinc-50 shadow-sm")}
                      onClick={() => handleDownload(selectedItem.id, selectedItem.original_filename)}>
                      <Download size={14} /> Download
                    </button>
                  )}
                  {selectedItem.source_url && (
                    <button className={cn("flex-1 py-4.5 font-black flex items-center justify-center gap-2 rounded-2xl text-[11px] uppercase tracking-widest", isDarkMode ? "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white" : "bg-white border border-zinc-100 text-zinc-600 hover:bg-zinc-50 shadow-sm")}
                      onClick={() => window.open(selectedItem.source_url, '_blank')}>
                      <ExternalLink size={14} /> Link
                    </button>
                  )}
                </div>
             </div>

             {/* 상세 분석 내용 */}
             <div className="space-y-10 pb-10">
                {selectedItem.analysis_status === "PROCESSING" ? (
                  <div className="flex flex-col items-center justify-center p-10 space-y-4 opacity-50">
                    <Zap size={24} className="text-amber-500 animate-pulse" />
                    <p className="text-xs font-bold text-zinc-500">AI 상세 분석이 진행 중입니다...</p>
                  </div>
                ) : selectedItem.source_metadata?.detailed_analysis ? (
                  <AnalysisUnifiedView 
                    data={{
                      ...selectedItem.source_metadata.detailed_analysis,
                      tension_score: selectedItem.tension_score,
                      tension_reason: selectedItem.tension_reason
                    }}
                    isDarkMode={isDarkMode}
                  />
                ) : (
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Dramatic Analysis</h4>
                    <div className={cn("p-6 rounded-[2rem]", isDarkMode ? "bg-zinc-900/40" : "bg-white border border-zinc-100 shadow-sm")}>
                       <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold text-zinc-500">Tension Score</span>
                          <span className="text-2xl font-black text-amber-500">{selectedItem.tension_score}</span>
                       </div>
                       <p className={cn("text-sm leading-relaxed font-medium", isDarkMode ? "text-zinc-300" : "text-zinc-600")}>{selectedItem.tension_reason || "분석 예약 대기 중..."}</p>
                    </div>
                  </section>
                )}
             </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
            <Bookmark size={32} className={isDarkMode ? "text-zinc-700" : "text-zinc-300"} />
            <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed">보관된 영감을 선택하여<br/>자세히 살펴보세요</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ArchiveDetailPanel;
