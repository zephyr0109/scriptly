"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingNote: any;
  handleUpdateNote: (id: string, title: string, content: string, onSuccess: () => void, onError: (err: string) => void) => Promise<void>;
  isUploading: boolean;
  isDarkMode: boolean;
  addToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
}

export default function EditNoteModal({
  isOpen,
  onClose,
  editingNote,
  handleUpdateNote,
  isUploading,
  isDarkMode,
  addToast
}: EditNoteModalProps) {
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (editingNote) {
      setEditTitle(editingNote.title || "");
      setEditContent(editingNote.content || "");
    }
  }, [editingNote]);

  if (!isOpen || !editingNote) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300">
      <div className={cn(
        "border rounded-3xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-205",
        isDarkMode ? "bg-[#14141A] border-zinc-800" : "bg-white border-zinc-200"
      )}>
        <div className={cn(
          "p-6 border-b flex items-center justify-between",
          isDarkMode ? "border-zinc-800/40" : "border-zinc-200"
        )}>
          <div className="flex flex-col gap-1">
            <h3 className={cn("text-sm font-black", isDarkMode ? "text-white" : "text-zinc-950")}>✍️ 극작 메모 수정</h3>
            <span className="text-[10px] text-zinc-500">기존에 작성한 수집 아이디어나 메모의 제목 및 내용을 수정합니다.</span>
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

        <div className={cn(
          "p-6 flex flex-col gap-5",
          isDarkMode ? "bg-[#0A0A0E]/30" : "bg-[#F8F9FC]/30"
        )}>
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">메모 제목</span>
            <input 
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="갈등의 성격을 대표하는 제목을 지어주세요..."
              className={cn(
                "w-full border p-3 rounded-2xl text-xs font-bold outline-none transition-all",
                isDarkMode ? "bg-[#0E0E12] border-zinc-800 text-white focus:border-amber-500/50" : "bg-white border-zinc-200 text-zinc-900 focus:border-amber-500"
              )}
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">메모 상세 기술 (줄바꿈 포함 가능)</span>
            <textarea 
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
              placeholder="뉴스에서 영감을 얻은 서사적 대립, 캐릭터 관계 변화 및 긴장감 연출 요소를 상세히 적어보세요..."
              className={cn(
                "w-full border p-4 rounded-2xl text-xs font-semibold outline-none leading-relaxed transition-all resize-none",
                isDarkMode ? "bg-[#0E0E12] border-zinc-800 text-zinc-300 focus:border-amber-500/50" : "bg-white border-zinc-200 text-zinc-700 focus:border-amber-500"
              )}
            />
          </div>
        </div>

        <div className={cn(
          "p-6 border-t flex justify-end gap-2.5",
          isDarkMode ? "border-zinc-800/40 bg-[#0A0A0E]/50" : "border-zinc-200 bg-[#F8F9FC]"
        )}>
          <button 
            onClick={onClose}
            className={cn(
              "px-5 py-2.5 border text-xs font-bold rounded-xl transition-all",
              isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
            )}
          >
            취소
          </button>
          <button 
            onClick={async () => {
              if (!editTitle.trim()) {
                addToast("메모 제목을 기입해주세요.", "warning");
                return;
              }
              if (!editContent.trim()) {
                addToast("메모 상세 내용을 적어주세요.", "warning");
                return;
              }
              
              await handleUpdateNote(
                editingNote.id,
                editTitle,
                editContent,
                () => {
                  addToast("메모가 수정되었습니다.", "success");
                  onClose();
                },
                (msg) => {
                  addToast(msg, "error");
                }
              );
            }}
            disabled={isUploading}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
          >
            {isUploading ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
