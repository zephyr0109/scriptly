import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Info, Users, LayoutList, FileText, ChevronRight, 
  Sparkles, Save, Archive, Plus, Trash2, Calendar, Star, Search, Loader2,
  Settings, Database, PencilLine, Zap, CheckCircle2
} from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";
import InsightLabView from "./InsightLabView";
import ArchiveImportModal from "./ArchiveImportModal";
import CharacterBoard from "./CharacterBoard";
import PlotTimeline from "./PlotTimeline";
import SynopsisView from "./SynopsisView";

interface ProjectWorkspaceProps {
  project: any;
  onBack: () => void;
  isDarkMode: boolean;
  // Flow props
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
  onUpdateProject: (id: string, data: any) => Promise<any>;
  handleSaveLabSession: () => Promise<boolean>;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  // Character props
  characters: any[];
  syncCharacters: (id: string, sourceIds: string[]) => void;
  createCharacter: (data: any) => void;
  updateCharacter: (id: string, data: any) => void;
  deleteCharacter: (id: string) => void;
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

const ProjectWorkspace = ({ 
  project, 
  onBack, 
  isDarkMode, 
  nodes, setNodes, onNodesChange,
  edges, setEdges, onEdgesChange,
  onExtract, 
  onSynthesize,
  labSources,
  onImportSources,
  onRemoveSource,
  onUpdateProject,
  handleSaveLabSession,
  addToast,
  characters,
  syncCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  handleGenerateMapDraft,
  isSynthesizing,
  events,
  isGeneratingPlot,
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  reorderEvents,
  generatePlotDraft,
  generateLogline,
  generateSynopsis,
  exportProject,
  isGeneratingSynopsis
}: ProjectWorkspaceProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 로컬 편집 상태 관리
  const [editData, setEditData] = useState({
    title: project.title,
    format: project.format || "16부작",
    genre: project.genre || "",
    atmosphere: project.atmosphere || "",
    intended_purpose: project.intended_purpose || "",
    core_conflict: project.core_conflict || "",
    theme: project.theme || "",
    logline: project.logline || "",
    full_synopsis: project.full_synopsis || "",
    linked_sources: project.linked_sources || []
  });

  useEffect(() => {
    setEditData({
      title: project.title,
      format: project.format || "16부작",
      genre: project.genre || "",
      atmosphere: project.atmosphere || "",
      intended_purpose: project.intended_purpose || "",
      core_conflict: project.core_conflict || "",
      theme: project.theme || "",
      logline: project.logline || "",
      full_synopsis: project.full_synopsis || "",
      linked_sources: project.linked_sources || []
    });
  }, [project]);

  const handleImport = (items: any[]) => {
    const newIds = items.map((s: any) => s.id);
    const updatedIds = Array.from(new Set([...editData.linked_sources, ...newIds])) as string[];
    setEditData(prev => ({ ...prev, linked_sources: updatedIds }));
    onImportSources(items);
    addToast(`${items.length}개의 영감을 연결했습니다.`, "success");
  };

  const handleRemove = (id: string) => {
    setEditData(prev => ({
      ...prev,
      linked_sources: prev.linked_sources.filter((sid: string) => sid !== id)
    }));
    onRemoveSource(id);
    addToast("영감 연결이 해제되었습니다.", "info");
  };

  const handleSaveProject = async () => {
    setIsSaving(true);
    console.log("Starting full project save...");
    try {
      // 1. 프로젝트 기본 정보 저장
      await onUpdateProject(project.id, editData);
      
      // 2. 인사이트 랩 캔버스 상태(노드, 엣지) 저장
      const success = await handleSaveLabSession();
      if (!success) {
        console.error("Canvas persistence failed returned false");
        throw new Error("캔버스 데이터를 저장하는 중 서버 응답 오류가 발생했습니다.");
      }
      
      addToast("기획안과 워크스페이스가 저장되었습니다.", "success");
    } catch (e: any) {
      console.error("Save Project Error:", e);
      addToast(e.message || "저장에 실패했습니다.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const formats = ["단막극", "2부작", "4부작", "8부작", "12부작", "16부작", "20부작", "영화", "연극", "웹드라마"];
  
  const tabs = [
    { id: "overview", label: "Project Info", icon: <Settings size={14} /> },
    { id: "characters", label: "Character Map", icon: <Users size={14} /> },
    { id: "plot", label: "Plot & Events", icon: <LayoutList size={14} /> },
    { id: "synopsis", label: "Draft & Synopsis", icon: <FileText size={14} /> },
  ];

  const handleGenerateCoreDraft = async () => {
    if (labSources.length === 0) {
      addToast("연결된 영감이 없습니다.", "info");
      return;
    }
    
    if (!showConfirmModal) {
      setShowConfirmModal(true);
      return;
    }

    setShowConfirmModal(false);
    setIsGeneratingDraft(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/insight/synthesize-on-demand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_ids: editData.linked_sources,
          genre: editData.genre,
          tone: editData.atmosphere,
          instruction: `작품 형식: ${editData.format}, 제목: ${editData.title}에 어울리는 핵심 갈등과 주제 제안.`
        })
      });
      if (response.ok) {
        const result = await response.json();
        setEditData(prev => ({ 
          ...prev, 
          intended_purpose: result.intended_purpose || prev.intended_purpose,
          core_conflict: result.core_conflict || prev.core_conflict, 
          theme: result.theme || prev.theme 
        }));
        addToast("기획 초안이 생성되었습니다.", "success");
      }
    } catch (e) { addToast("AI 생성 실패", "error"); }
    finally { setIsGeneratingDraft(false); }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* Header */}
      <header className={cn(
        "h-20 border-b flex items-center justify-between px-10 shrink-0 z-40",
        isDarkMode ? "bg-zinc-950/40 border-zinc-900 shadow-2xl" : "bg-white border-zinc-100 shadow-sm"
      )}>
        <div className="flex items-center gap-6">
           <button onClick={onBack} className="p-3 rounded-2xl hover:bg-zinc-800/10 transition-all text-zinc-500">
             <ArrowLeft size={18} />
           </button>
           <div className="flex flex-col">
              <h2 className={cn("text-lg font-black tracking-tight", isDarkMode ? "text-white" : "text-zinc-900")}>{editData.title}</h2>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{editData.format} — {editData.genre || "N/A"}</p>
           </div>
        </div>

        <nav className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900/60 p-1.5 rounded-[1.5rem]">
           {tabs.map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={cn(
                 "flex items-center gap-2.5 px-6 py-3 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all focus:outline-none",
                 activeTab === tab.id 
                   ? (isDarkMode ? "bg-white text-black shadow-2xl scale-105" : "bg-zinc-900 text-white shadow-xl scale-105") 
                   : "text-zinc-500 hover:text-indigo-500 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50"
               )}
             >
               {tab.icon} {tab.label}
             </button>
           ))}
        </nav>

        <button 
          onClick={handleSaveProject}
          disabled={isSaving}
          className={cn(
            "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl active:scale-95",
            isDarkMode ? "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/10" : "bg-zinc-900 text-white hover:bg-zinc-800",
            isSaving && "opacity-50"
          )}
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
          {isSaving ? "Saving..." : "Project Save"}
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
         {/* Left Body (Tab Dependent) */}
         {/* Left Body (Tab Dependent) */}
         <div className="flex-1 overflow-hidden min-h-0 h-full flex flex-col">
            {activeTab === "overview" && (
              <main className={cn("flex-1 overflow-y-auto p-12 space-y-16 animate-in fade-in duration-500", isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar-light")}>
                 <div className="max-w-4xl grid grid-cols-1 gap-12">
                    <section className="space-y-6">
                       <h4 className="flex items-center gap-2 text-[10px] font-black text-sky-500 uppercase tracking-[0.2em]"><Database size={14}/> Meta Information</h4>
                       <div className={cn("p-10 rounded-[3rem] border grid grid-cols-2 gap-8", isDarkMode ? "bg-zinc-900/20 border-zinc-800" : "bg-zinc-50 border-zinc-100")}>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">작품 제목</label>
                             <input className="w-full bg-transparent text-lg font-black outline-none border-b-2 border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 transition-colors py-1 focus:outline-none" value={editData.title} onChange={e => setEditData({...editData, title: e.target.value})} />
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">작품 형식</label>
                             <select className="w-full bg-transparent text-lg font-black outline-none border-b-2 border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 py-1 appearance-none cursor-pointer focus:outline-none" value={editData.format} onChange={e => setEditData({...editData, format: e.target.value})}>
                                {formats.map(f => <option key={f} value={f} className="text-black">{f}</option>)}
                             </select>
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">주요 장르</label>
                             <input className="w-full bg-transparent text-lg font-black outline-none border-b-2 border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 py-1 focus:outline-none" value={editData.genre} placeholder="예: 스릴러, 휴먼" onChange={e => setEditData({...editData, genre: e.target.value})} />
                          </div>
                          <div className="space-y-4">
                             <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">분위기/톤</label>
                             <input className="w-full bg-transparent text-lg font-black outline-none border-b-2 border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 py-1 focus:outline-none" value={editData.atmosphere} placeholder="분위기를 입력하세요" onChange={e => setEditData({...editData, atmosphere: e.target.value})} />
                          </div>
                       </div>
                    </section>
                    <section className="space-y-6">
                       <div className="flex justify-between items-center">
                          <h4 className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]"><Zap size={14}/> Core Direction</h4>
                          <button 
                            onClick={handleGenerateCoreDraft} 
                            disabled={isGeneratingDraft} 
                            className={cn(
                              "flex items-center gap-3 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95",
                              isDarkMode ? "bg-zinc-900 text-indigo-400 border border-indigo-500/30 hover:bg-zinc-800" : "bg-white text-indigo-600 border border-indigo-100 hover:bg-zinc-50"
                            )}
                          >
                             {isGeneratingDraft ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
                             AI Support
                          </button>
                       </div>
                       <div className={cn("p-10 rounded-[3rem] border space-y-10", isDarkMode ? "bg-zinc-900/20 border-zinc-800" : "bg-zinc-50 border-zinc-100")}>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-indigo-400 uppercase ml-1 focus:outline-none">기획의도</label>
                             <textarea className="w-full bg-transparent text-base font-bold outline-none resize-none min-h-[120px] leading-relaxed" placeholder="작가가 이 이야기를 왜 하려고 하는가? 작품의 기획 및 집필 의도를 서술하세요." value={editData.intended_purpose} onChange={e => setEditData({...editData, intended_purpose: e.target.value})} />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-rose-400 uppercase ml-1 focus:outline-none">핵심 갈등</label>
                             <textarea className="w-full bg-transparent text-base font-bold outline-none resize-none min-h-[120px] leading-relaxed" placeholder="이 이야기의 주인공이 해결해야 할 가장 큰 벽" value={editData.core_conflict} onChange={e => setEditData({...editData, core_conflict: e.target.value})} />
                          </div>
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-amber-500 uppercase ml-1">주제 및 인사이트</label>
                             <textarea className="w-full bg-transparent text-base font-bold outline-none resize-none min-h-[120px] leading-relaxed" placeholder="독자에게 전달하려는 핵심 메시지" value={editData.theme} onChange={e => setEditData({...editData, theme: e.target.value})} />
                          </div>
                       </div>
                    </section>
                 </div>
              </main>
            )}

            {activeTab === "characters" && (
              <CharacterBoard 
                characters={characters}
                syncCharacters={syncCharacters}
                createCharacter={createCharacter}
                updateCharacter={updateCharacter}
                deleteCharacter={deleteCharacter}
                project={project}
                isDarkMode={isDarkMode}
                nodes={nodes}
                setNodes={setNodes}
                onNodesChange={onNodesChange}
                edges={edges}
                setEdges={setEdges}
                onEdgesChange={onEdgesChange}
                handleGenerateMapDraft={handleGenerateMapDraft}
                linkedSources={editData.linked_sources}
                addToast={addToast}
              />
            )}

            {activeTab === "plot" && (
              <PlotTimeline 
                projectId={project.id}
                events={events}
                characters={characters}
                isGenerating={isGeneratingPlot}
                onCreateEvent={createEvent}
                onUpdateEvent={updateEvent}
                onDeleteEvent={deleteEvent}
                onReorder={reorderEvents}
                onGenerateDraft={generatePlotDraft}
                isDarkMode={isDarkMode}
                addToast={addToast}
                labSources={labSources}
              />
            )}

            {activeTab === "synopsis" && (
              <SynopsisView 
                project={project}
                characters={characters}
                isGenerating={isGeneratingSynopsis}
                isDarkMode={isDarkMode}
                editData={editData}
                setEditData={setEditData}
                onUpdateProject={onUpdateProject}
                onGenerateLogline={generateLogline}
                onGenerateSynopsis={generateSynopsis}
                onExport={exportProject}
                addToast={addToast}
              />
            )}
         </div>

         {/* Fixed Right Sidebar: Inspirations (Across all tabs unless specified) */}
         <aside className={cn("w-80 border-l flex flex-col z-10 shrink-0", isDarkMode ? "bg-[#0A0A0A] border-zinc-900" : "bg-zinc-50 border-zinc-100 shadow-xl")}>
            <div className="p-8 border-b dark:border-zinc-800 flex justify-between items-center">
               <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-500">Linked Archive</h3>
               <button onClick={() => setIsImportModalOpen(true)} className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:scale-110 shadow-lg transition-all shadow-indigo-600/20">
                  <Plus size={16} />
               </button>
            </div>
            <div className={cn("flex-1 overflow-y-auto p-5 space-y-4", isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar-light")}>
               {labSources.length === 0 ? (
                 <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                    <Archive size={32} />
                    <p className="text-[10px] font-black tracking-widest uppercase">No materials linked</p>
                 </div>
               ) : (
                 labSources.map(s => (
                   <div key={s.id} className={cn("p-4 rounded-3xl border flex items-center justify-between group transition-all cursor-default", isDarkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-100 shadow-sm hover:shadow-md")}>
                      <div className="flex items-center gap-3 min-w-0">
                         <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                            <FileText size={14} />
                         </div>
                         <div className="min-w-0">
                            <h5 className={cn("text-[11px] font-black truncate", isDarkMode ? "text-zinc-200" : "text-zinc-900")}>{s.title}</h5>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase">{s.type}</p>
                         </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleRemove(s.id); }} className="p-1.5 text-zinc-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                         <Trash2 size={12} />
                      </button>
                   </div>
                 ))
               )}
            </div>
            <div className="p-6 border-t dark:border-zinc-800 text-center space-y-2 opacity-30">
               <CheckCircle2 size={18} className="mx-auto text-indigo-500" />
               <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tight leading-relaxed">AI analyzes and suggests writing<br/>settings based on your data.</p>
            </div>
         </aside>
      </div>

      <ArchiveImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
        onImport={handleImport} 
        isDarkMode={isDarkMode} 
        existingSourceIds={editData.linked_sources}
      />

      {/* AI 생성 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className={cn(
             "w-[420px] rounded-2xl border p-8 space-y-6 relative shadow-2xl",
             isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
           )}>
              <div className="flex flex-col items-center text-center space-y-4">
                 <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <Sparkles size={32} />
                 </div>
                 <h2 className="text-xl font-black">AI 기획 초안을 생성하시겠습니까?</h2>
                 <p className="text-sm text-zinc-500 leading-relaxed">
                    기존의 <strong>기획의도, 핵심 갈등, 주제</strong>가 AI가 제안하는 내용으로 대체될 수 있습니다. 계속하시겠습니까?
                 </p>
              </div>
              <div className="flex gap-3 pt-2">
                 <button 
                   onClick={() => setShowConfirmModal(false)}
                   className={cn("flex-1 py-3 rounded-xl text-xs font-bold transition-all", isDarkMode ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600")}
                 >
                    취소
                 </button>
                 <button 
                   onClick={handleGenerateCoreDraft}
                   className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/20 transition-all"
                 >
                    네, 생성하겠습니다
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ProjectWorkspace;
