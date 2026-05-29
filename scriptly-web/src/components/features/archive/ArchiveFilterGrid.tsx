"use client";

import React from "react";
import { Check, FolderPlus, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";

interface ArchiveFilterGridProps {
  filteredAndSortedArchives: any[];
  projectLinkedInspirations: string[];
  setProjectLinkedInspirations: React.Dispatch<React.SetStateAction<string[]>>;
  addToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
  selectArchive?: (id: string) => void;
}

export default function ArchiveFilterGrid({
  filteredAndSortedArchives,
  projectLinkedInspirations,
  setProjectLinkedInspirations,
  addToast,
  selectArchive
}: ArchiveFilterGridProps) {
  const {
    isDarkMode,
    selectedArchiveId,
    selectArchive: storeSelectArchive
  } = useUIStore();

  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-black tracking-tight">수집된 영감 보관함</h2>
        <p className="text-xs text-zinc-500">대본 및 캐릭터 관계 설계 시 갈등의 축으로 삼을 수 있는 극화 변환 조각들입니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
        {filteredAndSortedArchives.map(item => (
          <div 
            key={item.id}
            onClick={() => {
              if (selectArchive) {
                selectArchive(item.id);
              } else {
                storeSelectArchive(item.id);
              }
            }}
            className={cn(
              "p-6 rounded-2xl border cursor-pointer transition-all duration-300 hover:-translate-y-0.5 flex flex-col gap-3 relative overflow-hidden",
              selectedArchiveId === item.id 
                ? (isDarkMode ? "bg-[#1E1E28] border-amber-500 shadow-xl shadow-amber-500/5" : "bg-amber-50/40 border-amber-500 shadow-md")
                : (isDarkMode ? "bg-[#14141A] border-zinc-800 hover:border-zinc-700" : "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm")
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full font-black">{item.type}</span>
              <span className="text-[10px] text-zinc-500 font-semibold">{item.date}</span>
            </div>
            <h3 className={cn(
              "text-sm font-black leading-relaxed hover:text-amber-400 transition-colors",
              isDarkMode ? "text-white" : "text-zinc-900"
            )}>
              {item.title}
            </h3>
            <p className={cn(
              "text-xs leading-relaxed font-medium flex-1",
              item.rawType === "NOTE" 
                ? (isDarkMode ? "text-zinc-300 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-850 whitespace-pre-wrap" : "text-zinc-800 bg-zinc-100/50 p-3.5 rounded-xl border border-zinc-200 whitespace-pre-wrap")
                : "text-zinc-400 line-clamp-3"
            )}>
              {item.desc}
            </p>
            
            <div className="flex items-center justify-between border-t border-zinc-800/10 pt-3">
              <span className="text-[10px] text-zinc-500 font-bold">
                {item.analysis_status === "COMPLETED" && item.tension_score > 0
                  ? `갈등 지수: ${item.tension_score}%`
                  : ""}
              </span>
              
              {/* 프로젝트 연결(Link) 및 연결해제 동적 처리 */}
              {projectLinkedInspirations.includes(item.id) ? (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectLinkedInspirations(prev => prev.filter(id => id !== item.id));
                    addToast("현재 프로젝트 연결을 해제했습니다.", "info");
                  }}
                  className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2 py-1 rounded font-bold transition-all flex items-center gap-1"
                >
                  <Check size={10} />
                  연결됨
                </button>
              ) : (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectLinkedInspirations(prev => [...prev, item.id]);
                    addToast("현재 드라마 프로젝트에 참고 자료로 연결(Link)했습니다!", "success");
                  }}
                  className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded font-bold transition-all flex items-center gap-1"
                >
                  <FolderPlus size={10} />
                  프로젝트 연결
                </button>
              )}
            </div>
          </div>
        ))}
        
        {filteredAndSortedArchives.length === 0 && (
          <div className="col-span-3 text-center py-16 text-zinc-500 text-xs flex flex-col items-center gap-2">
            <Bookmark size={20} className="text-zinc-700" />
            <span>해당 필터 조건에 부합하는 수집 자산이 없습니다.</span>
          </div>
        )}
      </div>
    </div>
  );
}
