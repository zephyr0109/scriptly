"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Trash2, Plus, Save, Loader2, Globe, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorldSettings, WorldStage, WorldFaction, WorldRuleCulture, WorldGlossary, WorldNote } from "@/hooks/useWorldSettings";

// 분리된 하위 컴포넌트들 Import
import WorldStageExplorer, { CategoryType, SelectedItem } from "./WorldStageExplorer";
import WorldStageForm from "./forms/WorldStageForm";
import WorldFactionForm from "./forms/WorldFactionForm";
import WorldRuleCultureForm from "./forms/WorldRuleCultureForm";
import WorldGlossaryGrid from "./forms/WorldGlossaryGrid";

interface WorldBuildingViewProps {
  projectId: string;
  isDarkMode: boolean;
  addToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
}

/**
 * WorldBuildingView 컴포넌트 (세계관 설정실)
 * 드라마의 시공간 무대, 세력/집단, 제도/문화, 용어 사전, 자유 메모 등을 생성 및 편집하는 최상위 오케스트레이션 컴포넌트입니다.
 */
export default function WorldBuildingView({ projectId, isDarkMode, addToast }: WorldBuildingViewProps) {
  const {
    stages, factions, rules, glossary, notes, isLoading, fetchAllWorldData,
    handleCreateStage, handleUpdateStage, handleDeleteStage,
    handleCreateFaction, handleUpdateFaction, handleDeleteFaction,
    handleCreateRuleCulture, handleUpdateRuleCulture, handleDeleteRuleCulture,
    handleCreateGlossary, handleUpdateGlossary, handleDeleteGlossary,
    handleCreateNote, handleUpdateNote, handleDeleteNote
  } = useWorldSettings();

  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    stage: true, faction: true, rule: true, glossary: true, note: true
  });

  // Form local state
  const [formName, setFormName] = useState("");
  const [formFields, setFormFields] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Glossary Sort state
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);

  // Unsaved changes modal states
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchAllWorldData(projectId);
      setSelected(null);
    }
  }, [projectId, fetchAllWorldData]);

  // Find active item data
  const activeItem = useMemo(() => {
    if (!selected || selected.id === "all") return null;
    if (selected.category === "stage") return stages.find(s => s.id === selected.id);
    if (selected.category === "faction") return factions.find(f => f.id === selected.id);
    if (selected.category === "rule") return rules.find(r => r.id === selected.id);
    if (selected.category === "glossary") return glossary.find(g => g.id === selected.id);
    if (selected.category === "note") return notes.find(n => n.id === selected.id);
    return null;
  }, [selected, stages, factions, rules, glossary, notes]);

  // Memoized sorted glossary for inline editable table view
  const sortedGlossary = useMemo(() => {
    if (!sortDirection) return glossary;
    return [...glossary].sort((a, b) => {
      const termA = a.term || "";
      const termB = b.term || "";
      return sortDirection === 'asc' 
        ? termA.localeCompare(termB, 'ko') 
        : termB.localeCompare(termA, 'ko');
    });
  }, [glossary, sortDirection]);

  // Check if form has unsaved changes
  const checkIsDirty = useCallback((): boolean => {
    if (!selected || !activeItem || selected.id === "all") return false;

    if (selected.category === "stage") {
      const stage = activeItem as WorldStage;
      return (
        formName !== (stage.name || "") ||
        (formFields.era || "") !== (stage.era || "") ||
        (formFields.parent_id || "") !== (stage.parent_id || "") ||
        (formFields.atmosphere || "") !== (stage.atmosphere || "") ||
        (formFields.technology_level || "") !== (stage.technology_level || "") ||
        (formFields.description || "") !== (stage.description || "")
      );
    }

    if (selected.category === "faction") {
      const faction = activeItem as WorldFaction;
      return (
        formName !== (faction.name || "") ||
        (formFields.type || "") !== (faction.type || "") ||
        (formFields.ideology_goal || "") !== (faction.ideology_goal || "") ||
        (formFields.base_stage_id || "") !== (faction.base_stage_id || "") ||
        (formFields.scale_status || "") !== (faction.scale_status || "") ||
        (formFields.hierarchy || "") !== (faction.hierarchy || "") ||
        (formFields.description || "") !== (faction.description || "")
      );
    }

    if (selected.category === "rule") {
      const rule = activeItem as WorldRuleCulture;
      return (
        formName !== (rule.name || "") ||
        (formFields.type || "RULE") !== (rule.type || "RULE") ||
        (formFields.scope_stage_id || "") !== (rule.scope_stage_id || "") ||
        (formFields.scope_faction_id || "") !== (rule.scope_faction_id || "") ||
        (formFields.content || "") !== (rule.content || "") ||
        (formFields.impact || "") !== (rule.impact || "") ||
        (formFields.exceptions || "") !== (rule.exceptions || "")
      );
    }

    if (selected.category === "glossary") {
      const entry = activeItem as WorldGlossary;
      return (
        formName !== (entry.term || "") ||
        (formFields.definition || "") !== (entry.definition || "") ||
        (formFields.usage_example || "") !== (entry.usage_example || "")
      );
    }

    if (selected.category === "note") {
      const note = activeItem as WorldNote;
      return (
        formName !== (note.title || "") ||
        (formFields.content || "") !== (note.content || "")
      );
    }

    return false;
  }, [selected, activeItem, formName, formFields]);

  // Dirty check wrapper
  const executeWithDirtyCheck = useCallback((action: () => void) => {
    if (checkIsDirty()) {
      setPendingAction(() => action);
      setShowUnsavedModal(true);
    } else {
      action();
    }
  }, [checkIsDirty]);

  // Synchronize form state when active item changes
  useEffect(() => {
    if (activeItem) {
      if (selected?.category === "stage") {
        const stage = activeItem as WorldStage;
        setFormName(stage.name);
        setFormFields({
          era: stage.era || "",
          parent_id: stage.parent_id || "",
          description: stage.description || "",
          atmosphere: stage.atmosphere || "",
          technology_level: stage.technology_level || ""
        });
      } else if (selected?.category === "faction") {
        const faction = activeItem as WorldFaction;
        setFormName(faction.name);
        setFormFields({
          type: faction.type || "",
          ideology_goal: faction.ideology_goal || "",
          base_stage_id: faction.base_stage_id || "",
          scale_status: faction.scale_status || "",
          hierarchy: faction.hierarchy || "",
          description: faction.description || ""
        });
      } else if (selected?.category === "rule") {
        const rule = activeItem as WorldRuleCulture;
        setFormName(rule.name);
        setFormFields({
          type: rule.type,
          scope_stage_id: rule.scope_stage_id || "",
          scope_faction_id: rule.scope_faction_id || "",
          content: rule.content || "",
          impact: rule.impact || "",
          exceptions: rule.exceptions || ""
        });
      } else if (selected?.category === "glossary") {
        const entry = activeItem as WorldGlossary;
        setFormName(entry.term);
        setFormFields({
          definition: entry.definition || "",
          usage_example: entry.usage_example || ""
        });
      } else if (selected?.category === "note") {
        const note = activeItem as WorldNote;
        setFormName(note.title);
        setFormFields({
          content: note.content || ""
        });
      }
    } else {
      setFormName("");
      setFormFields({});
    }
  }, [activeItem, selected]);

  const toggleCategory = (cat: string) => {
    setExpanded(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleAddNewItem = async (cat: CategoryType) => {
    try {
      let created: any;
      if (cat === "stage") created = await handleCreateStage(projectId, "새 시공간 무대");
      else if (cat === "faction") created = await handleCreateFaction(projectId, "새 집단/세력");
      else if (cat === "rule") created = await handleCreateRuleCulture(projectId, "새 규칙/문화", "RULE");
      else if (cat === "glossary") created = await handleCreateGlossary(projectId, "새 용어");
      else if (cat === "note") created = await handleCreateNote(projectId, "새 자유 메모");

      if (created) {
        if (cat === "glossary") {
          setSelected({ id: "all", category: cat });
        } else {
          setSelected({ id: created.id, category: cat });
        }
        addToast("새로운 세계관 항목이 추가되었습니다.", "success");
      }
    } catch (e) {
      addToast("항목 생성에 실패했습니다.", "error");
    }
  };

  // Substage creation action
  const handleCreateSubStage = async (parentId: string) => {
    try {
      const created = await handleCreateStage(projectId, "새 하위 시공간 무대");
      if (created) {
        await handleUpdateStage(created.id, { parent_id: parentId });
        setSelected({ id: created.id, category: "stage" });
        addToast("하위 시공간 무대가 추가되었습니다.", "success");
      }
    } catch (e) {
      addToast("하위 무대 생성에 실패했습니다.", "error");
    }
  };

  const handleSave = async (): Promise<boolean> => {
    if (!selected || !activeItem || selected.id === "all") return false;
    setIsSaving(true);
    try {
      if (selected.category === "stage") {
        await handleUpdateStage(selected.id, { name: formName, ...formFields });
      } else if (selected.category === "faction") {
        await handleUpdateFaction(selected.id, { name: formName, ...formFields });
      } else if (selected.category === "rule") {
        await handleUpdateRuleCulture(selected.id, { name: formName, ...formFields });
      } else if (selected.category === "glossary") {
        await handleUpdateGlossary(selected.id, { term: formName, ...formFields });
      } else if (selected.category === "note") {
        await handleUpdateNote(selected.id, { title: formName, ...formFields });
      }
      addToast("성공적으로 저장되었습니다.", "success");
      return true;
    } catch (e) {
      addToast("저장에 실패했습니다.", "error");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsavedSaveAndMove = async () => {
    const success = await handleSave();
    if (success) {
      setShowUnsavedModal(false);
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    }
  };

  const handleUnsavedDiscardAndMove = () => {
    setShowUnsavedModal(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  const handleUnsavedCancel = () => {
    setShowUnsavedModal(false);
    setPendingAction(null);
  };

  const handleDeleteClick = () => {
    if (!selected || selected.id === "all") return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selected || selected.id === "all") return;
    const isGlossaryDelete = selected.category === "glossary";
    setShowDeleteModal(false);
    try {
      if (selected.category === "stage") await handleDeleteStage(selected.id);
      else if (selected.category === "faction") await handleDeleteFaction(selected.id);
      else if (selected.category === "rule") await handleDeleteRuleCulture(selected.id);
      else if (selected.category === "glossary") await handleDeleteGlossary(selected.id);
      else if (selected.category === "note") await handleDeleteNote(selected.id);

      if (isGlossaryDelete) {
        setSelected({ id: "all", category: "glossary" });
      } else {
        setSelected(null);
      }
      addToast("항목이 성공적으로 삭제되었습니다.", "info");
    } catch (e) {
      addToast("삭제에 실패했습니다.", "error");
    }
  };

  return (
    <div className={cn("w-full h-full flex overflow-hidden rounded-[2.5rem] border", isDarkMode ? "bg-[#09090C] border-zinc-900" : "bg-white border-zinc-200 shadow-xl")}>
      
      {/* LEFT PANEL: Category Explorer */}
      <WorldStageExplorer
        stages={stages}
        factions={factions}
        rules={rules}
        glossary={glossary}
        notes={notes}
        selected={selected}
        expanded={expanded}
        isDarkMode={isDarkMode}
        toggleCategory={toggleCategory}
        handleAddNewItem={handleAddNewItem}
        handleCreateSubStage={handleCreateSubStage}
        executeWithDirtyCheck={executeWithDirtyCheck}
        setSelected={setSelected}
      />

      {/* RIGHT PANEL: Form Editor or Table View */}
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-black/20">
        {selected && selected.id === "all" && selected.category === "glossary" ? (
          <WorldGlossaryGrid
            glossary={glossary}
            sortedGlossary={sortedGlossary}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            handleAddNewItem={handleAddNewItem}
            handleUpdateGlossary={handleUpdateGlossary}
            handleDeleteGlossaryClick={(id) => {
              setSelected({ id, category: "glossary" });
              setShowDeleteModal(true);
            }}
            executeWithDirtyCheck={executeWithDirtyCheck}
          />
        ) : activeItem && selected ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Form Header */}
            <div className="p-6 border-b dark:border-zinc-900/60 flex justify-between items-center bg-[#0C0C10]/40">
              <h2 className="text-base font-black text-white">상세 내용 설정</h2>
              <div className="flex items-center gap-3">
                {selected.category === "stage" && (
                  <button
                    onClick={() => executeWithDirtyCheck(() => handleCreateSubStage(selected.id))}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl border border-zinc-800 transition-all shadow-md"
                  >
                    <Plus size={13} />
                    하위 공간 추가
                  </button>
                )}
                <button
                  onClick={handleDeleteClick}
                  className="p-3 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="삭제하기"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow-lg transition-all"
                >
                  {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  저장하기
                </button>
              </div>
            </div>

            {/* Form Fields Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar-dark max-w-4xl">
              
              {/* Common Name field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  {selected.category === "glossary" ? "용어명" : selected.category === "note" ? "메모 제목" : "항목명"}
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50"
                  placeholder="이름을 입력하세요..."
                />
              </div>

              {/* 1. STAGES Form */}
              {selected.category === "stage" && (
                <WorldStageForm
                  stages={stages}
                  selectedId={selected.id}
                  formFields={formFields}
                  setFormFields={setFormFields}
                />
              )}

              {/* 2. FACTIONS Form */}
              {selected.category === "faction" && (
                <WorldFactionForm
                  stages={stages}
                  formFields={formFields}
                  setFormFields={setFormFields}
                />
              )}

              {/* 3. RULES & CULTURES Form */}
              {selected.category === "rule" && (
                <WorldRuleCultureForm
                  stages={stages}
                  factions={factions}
                  formFields={formFields}
                  setFormFields={setFormFields}
                />
              )}

              {/* 4. GLOSSARY Form */}
              {selected.category === "glossary" && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">용어 정의 및 해설 (Definition)</label>
                    <textarea
                      value={formFields.definition || ""}
                      onChange={e => setFormFields(prev => ({ ...prev, definition: e.target.value }))}
                      className="w-full h-40 px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 resize-none custom-scrollbar-dark"
                      placeholder="작품 고유의 전문 용어나 작중 은어에 대한 정의를 기술해 주세요."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">대사 / 지문 사용 예시 (Usage Example)</label>
                    <textarea
                      value={formFields.usage_example || ""}
                      onChange={e => setFormFields(prev => ({ ...prev, usage_example: e.target.value }))}
                      className="w-full h-28 px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 resize-none custom-scrollbar-dark"
                      placeholder="실제 대본 지문이나 인물들의 대사에서 해당 용어가 쓰이는 구체적인 예문을 적어주세요."
                    />
                  </div>
                </>
              )}

              {/* 5. NOTES Form */}
              {selected.category === "note" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">자유 메모 본문 (Content)</label>
                  <textarea
                    value={formFields.content || ""}
                    onChange={e => setFormFields(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full h-96 px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 resize-none custom-scrollbar-dark"
                    placeholder="세계관 기획을 위한 비정형적 생각이나 인스턴트 백스토리를 마크다운 텍스트 등으로 자유롭게 기입하세요."
                  />
                </div>
              )}

            </div>
          </div>
        ) : (
          /* Empty/Placeholder State */
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center opacity-30 select-none">
            <Globe size={48} className="text-zinc-500 mb-4 animate-pulse" />
            <h3 className="text-sm font-bold text-white mb-2">세계관 설정실</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              왼쪽의 카테고리에서 항목을 선택하거나, `[+]` 버튼을 눌러 시공간 무대, 집단, 규칙, 문화적 관습, 용어 또는 자유 메모를 설계하세요.
            </p>
          </div>
        )}
      </div>

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onClose={handleUnsavedCancel}
        onSaveAndMove={handleUnsavedSaveAndMove}
        onDiscardAndMove={handleUnsavedDiscardAndMove}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title={selected && selected.id !== "all" ? (selected.category === "stage" ? "시공간 무대" : selected.category === "faction" ? "세력/집단" : selected.category === "rule" ? "제도/문화" : selected.category === "glossary" ? "용어" : "자유 메모") : ""}
      />

    </div>
  );
}

// --- Unsaved Changes Modal Component ---
interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndMove: () => void;
  onDiscardAndMove: () => void;
}

function UnsavedChangesModal({ isOpen, onClose, onSaveAndMove, onDiscardAndMove }: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0D0D11] border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-amber-500">
            <ShieldAlert size={24} />
            <h3 className="text-base font-black text-white">저장되지 않은 변경사항</h3>
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">
            현재 항목에 저장되지 않은 수정 내용이 있습니다. 변경사항을 저장하고 이동하시겠습니까, 아니면 무시하고 이동하시겠습니까?
          </p>
        </div>
        <div className="px-6 py-4 bg-zinc-900/40 border-t border-[#16161c]/50 flex flex-col gap-2">
          <button
            onClick={onSaveAndMove}
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow-lg transition-all"
          >
            변경사항 저장 후 이동
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onDiscardAndMove}
              className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl transition-all border border-zinc-700"
            >
              저장하지 않고 이동
            </button>
            <button
              onClick={onClose}
              className="py-2.5 bg-transparent hover:bg-zinc-900 text-zinc-500 hover:text-zinc-400 font-bold text-xs rounded-xl transition-all"
            >
              편집 계속하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Delete Confirm Modal Component ---
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, title }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#0D0D11] border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-3 text-rose-500">
            <Trash2 size={22} />
            <h3 className="text-base font-black text-white">{title} 삭제 확인</h3>
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">
            이 세계관 항목을 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 하위 데이터가 영구적으로 삭제됩니다.
          </p>
        </div>
        <div className="px-6 py-4 bg-zinc-900/40 border-t border-[#16161c]/50 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-transparent hover:bg-zinc-900 text-zinc-500 hover:text-zinc-400 font-bold text-xs rounded-xl transition-all"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-950/20 transition-all"
          >
            삭제 완료
          </button>
        </div>
      </div>
    </div>
  );
}
