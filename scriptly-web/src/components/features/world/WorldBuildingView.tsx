"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, Trash2, Folder, Globe, ShieldAlert, FileText, ChevronDown, ChevronRight, Save, Loader2, Compass } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorldSettings, WorldStage, WorldFaction, WorldRuleCulture, WorldGlossary, WorldNote } from "@/hooks/useWorldSettings";

interface WorldBuildingViewProps {
  projectId: string;
  isDarkMode: boolean;
  addToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
}

type CategoryType = "stage" | "faction" | "rule" | "glossary" | "note";

interface SelectedItem {
  id: string;
  category: CategoryType;
}

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
  const executeWithDirtyCheck = (action: () => void) => {
    if (checkIsDirty()) {
      setPendingAction(() => action);
      setShowUnsavedModal(true);
    } else {
      action();
    }
  };

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

  // Build recursive stage tree hierarchy
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
              <span className={cn("truncate flex-1", isSel ? "text-amber-400 font-extrabold" : "text-zinc-400")}>{stage.name}</span>
              {stage.era && <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500 font-medium shrink-0">{stage.era}</span>}
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
    <div className={cn("w-full h-full flex overflow-hidden rounded-[2.5rem] border", isDarkMode ? "bg-[#09090C] border-zinc-900" : "bg-white border-zinc-200 shadow-xl")}>
      
      {/* LEFT PANEL: Category Explorer */}
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

      {/* RIGHT PANEL: Form Editor or Table View */}
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-black/20">
        {selected && selected.id === "all" && selected.category === "glossary" ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Table Header */}
            <div className="p-6 border-b dark:border-zinc-900/60 flex justify-between items-center bg-[#0C0C10]/40">
              <div>
                <h2 className="text-base font-black text-white">용어 사전 일람표</h2>
                <p className="text-[10px] text-zinc-500 mt-1">작품에 등장하는 고유 설정이나 인물들 간의 전문 용어를 통합 관리하는 일람표입니다.</p>
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
                  <p className="text-xs text-zinc-400">등록된 용어가 없습니다.<br />우측 상단의 버튼을 눌러 첫 번째 용어를 추가해 보세요.</p>
                </div>
              ) : (
                <div className="w-full border border-zinc-800/80 rounded-2xl overflow-hidden bg-zinc-950/20">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="bg-zinc-900/40 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-800 select-none">
                        <th 
                          onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                          className="px-5 py-4 text-xs font-black w-[22%] cursor-pointer hover:bg-zinc-850/40 transition-colors group/hdr"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>용어 (Term)</span>
                            {sortDirection === 'asc' && <span className="text-[10px] text-amber-500 font-extrabold">▲</span>}
                            {sortDirection === 'desc' && <span className="text-[10px] text-amber-500 font-extrabold">▼</span>}
                            {!sortDirection && <span className="text-[10px] text-zinc-600 opacity-0 group-hover/hdr:opacity-100 transition-opacity">↕</span>}
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
                            setSelected({ id, category: "glossary" });
                            setShowDeleteModal(true);
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
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">시대 / 시점 (Era)</label>
                      <input
                        type="text"
                        value={formFields.era || ""}
                        onChange={e => setFormFields(prev => ({ ...prev, era: e.target.value }))}
                        className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50"
                        placeholder="예: 1990년대, 조선 영조기, 2030년대"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">상위 시공간 (Parent Stage)</label>
                      <select
                        value={formFields.parent_id || ""}
                        onChange={e => setFormFields(prev => ({ ...prev, parent_id: e.target.value || null }))}
                        className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                      >
                        <option value="">없음 (최상위 무대)</option>
                        {stages.filter(s => s.id !== selected.id).map(s => (
                          <option key={s.id} value={s.id}>{s.name} {s.era ? `(${s.era})` : ""}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">분위기 / 무드 (Atmosphere)</label>
                      <input
                        type="text"
                        value={formFields.atmosphere || ""}
                        onChange={e => setFormFields(prev => ({ ...prev, atmosphere: e.target.value }))}
                        className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50"
                        placeholder="예: 어둡고 습한 골목길, 화려하고 차가운 빌딩숲"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">기술 및 물리 인프라 (Tech Level)</label>
                      <input
                        type="text"
                        value={formFields.technology_level || ""}
                        onChange={e => setFormFields(prev => ({ ...prev, technology_level: e.target.value }))}
                        className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50"
                        placeholder="예: 스마트폰 상용화 시점, 사이버네틱스 도입 완료"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">공간 설명 및 역사적 의의 (Description)</label>
                    <textarea
                      value={formFields.description || ""}
                      onChange={e => setFormFields(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full h-44 px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 resize-none custom-scrollbar-dark"
                      placeholder="이 시공간적 장소에 대한 상세한 단상과 역사적 의의를 자유롭게 설명해 보세요."
                    />
                  </div>
                </>
              )}

              {/* 2. FACTIONS Form */}
              {selected.category === "faction" && (
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">세력 유형 (Type)</label>
                      <input
                        type="text"
                        value={formFields.type || ""}
                        onChange={e => setFormFields(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50"
                        placeholder="예: 사교 모임, 정당, 기업 카르텔, 비밀 단체"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">주요 거점 시공간 (Base Stage)</label>
                      <select
                        value={formFields.base_stage_id || ""}
                        onChange={e => setFormFields(prev => ({ ...prev, base_stage_id: e.target.value || null }))}
                        className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                      >
                        <option value="">없음 (특정 거점 없음)</option>
                        {stages.map(s => (
                          <option key={s.id} value={s.id}>{s.name} {s.era ? `(${s.era})` : ""}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">규모 및 위상 (Scale & Status)</label>
                      <input
                        type="text"
                        value={formFields.scale_status || ""}
                        onChange={e => setFormFields(prev => ({ ...prev, scale_status: e.target.value }))}
                        className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50"
                        placeholder="예: 전체 구성원 약 20명, 법조계 내 막강한 로비력 보유"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">조직 계급 / 직급 체계 (Hierarchy)</label>
                      <input
                        type="text"
                        value={formFields.hierarchy || ""}
                        onChange={e => setFormFields(prev => ({ ...prev, hierarchy: e.target.value }))}
                        className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50"
                        placeholder="예: 이사장 ➔ 외과 과장 ➔ 치프 레지던트 ➔ 레지던트"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">이념 및 집단 목표 (Ideology & Goal)</label>
                    <textarea
                      value={formFields.ideology_goal || ""}
                      onChange={e => setFormFields(prev => ({ ...prev, ideology_goal: e.target.value }))}
                      className="w-full h-24 px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 resize-none custom-scrollbar-dark"
                      placeholder="이 집단이 사수하거나 쟁취하고자 하는 궁극적인 이념과 신념 목표를 정의해 보세요."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">집단 상세 설명 (Description)</label>
                    <textarea
                      value={formFields.description || ""}
                      onChange={e => setFormFields(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full h-32 px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 resize-none custom-scrollbar-dark"
                      placeholder="집단에 대한 전반적인 소개 및 성향을 서술하세요."
                    />
                  </div>
                </>
              )}

              {/* 3. RULES & CULTURES Form */}
              {selected.category === "rule" && (
                <>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">분류 (Type)</label>
                      <select
                        value={formFields.type || "RULE"}
                        onChange={e => setFormFields(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                      >
                        <option value="RULE">📜 공식 제도 / 법률 (RULE)</option>
                        <option value="CULTURE">🍃 비공식 사회 관습 / 문화 (CULTURE)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">적용 시공간 무대 (Scope Stage)</label>
                      <select
                        value={formFields.scope_stage_id || ""}
                        onChange={e => setFormFields(prev => ({ ...prev, scope_stage_id: e.target.value || null }))}
                        className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                      >
                        <option value="">전역 (특정 장소 한정 없음)</option>
                        {stages.map(s => (
                          <option key={s.id} value={s.id}>{s.name} {s.era ? `(${s.era})` : ""}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">적용 대상 세력 (Scope Faction)</label>
                      <select
                        value={formFields.scope_faction_id || ""}
                        onChange={e => setFormFields(prev => ({ ...prev, scope_faction_id: e.target.value || null }))}
                        className="w-full px-5 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 appearance-none cursor-pointer"
                      >
                        <option value="">모든 인물/전체</option>
                        {factions.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">작동 규칙 및 관습 상세 내용 (Content)</label>
                    <textarea
                      value={formFields.content || ""}
                      onChange={e => setFormFields(prev => ({ ...prev, content: e.target.value }))}
                      className="w-full h-32 px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 resize-none custom-scrollbar-dark"
                      placeholder="제도나 관습이 구체적으로 어떤 방식으로 작동하며, 어떤 제약이 생기는지 서술하세요."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">사회적 / 인물 영향 (Impact)</label>
                      <textarea
                        value={formFields.impact || ""}
                        onChange={e => setFormFields(prev => ({ ...prev, impact: e.target.value }))}
                        className="w-full h-28 px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 resize-none custom-scrollbar-dark"
                        placeholder="이 룰이나 관습 때문에 캐릭터들이 겪는 내외적 딜레마나 압박을 정리해 보세요."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">예외 사항 / 설정 틈새 (Exceptions)</label>
                      <textarea
                        value={formFields.exceptions || ""}
                        onChange={e => setFormFields(prev => ({ ...prev, exceptions: e.target.value }))}
                        className="w-full h-28 px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-white outline-none focus:border-amber-500/50 resize-none custom-scrollbar-dark"
                        placeholder="이야기 전개 시 극적으로 활용될 수 있는 규칙의 허점이나 비공식 예외 규정을 기록하세요."
                      />
                    </div>
                  </div>
                </>
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

// --- Inline Editable Glossary Row Component ---
interface GlossaryRowProps {
  entry: WorldGlossary;
  onUpdate: (id: string, updates: Partial<WorldGlossary>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
}

function GlossaryRow({ entry, onUpdate, onDelete }: GlossaryRowProps) {
  const [term, setTerm] = useState(entry.term);
  const [definition, setDefinition] = useState(entry.definition || "");
  const [usageExample, setUsageExample] = useState(entry.usage_example || "");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if source array updates
  useEffect(() => {
    setTerm(entry.term);
    setDefinition(entry.definition || "");
    setUsageExample(entry.usage_example || "");
  }, [entry]);

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
