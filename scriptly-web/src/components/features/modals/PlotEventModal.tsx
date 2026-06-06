"use client";

import React from "react";
import { X, Users, Calendar, FileText, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";

interface PlotEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlotEventId: string | null;
  plotEventTitle: string;
  plotEventTimeHint: string;
  plotEventContent: string;
  plotEventCharacterIds: string[];
  characters: any[];
  setPlotEventForm: (form: any) => void;
  handleSaveEvent: () => Promise<void>;
  deleteEvent: (id: string) => Promise<boolean>;
  addToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
}

export default function PlotEventModal({
  isOpen,
  onClose,
  activePlotEventId,
  plotEventTitle,
  plotEventTimeHint,
  plotEventContent,
  plotEventCharacterIds,
  characters,
  setPlotEventForm,
  handleSaveEvent,
  deleteEvent,
  addToast
}: PlotEventModalProps) {
  const { isDarkMode } = useUIStore();

  if (!isOpen) return null;

  // 캐릭터 칩 클릭 토글 핸들러
  const handleToggleCharacter = (charId: string) => {
    const isSelected = plotEventCharacterIds.includes(charId);
    let nextIds = [];
    if (isSelected) {
      nextIds = plotEventCharacterIds.filter(id => id !== charId);
    } else {
      nextIds = [...plotEventCharacterIds, charId];
    }
    setPlotEventForm({ characterIds: nextIds });
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300">
      <div className={cn(
        "border rounded-3xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200",
        isDarkMode ? "bg-[#14141A] border-zinc-800" : "bg-white border-zinc-200"
      )}>
        {/* 헤더 */}
        <div className={cn(
          "p-6 border-b flex items-center justify-between",
          isDarkMode ? "border-zinc-800/40" : "border-zinc-200"
        )}>
          <div className="flex flex-col gap-0.5">
            <h3 className={cn("text-base font-black tracking-tight", isDarkMode ? "text-white" : "text-zinc-950")}>
              {activePlotEventId ? "사건 내용 수정" : "신규 사건 에피소드 등록"}
            </h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              {activePlotEventId ? "Update this event details" : "Create a new plot event"}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className={cn(
              "p-2 rounded-xl transition-all",
              isDarkMode ? "hover:bg-zinc-800 text-zinc-500 hover:text-white" : "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950"
            )}
          >
            <X size={16} />
          </button>
        </div>

        {/* 본문 */}
        <div className={cn(
          "p-8 flex flex-col gap-5 max-h-[500px] overflow-y-auto custom-scrollbar-dark",
          isDarkMode ? "bg-[#0A0A0E]/30" : "bg-[#F8F9FC]/30"
        )}>
          <div className="grid grid-cols-2 gap-4">
            {/* 발생 시간 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-500 font-black uppercase tracking-widest flex items-center gap-1">
                <Calendar size={11} />
                <span>발생 시간 (시점)</span>
              </label>
              <input 
                value={plotEventTimeHint} 
                onChange={(e) => setPlotEventForm({ timeHint: e.target.value })} 
                placeholder="예: 사건 중반, 밤 11시경" 
                className={cn(
                  "w-full border text-xs font-bold px-4 py-3 rounded-xl outline-none transition-all focus:border-amber-500/50",
                  isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                )} 
              />
            </div>
            {/* 사건 제목 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-500 font-black uppercase tracking-widest flex items-center gap-1">
                <FileText size={11} />
                <span>사건 제목</span>
              </label>
              <input 
                value={plotEventTitle} 
                onChange={(e) => setPlotEventForm({ title: e.target.value })} 
                placeholder="예: 교묘한 조력자 정우진의 등장" 
                className={cn(
                  "w-full border text-xs font-bold px-4 py-3 rounded-xl outline-none transition-all focus:border-amber-500/50",
                  isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                )} 
              />
            </div>
          </div>

          {/* 주요 내용 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-amber-500 font-black uppercase tracking-widest">주요 내용 (드라마틱 묘사)</label>
            <textarea 
              value={plotEventContent} 
              onChange={(e) => setPlotEventForm({ content: e.target.value })} 
              rows={5} 
              placeholder="사건 해결을 위해 IT 보안 전문가 정우진이 합류하고, 그는 수사에 필요한 디지털 증거 분석에서 탁월한 능력을 보이는데..." 
              className={cn(
                "w-full border text-xs font-semibold px-4 py-3 rounded-xl outline-none resize-none leading-relaxed transition-all focus:border-amber-500/50",
                isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
              )} 
            />
          </div>

          {/* 참여 인물 선별 */}
          <div className="flex flex-col gap-2.5">
            <label className="text-[10px] text-amber-500 font-black uppercase tracking-widest flex items-center gap-1.5">
              <Users size={11} />
              <span>참여 인물 선별</span>
            </label>
            
            {characters.length > 0 ? (
              <div className="flex flex-wrap gap-2 p-4 rounded-xl border border-dashed border-zinc-800/60 bg-zinc-950/20">
                {characters.map((char) => {
                  const isSelected = plotEventCharacterIds.includes(char.id);
                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => handleToggleCharacter(char.id)}
                      className={cn(
                        "text-[10px] font-black px-3.5 py-2 rounded-full transition-all border select-none active:scale-95",
                        isSelected 
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10" 
                          : isDarkMode
                            ? "bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                            : "bg-zinc-100 border-zinc-200 text-zinc-650 hover:bg-zinc-200 hover:text-zinc-900"
                      )}
                    >
                      {char.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-zinc-800/40 rounded-xl text-zinc-500 text-[10px] font-bold">
                등록된 인물이 없습니다. [캐릭터 맵]에서 등장인물을 먼저 생성해 주세요.
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className={cn(
          "p-6 border-t flex justify-between gap-3",
          isDarkMode ? "border-zinc-800/40 bg-[#0E0E12]" : "border-zinc-200 bg-[#F8F9FC]"
        )}>
          {activePlotEventId && (
            <button 
              onClick={async () => {
                if (confirm("정말 이 사건을 삭제하시겠습니까?")) {
                  const success = await deleteEvent(activePlotEventId);
                  if (success) {
                    addToast("사건이 안전하게 삭제되었습니다.", "info");
                    onClose();
                  }
                }
              }} 
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Trash2 size={13} />
              <span>삭제</span>
            </button>
          )}
          
          <div className="flex gap-3 ml-auto">
            <button 
              onClick={onClose} 
              className={cn(
                "px-4 py-2 border text-xs font-bold rounded-xl transition-all",
                isDarkMode ? "bg-zinc-800 border-zinc-700 text-zinc-450 hover:bg-zinc-700 hover:text-white" : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-100 hover:text-zinc-950"
              )}
            >
              취소
            </button>
            <button 
              onClick={handleSaveEvent} 
              className="px-6 py-2.5 bg-indigo-600 text-white hover:bg-indigo-500 text-xs font-black rounded-xl transition-all shadow-md active:scale-95 shadow-indigo-600/15"
            >
              저장 및 반영
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
