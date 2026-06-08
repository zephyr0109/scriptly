"use client";

import React, { useState, useEffect } from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";

interface LinkInspirationProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspiration: any;
  projects: any[];
  onSave: (inspirationId: string, selectedProjectIds: string[]) => Promise<void>;
  addToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
}

export default function LinkInspirationProjectModal({
  isOpen,
  onClose,
  inspiration,
  projects,
  onSave,
  addToast
}: LinkInspirationProjectModalProps) {
  const { isDarkMode } = useUIStore();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // 모달이 열리거나 타겟 영감이 바뀔 때, 이미 연결되어 있던 프로젝트 ID 목록을 초기 상태로 채웁니다.
  useEffect(() => {
    if (isOpen && inspiration && projects) {
      const initialLinkedIds = projects
        .filter(proj => proj.linked_sources && proj.linked_sources.includes(inspiration.id))
        .map(proj => proj.id);
      setSelectedIds(initialLinkedIds);
    }
  }, [isOpen, inspiration, projects]);

  if (!isOpen || !inspiration) return null;

  const handleToggleProject = (projectId: string) => {
    setSelectedIds(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(inspiration.id, selectedIds);
      addToast("기획안 자료 연동 정보가 업데이트되었습니다.", "success");
      onClose();
    } catch (e) {
      addToast("연동 정보 저장에 실패했습니다.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1100] p-4 animate-in fade-in duration-200">
      <div className={cn(
        "border rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl transition-all duration-300",
        isDarkMode ? "bg-[#14141A] border-zinc-800" : "bg-white border-zinc-200"
      )}>
        {/* 헤더 */}
        <div className={cn(
          "p-6 border-b flex items-center justify-between",
          isDarkMode ? "border-zinc-800" : "border-zinc-150"
        )}>
          <div className="flex flex-col gap-1 min-w-0 pr-4">
            <h3 className={cn("text-sm font-black", isDarkMode ? "text-white" : "text-zinc-950")}>
              🔗 드라마 기획안 연결 설정
            </h3>
            <span className="text-[10px] text-zinc-500 truncate block">
              영감: {inspiration.title}
            </span>
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
          "p-6 flex flex-col gap-4 max-h-[350px] overflow-y-auto custom-scrollbar-dark",
          isDarkMode ? "bg-[#0A0A0E]/30" : "bg-[#F8F9FC]/30"
        )}>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">
            이 영감을 연결할 기획안을 선택해 주세요 (다중 선택 가능)
          </span>

          {projects.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {projects.map(proj => {
                const isChecked = selectedIds.includes(proj.id);
                return (
                  <div
                    key={proj.id}
                    onClick={() => handleToggleProject(proj.id)}
                    className={cn(
                      "p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all duration-200 select-none",
                      isChecked
                        ? (isDarkMode ? "bg-amber-500/10 border-amber-500/40 text-white" : "bg-amber-50/50 border-amber-500 text-zinc-950")
                        : (isDarkMode ? "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 text-zinc-400" : "bg-white border-zinc-200 hover:border-zinc-300 text-zinc-600")
                    )}
                  >
                    <div className="flex flex-col gap-1 pr-4 min-w-0">
                      <span className={cn(
                        "text-xs font-black truncate",
                        isChecked ? (isDarkMode ? "text-amber-400" : "text-amber-600") : (isDarkMode ? "text-zinc-300" : "text-zinc-800")
                      )}>
                        {proj.title}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                        {proj.genre || "장르 미설정"} • {proj.format || "16부작 미니시리즈"}
                      </span>
                    </div>

                    <div className={cn(
                      "w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0",
                      isChecked
                        ? "bg-amber-500 border-amber-500 text-black"
                        : (isDarkMode ? "border-zinc-800 bg-zinc-950" : "border-zinc-300 bg-white")
                    )}>
                      {isChecked && <Check size={12} className="stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-zinc-500 text-xs">
              등록된 드라마 기획안 프로젝트가 없습니다.
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className={cn(
          "p-6 border-t flex justify-end gap-2.5",
          isDarkMode ? "border-zinc-800 bg-[#0A0A0E]/50" : "border-zinc-150 bg-[#F8F9FC]/50"
        )}>
          <button
            onClick={onClose}
            className={cn(
              "px-5 py-2.5 border text-xs font-bold rounded-xl transition-all",
              isDarkMode ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200" : "bg-white border-zinc-200 hover:bg-zinc-100 text-zinc-650 hover:text-zinc-900"
            )}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
          >
            {isSaving ? "저장 중..." : "연결 저장 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}
