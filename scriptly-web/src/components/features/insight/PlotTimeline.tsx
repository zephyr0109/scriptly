"use client";

import React, { useState } from "react";
import { Plus, Trash2, Calendar, GripVertical, Edit2, Sparkles, BookOpen, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";

interface PlotTimelineProps {
  events: any[];
  projectId?: string;
  characters?: any[];
  isGenerating?: boolean;
  handleOpenEventAdd?: () => void;
  handleOpenEventEdit?: (evt: any) => void;
  onCreateEvent?: (data: any) => Promise<any>;
  onUpdateEvent?: (id: string, data: any) => Promise<any>;
  onDeleteEvent?: (id: string) => Promise<boolean>;
  onReorder?: (projectId: string, ids: string[]) => Promise<any>;
  onGenerateDraft?: (projectId: string) => Promise<any>;
  addToast?: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
  isDarkMode?: boolean;
  labSources?: any[];
}

export default function PlotTimeline({ 
  events, 
  projectId,
  characters = [],
  isGenerating = false,
  handleOpenEventAdd,
  handleOpenEventEdit,
  onDeleteEvent,
  onReorder,
  onGenerateDraft,
  addToast,
  isDarkMode: propIsDarkMode
}: PlotTimelineProps) {
  const { isDarkMode: storeIsDarkMode } = useUIStore();
  const isDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : storeIsDarkMode;

  // 드래그앤드롭 행 재정렬을 위한 상태
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 커스텀 컨펌 모달을 위한 로컬 상태
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmType, setConfirmType] = useState<"warning" | "danger" | "info">("info");
  const [onConfirmAction, setOnConfirmAction] = useState<(() => void | Promise<void>) | null>(null);

  const triggerToast = (msg: string, type: "success" | "info" | "warning" | "error" = "success") => {
    if (addToast) {
      addToast(msg, type);
    } else {
      console.log(`[Toast ${type}]: ${msg}`);
    }
  };

  // HTML5 Drag and Drop 핸들러
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const reorderedEvents = [...events];
    const [removed] = reorderedEvents.splice(draggedIndex, 1);
    reorderedEvents.splice(targetIndex, 0, removed);

    setDraggedIndex(null);

    // 백엔드 순서 재정렬 API 연동
    if (projectId && onReorder) {
      const eventIds = reorderedEvents.map(evt => evt.id);
      try {
        await onReorder(projectId, eventIds);
      } catch (err) {
        triggerToast("순서 조정 저장에 실패했습니다.", "error");
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 select-none h-full min-h-0">
      
      {/* 툴바 & 타이틀 영역 */}
      <div className="flex items-center justify-between border-b border-zinc-800/10 pb-5 shrink-0">
        <div className="flex flex-col gap-1.5">
          <h2 className={cn("text-xl font-black tracking-tight", isDarkMode ? "text-white" : "text-zinc-950")}>
            드라마 에피소드 플롯 타임라인
          </h2>
          <p className="text-xs text-zinc-500 font-medium">
            대립되는 사건들의 흐름과 시간의 궤적을 엮어 드라마 시나리오 플롯의 강약을 정밀 조율합니다.
          </p>
        </div>

        {/* 우상단 액션 버튼 그룹 */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (!projectId || !onGenerateDraft) return;

              setConfirmTitle("AI 플롯 일괄 생성 경고");
              setConfirmMessage("AI 플롯 일괄 생성을 실행하면 현재 작성되어 있는 모든 플롯 타임라인의 기존 사건들이 '영구 삭제'되고 새로운 AI 초안으로 대체됩니다.\n\n정말로 진행하시겠습니까?");
              setConfirmType("warning");
              setOnConfirmAction(() => async () => {
                try {
                  await onGenerateDraft(projectId);
                  triggerToast("AI가 보관함 영감 및 기획안 정보를 바탕으로 플롯 초안 일괄 생성을 시작했습니다.", "success");
                } catch (err) {
                  triggerToast("초안 일괄 생성 요청에 실패했습니다.", "error");
                }
              });
              setIsConfirmOpen(true);
            }}
            disabled={isGenerating}
            className={cn(
              "px-4 py-2.5 text-xs font-black rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5 border",
              isDarkMode 
                ? "bg-indigo-950/20 border-indigo-900/40 text-indigo-400 hover:bg-indigo-900/20" 
                : "bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100",
              isGenerating && "opacity-50 cursor-not-allowed"
            )}
            title="AI 기반 에피소드 자동 초안 설계"
          >
            {isGenerating ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            <span>{isGenerating ? "GENERATING..." : "AI SUPPORT"}</span>
          </button>

          <button 
            onClick={handleOpenEventAdd}
            className="px-4 py-2.5 text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 shadow-indigo-600/10"
            title="새 에피소드 사건 추가"
          >
            <Plus size={14} />
            <span>ADD EVENT</span>
          </button>
        </div>
      </div>

      {/* 테이블 영역 */}
      <div className={cn(
        "flex-1 border rounded-3xl overflow-hidden flex flex-col min-h-0",
        isDarkMode ? "bg-[#14141E]/40 border-zinc-800/80" : "bg-white border-zinc-200 shadow-sm"
      )}>
        <div className="flex-grow overflow-auto custom-scrollbar-dark min-h-0">
          <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
            <thead>
              <tr className={cn(
                "border-b text-[10px] font-black uppercase tracking-widest sticky top-0 z-10 select-none",
                isDarkMode ? "bg-[#111118] border-zinc-850 text-zinc-500" : "bg-zinc-50 border-zinc-150 text-zinc-500"
              )}>
                <th className="py-4 pl-6 w-[70px] text-center">순서</th>
                <th className="py-4 px-4 w-[160px]">TIME (발생 시점)</th>
                <th className="py-4 px-6 w-[45%]">EVENT DETAILS (사건 세부 내용)</th>
                <th className="py-4 px-6 w-[25%]">CHARACTERS (관련 인물)</th>
                <th className="py-4 pr-6 w-[100px] text-center">ACTIONS</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-zinc-800/40">
              {events.map((evt, idx) => {
                // 관련 캐릭터들 필터링
                const relatedChars = (evt.related_character_ids || [])
                  .map((id: string) => characters.find(c => c.id === id))
                  .filter(Boolean);

                return (
                  <tr 
                    key={evt.id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    className={cn(
                      "group transition-all hover:bg-zinc-800/10",
                      draggedIndex === idx && "opacity-45 bg-zinc-800/30 scale-[0.99] border-dashed border-indigo-500"
                    )}
                  >
                    {/* 순서 및 드래그 핸들 */}
                    <td className="py-4 pl-6 text-center select-none">
                      <div className="flex items-center justify-center gap-1.5" title="드래그하여 순서 조정">
                        <GripVertical 
                          size={13} 
                          className="text-zinc-650 cursor-grab group-hover:text-zinc-400 transition-colors" 
                        />
                        <span className={cn("text-xs font-black", isDarkMode ? "text-zinc-500" : "text-zinc-400")}>
                          {idx + 1}
                        </span>
                      </div>
                    </td>

                    {/* TIME 시점 */}
                    <td className="py-4 px-4 align-top">
                      <div className={cn(
                        "text-xs font-bold leading-relaxed whitespace-pre-wrap pr-2",
                        isDarkMode ? "text-zinc-400" : "text-zinc-700"
                      )}>
                        {evt.time_hint || "지정되지 않음"}
                      </div>
                    </td>

                    {/* EVENT DETAILS */}
                    <td className="py-4 px-6 align-top">
                      <div className="flex flex-col pr-4">
                        <h4 className={cn(
                          "text-xs font-black tracking-tight leading-snug cursor-pointer hover:underline hover:text-indigo-400 transition-all",
                          isDarkMode ? "text-zinc-100" : "text-zinc-950"
                        )}
                        onClick={() => handleOpenEventEdit?.(evt)}
                        >
                          {evt.title || "사건 제목 없음"}
                        </h4>
                      </div>
                    </td>

                    {/* CHARACTERS */}
                    <td className="py-4 px-6 align-top">
                      {relatedChars.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-h-[75px] overflow-y-auto custom-scrollbar-dark pr-1">
                          {relatedChars.map((char: any) => (
                            <span 
                              key={char.id}
                              className={cn(
                                "text-[9px] font-black px-2 py-0.8 rounded-full border shrink-0",
                                isDarkMode 
                                  ? "bg-indigo-500/5 text-indigo-400 border-indigo-500/20" 
                                  : "bg-indigo-50 text-indigo-600 border-indigo-100"
                              )}
                            >
                              {char.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-650 font-bold">인물 없음</span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="py-4 pr-6 text-center align-top select-none">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleOpenEventEdit?.(evt)}
                          className={cn(
                            "p-2 rounded-xl transition-all border",
                            isDarkMode 
                              ? "bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-white hover:bg-zinc-800" 
                              : "bg-white border-zinc-200 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100"
                          )}
                          title="사건 수정"
                        >
                          <Edit2 size={11} />
                        </button>
                        
                        <button 
                          onClick={() => {
                            setConfirmTitle("사건 삭제 확인");
                            setConfirmMessage("정말 이 플롯 사건을 타임라인에서 영구히 삭제하시겠습니까?");
                            setConfirmType("danger");
                            setOnConfirmAction(() => async () => {
                              if (onDeleteEvent) {
                                const success = await onDeleteEvent(evt.id);
                                if (success) {
                                  triggerToast("사건이 타임라인에서 안전하게 제거되었습니다.", "info");
                                }
                              }
                            });
                            setIsConfirmOpen(true);
                          }}
                          className={cn(
                            "p-2 rounded-xl transition-all border",
                            isDarkMode 
                              ? "bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20" 
                              : "bg-white border-zinc-200 text-zinc-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100"
                          )}
                          title="사건 삭제"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {events.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <AlertCircle size={24} className="text-zinc-600" />
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs text-zinc-500 font-bold">등록된 플롯 사건 타임라인이 아직 없습니다.</p>
                        <p className="text-[10px] text-zinc-600">우상단의 [ADD EVENT] 버튼을 눌러 첫 번째 에피소드 사건을 기록해보세요.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[1100] p-4 animate-in fade-in duration-200">
          <div className={cn(
            "border w-full max-w-sm rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in scale-in duration-200",
            isDarkMode ? "bg-[#14141A] border-zinc-800" : "bg-white border-zinc-200"
          )}>
            <div className="p-6 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                {confirmType === "danger" || confirmType === "warning" ? (
                  <span className="text-rose-500 text-lg">⚠️</span>
                ) : (
                  <span className="text-indigo-500 text-lg">ℹ️</span>
                )}
                <h3 className={cn("text-sm font-black", isDarkMode ? "text-white" : "text-zinc-950")}>
                  {confirmTitle}
                </h3>
              </div>
              <p className={cn("text-xs leading-relaxed font-semibold whitespace-pre-wrap", isDarkMode ? "text-zinc-400" : "text-zinc-650")}>
                {confirmMessage}
              </p>
            </div>
            <div className={cn(
              "px-6 py-4 flex items-center justify-end gap-2 border-t",
              isDarkMode ? "bg-zinc-900/40 border-zinc-800/40" : "bg-zinc-50 border-zinc-100"
            )}>
              <button
                onClick={() => setIsConfirmOpen(false)}
                className={cn(
                  "px-4 py-2 text-[11px] font-black rounded-xl border transition-all active:scale-95 cursor-pointer",
                  isDarkMode 
                    ? "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white" 
                    : "bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900"
                )}
              >
                취소
              </button>
              <button
                onClick={async () => {
                  setIsConfirmOpen(false);
                  if (onConfirmAction) {
                    await onConfirmAction();
                  }
                }}
                className={cn(
                  "px-4 py-2 text-[11px] font-black text-white rounded-xl transition-all shadow-md active:scale-95 cursor-pointer",
                  confirmType === "danger" 
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/10" 
                    : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/10"
                )}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 간단한 addToast 폴백용 (로컬 콘솔용)
function addToast(msg: string, type = "success") {
  console.log(`[Toast ${type}]: ${msg}`);
}
