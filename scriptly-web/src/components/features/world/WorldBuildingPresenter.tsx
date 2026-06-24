'use client';

import React from "react";
import { Trash2, Plus, Save, Loader2, Globe, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// 분리된 하위 컴포넌트들 Import
import WorldStageExplorer, { CategoryType, SelectedItem } from "./WorldStageExplorer";
import WorldStageForm from "./forms/WorldStageForm";
import WorldFactionForm from "./forms/WorldFactionForm";
import WorldRuleCultureForm from "./forms/WorldRuleCultureForm";
import WorldGlossaryGrid from "./forms/WorldGlossaryGrid";

import { useWorldBuilding } from "@/hooks/useWorldBuilding";

interface WorldBuildingPresenterProps extends ReturnType<typeof useWorldBuilding> {
  projectId: string;
  isDarkMode: boolean;
  addToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
}

export default function WorldBuildingPresenter({
  stages,
  factions,
  rules,
  glossary,
  notes,
  isLoading,
  selected,
  setSelected,
  expanded,
  formName,
  setFormName,
  formFields,
  setFormFields,
  isSaving,
  sortDirection,
  setSortDirection,
  showUnsavedModal,
  setShowUnsavedModal,
  showDeleteModal,
  setShowDeleteModal,
  activeItem,
  sortedGlossary,
  toggleCategory,
  handleAddNewItem,
  handleCreateSubStage,
  handleSave,
  handleUnsavedSaveAndMove,
  handleUnsavedDiscardAndMove,
  handleUnsavedCancel,
  handleDeleteClick,
  handleConfirmDelete,
  executeWithDirtyCheck,
  handleUpdateGlossary,
  handleDeleteGlossary,
  projectId,
  isDarkMode,
  addToast,
}: WorldBuildingPresenterProps) {
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
