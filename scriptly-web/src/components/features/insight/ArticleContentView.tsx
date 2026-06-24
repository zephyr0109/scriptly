"use client";
import React from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ArticleContentViewProps {
  activeInspiration: any;
  isDarkMode: boolean;
  isCrawling: boolean;
  crawledContent: string;
}

export default function ArticleContentView({
  activeInspiration,
  isDarkMode,
  isCrawling,
  crawledContent
}: ArticleContentViewProps) {
  if (!activeInspiration) return null;

  const url = activeInspiration.url || activeInspiration.source_url;

  return (
    <div className="flex flex-col gap-3 min-h-0">
      {/* 원문 바로가기 배너 */}
      {url && url !== "#" && (
        <div className={cn(
          "flex items-center justify-between text-[10px] font-bold p-3 rounded-xl border shrink-0",
          isDarkMode ? "bg-zinc-950/40 border-zinc-800/60 text-zinc-400" : "bg-zinc-100/50 border-zinc-200 text-zinc-600"
        )}>
          <span className="truncate max-w-[70%]">출처: {url}</span>
          <a 
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-amber-500 hover:text-amber-400 font-black cursor-pointer shrink-0 transition-colors"
          >
            <span>원본 기사 읽기</span>
            <ExternalLink size={10} />
          </a>
        </div>
      )}

      {isCrawling ? (
        <div className="flex flex-col gap-3 py-4 animate-pulse">
          <div className="h-4 bg-zinc-800/60 rounded w-1/3" />
          <div className="h-3 bg-zinc-800/40 rounded w-full" />
          <div className="h-3 bg-zinc-800/40 rounded w-full" />
          <div className="h-3 bg-zinc-800/40 rounded w-4/5" />
          <div className="h-3 bg-zinc-800/40 rounded w-full" />
          <div className="h-3 bg-zinc-800/40 rounded w-3/4" />
          <div className="flex items-center justify-center py-6 gap-2">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-bold text-zinc-500">기사 원문을 불러오는 중...</span>
          </div>
        </div>
      ) : (
        <div className={cn(
          "p-4 rounded-xl border text-[11px] leading-relaxed font-semibold whitespace-pre-wrap select-text overflow-y-auto max-h-[450px] custom-scrollbar-dark",
          isDarkMode ? "bg-zinc-950/20 border-zinc-800/60 text-zinc-300" : "bg-zinc-100/30 border-zinc-200 text-zinc-800"
        )}>
          {crawledContent || "기사 원문이 비어있거나 불러오지 못했습니다."}
        </div>
      )}
    </div>
  );
}
