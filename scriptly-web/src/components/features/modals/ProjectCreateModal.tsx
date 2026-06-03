"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  createProject: (data: any) => Promise<any>;
  addToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
}

export default function ProjectCreateModal({
  isOpen,
  onClose,
  createProject,
  addToast
}: ProjectCreateModalProps) {
  const { isDarkMode } = useUIStore();
  
  // 프로젝트 기획 생성 임시 State 캡슐화
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [newProjectGenre, setNewProjectGenre] = useState<string>("스릴러");
  const [newProjectLogline, setNewProjectLogline] = useState<string>("");

  if (!isOpen) return null;

  const handleCreateNewProject = async () => {
    if (!newProjectName.trim()) {
      addToast("드라마 프로젝트의 제목을 입력해주세요.", "error");
      return;
    }
    try {
      await createProject({
        title: newProjectName,
        genre: newProjectGenre,
        logline: newProjectLogline || "작품의 로그라인이 아직 입력되지 않았습니다."
      });
      addToast(`신규 드라마 '${newProjectName}' 기획 워크스페이스가 생성되었습니다!`, "success");
      setNewProjectName("");
      setNewProjectGenre("스릴러");
      setNewProjectLogline("");
      onClose();
    } catch (e) {
      addToast("프로젝트 생성에 실패했습니다.", "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300">
      <div className="bg-[#14141A] border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-800/40 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-black text-white">신규 드라마 기획 워크스페이스 개설</h3>
            <span className="text-[10px] text-zinc-500">집필하고 기획안을 보며 쓸 새로운 작품 기획 마당을 만듭니다.</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">기획 작품 제목</label>
            <input 
              value={newProjectName} 
              onChange={(e) => setNewProjectName(e.target.value)} 
              placeholder="예: 시그널 시즌2" 
              className="w-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl outline-none focus:border-amber-500/50" 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">편성 장르 스타일</label>
            <input 
              value={newProjectGenre} 
              onChange={(e) => setNewProjectGenre(e.target.value)} 
              placeholder="예: 범죄 수사 스릴러 / 휴먼 다큐" 
              className="w-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl outline-none focus:border-amber-500/50" 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">작품 기본 로그라인</label>
            <textarea 
              value={newProjectLogline} 
              onChange={(e) => setNewProjectLogline(e.target.value)} 
              rows={3} 
              placeholder="작품의 한 줄짜리 핵심 내러티브를 요약하세요..." 
              className="w-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white px-4 py-3 rounded-xl outline-none resize-none leading-relaxed focus:border-amber-500/50" 
            />
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800/40 bg-[#0E0E12] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition-all">
            취소
          </button>
          <button onClick={handleCreateNewProject} className="px-5 py-2.5 bg-amber-500 text-black hover:bg-amber-400 text-xs font-black rounded-xl transition-all shadow-md active:scale-95">
            워크스페이스 생성
          </button>
        </div>
      </div>
    </div>
  );
}
