"use client";

import React from "react";
import { Plus, Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";

interface PlotTimelineProps {
  events: any[];
  handleOpenEventAdd?: () => void;
  addToast?: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
  projectId?: string;
  characters?: any[];
  isGenerating?: boolean;
  onCreateEvent?: (data: any) => Promise<any>;
  onUpdateEvent?: (id: string, data: any) => Promise<any>;
  onDeleteEvent?: (id: string) => Promise<boolean>;
  onReorder?: (projectId: string, ids: string[]) => Promise<any>;
  onGenerateDraft?: (projectId: string) => Promise<any>;
  isDarkMode?: boolean;
  labSources?: any[];
}

export default function PlotTimeline({ 
  events, 
  handleOpenEventAdd, 
  addToast: propAddToast,
  projectId,
  characters,
  isGenerating,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  onReorder,
  onGenerateDraft,
  isDarkMode: propIsDarkMode,
  labSources
}: PlotTimelineProps) {
  const { isDarkMode: storeIsDarkMode } = useUIStore();
  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : storeIsDarkMode;

  const triggerToast = (msg: string, type: "success" | "info" | "warning" | "error" = "success") => {
    if (propAddToast) {
      propAddToast(msg, type);
    } else {
      addToast(msg, type);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 select-none">
      <div className="flex items-center justify-between border-b border-zinc-800/10 pb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black tracking-tight">드라마 에피소드 플롯 타임라인</h2>
          <p className="text-xs text-zinc-500">대립되는 사건들의 흐름과 시간의 궤적을 엮어 드라마 시나리오 플롯의 강약을 정밀 조율합니다.</p>
        </div>
        <button 
          onClick={() => {
            if (handleOpenEventAdd) {
              handleOpenEventAdd();
            } else {
              triggerToast("정식 버전에서 타임라인 사건 추가를 지원합니다.", "info");
            }
          }}
          className="px-4 py-2 text-xs font-black bg-amber-500 text-black hover:bg-amber-400 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>사건 추가</span>
        </button>
      </div>

      <div className="relative pl-10 flex flex-col gap-8 mt-4">
        <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-zinc-800" />
        
        {events.map((evt, idx) => (
          <div key={evt.id} className="relative flex flex-col gap-2.5 animate-in slide-in-from-left-5 duration-300">
            <div className="absolute -left-[35px] w-6 h-6 rounded-full bg-zinc-950 border border-amber-500/80 flex items-center justify-center font-black text-[10px] text-amber-500">
              {idx + 1}
            </div>
            
            <div className={cn(
              "p-6 rounded-2xl border flex flex-col gap-2",
              isDarkMode ? "bg-[#14141A] border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
            )}>
              <div className="flex items-center justify-between">
                <span className={cn("text-sm font-black", isDarkMode ? "text-white" : "text-zinc-950")}>{evt.title}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
                    <Calendar size={10} />
                    {evt.time_hint || `${idx + 1}화 씬`}
                  </span>
                  <button 
                    onClick={() => triggerToast("사건 정보 삭제 시뮬레이션 완료", "info")}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-600 hover:text-rose-400 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                {evt.content || "상세 사건 내용이 없습니다. 사건을 기록해보세요."}
              </p>
            </div>
          </div>
        ))}

        {events.length === 0 && (
          <div className="text-center py-16 text-zinc-500 text-xs">
            구성된 플롯 사건 타임라인이 아직 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

// 간단한 addToast 폴백용 (로컬 콘솔용)
function addToast(msg: string, type = "success") {
  console.log(`[Toast ${type}]: ${msg}`);
}
