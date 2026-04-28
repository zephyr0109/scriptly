/**
 * [Architecture Point: UI Layer - Feature Component]
 * 특정 도메인(뉴스 큐레이션)의 상세 정보를 보여주는 패널 컴포넌트입니다.
 */
import React from "react";
import { Zap, Archive, Brain, Sparkles, FileText, ArrowRightLeft, Search, Wind } from "lucide-react";
import AnalysisUnifiedView from "../../shared/AnalysisUnifiedView";
import { cn } from "@/lib/utils";

const CurationDetailPanel = ({ 
  selectedNews, 
  isAnalyzingDetail, 
  handleAnalyzeDetail, 
  isSaving, 
  handleSaveToArchive, 
  isDarkMode, 
  setActiveTab,
  onSendToLab
}: any) => {
  return (
    <aside className={cn("w-[420px] border-l flex flex-col transition-colors", isDarkMode ? "bg-[#0C0C0C] border-zinc-800/50" : "bg-zinc-50/50 border-zinc-200")}>
      <div className="p-8 pb-4 flex items-center justify-between">
        <h2 className={cn("text-lg font-bold flex items-center gap-2", isDarkMode ? "text-white" : "text-zinc-900")}>
          <Zap size={18} className="text-amber-500 fill-amber-500" /> 퀵 인사이트
        </h2>
      </div>

      <div className={cn(
        "flex-1 overflow-y-auto px-8 py-4 font-sans space-y-8",
        isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar-light"
      )}>
        {selectedNews ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* 액션 버튼 영역 */}
            <div className="flex gap-3">
              <button 
                onClick={handleSaveToArchive}
                disabled={isSaving}
                className={cn(
                  "flex-1 py-3.5 font-bold rounded-2xl text-[11px] transition-all flex items-center justify-center gap-2 uppercase tracking-widest",
                  isDarkMode ? "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white" : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-amber-500 shadow-sm"
                )}>
                <Archive size={14} /> {isSaving ? "저장 중" : "보관함 저장"}
              </button>
            </div>

            {/* 상세 분석 및 통합 뷰 */}
            <div className="space-y-8">
               {!selectedNews.detail_analysis ? (
                 <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* 텐션 정보 카드 (임시/배치 결과) */}
                    <div className={cn("p-7 rounded-[2.5rem] space-y-5 transition-all", isDarkMode ? "bg-zinc-900/40" : "bg-white border border-zinc-100 shadow-sm")}>
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Dramatic Tension (Batch)</h4>
                        <div className="flex items-end gap-1">
                           <span className="text-3xl font-black text-amber-500 tracking-tighter">{selectedNews.tension_evaluation?.score || 0}</span>
                           <span className="text-xs text-zinc-600 font-bold mb-1">/100</span>
                        </div>
                      </div>
                      <p className={cn("text-sm leading-relaxed font-medium opacity-80", isDarkMode ? "text-zinc-300" : "text-zinc-600")}>{selectedNews.tension_evaluation?.reason}</p>
                      <div className={cn("mt-4 p-5 rounded-3xl", isDarkMode ? "bg-rose-500/10" : "bg-rose-50")}>
                        <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2"><ArrowRightLeft size={12}/> 핵심 갈등 구조</h4>
                        <p className={cn("text-sm font-bold leading-relaxed", isDarkMode ? "text-white" : "text-zinc-900")}>{selectedNews.tension_evaluation?.potential_conflict}</p>
                      </div>
                    </div>

                    <div className={cn("p-10 rounded-[2.5rem] text-center space-y-6 border-2 border-dashed", isDarkMode ? "border-zinc-800/50 bg-zinc-900/10" : "border-zinc-200 bg-zinc-100/30")}>
                        <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                          <Sparkles size={20} className="text-amber-500" />
                        </div>
                        <p className="text-xs font-bold text-zinc-500 leading-relaxed italic">이 기사의 본문을 심층 분석하여<br/>인사이트를 추출하시겠습니까?</p>
                        <button 
                          onClick={handleAnalyzeDetail}
                          disabled={isAnalyzingDetail}
                          className={cn(
                            "w-full py-4.5 font-black rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-xl",
                            isDarkMode ? "bg-amber-500 text-black hover:bg-amber-400" : "bg-zinc-900 text-white hover:bg-zinc-800"
                          )}
                        >
                          {isAnalyzingDetail ? <Zap size={14} className="animate-spin" /> : <Sparkles size={14} />}
                          {isAnalyzingDetail ? "인사이트 추출 중..." : "AI 상세 인사이트 추출"}
                        </button>
                    </div>
                 </div>
               ) : (
                 <AnalysisUnifiedView 
                   data={selectedNews.detail_analysis} 
                   isDarkMode={isDarkMode} 
                 />
               )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
            <Search size={32} className={isDarkMode ? "text-zinc-700" : "text-zinc-300"} />
            <p className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em] leading-relaxed">기사를 선택하여<br/>인사이트를 발견하세요</p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default CurationDetailPanel;
