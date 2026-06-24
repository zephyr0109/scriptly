"use client";

import React from "react";
import { FolderPlus, Plus } from "lucide-react";

// 집필 및 기획 관리 탭 서브 컴포넌트들 Import
import ProjectInfo from "@/components/features/insight/ProjectInfo";
import CharacterMapDualView from "@/components/features/insight/CharacterMapDualView";
import PlotTimeline from "@/components/features/insight/PlotTimeline";
import SynopsisWorkspaceView from "@/components/features/insight/SynopsisWorkspaceView";
import ScriptEditor from "@/components/features/editor/ScriptEditor";
import WorldBuildingView from "@/components/features/world/WorldBuildingView";

interface WorkspaceContainerProps {
  /** 현재 활성 프로젝트 ID */
  selectedProjectId: string | null;
  /** 현재 활성 프로젝트 상세 데이터 */
  currentProject: any;
  /** 워크스페이스 활성 탭 */
  activeWorkspaceTab: string;
  /** 다크 모드 여부 */
  isDarkMode: boolean;
  
  // 글로벌 모달 제어
  setModalOpen: (modalName: any, isOpen: boolean) => void;
  
  // 토스트
  addToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;

  // ProjectInfo 탭 용 상태 및 핸들러
  editProjectTitle: string;
  setEditProjectTitle: (val: string) => void;
  editProjectGenre: string;
  setEditProjectGenre: (val: string) => void;
  formatSelectMode: string;
  setFormatSelectMode: (val: string) => void;
  customFormat: string;
  setCustomFormat: (val: string) => void;
  editProjectAtmosphere: string;
  setEditProjectAtmosphere: (val: string) => void;
  editProjectIntendedPurpose: string;
  setEditProjectIntendedPurpose: (val: string) => void;
  editProjectCoreConflict: string;
  setEditProjectCoreConflict: (val: string) => void;
  editProjectTheme: string;
  setEditProjectTheme: (val: string) => void;
  editProjectLogline: string;
  setEditProjectLogline: (val: string) => void;
  handleSaveProjectInfo: () => Promise<void>;

  // 캐릭터 탭 용 상태 및 핸들러
  characters: any[];
  handleOpenCharacterAdd: () => void;
  handleOpenCharacterEdit: (char: any) => void;
  syncCharacters: (projectId: string, sourceIds: string[]) => Promise<any>;
  deleteCharacter: (id: string) => Promise<boolean>;
  handleGenerateMapDraft: (projectId: string) => Promise<void>;
  nodes: any[];
  setNodes: React.Dispatch<React.SetStateAction<any[]>>;
  onNodesChange: any;
  edges: any[];
  setEdges: React.Dispatch<React.SetStateAction<any[]>>;
  onEdgesChange: any;
  handleSaveLabSession: () => Promise<boolean>;

  // 플롯 타임라인 탭 용 상태 및 핸들러
  events: any[];
  isGeneratingPlot: boolean;
  handleOpenEventAdd: () => void;
  handleOpenEventEdit: (evt: any) => void;
  deleteEvent: (id: string) => Promise<boolean>;
  reorderEvents: (projectId: string, ids: string[]) => Promise<any>;
  generatePlotDraft: (projectId: string) => Promise<any>;

  // 초안 및 시놉시스 탭 용 상태 및 핸들러
  editProjectFullSynopsis: string;
  setEditProjectFullSynopsis: (val: string) => void;
  isGeneratingSynopsis: boolean;
  handleGenerateLogline: () => Promise<void>;
  handleGenerateSynopsis: () => Promise<void>;
  handleSaveSynopsis: () => Promise<void>;
  handleExportDocument: (format: "word" | "pdf") => Promise<void>;

  // 대본 작성기 탭 용 상태 및 핸들러
  scripts: any[];
  currentScript: any;
  setCurrentScript: (script: any) => void;
  createScript: (projectId: string, title: string, episodeNumber: number) => Promise<any>;
  updateScript: (id: string, updates: any) => Promise<any>;
  deleteScript: (id: string) => Promise<boolean>;
  isLoadingScripts: boolean;
}

/**
 * WorkspaceContainer 컴포넌트
 * 드라마 프로젝트 활성화 여부에 따른 Empty State 렌더링 및
 * 6개의 기획/집필 상세 탭의 화면 전환 오케스트레이션을 담당합니다.
 */
export default function WorkspaceContainer({
  selectedProjectId,
  currentProject,
  activeWorkspaceTab,
  isDarkMode,
  setModalOpen,
  addToast,
  
  // ProjectInfo
  editProjectTitle,
  setEditProjectTitle,
  editProjectGenre,
  setEditProjectGenre,
  formatSelectMode,
  setFormatSelectMode,
  customFormat,
  setCustomFormat,
  editProjectAtmosphere,
  setEditProjectAtmosphere,
  editProjectIntendedPurpose,
  setEditProjectIntendedPurpose,
  editProjectCoreConflict,
  setEditProjectCoreConflict,
  editProjectTheme,
  setEditProjectTheme,
  editProjectLogline,
  setEditProjectLogline,
  handleSaveProjectInfo,

  // Characters
  characters,
  handleOpenCharacterAdd,
  handleOpenCharacterEdit,
  syncCharacters,
  deleteCharacter,
  handleGenerateMapDraft,
  nodes,
  setNodes,
  onNodesChange,
  edges,
  setEdges,
  onEdgesChange,
  handleSaveLabSession,

  // Plot Timeline
  events,
  isGeneratingPlot,
  handleOpenEventAdd,
  handleOpenEventEdit,
  deleteEvent,
  reorderEvents,
  generatePlotDraft,

  // Synopsis
  editProjectFullSynopsis,
  setEditProjectFullSynopsis,
  isGeneratingSynopsis,
  handleGenerateLogline,
  handleGenerateSynopsis,
  handleSaveSynopsis,
  handleExportDocument,

  // Scripts Editor
  scripts,
  currentScript,
  setCurrentScript,
  createScript,
  updateScript,
  deleteScript,
  isLoadingScripts,
}: WorkspaceContainerProps) {
  
  // 활성 프로젝트가 없을 시 가이드 화면 렌더링
  if (!selectedProjectId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#0D0D12] text-center border-l border-zinc-900/60">
        <div className="relative mb-6 p-6 rounded-3xl bg-zinc-950 border border-zinc-800/80 shadow-2xl flex items-center justify-center">
          <div className="absolute inset-0 bg-purple-500/5 rounded-3xl blur-xl" />
          <FolderPlus className="w-16 h-16 text-purple-400 relative z-10 animate-pulse" />
        </div>
        <h2 className="text-xl font-black text-white mb-2">진행 중인 극작 프로젝트가 없습니다</h2>
        <p className="text-sm text-zinc-500 max-w-md mb-8 leading-relaxed">
          새로운 이야기의 첫발을 떼어보세요. 프로젝트를 생성하시면 시놉시스 기획, 인물 관계도 매핑, 대본 집필 등의 다양한 창작 도구들을 즉시 사용할 수 있습니다.
        </p>
        <button
          onClick={() => setModalOpen("project", true)}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus size={16} />
          새 극작 프로젝트 시작하기
        </button>
      </div>
    );
  }

  return (
    <>
      {activeWorkspaceTab === "info" && (
        <ProjectInfo
          currentProject={currentProject}
          editProjectTitle={editProjectTitle}
          setEditProjectTitle={setEditProjectTitle}
          editProjectGenre={editProjectGenre}
          setEditProjectGenre={setEditProjectGenre}
          formatSelectMode={formatSelectMode}
          setFormatSelectMode={setFormatSelectMode}
          customFormat={customFormat}
          setCustomFormat={setCustomFormat}
          editProjectAtmosphere={editProjectAtmosphere}
          setEditProjectAtmosphere={setEditProjectAtmosphere}
          editProjectIntendedPurpose={editProjectIntendedPurpose}
          setEditProjectIntendedPurpose={setEditProjectIntendedPurpose}
          editProjectCoreConflict={editProjectCoreConflict}
          setEditProjectCoreConflict={setEditProjectCoreConflict}
          editProjectTheme={editProjectTheme}
          setEditProjectTheme={setEditProjectTheme}
          editProjectLogline={editProjectLogline}
          setEditProjectLogline={setEditProjectLogline}
          handleSaveProjectInfo={handleSaveProjectInfo}
          addToast={addToast}
        />
      )}

      {activeWorkspaceTab === "characters" && (
        <CharacterMapDualView 
          characters={characters} 
          handleOpenCharacterAdd={handleOpenCharacterAdd} 
          handleOpenCharacterEdit={handleOpenCharacterEdit} 
          syncCharacters={syncCharacters}
          deleteCharacter={deleteCharacter}
          handleGenerateMapDraft={handleGenerateMapDraft}
          project={currentProject}
          isDarkMode={isDarkMode}
          nodes={nodes}
          setNodes={setNodes}
          onNodesChange={onNodesChange}
          edges={edges}
          setEdges={setEdges}
          onEdgesChange={onEdgesChange}
          handleSaveLabSession={handleSaveLabSession}
          addToast={addToast}
        />
      )}

      {activeWorkspaceTab === "plot" && (
        <PlotTimeline 
          events={events}
          projectId={selectedProjectId}
          characters={characters}
          isGenerating={isGeneratingPlot}
          handleOpenEventAdd={handleOpenEventAdd}
          handleOpenEventEdit={handleOpenEventEdit}
          onDeleteEvent={deleteEvent}
          onReorder={reorderEvents}
          onGenerateDraft={generatePlotDraft}
          addToast={addToast}
        />
      )}

      {activeWorkspaceTab === "draft" && (
        <SynopsisWorkspaceView
          currentProject={currentProject}
          characters={characters}
          editProjectLogline={editProjectLogline}
          setEditProjectLogline={setEditProjectLogline}
          editProjectFullSynopsis={editProjectFullSynopsis}
          setEditProjectFullSynopsis={setEditProjectFullSynopsis}
          isGeneratingSynopsis={isGeneratingSynopsis}
          handleGenerateLogline={handleGenerateLogline}
          handleGenerateSynopsis={handleGenerateSynopsis}
          handleSaveSynopsis={handleSaveSynopsis}
          handleExportDocument={handleExportDocument}
        />
      )}

      {activeWorkspaceTab === "editor" && (
        <ScriptEditor 
          projectId={selectedProjectId}
          scripts={scripts}
          currentScript={currentScript}
          setCurrentScript={setCurrentScript}
          createScript={createScript}
          updateScript={updateScript}
          deleteScript={deleteScript}
          isLoading={isLoadingScripts}
          addToast={addToast} 
        />
      )}

      {activeWorkspaceTab === "world" && (
        <WorldBuildingView 
          projectId={selectedProjectId}
          isDarkMode={isDarkMode}
          addToast={addToast}
        />
      )}
    </>
  );
}
