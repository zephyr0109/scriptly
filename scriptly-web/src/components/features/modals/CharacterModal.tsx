"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCharacterId: string | null;
  charName: string;
  charRole: string;
  charDesc: string;
  charDesire: string;
  charColor: string;
  setCharacterForm: (form: any) => void;
  handleSaveCharacter: () => Promise<void>;
  deleteCharacter: (id: string) => Promise<boolean>;
  addToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
}

export default function CharacterModal({
  isOpen,
  onClose,
  activeCharacterId,
  charName,
  charRole,
  charDesc,
  charDesire,
  charColor,
  setCharacterForm,
  handleSaveCharacter,
  deleteCharacter,
  addToast
}: CharacterModalProps) {
  const { isDarkMode } = useUIStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300">
      <div className="bg-[#14141A] border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-800/40 flex items-center justify-between">
          <h3 className="text-sm font-black text-white">{activeCharacterId ? "등장인물 정보 수정" : "신규 인물 캐릭터 등록"}</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all"><X size={16} /></button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">인물 이름</label>
            <input 
              value={charName} 
              onChange={(e) => setCharacterForm({ name: e.target.value })} 
              placeholder="예: 황시목" 
              className="w-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl outline-none focus:border-amber-500/50" 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">배역 비중 및 포지션</label>
            <select 
              value={charRole} 
              onChange={(e) => setCharacterForm({ role: e.target.value })} 
              className="w-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-3 py-2.5 rounded-xl outline-none"
            >
              <option>주연 (검사)</option>
              <option>주연 (형사)</option>
              <option>조연 (법조인)</option>
              <option>조연 (정치인)</option>
              <option>조연 (기자)</option>
              <option>단역</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">인물 내면의 근본 욕망 (Desire)</label>
            <input 
              value={charDesire} 
              onChange={(e) => setCharacterForm({ desire: e.target.value })} 
              placeholder="예: 법 앞의 절대 평등과 사회 정의 실현" 
              className="w-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl outline-none focus:border-amber-500/50" 
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">인물 프로파일링 정보 기술</label>
            <textarea 
              value={charDesc} 
              onChange={(e) => setCharacterForm({ desc: e.target.value })} 
              rows={3} 
              placeholder="인물의 주요 특징, 대인 관계에서의 특질 기술..." 
              className="w-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white px-4 py-2.5 rounded-xl outline-none resize-none leading-relaxed focus:border-amber-500/50" 
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">인물 전용 다이어그램 식별 컬러</label>
            <div className="flex gap-2.5">
              {[
                { label: "파랑", class: "bg-blue-500/20 text-blue-400 border-blue-500/50" },
                { label: "녹색", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" },
                { label: "보라", class: "bg-purple-500/20 text-purple-400 border-purple-500/50" },
                { label: "빨강", class: "bg-rose-500/20 text-rose-400 border-rose-500/50" }
              ].map(c => (
                <button
                  key={c.class}
                  onClick={() => setCharacterForm({ color: c.class })}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all",
                    charColor === c.class ? "bg-amber-500 text-black border-amber-400" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-zinc-800/40 bg-[#0E0E12] flex justify-between gap-3">
          {activeCharacterId && (
            <button 
              onClick={async () => {
                await deleteCharacter(activeCharacterId);
                addToast("인물 프로필이 완벽히 삭제되었습니다.", "info");
                onClose();
              }} 
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl transition-all"
            >
              삭제
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition-all">취소</button>
            <button onClick={handleSaveCharacter} className="px-5 py-2.5 bg-amber-500 text-black hover:bg-amber-400 text-xs font-black rounded-xl transition-all shadow-md active:scale-95">저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}
