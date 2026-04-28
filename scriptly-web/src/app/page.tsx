"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Sparkles, Brain, Archive, PenTool, Search, 
  Sun, Moon, X, CheckCircle, AlertCircle, Info as InfoIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

// 컴포넌트 임포트
import CurationFeed from "@/components/features/curation/CurationFeed";
import CurationDetailPanel from "@/components/features/curation/CurationDetailPanel";
import ArchiveView from "@/components/features/archive/ArchiveView";
import ArchiveDetailPanel from "@/components/features/archive/ArchiveDetailPanel";
import InsightLabMain from "@/components/features/insight/InsightLabMain";

// 커스텀 훅 임포트
import { useCuration } from "@/hooks/useCuration";
import { useArchive } from "@/hooks/useArchive";
import { useInsightLab } from "@/hooks/useInsightLab";

export default function IntegratedPrototype() {
  const [activeTab, setActiveTab] = useState("curation");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  
  // Toast State
  const [toasts, setToasts] = useState<any[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // 1. 보관함(Archive) 상태 및 로직
  const {
    archiveItems,
    selectedArchiveIndex, setSelectedArchiveIndex,
    selectedSourceIds, setSelectedSourceIds,
    isUploading,
    fetchArchiveItems,
    handleFileUpload,
    handleUrlArchive,
    handleDownloadFile,
    handleReanalyze,
    handleDeleteArchiveItem,
    selectedArchiveItem
  } = useArchive();

  // 2. 큐레이션(Curation - 스카우터) 상태 및 로직
  const {
    searchQuery, setSearchQuery,
    newsResults, setNewsResults,
    selectedNewsIndex, setSelectedNewsIndex,
    isLoading, isLoadingMore,
    isSaving, currentStart,
    isAnalyzingDetail,
    handleSearch,
    handleAnalyzeDetail,
    handleSaveToArchive,
    selectedNews
  } = useCuration(fetchArchiveItems);

  // 3. 연구소(Insight Lab) 상태 및 로직
  const {
    labSources,
    nodes, setNodes,
    edges, setEdges,
    isSynthesizing,
    handleSendToLab,
    handleMoveToLab,
    handleSynthesizeOnDemand,
    handleExtract,
    projects,
    currentProject,
    isLoadingProjects,
    fetchProjects,
    createProject,
    selectProject,
    updateProject,
    fetchCharacters,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    syncCharacters,
    handleImportSources,
    handleRemoveLabSource,
    handleSaveLabSession,
    handleGenerateMapDraft,
    onNodesChange,
    onEdgesChange,
    characters,
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
  } = useInsightLab(isDarkMode);


  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { if (isResizingSidebar) setSidebarWidth(Math.max(200, Math.min(400, e.clientX))); };
    const handleMouseUp = () => setIsResizingSidebar(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
  }, [isResizingSidebar]);

  return (
    <div className={cn("flex h-screen overflow-hidden transition-all duration-500 font-sans antialiased", isDarkMode ? "dark bg-[#0A0A0A] text-zinc-200" : "light bg-white text-zinc-900")}>
      <aside style={{ width: `${sidebarWidth}px` }} className={cn("relative flex flex-col border-r p-8 gap-12 z-40 shadow-2xl", isDarkMode ? "border-zinc-800/50 bg-[#0A0A0A]" : "border-zinc-200 bg-white")}>
        <div className="flex items-center gap-3 px-2">
          <div className="w-12 h-12 bg-amber-500 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-amber-500/20"><PenTool size={24} className="text-black" /></div>
          <span className={cn("text-2xl font-black tracking-tighter italic", isDarkMode ? "text-white" : "text-zinc-900")}>Scriptly.</span>
        </div>
        <nav className="flex flex-col gap-2">
          {[
            { id: "curation", icon: Sparkles, label: "영감 스카우터" },
            { id: "archive", icon: Archive, label: "영감 보관함" },
            { id: "insight", icon: Brain, label: "인사이트 연구소" }
          ].map(item => (
            <div key={item.id} onClick={() => setActiveTab(item.id)} className={cn("flex items-center gap-4 px-6 py-4.5 rounded-[1.5rem] cursor-pointer transition-all active:scale-95", activeTab === item.id ? (isDarkMode ? "bg-white text-black font-bold shadow-2xl" : "bg-zinc-900 text-white font-bold shadow-lg") : (isDarkMode ? "text-zinc-500 hover:bg-zinc-900 hover:text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"))}>
              <item.icon size={20} /> <span className="text-sm font-bold">{item.label}</span>
            </div>
          ))}
        </nav>
        <div onMouseDown={() => setIsResizingSidebar(true)} className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-amber-500 transition-all z-50" />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className={cn("h-28 border-b flex items-center justify-between px-12 backdrop-blur-2xl sticky top-0 z-50", isDarkMode ? "border-zinc-800/50 bg-[#0A0A0A]/80" : "border-zinc-200 bg-white/80")}>
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchQuery, 1, () => setActiveTab("curation")); }} className={cn("flex items-center gap-5 px-8 py-4.5 rounded-[1.75rem] w-[520px] border-2 transition-all", isDarkMode ? "bg-zinc-900/50 border-zinc-800 focus-within:border-amber-500/50" : "bg-zinc-50 border-zinc-200 focus-within:bg-white focus-within:border-amber-500 focus-within:shadow-xl")}>
            <Search size={24} className="text-zinc-400" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="사건 키워드로 영감 스카우팅..." className={cn("bg-transparent border-none outline-none text-base w-full font-bold", isDarkMode ? "text-white" : "text-zinc-900")} />
          </form>
          <div className="flex items-center gap-6">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={cn("p-4 rounded-2xl border-2 transition-all shadow-sm", isDarkMode ? "bg-zinc-900 border-zinc-800 text-amber-500" : "bg-white border-zinc-200 text-zinc-900")}>
              {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-rose-500 to-rose-600 shadow-lg"></div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {activeTab === "curation" && (
            <>
              <CurationFeed 
                newsResults={newsResults}
                selectedNewsIndex={selectedNewsIndex}
                setSelectedNewsIndex={setSelectedNewsIndex}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                searchQuery={searchQuery}
                isDarkMode={isDarkMode}
                handleLoadMore={() => handleSearch(searchQuery, currentStart + 10)}
              />
              <CurationDetailPanel 
                selectedNews={selectedNews}
                isAnalyzingDetail={isAnalyzingDetail}
                handleAnalyzeDetail={() => handleAnalyzeDetail(() => addToast("심층 분석이 완료되었습니다.", "success"))}
                isSaving={isSaving}
                handleSaveToArchive={() => handleSaveToArchive(() => addToast("보관함에 저장되었습니다.", "success"), (msg) => addToast(msg, "error"))}
                isDarkMode={isDarkMode}
                setActiveTab={setActiveTab}
                onSendToLab={(item: any) => handleSendToLab(item, setActiveTab)}
              />
            </>
          )}
          {activeTab === "archive" && (
            <>
              <ArchiveView 
                archiveItems={archiveItems}
                selectedArchiveIndex={selectedArchiveIndex}
                setSelectedArchiveIndex={setSelectedArchiveIndex}
                selectedSourceIds={selectedSourceIds}
                setSelectedSourceIds={setSelectedSourceIds}
                isDarkMode={isDarkMode}
                handleDelete={(id: string) => handleDeleteArchiveItem(id, () => addToast("영감이 삭제되었습니다.", "info"))}
                handleFileUpload={(file: File) => handleFileUpload(file, () => addToast("파일이 업로드 되었습니다.", "success"), (err) => addToast(err, "error"))}
                isUploading={isUploading}
                handleSynthesize={() => handleMoveToLab(selectedSourceIds, archiveItems, setSelectedSourceIds, setActiveTab)}
                handleUrlArchive={(url: string) => handleUrlArchive(url, () => addToast("외부 링크 수집을 시작합니다.", "success"), (err) => addToast(err, "error"))}
              />
              <ArchiveDetailPanel 
                selectedItem={selectedArchiveItem}
                isDarkMode={isDarkMode}
                setActiveTab={setActiveTab}
                handleDownload={handleDownloadFile}
                handleReanalyze={(id: string) => handleReanalyze(id, () => addToast("재분석을 요청했습니다.", "info"))}
                onSendToLab={(item: any) => handleSendToLab(item, setActiveTab)}
              />
            </>
          )}
          {activeTab === "insight" && (
            <div className="flex-1 flex overflow-hidden animate-in fade-in duration-700">
                <div className="flex-1 overflow-hidden h-full flex flex-col">
                   <InsightLabMain 
                     projects={projects}
                     currentProject={currentProject}
                     isLoadingProjects={isLoadingProjects}
                     fetchProjects={fetchProjects}
                     createProject={createProject}
                     selectProject={selectProject}
                       onUpdateProject={updateProject}
                       nodes={nodes}
                       setNodes={setNodes}
                       onNodesChange={onNodesChange}
                       edges={edges}
                       setEdges={setEdges}
                       onEdgesChange={onEdgesChange}
                       onExtract={handleExtract}
                     onSynthesize={handleSynthesizeOnDemand}
                     labSources={labSources}
                     onImportSources={handleImportSources}
                     onRemoveSource={handleRemoveLabSource}
                     isDarkMode={isDarkMode}
                     addToast={addToast}
                     characters={characters}
                     syncCharacters={syncCharacters}
                     createCharacter={createCharacter}
                     updateCharacter={updateCharacter}
                     deleteCharacter={deleteCharacter}
                     handleSaveLabSession={handleSaveLabSession}
                     handleGenerateMapDraft={handleGenerateMapDraft}
                     isSynthesizing={isSynthesizing}
                     events={events}
                     isGeneratingPlot={isGeneratingPlot}
                     fetchEvents={fetchEvents}
                     createEvent={createEvent}
                     updateEvent={updateEvent}
                     deleteEvent={deleteEvent}
                     reorderEvents={reorderEvents}
                     generatePlotDraft={generatePlotDraft}
                     generateLogline={generateLogline}
                     generateSynopsis={generateSynopsis}
                     exportProject={exportProject}
                     isGeneratingSynopsis={isGeneratingSynopsis}
                   />
                </div>
            </div>
          )}
        </div>

        {/* Toast Notification Container */}
        <div className="fixed bottom-10 left-10 flex flex-col-reverse gap-3 z-[1001]">
          {toasts.map(toast => (
            <div key={toast.id} className={cn(
               "px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-left-10 duration-500",
               isDarkMode ? "bg-zinc-900 border border-zinc-800 text-white" : "bg-white border border-zinc-100 text-zinc-900 shadow-xl shadow-zinc-200"
            )}>
              {toast.type === 'success' && <CheckCircle size={18} className="text-emerald-500" />}
              {toast.type === 'error' && <AlertCircle size={18} className="text-rose-500" />}
              {toast.type === 'info' && <InfoIcon size={18} className="text-sky-500" />}
              <p className="text-sm font-bold">{toast.message}</p>
              <button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="ml-2 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
