/**
 * [Architecture Point: UI Layer - Feature Component]
 * 인사이트 연구소(Insight Lab) 기능을 담당하는 메인 워크스페이스 컴포넌트입니다.
 * 필사 시 복잡한 데이터 구조(Project, Workspace)가 어떻게 시각화되는지 보십시오.
 */
import React, { useEffect } from "react";
import ProjectListView from "./ProjectListView";
import ProjectWorkspace from "./ProjectWorkspace";

interface InsightLabMainProps {
  projects: any[];
  currentProject: any | null;
  isLoadingProjects: boolean;
  fetchProjects: () => void;
  createProject: (data: any) => void;
  selectProject: (p: any) => void;
  onUpdateProject: (id: string, data: any) => Promise<any>;
  isDarkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  
  // flow props
  nodes: any[];
  setNodes: any;
  onNodesChange: any;
  edges: any[];
  setEdges: any;
  onEdgesChange: any;
  onExtract: any;
  onSynthesize: any;
  labSources: any[];
  onImportSources: (items: any[]) => void;
  onRemoveSource: (id: string) => void;
  
  // Character props
  characters: any[];
  syncCharacters: (id: string, sourceIds: string[]) => void;
  createCharacter: (data: any) => void;
  updateCharacter: (id: string, data: any) => void;
  deleteCharacter: (id: string) => void;
  handleSaveLabSession: () => Promise<boolean>;
  handleGenerateMapDraft: (projectId: string) => Promise<void>;
  isSynthesizing: boolean;
  // Event props
  events: any[];
  isGeneratingPlot: boolean;
  fetchEvents: (id: string) => void;
  createEvent: (data: any) => Promise<any>;
  updateEvent: (id: string, data: any) => Promise<any>;
  deleteEvent: (id: string) => Promise<boolean>;
  reorderEvents: (projectId: string, ids: string[]) => Promise<any>;
  generatePlotDraft: (projectId: string) => Promise<any>;
  generateLogline: (projectId: string) => Promise<any>;
  generateSynopsis: (projectId: string) => Promise<any>;
  exportProject: (projectId: string, format: string) => Promise<any>;
  isGeneratingSynopsis: boolean;
}

const InsightLabMain = (props: InsightLabMainProps) => {
  useEffect(() => {
    props.fetchProjects();
  }, [props.fetchProjects]);

  if (!props.currentProject) {
    return (
      <ProjectListView 
        projects={props.projects}
        onSelectProject={props.selectProject}
        onCreateProject={props.createProject}
        isDarkMode={props.isDarkMode}
        isLoading={props.isLoadingProjects}
      />
    );
  }

  return (
    <ProjectWorkspace 
      project={props.currentProject}
      onBack={() => props.selectProject(null)}
      isDarkMode={props.isDarkMode}
      nodes={props.nodes}
      setNodes={props.setNodes}
      onNodesChange={props.onNodesChange}
      edges={props.edges}
      setEdges={props.setEdges}
      onEdgesChange={props.onEdgesChange}
      onExtract={props.onExtract}
      onSynthesize={props.onSynthesize}
      labSources={props.labSources}
      onImportSources={props.onImportSources}
      onRemoveSource={props.onRemoveSource}
      onUpdateProject={props.onUpdateProject}
      handleSaveLabSession={props.handleSaveLabSession}
      addToast={props.addToast}
      characters={props.characters}
      syncCharacters={props.syncCharacters}
      createCharacter={props.createCharacter}
      updateCharacter={props.updateCharacter}
      deleteCharacter={props.deleteCharacter}
      handleGenerateMapDraft={props.handleGenerateMapDraft}
      isSynthesizing={props.isSynthesizing}
      events={props.events}
      isGeneratingPlot={props.isGeneratingPlot}
      fetchEvents={props.fetchEvents}
      createEvent={props.createEvent}
      updateEvent={props.updateEvent}
      deleteEvent={props.deleteEvent}
      reorderEvents={props.reorderEvents}
      generatePlotDraft={props.generatePlotDraft}
      generateLogline={props.generateLogline}
      generateSynopsis={props.generateSynopsis}
      exportProject={props.exportProject}
      isGeneratingSynopsis={props.isGeneratingSynopsis}
    />
  );
};

export default InsightLabMain;
