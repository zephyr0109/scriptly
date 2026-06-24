"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { WorldGlossary } from "@/hooks/useWorldSettings";

interface GlossaryRowProps {
  /** 용어 사전 개별 데이터 */
  entry: WorldGlossary;
  /** 필드 수정 완료(onBlur) 시 백엔드 업데이트를 반영할 핸들러 */
  onUpdate: (id: string, updates: Partial<WorldGlossary>) => Promise<any>;
  /** 용어 삭제 핸들러 */
  onDelete: (id: string) => Promise<any>;
}

/**
 * GlossaryRow 컴포넌트
 * 용어 사전의 개별 행을 렌더링하고, 인라인 수정을 직접 처리합니다.
 * React 리렌더링 시 포커스 블러 버그를 막기 위해 독립 스코프로 격리되어 있습니다.
 */
export default function GlossaryRow({ entry, onUpdate, onDelete }: GlossaryRowProps) {
  const [term, setTerm] = useState(entry.term);
  const [definition, setDefinition] = useState(entry.definition || "");
  const [usageExample, setUsageExample] = useState(entry.usage_example || "");
  const [isSaving, setIsSaving] = useState(false);

  // 상위에서 데이터 배열이 변경될 경우 로컬 상태와 동기화
  useEffect(() => {
    setTerm(entry.term);
    setDefinition(entry.definition || "");
    setUsageExample(entry.usage_example || "");
  }, [entry]);

  /**
   * 필드 수정 완료(Focus Out) 시 백엔드 API를 호출해 영속화합니다.
   */
  const handleSaveField = async (updatedFields: Partial<WorldGlossary>) => {
    setIsSaving(true);
    try {
      await onUpdate(entry.id, updatedFields);
    } catch (e) {
      console.error("Failed to update inline glossary:", e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <tr className="hover:bg-zinc-800/10 border-b border-zinc-900 last:border-0 transition-colors group">
      <td className="px-3 py-1.5 text-xs">
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onBlur={() => term !== entry.term && handleSaveField({ term })}
          className="w-full bg-transparent border-0 focus:bg-zinc-900/60 focus:ring-1 focus:ring-amber-500/50 rounded px-2.5 py-1.5 outline-none font-bold text-amber-400/90"
          placeholder="용어 입력..."
        />
      </td>
      <td className="px-3 py-1.5 text-xs">
        <textarea
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          onBlur={() => definition !== (entry.definition || "") && handleSaveField({ definition })}
          rows={1}
          className="w-full bg-transparent border-0 focus:bg-zinc-900/60 focus:ring-1 focus:ring-amber-500/50 rounded px-2.5 py-1.5 outline-none text-zinc-300 resize-y min-h-[32px] custom-scrollbar-dark"
          placeholder="정의 및 해설 입력..."
        />
      </td>
      <td className="px-3 py-1.5 text-xs">
        <textarea
          value={usageExample}
          onChange={(e) => setUsageExample(e.target.value)}
          onBlur={() => usageExample !== (entry.usage_example || "") && handleSaveField({ usage_example: usageExample })}
          rows={1}
          className="w-full bg-transparent border-0 focus:bg-zinc-900/60 focus:ring-1 focus:ring-amber-500/50 rounded px-2.5 py-1.5 outline-none text-zinc-400 resize-y min-h-[32px] custom-scrollbar-dark"
          placeholder="사용 예시 입력..."
        />
      </td>
      <td className="px-3 py-1.5 text-xs w-16 text-center">
        <div className="flex items-center justify-center gap-1.5">
          {isSaving ? (
            <Loader2 size={12} className="animate-spin text-amber-500" />
          ) : (
            <button
              onClick={() => onDelete(entry.id)}
              className="p-1.5 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
              title="용어 삭제"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
