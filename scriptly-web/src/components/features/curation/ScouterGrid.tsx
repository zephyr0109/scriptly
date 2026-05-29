"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";

interface ScouterGridProps {
  isLoading: boolean;
  activeInspirations: any[];
  selectInspiration?: (id: string) => void;
}

export default function ScouterGrid({ isLoading, activeInspirations, selectInspiration }: ScouterGridProps) {
  const {
    isDarkMode,
    selectedInspirationId,
    selectInspiration: storeSelectInspiration
  } = useUIStore();

  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl font-black tracking-tight">영감 스카우터</h2>
        <p className="text-xs text-zinc-500">정부 뉴스, 시사 보도에서 리얼리티를 확보할 드라마틱한 갈등 자산을 찾아냅니다.</p>
      </div>

      {isLoading && (
        <div className="flex-grow flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-amber-500">실시간 스카우팅 및 극화 가능 장부 파싱 중...</span>
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          {activeInspirations.map((insp) => (
            <div 
              key={insp.id}
              onClick={() => {
                if (selectInspiration) {
                  selectInspiration(insp.id);
                } else {
                  storeSelectInspiration(insp.id);
                }
              }}
              className={cn(
                "p-6 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-[1.01] flex flex-col gap-3 group relative overflow-hidden",
                selectedInspirationId === insp.id 
                  ? (isDarkMode ? "bg-[#1E1E28] border-amber-500 shadow-xl shadow-amber-500/5" : "bg-amber-50/40 border-amber-500 shadow-md")
                  : (isDarkMode ? "bg-[#14141A] border-zinc-800 hover:border-zinc-700" : "bg-white border-zinc-200 hover:border-zinc-300")
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-black">{insp.keyword || insp.main_keyword || "시사속보"}</span>
                <span className="text-[10px] text-zinc-500 font-semibold">{insp.source || "네이버 뉴스"}</span>
              </div>
              <h3 className={cn(
                "text-sm font-black leading-relaxed group-hover:text-amber-400 transition-colors",
                selectedInspirationId === insp.id ? "text-amber-400" : (isDarkMode ? "text-white" : "text-zinc-900")
              )}>
                {insp.title}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-semibold line-clamp-3">
                {insp.desc || insp.content}
              </p>
              
              <div className="flex items-center justify-between border-t border-zinc-800/10 pt-3 mt-1">
                <span className="text-[10px] text-zinc-500">{insp.date || (insp.published_at ? insp.published_at.split("T")[0] : "")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
