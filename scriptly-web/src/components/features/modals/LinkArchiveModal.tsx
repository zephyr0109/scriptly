"use client";

import React, { useState, useMemo } from "react";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";

interface LinkArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  archiveItems: any[];
  projectLinkedInspirations: string[];
  setProjectLinkedInspirations: React.Dispatch<React.SetStateAction<string[]>>;
  addToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
}

export default function LinkArchiveModal({
  isOpen,
  onClose,
  archiveItems,
  projectLinkedInspirations,
  setProjectLinkedInspirations,
  addToast
}: LinkArchiveModalProps) {
  const { isDarkMode } = useUIStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");

  const folders = useMemo(() => {
    const fromItems = archiveItems
      .map(item => item.folder)
      .filter((f): f is string => typeof f === "string" && f.trim() !== "");
    return Array.from(new Set(fromItems)).sort();
  }, [archiveItems]);

  const filteredItems = useMemo(() => {
    return archiveItems.filter(item => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = item.title.toLowerCase().includes(q) || 
                            (item.content && item.content.toLowerCase().includes(q)) ||
                            (item.summary && item.summary.toLowerCase().includes(q));
      
      if (selectedFolder === "all") return matchesSearch;
      if (selectedFolder === "unclassified") return matchesSearch && (!item.folder || item.folder.trim() === "");
      return matchesSearch && item.folder === selectedFolder;
    });
  }, [archiveItems, searchQuery, selectedFolder]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300">
      <div className="bg-[#14141A] border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-800/40 flex items-center justify-between">
          <h3 className="text-sm font-black text-white">보관함에서 참고 영감 장부 불러오기</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Search & Folder filters inside Modal */}
        <div className="p-6 pb-2 border-b border-zinc-800/40 flex flex-col gap-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="영감 제목, 내용 검색..."
              className="w-full pl-9 pr-7 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-indigo-500/50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none custom-scrollbar-horizontal w-full">
            <button
              onClick={() => setSelectedFolder("all")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[9px] font-black shrink-0 transition-all border",
                selectedFolder === "all"
                  ? "bg-indigo-600 text-white border-indigo-500 shadow"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              )}
            >
              전체
            </button>
            <button
              onClick={() => setSelectedFolder("unclassified")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[9px] font-black shrink-0 transition-all border",
                selectedFolder === "unclassified"
                  ? "bg-indigo-600 text-white border-indigo-500 shadow"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
              )}
            >
              미분류
            </button>
            {folders.map(f => (
              <button
                key={f}
                onClick={() => setSelectedFolder(f)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[9px] font-black shrink-0 transition-all border",
                  selectedFolder === f
                    ? "bg-indigo-600 text-white border-indigo-500 shadow"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                )}
              >
                📁 {f}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[260px] flex flex-col gap-2.5 custom-scrollbar-dark select-none">
          {filteredItems.map(item => {
            const isLinked = projectLinkedInspirations.includes(item.id);
            return (
              <div 
                key={item.id}
                className={cn(
                  "p-4 rounded-xl border flex items-center justify-between transition-all",
                  isDarkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                )}
              >
                <div className="flex flex-col gap-0.5 min-w-0 pr-4">
                  <span className="text-xs font-black text-white truncate">{item.title}</span>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide">{item.type}</span>
                </div>
                {isLinked ? (
                  <button 
                    onClick={() => {
                      setProjectLinkedInspirations(prev => prev.filter(id => id !== item.id));
                      addToast("프로젝트 연동을 해제했습니다.", "info");
                    }}
                    className="px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-lg shrink-0"
                  >
                    연결 해제
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setProjectLinkedInspirations(prev => [...prev, item.id]);
                      addToast("현재 프로젝트 집필실 서랍에 배치했습니다.", "success");
                    }}
                    className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded-lg transition-all shrink-0"
                  >
                    책장에 적재
                  </button>
                )}
              </div>
            );
          })}
          {archiveItems.length === 0 && (
            <div className="text-center py-8 text-xs text-zinc-500">
              수집된 영감 자산이 없습니다. 보관실에서 영감을 먼저 수집해 보세요.
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800/40 bg-[#0E0E12] flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-amber-500 text-black hover:bg-amber-400 text-xs font-black rounded-xl transition-all shadow-md active:scale-95">
            완료
          </button>
        </div>
      </div>
    </div>
  );
}
