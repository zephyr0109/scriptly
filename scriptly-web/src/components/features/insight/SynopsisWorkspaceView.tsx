"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";

/**
 * SynopsisWorkspaceView 컴포넌트의 Props 인터페이스 정의
 */
interface SynopsisWorkspaceViewProps {
  currentProject: any;
  characters: any[];
  editProjectLogline: string;
  setEditProjectLogline: (val: string) => void;
  editProjectFullSynopsis: string;
  setEditProjectFullSynopsis: (val: string) => void;
  isGeneratingSynopsis: boolean;
  handleGenerateLogline: () => Promise<void>;
  handleGenerateSynopsis: () => Promise<void>;
  handleSaveSynopsis: () => Promise<void>;
  handleExportDocument: (format: "word" | "pdf") => Promise<void>;
}

/**
 * SynopsisWorkspaceView 컴포넌트
 * 드라마 시놉시스 설계실 탭(activeWorkspaceTab === "draft")을 담당하며, 2단 레이아웃(좌측: 작품 개요 및 인물 인덱스, 우측: 로그라인 및 줄거리 편집)과 상단 내보내기 툴바를 제공합니다.
 */
export default function SynopsisWorkspaceView({
  currentProject,
  characters,
  editProjectLogline,
  setEditProjectLogline,
  editProjectFullSynopsis,
  setEditProjectFullSynopsis,
  isGeneratingSynopsis,
  handleGenerateLogline,
  handleGenerateSynopsis,
  handleSaveSynopsis,
  handleExportDocument
}: SynopsisWorkspaceViewProps) {
  const { isDarkMode } = useUIStore();
  return (
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
                className={cn(
                  "px-3 py-1.5 text-[9px] font-black rounded-lg transition-all shadow-sm active:scale-95 flex items-center gap-1 border",
                  isDarkMode 
                    ? "bg-indigo-950/20 border-indigo-900/40 text-indigo-400 hover:bg-indigo-900/20" 
                    : "bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100",
                  isGeneratingSynopsis && "opacity-50 cursor-not-allowed"
                )}
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
                className={cn(
                  "px-3 py-1.5 text-[9px] font-black rounded-lg transition-all shadow-sm active:scale-95 flex items-center gap-1 border",
                  isDarkMode 
                    ? "bg-indigo-950/20 border-indigo-900/40 text-indigo-400 hover:bg-indigo-900/20" 
                    : "bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100",
                  isGeneratingSynopsis && "opacity-50 cursor-not-allowed"
                )}
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
  );
}
