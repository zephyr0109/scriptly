"use client";

import React from "react";
import { WorldStage, WorldFaction } from "@/hooks/useWorldSettings";

interface WorldRuleCultureFormProps {
  /** 시공간 무대 목록 (적용 무대 선택용) */
  stages: WorldStage[];
  /** 세력/집단 목록 (적용 세력 선택용) */
  factions: WorldFaction[];
  /** 로컬 폼 상태 필드 */
  formFields: Record<string, any>;
  /** 로컬 폼 상태 필드 업데이트 핸들러 */
  setFormFields: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

/**
 * WorldRuleCultureForm 컴포넌트
 * 사회 제도 및 문화적 관습(Rules & Cultures) 항목에 대한 세부 설정 폼을 제공합니다.
 */
export default function WorldRuleCultureForm({
  stages,
  factions,
  formFields,
  setFormFields,
}: WorldRuleCultureFormProps) {
  return (
    <>
      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            분류 (Type)
          </label>
          <select
            value={formFields.type || "RULE"}
            onChange={(e) => setFormFields((prev) => ({ ...prev, type: e.target.value }))}
            className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
          >
            <option value="RULE">📜 공식 제도 / 법률 (RULE)</option>
            <option value="CULTURE">🍃 비공식 사회 관습 / 문화 (CULTURE)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            적용 시공간 무대 (Scope Stage)
          </label>
          <select
            value={formFields.scope_stage_id || ""}
            onChange={(e) => setFormFields((prev) => ({ ...prev, scope_stage_id: e.target.value || null }))}
            className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
          >
            <option value="">전역 (특정 장소 한정 없음)</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.era ? `(${s.era})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            적용 대상 세력 (Scope Faction)
          </label>
          <select
            value={formFields.scope_faction_id || ""}
            onChange={(e) => setFormFields((prev) => ({ ...prev, scope_faction_id: e.target.value || null }))}
            className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
          >
            <option value="">모든 인물/전체</option>
            {factions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
          작동 규칙 및 관습 상세 내용 (Content)
        </label>
        <textarea
          value={formFields.content || ""}
          onChange={(e) => setFormFields((prev) => ({ ...prev, content: e.target.value }))}
          className="w-full h-32 px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 resize-none custom-scrollbar-dark"
          placeholder="제도나 관습이 구체적으로 어떤 방식으로 작동하며, 어떤 제약이 생기는지 서술하세요."
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            사회적 / 인물 영향 (Impact)
          </label>
          <textarea
            value={formFields.impact || ""}
            onChange={(e) => setFormFields((prev) => ({ ...prev, impact: e.target.value }))}
            className="w-full h-28 px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 resize-none custom-scrollbar-dark"
            placeholder="이 룰이나 관습 때문에 캐릭터들이 겪는 내외적 딜레마나 압박을 정리해 보세요."
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            예외 사항 / 설정 틈새 (Exceptions)
          </label>
          <textarea
            value={formFields.exceptions || ""}
            onChange={(e) => setFormFields((prev) => ({ ...prev, exceptions: e.target.value }))}
            className="w-full h-28 px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 resize-none custom-scrollbar-dark"
            placeholder="이야기 전개 시 극적으로 활용될 수 있는 규칙의 허점이나 비공식 예외 규정을 기록하세요."
          />
        </div>
      </div>
    </>
  );
}
