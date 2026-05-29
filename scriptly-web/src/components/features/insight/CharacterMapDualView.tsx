"use client";

import React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";

interface CharacterMapDualViewProps {
  characters: any[];
  handleOpenCharacterAdd: () => void;
  handleOpenCharacterEdit: (char: any) => void;
}

export default function CharacterMapDualView({
  characters,
  handleOpenCharacterAdd,
  handleOpenCharacterEdit
}: CharacterMapDualViewProps) {
  const { isDarkMode } = useUIStore();

  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 select-none">
      <div className="flex items-center justify-between border-b border-zinc-800/10 pb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black tracking-tight">인물 관계도 & 캐릭터 프로파일</h2>
          <p className="text-xs text-zinc-500">인간 본연의 모티프와 욕망을 설정하고 캐릭터 간의 입체적 갈등을 캔버스 위에서 매핑합니다.</p>
        </div>
        <button 
          onClick={handleOpenCharacterAdd}
          className="px-4 py-2 text-xs font-black bg-amber-500 text-black hover:bg-amber-400 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>인물 추가</span>
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        
        {/* 1. 좌측 영역 (인물 나열 인덱스 - 290px 고정 폭) */}
        <div className={cn(
          "w-[290px] border rounded-2xl p-4 flex flex-col gap-3 shrink-0 overflow-y-auto custom-scrollbar-dark",
          isDarkMode ? "bg-[#14141E]/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
        )}>
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/20">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">등장인물 인덱스 ({characters.length})</span>
            <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold">List</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {characters.map((char) => (
              <div 
                key={char.id}
                onClick={() => handleOpenCharacterEdit(char)}
                className={cn(
                  "p-3.5 rounded-xl border cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col gap-1.5",
                  isDarkMode ? "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700" : "bg-zinc-50 border-zinc-200 hover:border-zinc-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("text-xs font-black", isDarkMode ? "text-white" : "text-zinc-900")}>{char.name}</span>
                    <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold">주역</span>
                  </div>
                  <span className="text-[9px] text-zinc-500 font-semibold">{char.role?.replace("주연 (", "")?.replace(")", "")?.replace("조연 (", "") || "배역"}</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2 font-medium">
                  {char.description || char.desc || "상세 인물 소개 정보 대기 중..."}
                </p>
              </div>
            ))}
            {characters.length === 0 && (
              <div className="text-center py-10 text-zinc-500 text-xs">
                개설된 등장인물이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 2. 우측 영역 (관계도 캔버스) */}
        <div className={cn(
          "flex-grow rounded-2xl border relative overflow-hidden flex items-center justify-center p-6 min-h-0",
          isDarkMode ? "bg-[#09090C] border-zinc-800" : "bg-[#F0F2F7] border-zinc-200"
        )}>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          <div className="relative w-full h-full flex items-center justify-around z-10">
            {characters.map((char, index) => {
              const color = char.char_metadata?.color || char.color || "bg-blue-500/20 text-blue-400 border-blue-500/50";
              return (
                <div 
                  key={char.id}
                  onClick={() => handleOpenCharacterEdit(char)}
                  style={{ transform: `translateY(${index % 2 === 0 ? '-30px' : '40px'})` }}
                  className={cn(
                    "w-48 p-4 rounded-xl border shadow-2xl cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 hover:border-amber-500/80",
                    isDarkMode ? "bg-[#14141E] border-zinc-800" : "bg-white border-zinc-200"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", color.split(" ")[0])} />
                    <span className={cn("text-xs font-black", isDarkMode ? "text-white" : "text-zinc-950")}>{char.name}</span>
                    <span className="text-[9px] text-zinc-500 font-bold ml-auto">{char.role || "주연"}</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-medium line-clamp-3">
                    {char.description || char.desc || "상세 설정 입력 대기 중."}
                  </p>
                </div>
              );
            })}
            
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
              <path 
                d="M 180 180 Q 280 120 400 240" 
                fill="none" 
                stroke="#f59e0b" 
                strokeWidth="2" 
                strokeDasharray="4 4" 
              />
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}
