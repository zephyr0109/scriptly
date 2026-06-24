import { useState, useEffect, useMemo, useCallback } from "react";
import { useWorldSettings, WorldStage, WorldFaction, WorldRuleCulture, WorldGlossary, WorldNote } from "@/hooks/useWorldSettings";
import { SelectedItem, CategoryType } from "@/components/features/world/WorldStageExplorer";

interface UseWorldBuildingProps {
  projectId: string;
  addToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
}

export function useWorldBuilding({ projectId, addToast }: UseWorldBuildingProps) {
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

  return {
    stages,
    factions,
    rules,
    glossary,
    notes,
    isLoading,
    selected,
    setSelected,
    expanded,
    setExpanded,
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
  };
}
