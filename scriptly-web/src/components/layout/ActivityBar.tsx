"use client";

import React from "react";
import { Sparkles, Archive, Folder, Sun, Moon, Settings, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";

interface ActivityBarProps {
  addToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
}

export default function ActivityBar({ addToast }: ActivityBarProps) {
  const {
    activeActivity,
    setActivity,
    isDarkMode,
    setDarkMode
  } = useUIStore();

  return (
    <aside className={cn(
      "w-[64px] flex flex-col items-center py-6 gap-8 border-r z-45 shrink-0",
      isDarkMode ? "bg-[#09090C] border-zinc-800/80" : "bg-[#F0F2F7] border-zinc-200"
    )}>
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
        <PenTool size={20} className="text-white" />
      </div>

      <nav className="flex flex-col gap-3 w-full px-2 flex-1">
        {[
          { id: "inspiration", icon: Sparkles, label: "영감 검색 & 보관" },
          { id: "workspace", icon: Folder, label: "작업 공간" }
        ].map(tab => {
          const isActive = activeActivity === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActivity(tab.id as any);
                addToast(`'${tab.label}' 메뉴로 전환되었습니다.`, "info");
              }}
              title={tab.label}
              className={cn(
                "relative group w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                isActive 
                  ? (isDarkMode ? "bg-amber-500 text-black shadow-lg shadow-amber-500/10 font-bold" : "bg-[#1E202B] text-white shadow-md font-bold")
                  : (isDarkMode ? "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200" : "text-zinc-500 hover:bg-zinc-300/40 hover:text-zinc-900")
              )}
            >
              <tab.icon size={22} className="transition-transform group-hover:scale-105" />
              <div className={cn(
                "absolute left-16 px-3 py-1.5 rounded-lg text-xs font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-xl whitespace-nowrap",
                isDarkMode ? "bg-[#181822] text-zinc-100 border border-zinc-800" : "bg-white text-zinc-900 border border-zinc-200"
              )}>
                {tab.label}
              </div>
            </button>
          );
        })}
      </nav>

      <div className="flex flex-col items-center gap-4 w-full mb-16">
        <button 
          onClick={() => setDarkMode(!isDarkMode)}
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
            isDarkMode ? "text-amber-400 hover:bg-zinc-900" : "text-zinc-600 hover:bg-zinc-200"
          )}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        
        <button 
          onClick={() => addToast("설정 패널은 정식 오픈 버전에서 활성화됩니다.", "info")}
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
            isDarkMode ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200"
          )}
        >
          <Settings size={18} />
        </button>

        <div className="w-9 h-9 rounded-full bg-zinc-700/60 border border-zinc-500/30 overflow-hidden flex items-center justify-center shadow-md active:scale-95 transition-all">
          <span className="text-xs font-bold text-amber-500">작가</span>
        </div>
      </div>
    </aside>
  );
}
