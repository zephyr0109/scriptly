"use client";

import React from "react";
import { Plus, Globe } from "lucide-react";
import { WorldGlossary } from "@/hooks/useWorldSettings";
import { CategoryType } from "../WorldStageExplorer";
import GlossaryRow from "./GlossaryRow";

interface WorldGlossaryGridProps {
  /** 용어 사전 원본 데이터 목록 */
  glossary: WorldGlossary[];
  /** 정렬이 적용된 용어 사전 데이터 목록 */
  sortedGlossary: WorldGlossary[];
  /** 현재 가나다 정렬 방향 */
  sortDirection: 'asc' | 'desc' | null;
  /** 정렬 방향 변경 핸들러 */
  setSortDirection: React.Dispatch<React.SetStateAction<'asc' | 'desc' | null>>;
  /** 새 용어 추가 핸들러 */
  handleAddNewItem: (cat: CategoryType) => Promise<void>;
  /** 인라인 용어 수정 핸들러 */
  handleUpdateGlossary: (id: string, updates: Partial<WorldGlossary>) => Promise<any>;
  /** 개별 용어 삭제 클릭 핸들러 (부모에서 삭제 확인 모달 호출) */
  handleDeleteGlossaryClick: (id: string) => void;
  /** 변경 사항 미저장 체크 래퍼 */
  executeWithDirtyCheck: (action: () => void) => void;
}

/**
 * WorldGlossaryGrid 컴포넌트
 * 세계관 설정실 내의 '용어 사전' 일람표 화면을 렌더링합니다.
 * 인라인 자유 편집이 가능한 그리드 구조를 가집니다.
 */
export default function WorldGlossaryGrid({
  glossary,
  sortedGlossary,
  sortDirection,
  setSortDirection,
  handleAddNewItem,
  handleUpdateGlossary,
  handleDeleteGlossaryClick,
  executeWithDirtyCheck,
}: WorldGlossaryGridProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Table Header */}
      <div className="p-6 border-b dark:border-zinc-900/60 flex justify-between items-center bg-[#0C0C10]/40">
        <div>
          <h2 className="text-base font-black text-white">용어 사전 일람표</h2>
          <p className="text-[10px] text-zinc-500 mt-1">
            작품에 등장하는 고유 설정이나 인물들 간의 전문 용어를 통합 관리하는 일람표입니다.
          </p>
        </div>
        <button
          onClick={() => executeWithDirtyCheck(() => handleAddNewItem("glossary"))}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow-lg transition-all"
        >
          <Plus size={13} />
          새 용어 추가
        </button>
      </div>

      {/* Table Body */}
      <div className="flex-1 overflow-auto p-8 custom-scrollbar-dark">
        {glossary.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 select-none">
            <Globe size={40} className="text-zinc-500 mb-3" />
            <p className="text-xs text-zinc-400">
              등록된 용어가 없습니다.
              <br />
              우측 상단의 버튼을 눌러 첫 번째 용어를 추가해 보세요.
            </p>
          </div>
        ) : (
          <div className="w-full border border-zinc-800/80 rounded-2xl overflow-hidden bg-zinc-950/20">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="bg-zinc-900/40 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-800 select-none">
                  <th
                    onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                    className="px-5 py-4 text-xs font-black w-[22%] cursor-pointer hover:bg-zinc-850/40 transition-colors group/hdr"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>용어 (Term)</span>
                      {sortDirection === 'asc' && <span className="text-[10px] text-amber-500 font-extrabold">▲</span>}
                      {sortDirection === 'desc' && <span className="text-[10px] text-amber-500 font-extrabold">▼</span>}
                      {!sortDirection && (
                        <span className="text-[10px] text-zinc-600 opacity-0 group-hover/hdr:opacity-100 transition-opacity">
                          ↕
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-5 py-4 text-xs font-black w-[40%]">정의 및 해설 (Definition)</th>
                  <th className="px-5 py-4 text-xs font-black w-[32%]">사용 예시 (Usage Example)</th>
                  <th className="px-5 py-4 text-xs font-black w-[6%] text-center">관리</th>
                </tr>
              </thead>
              <tbody>
                {sortedGlossary.map((entry) => (
                  <GlossaryRow
                    key={entry.id}
                    entry={entry}
                    onUpdate={handleUpdateGlossary}
                    onDelete={async (id) => {
                      handleDeleteGlossaryClick(id);
                    }}
                  />
                ))}
                {/* 인라인 새 용어 추가 단축 버튼 행 */}
                <tr className="hover:bg-zinc-800/10 transition-colors border-t border-zinc-900 bg-zinc-900/10">
                  <td colSpan={4} className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => executeWithDirtyCheck(() => handleAddNewItem("glossary"))}
                      className="inline-flex items-center gap-1.5 px-5 py-2 text-zinc-500 hover:text-amber-400 font-bold text-xs rounded-xl hover:bg-zinc-800/30 transition-all outline-none"
                    >
                      <Plus size={13} />
                      새 용어 행 추가
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
