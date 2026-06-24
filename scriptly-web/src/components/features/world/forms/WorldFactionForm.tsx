"use client";

import React from "react";
import { WorldStage } from "@/hooks/useWorldSettings";

interface WorldFactionFormProps {
  /** 시공간 무대 목록 (주요 거점 선택을 위해 필요) */
  stages: WorldStage[];
  /** 로컬 폼 상태 필드 */
  formFields: Record<string, any>;
  /** 로컬 폼 상태 필드 업데이트 핸들러 */
  setFormFields: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

/**
 * WorldFactionForm 컴포넌트
 * 세력/집단(Faction) 항목에 대한 세부 설정 폼을 제공합니다.
 */
export default function WorldFactionForm({
  stages,
  formFields,
  setFormFields,
}: WorldFactionFormProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            세력 유형 (Type)
          </label>
          <input
            type="text"
            value={formFields.type || ""}
            onChange={(e) => setFormFields((prev) => ({ ...prev, type: e.target.value }))}
            className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50"
            placeholder="예: 사교 모임, 정당, 기업 카르텔, 비밀 단체"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            주요 거점 시공간 (Base Stage)
          </label>
          <select
            value={formFields.base_stage_id || ""}
            onChange={(e) => setFormFields((prev) => ({ ...prev, base_stage_id: e.target.value || null }))}
            className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
          >
            <option value="">없음 (특정 거점 없음)</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.era ? `(${s.era})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            규모 및 위상 (Scale & Status)
          </label>
          <input
            type="text"
            value={formFields.scale_status || ""}
            onChange={(e) => setFormFields((prev) => ({ ...prev, scale_status: e.target.value }))}
            className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50"
            placeholder="예: 전체 구성원 약 20명, 법조계 내 막강한 로비력 보유"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            조직 계급 / 직급 체계 (Hierarchy)
          </label>
          <input
            type="text"
            value={formFields.hierarchy || ""}
            onChange={(e) => setFormFields((prev) => ({ ...prev, hierarchy: e.target.value }))}
            className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50"
            placeholder="예: 이사장 ➔ 외과 과장 ➔ 치프 레지던트 ➔ 레지던트"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
          이념 및 집단 목표 (Ideology & Goal)
        </label>
        <textarea
          value={formFields.ideology_goal || ""}
          onChange={(e) => setFormFields((prev) => ({ ...prev, ideology_goal: e.target.value }))}
          className="w-full h-24 px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 resize-none custom-scrollbar-dark"
          placeholder="이 집단이 사수하거나 쟁취하고자 하는 궁극적인 이념과 신념 목표를 정의해 보세요."
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
          집단 상세 설명 (Description)
        </label>
        <textarea
          value={formFields.description || ""}
          onChange={(e) => setFormFields((prev) => ({ ...prev, description: e.target.value }))}
          className="w-full h-32 px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 resize-none custom-scrollbar-dark"
          placeholder="집단에 대한 전반적인 소개 및 성향을 서술하세요."
        />
      </div>
    </>
  );
}
