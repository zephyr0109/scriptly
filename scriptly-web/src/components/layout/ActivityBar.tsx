"use client";

import React from "react";
import { Sparkles, Folder, PenTool, Sun, Moon, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityBarProps {
  activeActivity: "inspiration" | "workspace";
  setActivity: (activity: "inspiration" | "workspace") => void;
  isDarkMode: boolean;
  setDarkMode: (val: boolean) => void;
  addToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
  user: any;
  logout: () => void;
}

export default function ActivityBar({
  activeActivity,
  setActivity,
  isDarkMode,
  setDarkMode,
  addToast,
  user,
  logout
}: ActivityBarProps) {
  const getDisplayName = (user: any) => {
    if (!user) return "작가";
    const name = user.full_name || user.email.split("@")[0];
    return name.slice(0, 2);
  };

  return (
    <aside className={cn(
      "w-[64px] flex flex-col items-center py-6 gap-8 border-r z-45 shrink-0",
      isDarkMode ? "bg-[#09090C] border-zinc-800/80" : "bg-[#F0F2F7] border-zinc-200"
    )}>
      {/* 로고 */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
        <PenTool size={20} className="text-white" />
      </div>

      {/* 탐색 메뉴 */}
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

      {/* 설정 및 테마 & 프로필 */}
      <div className="flex flex-col items-center gap-4 w-full mb-24">
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
          onClick={() => {
            if (confirm("로그아웃 하시겠습니까?")) {
              logout();
            }
          }}
          title="로그아웃"
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
            isDarkMode ? "text-zinc-500 hover:text-rose-400 hover:bg-zinc-900" : "text-zinc-500 hover:text-rose-655 hover:bg-zinc-200"
          )}
        >
          <LogOut size={18} />
        </button>

        <div className="w-9 h-9 rounded-full bg-zinc-700/60 border border-zinc-500/30 overflow-hidden flex items-center justify-center shadow-md active:scale-95 transition-all" title={user?.email || "작가"}>
          <span className="text-xs font-bold text-amber-500">{getDisplayName(user)}</span>
        </div>
      </div>
    </aside>
  );
}
