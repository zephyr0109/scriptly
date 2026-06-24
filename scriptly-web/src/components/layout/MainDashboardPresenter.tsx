'use client';

import React from "react";
import { PenTool, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

// 레이아웃 컴포넌트 임포트
import ActivityBar from "@/components/layout/ActivityBar";
import SidebarPanel from "@/components/layout/SidebarPanel";
import WorkspaceContainer from "@/components/layout/WorkspaceContainer";
import RightInsightPanel from "@/components/layout/RightInsightPanel";
import ScouterGrid from "@/components/features/curation/ScouterGrid";
import ArchiveFilterGrid from "@/components/features/archive/ArchiveFilterGrid";

// 글로벌 모달 및 공통 컴포넌트 임포트
import CollectModal from "@/components/features/modals/CollectModal";
import ProjectCreateModal from "@/components/features/modals/ProjectCreateModal";
import LinkArchiveModal from "@/components/features/modals/LinkArchiveModal";
import CharacterModal from "@/components/features/modals/CharacterModal";
import LinkInspirationProjectModal from "@/components/features/modals/LinkInspirationProjectModal";
import PlotEventModal from "@/components/features/modals/PlotEventModal";
import ToastContainer from "@/components/layout/ToastContainer";

import { useMainDashboard } from "@/hooks/useMainDashboard";

type MainDashboardPresenterProps = ReturnType<typeof useMainDashboard>;

export default function MainDashboardPresenter({
  isMounted,
  hasHydrated,
  isAuthenticated,
  isDarkMode,
  setDarkMode,
  router,
  user,
  logout,
  activeActivity,
  setActivity,
  inspirationSubTab,
  setInspirationSubTab,
  activeWorkspaceTab,
  setWorkspaceTab,
  isRightPanelOpen,
  toggleRightPanel,
  setRightPanelOpen,
  sidebarWidth,
  setSidebarWidth,
  selectedProjectId,
  selectProject,
  selectedInspirationId,
  selectInspiration,
  selectedArchiveId,
  selectArchive,
  isCollectModalOpen,
  isProjectModalOpen,
  isLinkArchiveModalOpen,
  isCharacterModalOpen,
  isPlotEventModalOpen,
  setModalOpen,
  
  // 캐릭터 폼 상태
  activeCharacterId,
  charName,
  charRole,
  charDesc,
  charDesire,
  charColor,
  charAge,
  charGender,
  charOccupation,
  charIsLocked,
  setCharacterForm,
  resetCharacterForm,

  // 플롯 사건 폼 상태
  activePlotEventId,
  plotEventTitle,
  plotEventTimeHint,
  plotEventContent,
  plotEventCharacterIds,
  setPlotEventForm,
  resetPlotEventForm,

  // 아카이브 데이터
  archiveItems,
  selectedArchiveIndex,
  setSelectedArchiveIndex,
  isUploading,
  fetchArchiveItems,
  handleFileUpload,
  handleUrlArchive,
  handleCreateNote,
  handleUpdateNote,
  handleReanalyze,
  handleDeleteArchiveItem,
  localFolders,
  handleCreateLocalFolder,
  handleMoveToFolder,
  handleRenameFolder,
  handleDeleteFolder,

  // 큐레이션 기사 검색
  searchQuery,
  setSearchQuery,
  newsResults,
  setSelectedNewsIndex,
  isLoading,
  isLoadingMore,
  isSaving,
  currentStart,
  isAnalyzingDetail,
  handleSearch,
  handleAnalyzeDetail,
  handleSaveToArchive,
  selectedNews,

  // 연구소
  projects,
  setProjects,
  currentProject,
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  characters,
  events,
  isGeneratingPlot,
  createEvent,
  updateEvent,
  deleteEvent,
  reorderEvents,
  generatePlotDraft,
  generateLogline,
  generateSynopsis,
  isGeneratingSynopsis,
  
  // 대본 작성기
  scripts,
  currentScript,
  setCurrentScript,
  isLoadingScripts,
  fetchScripts,
  createScript,
  updateScript,
  deleteScript,

  // React Flow 캔버스
  nodes,
  setNodes,
  edges,
  setEdges,
  onNodesChange,
  onEdgesChange,
  syncCharacters,
  handleGenerateMapDraft,
  handleSaveLabSession,

  // 토스트 및 리사이즈
  toasts,
  setToasts,
  addToast,
  isResizingSidebar,
  setIsResizingSidebar,
  projectLinkedInspirations,
  setProjectLinkedInspirationsWrapper,
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
  editProjectFullSynopsis,
  setEditProjectFullSynopsis,

  // 추가 모달 제어 상태
  isProjectManageModalOpen,
  setIsProjectManageModalOpen,
  isLinkInspirationProjectModalOpen,
  setIsLinkInspirationProjectModalOpen,
  activeInspirationForLink,
  handleOpenLinkInspirationProjectModal,
  handleSaveInspirationProjectLinks,

  // 극작 메모 수정용 로컬 상태
  isEditModalOpen,
  setIsEditModalOpen,
  editingNote,
  setEditingNote,
  editTitle,
  setEditTitle,
  editContent,
  setEditContent,

  // 캐릭터 및 이벤트 모달 트리거
  handleOpenCharacterAdd,
  handleOpenCharacterEdit,
  handleSaveCharacter,
  handleOpenEventAdd,
  handleOpenEventEdit,
  handleSaveEvent,

  // 추가된 누락 함수들
  handleSaveProjectInfo,
  handleSaveSynopsis,
  handleGenerateLogline,
  handleGenerateSynopsis,
  handleExportDocument,
  handleToggleLinkInspiration,
  setActiveInspirationForLink,

  // 데이터 가공 맵 & 메모 목록
  analyzedProjectsMap,
  currentInspiration,
  linkedReferenceItems,
  handleTriggerQuickAnalysis,
  recentQueries,
  addToRecentQueries,
  archiveFilter,
  setArchiveFilter,
  archiveSort,
  setArchiveSort,
}: MainDashboardPresenterProps) {
  
  if (!isMounted || !hasHydrated || !isAuthenticated) {
    return (
      <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-[#0D0D11]">
        <div className="absolute inset-0 opacity-10 blur-[100px] pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-amber-500 rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600 rounded-full" />
        </div>

        <div className="flex flex-col items-center gap-4 z-10 select-none animate-in fade-in duration-500">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-xl shadow-amber-500/10 border border-amber-500/20 animate-pulse">
            <PenTool size={28} className="text-white" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-[#E4E4ED] font-black text-sm tracking-wider uppercase">Scriptly</h1>
            <p className="text-zinc-500 text-[10px] font-bold tracking-tight">드라마 집필 보조 에이전트 시스템</p>
          </div>
          <div className="flex items-center gap-1.5 mt-2 bg-zinc-900/60 border border-zinc-800/80 px-3 py-1.5 rounded-full">
            <Loader2 size={12} className="animate-spin text-amber-500" />
            <span className="text-zinc-400 text-[9px] font-black tracking-tight">인증 상태를 확인하고 있습니다...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex h-screen w-screen overflow-hidden font-sans transition-all duration-300 antialiased selection:bg-amber-500/30 selection:text-amber-200 relative", 
      isDarkMode ? "dark bg-[#0D0D11] text-[#E4E4ED]" : "bg-[#F8F9FC] text-[#1E202B]"
    )}>
      
      {/* 1. Activity Bar (맨 왼쪽) */}
      <ActivityBar
        activeActivity={activeActivity}
        setActivity={setActivity}
        isDarkMode={isDarkMode}
        setDarkMode={setDarkMode}
        user={user}
        logout={logout}
        router={router}
      />

      {/* 2. Explorer Sidebar (사이드바) */}
      <SidebarPanel
        activeActivity={activeActivity}
        inspirationSubTab={inspirationSubTab}
        setInspirationSubTab={setInspirationSubTab}
        activeWorkspaceTab={activeWorkspaceTab}
        setWorkspaceTab={setWorkspaceTab}
        projects={projects}
        selectedProjectId={selectedProjectId}
        selectProject={selectProject}
        setModalOpen={setModalOpen}
        setIsProjectManageModalOpen={setIsProjectManageModalOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        recentQueries={recentQueries}
        addToRecentQueries={addToRecentQueries}
        archiveFilter={archiveFilter}
        setArchiveFilter={setArchiveFilter}
        archiveSort={archiveSort}
        setArchiveSort={setArchiveSort}
        isResizingSidebar={isResizingSidebar}
        setIsResizingSidebar={setIsResizingSidebar}
        sidebarWidth={sidebarWidth}
        isDarkMode={isDarkMode}
        addToast={addToast}
        fetchProjects={fetchProjects}
      />

      {/* 3. Main Workspace (메인 캔버스 영역) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* 상단 통합 헤더 */}
        <header className={cn(
          "h-16 border-b flex items-center justify-between px-8 z-40 shrink-0",
          isDarkMode ? "bg-[#0D0D11] border-zinc-800/80" : "bg-white border-zinc-200"
        )}>
          <div className="flex items-center gap-2.5 text-xs font-medium">
            {activeActivity === "inspiration" ? (
              <>
                <span className="font-bold">영감 기획실</span>
                <span className="text-zinc-600">/</span>
                <span className={cn("font-extrabold uppercase tracking-wide", isDarkMode ? "text-zinc-300" : "text-zinc-800")}>
                  {inspirationSubTab === "search" ? "영감 검색 (스카우터)" : "영감 보관함"}
                </span>
              </>
            ) : (
              <>
                <span className="font-bold">{currentProject?.title || "드라마 프로젝트"}</span>
                <span className="text-zinc-600">/</span>
                <span className={cn("font-extrabold uppercase tracking-wide", isDarkMode ? "text-zinc-300" : "text-zinc-800")}>
                  {activeWorkspaceTab === "info" && "프로젝트 정보"}
                  {activeWorkspaceTab === "characters" && "캐릭터 관계도"}
                  {activeWorkspaceTab === "plot" && "플롯 타임라인"}
                  {activeWorkspaceTab === "draft" && "AI 초안 & 시놉시스"}
                  {activeWorkspaceTab === "editor" && "대본 작성기 (Markdown)"}
                  {activeWorkspaceTab === "world" && "세계관 설정"}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => toggleRightPanel()}
              className={cn(
                "p-2 rounded-lg border transition-all",
                isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white" : "bg-white border-zinc-200 text-zinc-600 hover:text-zinc-955"
              )}
              title="우측 참고 분할 뷰 토글"
            >
              {isRightPanelOpen ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </header>

        {/* 중앙 워크스페이스 컨텐츠 영역 */}
        <div className="flex-1 flex overflow-hidden">
          
          {activeActivity === "inspiration" && (
            <div className="flex-1 flex overflow-hidden animate-in fade-in duration-300">
              
              {/* 1. 영감 검색 (Scouter) 메인 화면 */}
              {inspirationSubTab === "search" && (
                <div className="flex-grow flex flex-col min-w-0 overflow-hidden">
                  <ScouterGrid 
                    isLoading={isLoading} 
                    isLoadingMore={isLoadingMore}
                    activeInspirations={newsResults.map(item => ({
                      id: item.id,
                      title: item.article?.title || item.title || "기사 제목",
                      desc: item.article?.description || item.content || "기사 요약 내용",
                      keyword: item.article?.keyword || item.main_keyword || "시사속보",
                      source: item.article?.link?.includes("google.com") ? "구글 뉴스" : "네이버 뉴스",
                      date: item.article?.pubDate || ""
                    }))} 
                    selectInspiration={(id) => {
                      selectInspiration(id);
                    }}
                    searchQuery={searchQuery}
                    handleLoadMore={() => handleSearch(searchQuery, currentStart + 10)}
                  />
                </div>
              )}

              {/* 2. 수집된 영감 보관함 메인 화면 */}
              {inspirationSubTab === "archive" && (
                <div className="flex-grow flex flex-col min-w-0 overflow-hidden">
                  <ArchiveFilterGrid 
                    rawArchiveItems={archiveItems}
                    localFolders={localFolders}
                    handleCreateLocalFolder={handleCreateLocalFolder}
                    handleMoveToFolder={handleMoveToFolder}
                    handleRenameFolder={handleRenameFolder}
                    handleDeleteFolder={handleDeleteFolder}
                    addToast={addToast}
                    selectArchive={(id) => {
                      selectArchive(id);
                    }}
                    onEditClick={(item) => {
                      const originalItem = archiveItems.find(a => a.id === item.id);
                      if (originalItem) {
                        setEditingNote(originalItem);
                        setEditTitle(originalItem.title);
                        setEditContent(originalItem.content);
                        setIsEditModalOpen(true);
                      }
                    }}
                    onDeleteClick={async (id) => {
                      if (confirm("정말 이 영감 자산을 삭제하시겠습니까?")) {
                        await handleDeleteArchiveItem(id, () => {
                          addToast("영감 자산이 영구히 삭제되었습니다.", "success");
                        });
                      }
                    }}
                    archiveFilter={archiveFilter}
                    archiveSort={archiveSort}
                  />
                </div>
              )}
            </div>
          )}

          {activeActivity === "workspace" && (
            <WorkspaceContainer
              selectedProjectId={selectedProjectId}
              currentProject={currentProject}
              activeWorkspaceTab={activeWorkspaceTab}
              isDarkMode={isDarkMode}
              setModalOpen={setModalOpen}
              addToast={addToast}
              
              // ProjectInfo
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

              // Characters
              characters={characters}
              handleOpenCharacterAdd={handleOpenCharacterAdd}
              handleOpenCharacterEdit={handleOpenCharacterEdit}
              syncCharacters={syncCharacters}
              deleteCharacter={deleteCharacter}
              handleGenerateMapDraft={handleGenerateMapDraft}
              nodes={nodes}
              setNodes={setNodes}
              onNodesChange={onNodesChange}
              edges={edges}
              setEdges={setEdges}
              onEdgesChange={onEdgesChange}
              handleSaveLabSession={handleSaveLabSession}

              // Plot Timeline
              events={events}
              isGeneratingPlot={isGeneratingPlot}
              handleOpenEventAdd={handleOpenEventAdd}
              handleOpenEventEdit={handleOpenEventEdit}
              deleteEvent={deleteEvent}
              reorderEvents={reorderEvents}
              generatePlotDraft={generatePlotDraft}

              // Synopsis
              editProjectFullSynopsis={editProjectFullSynopsis}
              setEditProjectFullSynopsis={setEditProjectFullSynopsis}
              isGeneratingSynopsis={isGeneratingSynopsis}
              handleGenerateLogline={handleGenerateLogline}
              handleGenerateSynopsis={handleGenerateSynopsis}
              handleSaveSynopsis={handleSaveSynopsis}
              handleExportDocument={handleExportDocument}

              // Scripts Editor
              scripts={scripts}
              currentScript={currentScript}
              setCurrentScript={setCurrentScript}
              createScript={createScript}
              updateScript={updateScript}
              deleteScript={deleteScript}
              isLoadingScripts={isLoadingScripts}
            />
          )}
        </div>
      </main>

      {/* 4. 우측 보조 패널 */}
      <RightInsightPanel 
        currentInspiration={currentInspiration}
        isAnalyzingQuick={isAnalyzingDetail || isUploading}
        analyzedProjects={analyzedProjectsMap}
        handleTriggerQuickAnalysis={handleTriggerQuickAnalysis}
        linkedReferenceItems={linkedReferenceItems}
        projects={projects}
        archiveItems={archiveItems}
        onOpenLinkProjectModal={handleOpenLinkInspirationProjectModal}
        onRemoveReference={(id) => handleToggleLinkInspiration(id, false)}
        handleSaveToArchive={() => handleSaveToArchive(() => addToast("수집 기사가 영감 보관함에 복사 완료되었습니다.", "success"), (msg) => addToast(msg, "error"))}
        isSaving={isSaving}
        addToast={addToast}
      />

      {/* --- 글로벌 팝업 & 모달 기획창 --- */}
      
      {/* 1-2. 극작 메모 수정 모달 */}
      {isEditModalOpen && editingNote && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300">
          <div className="bg-[#14141A] border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-zinc-800/40 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-black text-white">✍️ 극작 메모 수정</h3>
                <span className="text-[10px] text-zinc-500">기존에 작성한 수집 아이디어나 메모의 제목 및 내용을 수정합니다.</span>
              </div>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingNote(null);
                }} 
                className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all"
              >
                <span className="text-xs">✕</span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5 bg-[#0A0A0E]/30">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">메모 제목</span>
                <input 
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="갈등의 성격을 대표하는 제목을 지어주세요..."
                  className="w-full bg-[#0E0E12] border border-zinc-800 p-3 rounded-2xl text-xs font-bold text-white focus:border-amber-500/50 outline-none transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">메모 상세 기술</span>
                <textarea 
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  placeholder="뉴스에서 영감을 얻은 서사적 대립, 캐릭터 관계 변화 및 긴장감 연출 요소를 상세히 적어보세요..."
                  className="w-full bg-[#0E0E12] border border-zinc-800 p-4 rounded-2xl text-xs font-semibold text-zinc-300 focus:border-amber-500/50 outline-none leading-relaxed transition-all resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800/40 flex justify-end gap-2.5 bg-[#0A0A0E]/50">
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingNote(null);
                }}
                className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-bold rounded-xl transition-all"
              >
                취소
              </button>
              <button 
                onClick={async () => {
                  if (!editTitle.trim()) {
                    addToast("메모 제목을 기입해주세요.", "warning");
                    return;
                  }
                  if (!editContent.trim()) {
                    addToast("메모 상세 내용을 적어주세요.", "warning");
                    return;
                  }
                  
                  await handleUpdateNote(
                    editingNote.id,
                    editTitle,
                    editContent,
                    () => {
                      addToast("메모가 수정되었습니다.", "success");
                      setIsEditModalOpen(false);
                      setEditingNote(null);
                    },
                    (msg) => {
                      addToast(msg, "error");
                    }
                  );
                }}
                disabled={isUploading}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-1.5"
              >
                {isUploading ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. 신규 영감 수집 모달 */}
      <CollectModal 
        isOpen={isCollectModalOpen}
        onClose={() => setModalOpen("collect", false)}
        handleUrlArchive={handleUrlArchive}
        handleFileUpload={handleFileUpload}
        handleCreateNote={handleCreateNote}
        addToast={addToast}
      />

      {/* 2. 신규 드라마 기획 생성 모달 */}
      <ProjectCreateModal 
        isOpen={isProjectModalOpen}
        onClose={() => setModalOpen("project", false)}
        createProject={createProject}
        addToast={addToast}
      />

      {/* 3. 영감 불러오기 책장 연동 모달 */}
      <LinkArchiveModal 
        isOpen={isLinkArchiveModalOpen}
        onClose={() => setModalOpen("linkArchive", false)}
        archiveItems={archiveItems}
        projectLinkedInspirations={projectLinkedInspirations}
        setProjectLinkedInspirations={setProjectLinkedInspirationsWrapper}
        addToast={addToast}
      />

      {/* 4. 캐릭터 인물 추가/수정 CRUD 모달 */}
      <CharacterModal 
        isOpen={isCharacterModalOpen}
        onClose={() => setModalOpen("character", false)}
        activeCharacterId={activeCharacterId}
        charName={charName}
        charRole={charRole}
        charDesc={charDesc}
        charDesire={charDesire}
        charColor={charColor}
        charAge={charAge}
        charGender={charGender}
        charOccupation={charOccupation}
        charIsLocked={charIsLocked}
        setCharacterForm={setCharacterForm}
        handleSaveCharacter={handleSaveCharacter}
        deleteCharacter={deleteCharacter}
        addToast={addToast}
      />

      {/* 4.5 플롯 에피소드 사건 추가/수정 CRUD 모달 */}
      <PlotEventModal 
        isOpen={isPlotEventModalOpen}
        onClose={() => setModalOpen("plotEvent", false)}
        activePlotEventId={activePlotEventId}
        plotEventTitle={plotEventTitle}
        plotEventTimeHint={plotEventTimeHint}
        plotEventContent={plotEventContent}
        plotEventCharacterIds={plotEventCharacterIds}
        characters={characters}
        setPlotEventForm={setPlotEventForm}
        handleSaveEvent={handleSaveEvent}
        deleteEvent={deleteEvent}
        addToast={addToast}
      />

      {/* 6. 영감-프로젝트 다중 연결 설정 모달 */}
      <LinkInspirationProjectModal 
        isOpen={isLinkInspirationProjectModalOpen}
        onClose={() => {
          setIsLinkInspirationProjectModalOpen(false);
          setActiveInspirationForLink(null);
        }}
        inspiration={activeInspirationForLink}
        projects={projects}
        onSave={handleSaveInspirationProjectLinks}
        addToast={addToast}
      />

      {/* 5. 프로젝트 관리 및 순서제어 모달 */}
      {isProjectManageModalOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300">
          <div className="bg-[#14141A] border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-zinc-800/40 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-black text-white">⚙️ 드라마 프로젝트 기획안 관리</h3>
                <span className="text-[10px] text-zinc-500">생성된 기획안들의 우선순위 배열(순서)을 조정하거나 삭제합니다.</span>
              </div>
              <button 
                onClick={() => setIsProjectManageModalOpen(false)} 
                className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all"
              >
                <span className="text-xs">✕</span>
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 bg-[#0A0A0E]/30 max-h-[350px] overflow-y-auto custom-scrollbar-dark">
              {projects.length > 0 ? (
                projects.map((proj, idx) => (
                  <div 
                    key={proj.id}
                    className={cn(
                      "p-4.5 rounded-2xl border flex items-center justify-between transition-all",
                      selectedProjectId === proj.id 
                        ? "bg-[#1E1E28]/60 border-amber-500/40"
                        : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      {/* 순서 조정 버튼 */}
                      <div className="flex flex-col gap-1">
                        <button 
                          disabled={idx === 0}
                          onClick={() => {
                            const next = [...projects];
                            const temp = next[idx];
                            next[idx] = next[idx - 1];
                            next[idx - 1] = temp;
                            setProjects(next);
                          }}
                          className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                        >
                          <span className="text-[10px] rotate-180 block">▼</span>
                        </button>
                        <button 
                          disabled={idx === projects.length - 1}
                          onClick={() => {
                            const next = [...projects];
                            const temp = next[idx];
                            next[idx] = next[idx + 1];
                            next[idx + 1] = temp;
                            setProjects(next);
                          }}
                          className="p-0.5 hover:bg-zinc-800 rounded text-zinc-500 hover:text-zinc-200 disabled:opacity-30"
                        >
                          <span className="text-[10px] block">▼</span>
                        </button>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black text-white">{proj.title}</span>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{proj.genre || "장르 미설정"} • {proj.format || "16부작 미니시리즈"}</span>
                      </div>
                    </div>

                    <button 
                      onClick={async () => {
                        if (confirm(`정말 이 프로젝트('${proj.title}')를 영구 삭제하시겠습니까?\n하위 대본, 인물 설정 등 기획된 모든 서사 데이터가 영구 삭제됩니다.`)) {
                          const success = await deleteProject(proj.id);
                          if (success) {
                            addToast("드라마 프로젝트가 영구 삭제되었습니다.", "success");
                            if (selectedProjectId === proj.id) {
                              const remaining = projects.filter(p => p.id !== proj.id);
                              if (remaining.length > 0) {
                                selectProject(remaining[0].id);
                              } else {
                                selectProject("");
                              }
                            }
                          } else {
                            addToast("프로젝트 삭제에 실패했습니다.", "error");
                          }
                        }
                      }}
                      className="p-2 hover:bg-rose-500/10 rounded-xl text-zinc-500 hover:text-rose-500 transition-all"
                      title="프로젝트 삭제"
                    >
                      <span className="text-xs">🗑️</span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500 text-xs">생성된 드라마 기획안 프로젝트가 없습니다.</div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-800/40 flex justify-end bg-[#0A0A0E]/50">
              <button 
                onClick={() => setIsProjectManageModalOpen(false)}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl transition-all shadow-lg active:scale-95"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 실시간 알림 토스트 컨테이너 */}
      <ToastContainer 
        toasts={toasts}
        setToasts={setToasts}
      />
    </div>
  );
}
