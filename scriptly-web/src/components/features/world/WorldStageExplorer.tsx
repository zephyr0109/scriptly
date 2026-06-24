"use client";

import React from "react";
import { Plus, Folder, Globe, ShieldAlert, FileText, ChevronDown, ChevronRight, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorldStage, WorldFaction, WorldRuleCulture, WorldGlossary, WorldNote } from "@/hooks/useWorldSettings";

export type CategoryType = "stage" | "faction" | "rule" | "glossary" | "note";

export interface SelectedItem {
  id: string;
  category: CategoryType;
}

interface WorldStageExplorerProps {
  /** 시공간 무대 데이터 목록 */
  stages: WorldStage[];
  /** 세력/집단 데이터 목록 */
  factions: WorldFaction[];
  /** 제도/문화 데이터 목록 */
  rules: WorldRuleCulture[];
  /** 용어 사전 데이터 목록 */
  glossary: WorldGlossary[];
  /** 자유 메모 데이터 목록 */
  notes: WorldNote[];
  /** 현재 선택된 세계관 항목 */
  selected: SelectedItem | null;
  /** 카테고리별 확장/축소 상태 */
  expanded: Record<string, boolean>;
  /** 다크 모드 여부 */
  isDarkMode: boolean;
  /** 카테고리 접기/펼치기 핸들러 */
  toggleCategory: (cat: string) => void;
  /** 새 세계관 항목 추가 핸들러 */
  handleAddNewItem: (cat: CategoryType) => Promise<void>;
  /** 하위 시공간 무대 추가 핸들러 */
  handleCreateSubStage: (parentId: string) => Promise<void>;
  /** 변경 사항 미저장 체크 래퍼 */
  executeWithDirtyCheck: (action: () => void) => void;
  /** 선택 항목 설정 핸들러 */
  setSelected: (item: SelectedItem | null) => void;
}

/**
 * WorldStageExplorer 컴포넌트
 * 세계관 설정실 좌측의 카테고리 탐색기 영역을 렌더링하고,
 * 각 항목을 트리 또는 목록 형태로 표출합니다.
 */
export default function WorldStageExplorer({
  stages,
  factions,
  rules,
  glossary,
  notes,
  selected,
  expanded,
  isDarkMode,
  toggleCategory,
  handleAddNewItem,
  handleCreateSubStage,
  executeWithDirtyCheck,
  setSelected,
}: WorldStageExplorerProps) {
  
  /**
   * 계층 구조를 가진 시공간 무대 트리를 재귀적으로 렌더링합니다.
   */
  const renderStageTree = (parentId: string | null, depth = 0) => {
    const childStages = stages.filter(s => (parentId === null ? !s.parent_id : s.parent_id === parentId));
    return childStages.map(stage => {
      const isSel = selected?.id === stage.id && selected?.category === "stage";
      return (
        <div key={stage.id} className="w-full">
          <div
            style={{ paddingLeft: `${depth * 12 + 16}px` }}
            className={cn(
              "w-full py-2.5 pr-4 rounded-xl text-xs flex items-center justify-between transition-all hover:bg-zinc-800/40 group cursor-pointer",
              isSel ? "bg-amber-500/10 border-l-2 border-amber-500" : ""
            )}
            onClick={() => executeWithDirtyCheck(() => setSelected({ id: stage.id, category: "stage" }))}
          >
            <div className="flex items-center gap-2 truncate flex-1">
              <Compass size={13} className={isSel ? "text-amber-400" : "text-zinc-500"} />
              <span className={cn("truncate flex-1", isSel ? "text-amber-400 font-extrabold" : "text-zinc-400")}>
                {stage.name}
              </span>
              {stage.era && (
                <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500 font-medium shrink-0">
                  {stage.era}
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                executeWithDirtyCheck(() => handleCreateSubStage(stage.id));
              }}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 shrink-0"
              title="하위 무대 추가"
            >
              <Plus size={11} />
            </button>
          </div>
          {renderStageTree(stage.id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <div className={cn("w-72 border-r h-full flex flex-col shrink-0 select-none", isDarkMode ? "bg-[#0C0C10] border-zinc-900" : "bg-zinc-50/50 border-zinc-200")}>
      <div className="flex-1 overflow-y-auto pt-6 px-4 pb-4 space-y-3 custom-scrollbar-dark">
        
        {/* 1. 시공간 무대 Accordion */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <button onClick={() => toggleCategory("stage")} className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500 hover:text-white transition-all uppercase tracking-wider">
              {expanded.stage ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              시공간 무대 (STAGES)
            </button>
            <button onClick={() => executeWithDirtyCheck(() => handleAddNewItem("stage"))} className="p-1 hover:bg-zinc-800 rounded text-amber-500 hover:text-amber-400" title="새 무대 추가">
              <Plus size={12} />
            </button>
          </div>
          {expanded.stage && <div className="space-y-0.5 mt-1">{renderStageTree(null)}</div>}
        </div>

        {/* 2. 세력/집단 Accordion */}
        <div className="space-y-1 pt-2">
          <div className="flex items-center justify-between px-2 py-1">
            <button onClick={() => toggleCategory("faction")} className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500 hover:text-white transition-all uppercase tracking-wider">
              {expanded.faction ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              세력/집단 (FACTIONS)
            </button>
            <button onClick={() => executeWithDirtyCheck(() => handleAddNewItem("faction"))} className="p-1 hover:bg-zinc-800 rounded text-amber-500 hover:text-amber-400" title="새 집단 추가">
              <Plus size={12} />
            </button>
          </div>
          {expanded.faction && factions.map(f => {
            const isSel = selected?.id === f.id && selected?.category === "faction";
            return (
              <button
                key={f.id}
                onClick={() => executeWithDirtyCheck(() => setSelected({ id: f.id, category: "faction" }))}
                className={cn(
                  "w-full text-left py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-all hover:bg-zinc-800/40",
                  isSel ? "bg-amber-500/10 text-amber-400 font-extrabold border-l-2 border-amber-500" : "text-zinc-400"
                )}
              >
                <Folder size={13} className={isSel ? "text-amber-400" : "text-zinc-500"} />
                <span className="truncate flex-1">{f.name}</span>
              </button>
            );
          })}
        </div>

        {/* 3. 제도/문화 관습 Accordion */}
        <div className="space-y-1 pt-2">
          <div className="flex items-center justify-between px-2 py-1">
            <button onClick={() => toggleCategory("rule")} className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500 hover:text-white transition-all uppercase tracking-wider">
              {expanded.rule ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              제도/문화 (RULES & CULTURES)
            </button>
            <button onClick={() => executeWithDirtyCheck(() => handleAddNewItem("rule"))} className="p-1 hover:bg-zinc-800 rounded text-amber-500 hover:text-amber-400" title="새 규칙 추가">
              <Plus size={12} />
            </button>
          </div>
          {expanded.rule && rules.map(r => {
            const isSel = selected?.id === r.id && selected?.category === "rule";
            return (
              <button
                key={r.id}
                onClick={() => executeWithDirtyCheck(() => setSelected({ id: r.id, category: "rule" }))}
                className={cn(
                  "w-full text-left py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-all hover:bg-zinc-800/40",
                  isSel ? "bg-amber-500/10 text-amber-400 font-extrabold border-l-2 border-amber-500" : "text-zinc-400"
                )}
              >
                <ShieldAlert size={13} className={isSel ? "text-amber-400" : "text-zinc-500"} />
                <span className="truncate flex-1">{r.name}</span>
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-black", r.type === "RULE" ? "bg-red-500/10 text-red-400" : "bg-teal-500/10 text-teal-400")}>
                  {r.type === "RULE" ? "법" : "문화"}
                </span>
              </button>
            );
          })}
        </div>

        {/* 4. 용어 사전 Button */}
        <div className="pt-2">
          <button
            onClick={() => executeWithDirtyCheck(() => setSelected({ id: "all", category: "glossary" }))}
            className={cn(
              "w-full text-left py-2.5 px-4 rounded-xl text-xs flex items-center justify-between transition-all hover:bg-zinc-800/40 font-black tracking-wider uppercase",
              selected?.id === "all" && selected?.category === "glossary"
                ? "bg-amber-500/10 text-amber-400 font-extrabold border-l-2 border-amber-500"
                : "text-zinc-500 hover:text-white"
            )}
          >
            <div className="flex items-center gap-2">
              <Globe size={13} className={selected?.id === "all" && selected?.category === "glossary" ? "text-amber-400" : "text-zinc-500"} />
              <span>용어 사전 (GLOSSARY)</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 dark:bg-zinc-900 rounded text-zinc-500 font-medium shrink-0">{glossary.length}</span>
          </button>
        </div>

        {/* 5. 자유 메모 Accordion */}
        <div className="space-y-1 pt-2">
          <div className="flex items-center justify-between px-2 py-1">
            <button onClick={() => toggleCategory("note")} className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500 hover:text-white transition-all uppercase tracking-wider">
              {expanded.note ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              자유 메모 (WORLD NOTES)
            </button>
            <button onClick={() => executeWithDirtyCheck(() => handleAddNewItem("note"))} className="p-1 hover:bg-zinc-800 rounded text-amber-500 hover:text-amber-400" title="새 메모 추가">
              <Plus size={12} />
            </button>
          </div>
          {expanded.note && notes.map(n => {
            const isSel = selected?.id === n.id && selected?.category === "note";
            return (
              <button
                key={n.id}
                onClick={() => executeWithDirtyCheck(() => setSelected({ id: n.id, category: "note" }))}
                className={cn(
                  "w-full text-left py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition-all hover:bg-zinc-800/40",
                  isSel ? "bg-amber-500/10 text-amber-400 font-extrabold border-l-2 border-amber-500" : "text-zinc-400"
                )}
              >
                <FileText size={13} className={isSel ? "text-amber-400" : "text-zinc-500"} />
                <span className="truncate flex-1">{n.title}</span>
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
