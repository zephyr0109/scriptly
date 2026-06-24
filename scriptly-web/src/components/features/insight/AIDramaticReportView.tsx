"use client";
import React from "react";
import { 
  Sparkles, ShieldAlert, Flame, UserCheck, CheckSquare, 
  BookmarkCheck, Compass 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIDramaticReportViewProps {
  activeInspiration: any;
  analyzedProjects: Record<string, any>;
  isDarkMode: boolean;
  isSourceAnalyzing: boolean;
  isAnalyzingQuick: boolean;
  linkedProjects: any[];
}

export default function AIDramaticReportView({
  activeInspiration,
  analyzedProjects,
  isDarkMode,
  isSourceAnalyzing,
  isAnalyzingQuick,
  linkedProjects
}: AIDramaticReportViewProps) {
  if (!activeInspiration) return null;

  const analysis = analyzedProjects[activeInspiration.id];

  return (
    <div className="flex flex-col gap-5 border-t border-zinc-800/30 pt-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AI 극화 분석 리포트</span>
        <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-black">
          {activeInspiration.keyword || activeInspiration.main_keyword || "갈등자산"}
        </span>
      </div>

      {/* 1. 분석 중 상태 (이전 분석 결과 캐시가 없을 때만 거대 스피너 노출) */}
      {isSourceAnalyzing && !analysis && (
        <div className={cn(
          "p-8 rounded-2xl border flex flex-col items-center justify-center gap-3 py-12 text-center",
          isDarkMode ? "bg-[#14141E] border-zinc-800" : "bg-white border-zinc-200"
        )}>
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-amber-400 animate-pulse">AI 분석 중</span>
        </div>
      )}

      {/* 1.5 분석 실패 상태 (이전 분석 캐시가 없을 때만 실패 경고 뷰 렌더링) */}
      {!isSourceAnalyzing && activeInspiration.analysis_status === "FAILED" && !analysis && (
        <div className={cn(
          "p-8 rounded-2xl border text-center flex flex-col items-center gap-3 py-10",
          isDarkMode ? "bg-red-500/5 border-red-500/20" : "bg-red-50 border-red-200"
        )}>
          <ShieldAlert size={24} className="text-red-500" />
          <span className="text-[11px] text-red-500 leading-relaxed font-extrabold">
            AI 분석에 실패했습니다. API 사용량(Quota) 초과 등의 사유일 수 있으니 잠시 후 다시 시도해 주세요.
          </span>
        </div>
      )}

      {/* 2. 분석 대기 상태 */}
      {!isSourceAnalyzing && !analysis && activeInspiration.analysis_status !== "FAILED" && (
        <div className={cn(
          "p-8 rounded-2xl border text-center flex flex-col items-center gap-3 py-10",
          isDarkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"
        )}>
          <Sparkles size={24} className="text-amber-500 animate-pulse" />
          <span className="text-xs font-bold text-zinc-400 leading-relaxed">
            이 영감 자산은 아직 AI 정밀 분석이 수행되지 않았습니다. 아래 버튼을 눌러 갈등 구조와 인물의 욕망을 추출하세요.
          </span>
        </div>
      )}

      {/* 3. 분석 완료 리포트 노출 */}
      {!isAnalyzingQuick && analysis && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-500">
          
          {/* 연결된 기획안(프로젝트) 뱃지 목록 */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <BookmarkCheck size={12} className="text-amber-400" />
              연결된 기획안
            </span>
            <div className="flex flex-wrap gap-1.5">
              {linkedProjects.length > 0 ? (
                linkedProjects.map(proj => (
                  <span 
                    key={proj.id} 
                    className="text-[9px] bg-[#fbbf24]/10 border border-[#fbbf24]/20 text-[#fbbf24] font-bold px-2 py-0.5 rounded"
                  >
                    {proj.title}
                  </span>
                ))
              ) : (
                <span className="text-[9px] text-zinc-500 font-bold italic">
                  연결된 기획안이 없습니다.
                </span>
              )}
            </div>
          </div>

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
                  {analysis.score > 0 ? analysis.score : "-"}
                </span> / 100
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full transition-all duration-1000"
                style={{ width: `${analysis.score || 0}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-455 leading-relaxed font-semibold">
              {analysis.scoreDesc}
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
              "{analysis.conflictStructure}"
            </div>
          </div>

          {/* C. 자료 요약 및 분위기 제안 */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Compass size={12} className="text-blue-400" />
              자료 요약 및 분위기 제안
            </span>
            <div className={cn(
              "p-4 rounded-xl border flex flex-col gap-3 text-[11px] text-zinc-455 leading-relaxed font-semibold",
              isDarkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200"
            )}>
              <p>{analysis.summaryAndVibe}</p>
              <div className="border-t border-zinc-800/30 pt-2 flex flex-col gap-1">
                <span className="text-[10px] text-amber-500 font-black">추천 분위기</span>
                <span className="text-white font-extrabold">{analysis.recommendedVibe}</span>
              </div>
            </div>
          </div>

          {/* D. 주요 키워드 해시태그 */}
          <div className="flex flex-wrap gap-1.5">
            {(analysis.keywords || []).map((kw: string) => (
              <span key={kw} className="text-[10px] bg-zinc-800 text-zinc-300 px-2.5 py-1.5 rounded-lg font-bold border border-zinc-800/30">
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
              {(analysis.relatedPeople || []).map((person: any, idx: number) => (
                <div 
                  key={idx}
                  className={cn(
                    "p-3 rounded-xl border flex flex-col gap-1.5",
                    isDarkMode ? "bg-zinc-900 border-zinc-800/80" : "bg-white border-zinc-200"
                  )}
                >
                  <span className="text-[11px] font-extrabold text-white">{person.role}</span>
                  <p className="text-[10px] text-zinc-455 leading-normal">{person.desc}</p>
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
              {(analysis.keyEvents || []).map((evt: string, idx: number) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 mt-1.5" />
                  <span className="text-[11px] text-zinc-455 leading-relaxed font-semibold">{evt}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
