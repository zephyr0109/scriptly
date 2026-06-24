"use client";

import React from "react";
import { WorldStage } from "@/hooks/useWorldSettings";

interface WorldStageFormProps {
  /** 전체 시공간 무대 데이터 목록 (상위 무대 선택을 위해 필요) */
  stages: WorldStage[];
  /** 현재 선택된 시공간 무대의 ID (본인 선택 차단용) */
  selectedId: string;
  /** 로컬 폼 상태 필드 */
  formFields: Record<string, any>;
  /** 로컬 폼 상태 필드 업데이트 핸들러 */
  setFormFields: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

/**
 * WorldStageForm 컴포넌트
 * 시공간 무대(Era & Place) 항목에 대한 세부 설정 폼을 제공합니다.
 */
export default function WorldStageForm({
  stages,
  selectedId,
  formFields,
  setFormFields,
}: WorldStageFormProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            시대 / 시점 (Era)
          </label>
          <input
            type="text"
            value={formFields.era || ""}
            onChange={(e) => setFormFields((prev) => ({ ...prev, era: e.target.value }))}
            className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50"
            placeholder="예: 1990년대, 조선 영조기, 2030년대"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            상위 시공간 (Parent Stage)
          </label>
          <select
            value={formFields.parent_id || ""}
            onChange={(e) => setFormFields((prev) => ({ ...prev, parent_id: e.target.value || null }))}
            className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
          >
            <option value="">없음 (최상위 무대)</option>
            {stages
              .filter((s) => s.id !== selectedId)
              .map((s) => (
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
            분위기 / 무드 (Atmosphere)
          </label>
          <input
            type="text"
            value={formFields.atmosphere || ""}
            onChange={(e) => setFormFields((prev) => ({ ...prev, atmosphere: e.target.value }))}
            className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50"
            placeholder="예: 어둡고 습한 골목길, 화려하고 차가운 빌딩숲"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            기술 및 물리 인프라 (Tech Level)
          </label>
          <input
            type="text"
            value={formFields.technology_level || ""}
            onChange={(e) => setFormFields((prev) => ({ ...prev, technology_level: e.target.value }))}
            className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50"
            placeholder="예: 스마트폰 상용화 시점, 사이버네틱스 도입 완료"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
          공간 설명 및 역사적 의의 (Description)
        </label>
        <textarea
          value={formFields.description || ""}
          onChange={(e) => setFormFields((prev) => ({ ...prev, description: e.target.value }))}
          className="w-full h-44 px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 resize-none custom-scrollbar-dark"
          placeholder="이 시공간적 장소에 대한 상세한 단상과 역사적 의의를 자유롭게 설명해 보세요."
        />
      </div>
    </>
  );
}
