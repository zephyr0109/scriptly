/**
 * [Architecture Point: UI Layer - Shared Component]
 * 도메인에 종속되지 않고 여러 곳에서 재사용되는 UI 컴포넌트입니다.
 * 필사 시 범용적인 Props 인터페이스와 스타일 처리 방식을 보십시오.
 */
import React from "react";
import { Zap, ArrowRightLeft, FileText, User, Sparkles, Wind } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisUnifiedViewProps {
  data: any;
  isDarkMode: boolean;
}

const AnalysisUnifiedView = ({ data, isDarkMode }: AnalysisUnifiedViewProps) => {
  if (!data) return null;

  const { 
    summary, 
    keywords = [], 
    incidents = [], 
    people = [], 
    core_conflict, 
    atmosphere, 
    tension_score, 
    tension_reason 
  } = data;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700 pb-10">
      {/* 1. 긴장도 및 핵심 갈등 */}
      <section className={cn(
        "p-7 rounded-[2.5rem] space-y-5 transition-all", 
        isDarkMode ? "bg-zinc-900/40" : "bg-white border border-zinc-100 shadow-sm"
      )}>
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Dramatic Tension</h4>
          <div className="flex items-end gap-1">
             <span className="text-3xl font-black text-amber-500 tracking-tighter">{tension_score || 0}</span>
             <span className="text-xs text-zinc-600 font-bold mb-1">/100</span>
          </div>
        </div>
        <p className={cn("text-sm leading-relaxed font-medium opacity-80", isDarkMode ? "text-zinc-300" : "text-zinc-600")}>
          {tension_reason || "긴장도 분석 결과가 없습니다."}
        </p>
        
        {core_conflict && (
          <div className={cn("mt-4 p-5 rounded-3xl", isDarkMode ? "bg-rose-500/10" : "bg-rose-50")}>
            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <ArrowRightLeft size={12}/> 핵심 갈등 구조
            </h4>
            <p className={cn("text-sm font-bold leading-relaxed", isDarkMode ? "text-white" : "text-zinc-900")}>
              {core_conflict}
            </p>
          </div>
        )}
      </section>

      {/* 2. 요약 및 분위기 */}
      <section className="space-y-4">
        <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-widest flex items-center gap-2">
          <FileText size={14}/> 자료 요약 및 분위기
        </h4>
        <div className={cn("p-6 rounded-[2rem] text-[13px] leading-relaxed font-medium", isDarkMode ? "bg-zinc-900/30 text-zinc-400" : "bg-sky-50/30 text-zinc-600")}>
          {summary || "요약 정보가 없습니다."}
        </div>
        {atmosphere && (
          <div className={cn(
            "p-4 rounded-2xl flex items-center gap-3", 
            isDarkMode ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-700"
          )}>
            <Wind size={14} />
            <span className="text-xs font-bold tracking-tight">추천 분위기: {atmosphere}</span>
          </div>
        )}
      </section>

      {/* 3. 키워드 */}
      <section className="space-y-4">
        <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
          <Sparkles size={14}/> 주요 키워드
        </h4>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw: string, i: number) => (
            <span key={i} className={cn(
              "px-3 py-1.5 rounded-full text-[10px] font-bold border", 
              isDarkMode ? "bg-zinc-900 border-zinc-800 text-emerald-500" : "bg-emerald-50 border-emerald-100 text-emerald-700"
            )}>
              #{kw}
            </span>
          ))}
        </div>
      </section>

      {/* 4. 인물 및 사건 */}
      <section className="space-y-6">
        <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
          <User size={14}/> 인물 및 사건 (재료 추출)
        </h4>
        <div className="space-y-4">
          {/* People List */}
          <div className={cn("p-5 rounded-3xl", isDarkMode ? "bg-zinc-900/50" : "bg-white border border-zinc-100 shadow-sm")}>
            <p className="text-[10px] text-zinc-500 mb-3 font-black uppercase tracking-tighter">Related People</p>
            <div className="space-y-2">
              {people.map((p: any, i: number) => (
                <div key={i} className={cn(
                  "p-3 rounded-xl border flex flex-col gap-1",
                  isDarkMode ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-50 border-zinc-100"
                )}>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black text-indigo-400">{typeof p === 'object' ? p.name : p}</span>
                    <span className="text-[9px] font-bold text-zinc-500">{typeof p === 'object' ? p.role : ''}</span>
                  </div>
                  {typeof p === 'object' && p.description && (
                    <p className="text-[10px] text-zinc-500 line-clamp-1 italic">{p.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Incidents List */}
          <div className={cn("p-5 rounded-3xl", isDarkMode ? "bg-zinc-900/50" : "bg-white border border-zinc-100 shadow-sm")}>
            <p className="text-[10px] text-zinc-500 mb-3 font-black uppercase tracking-tighter">Key Events / Incidents</p>
            <ul className="space-y-2">
              {incidents.map((ev: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-xs font-medium leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span className={isDarkMode ? "text-zinc-400" : "text-zinc-600"}>{ev}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalysisUnifiedView;
