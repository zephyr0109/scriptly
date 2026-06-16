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
  charAge: string;
  charGender: string;
  charOccupation: string;
  charIsLocked: boolean;
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
  charAge,
  charGender,
  charOccupation,
  charIsLocked,
  setCharacterForm,
  handleSaveCharacter,
  deleteCharacter,
  addToast
}: CharacterModalProps) {
  const { isDarkMode } = useUIStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300">
      <div className={cn(
        "border rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200",
        isDarkMode ? "bg-[#14141A] border-zinc-800" : "bg-white border-zinc-200"
      )}>
        {/* 헤더 */}
        <div className={cn(
          "p-6 border-b flex items-center justify-between",
          isDarkMode ? "border-zinc-800/40" : "border-zinc-250"
        )}>
          <h3 className={cn("text-sm font-black", isDarkMode ? "text-white" : "text-zinc-950")}>
            {activeCharacterId ? "등장인물 정보 수정" : "신규 인물 캐릭터 등록"}
          </h3>
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
          "p-6 flex flex-col gap-4 max-h-[450px] overflow-y-auto custom-scrollbar-dark",
          isDarkMode ? "bg-[#0A0A0E]/30" : "bg-[#F8F9FC]/30"
        )}>
          {/* 이름 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">인물 이름</label>
            <input 
              value={charName} 
              onChange={(e) => setCharacterForm({ name: e.target.value })} 
              placeholder="예: 황시목" 
              className="w-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl outline-none focus:border-amber-500/50" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 나이 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">나이</label>
              <input 
                value={charAge} 
                onChange={(e) => setCharacterForm({ age: e.target.value })} 
                placeholder="예: 30대 후반" 
                className="w-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl outline-none focus:border-amber-500/50" 
              />
            </div>
            {/* 성별 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">성별</label>
              <input 
                value={charGender} 
                onChange={(e) => setCharacterForm({ gender: e.target.value })} 
                placeholder="예: 남성" 
                className="w-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl outline-none focus:border-amber-500/50" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 배역 비중 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">배역 비중</label>
              <select 
                value={charRole} 
                onChange={(e) => setCharacterForm({ role: e.target.value })} 
                className="w-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-3 py-2.5 rounded-xl outline-none cursor-pointer"
              >
                <option value="주연">주연</option>
                <option value="주조연">주조연</option>
                <option value="조연">조연</option>
                <option value="단역">단역</option>
                <option value="카메오">카메오</option>
              </select>
            </div>
            {/* 직업 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">직업</label>
              <input 
                value={charOccupation} 
                onChange={(e) => setCharacterForm({ occupation: e.target.value })} 
                placeholder="예: 서부지검 검사" 
                className="w-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl outline-none focus:border-amber-500/50" 
              />
            </div>
          </div>

          {/* 내면 욕망 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">인물 내면의 근본 욕망 (Desire)</label>
            <input 
              value={charDesire} 
              onChange={(e) => setCharacterForm({ desire: e.target.value })} 
              placeholder="예: 법 앞의 절대 평등과 사회 정의 실현" 
              className="w-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl outline-none focus:border-amber-500/50" 
            />
          </div>

          {/* 캐릭터 고정 여부 */}
          <div className="flex items-center gap-2.5 py-1 px-1 bg-zinc-950/40 border border-zinc-900 rounded-2xl p-3 mt-1">
            <input 
              type="checkbox"
              id="charIsLocked" 
              checked={charIsLocked}
              onChange={(e) => setCharacterForm({ isLocked: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-800 bg-zinc-900 text-amber-500 focus:ring-0 outline-none cursor-pointer"
            />
            <label htmlFor="charIsLocked" className="text-xs font-bold text-zinc-400 cursor-pointer flex items-center gap-1.5 select-none hover:text-white transition-all">
              📌 인물 고정 (관계도 자동 분석 시 유지)
            </label>
          </div>

          {/* 상세 기술 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">상세 인물 소개 기술</label>
            <textarea 
              value={charDesc} 
              onChange={(e) => setCharacterForm({ desc: e.target.value })} 
              rows={4} 
              placeholder="인물의 외형적/성격적 특징 및 타인과의 갈등 관계 특질 등을 상세히 적어주세요..." 
              className="w-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white px-4 py-2.5 rounded-xl outline-none resize-none leading-relaxed focus:border-amber-500/50" 
            />
          </div>
        </div>

        {/* 푸터 */}
        <div className={cn(
          "p-6 border-t flex justify-between gap-3",
          isDarkMode ? "border-zinc-800/40 bg-[#0E0E12]" : "border-zinc-200 bg-[#F8F9FC]"
        )}>
          {activeCharacterId && (
            <button 
              onClick={async () => {
                if (confirm("정말 이 등장인물을 삭제하시겠습니까?")) {
                  await deleteCharacter(activeCharacterId);
                  addToast("인물 프로필이 완벽히 삭제되었습니다.", "info");
                  onClose();
                }
              }} 
              className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl transition-all active:scale-95"
            >
              삭제
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
              onClick={handleSaveCharacter} 
              className="px-5 py-2.5 bg-amber-500 text-black hover:bg-amber-400 text-xs font-black rounded-xl transition-all shadow-md active:scale-95"
            >
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
