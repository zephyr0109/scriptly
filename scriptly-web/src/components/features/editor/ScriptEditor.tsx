"use client";

import React, { useMemo } from "react";
import { Save, Play, BookOpenCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";

interface ScriptEditorProps {
  scriptText: string;
  setScriptText: React.Dispatch<React.SetStateAction<string>>;
  addToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
}

export default function ScriptEditor({ scriptText, setScriptText, addToast }: ScriptEditorProps) {
  const { isDarkMode } = useUIStore();

  const outline = useMemo(() => {
    return scriptText.split("\n")
      .filter(line => line.startsWith("#"))
      .map((line, idx) => ({
        id: `scene_${idx}`,
        title: line.replace(/^#+\s*/, ""),
        rawLine: line
      }));
  }, [scriptText]);

  return (
    <div className="flex-1 flex overflow-hidden min-h-0 select-none">
      
      {/* 1. 좌측 영역 (실시간 씬 아웃라인 구조 바 - 220px 고정 폭) */}
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
                addToast(`선택된 '${scene.title}' 위치로 신속 이동 시뮬레이션!`, "info");
              }}
              className="text-left py-2 px-3 rounded-lg text-xs font-bold transition-all text-zinc-400 hover:text-white hover:bg-zinc-800/50 flex items-center gap-2"
            >
              <span className="text-[9px] font-black text-amber-500">#{idx + 1}</span>
              <span className="truncate">{scene.title}</span>
            </button>
          ))}
          {outline.length === 0 && (
            <span className="text-[10px] text-zinc-600 font-semibold italic text-center py-6">
              헤더(# 씬 이름)를 입력하여 씬을 생성해 보세요!
            </span>
          )}
        </div>
      </div>

      {/* 2. 우측 영역 (본문 작성 에디터 화면) */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex items-center justify-between border-b border-zinc-800/10 p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-black text-white">자유 집필 대본 작성기</h2>
            <p className="text-[10px] text-zinc-500 font-semibold">드라마 시나리오를 집필하며 좌측의 실시간 씬 아웃라인의 정렬 상태를 추적합니다.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => addToast("작성된 대본이 로컬 서버에 영구 자동 저장되었습니다.", "success")}
              className="px-3.5 py-2 text-xs font-bold bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Save size={13} />
              자동 저장 활성
            </button>
            <button 
              onClick={() => addToast("대본 작성기 AI 실시간 감지 분석 가동", "info")}
              className="px-4 py-2 text-xs font-black bg-amber-500 text-black hover:bg-amber-400 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <Play size={13} />
              AI 씬 분석 시작
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-hidden flex">
          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            placeholder="이곳에 자유롭게 극본 대본을 작성해 보세요. Markdown 제목 문법(#, ##)으로 단락을 구분하면 좌측 아웃라인 패널에 실시간 씬 목록이 매핑되어 편리하게 추적할 수 있습니다."
            className={cn(
              "flex-1 h-full w-full outline-none resize-none font-mono text-sm leading-relaxed p-6 rounded-2xl border custom-scrollbar-dark",
              isDarkMode 
                ? "bg-[#14141A] border-zinc-800/80 text-zinc-100 focus:border-amber-500/30" 
                : "bg-white border-zinc-200 text-zinc-900 focus:border-amber-500"
            )}
          />
        </div>
      </div>

    </div>
  );
}
