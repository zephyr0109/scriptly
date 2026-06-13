const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'scriptly-web', 'src', 'app', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports to the top of the file
const importMarker = "import api from \"@/lib/api\";";
const importsToAdd = `import api from "@/lib/api";
import ActivityBar from "@/components/layout/ActivityBar";
import SidebarPanel from "@/components/layout/SidebarPanel";
import EditNoteModal from "@/components/features/modals/EditNoteModal";`;
content = content.replace(importMarker, importsToAdd);

// 2. Remove editTitle and editContent state declarations
const stateTarget = `  // 직접 극작 메모(NOTE) 수정을 위한 Local State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [editContent, setEditContent] = useState<string>("");`;
const stateReplacement = `  // 직접 극작 메모(NOTE) 수정을 위한 Local State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<any>(null);`;
content = content.replace(stateTarget, stateReplacement);

// 3. Remove setEditTitle and setEditContent calls inside onEditClick callback
const onEditClickTarget = `                    onEditClick={(item) => {
                      const originalItem = archiveItems.find(a => a.id === item.id);
                      if (originalItem) {
                        setEditingNote(originalItem);
                        setEditTitle(originalItem.title);
                        setEditContent(originalItem.content);
                        setIsEditModalOpen(true);
                      }
                    }}`;
const onEditClickReplacement = `                    onEditClick={(item) => {
                      const originalItem = archiveItems.find(a => a.id === item.id);
                      if (originalItem) {
                        setEditingNote(originalItem);
                        setIsEditModalOpen(true);
                      }
                    }}`;
content = content.replace(onEditClickTarget, onEditClickReplacement);

// 4. Replace inline Activity Bar
const activityBarMarkerStart = `{/* 1. Activity Bar (맨 왼쪽) - 최하단 margin을 조정하여 Next Indicator 겹침 방지 */}`;
const activityBarMarkerEnd = `{/* 2. Explorer Sidebar (사이드바) - 작가님이 극찬하셨던 프리뷰 디자인 100% 완벽 복원 */}`;

const startIndexAct = content.indexOf(activityBarMarkerStart);
const endIndexAct = content.indexOf(activityBarMarkerEnd);

if (startIndexAct !== -1 && endIndexAct !== -1) {
  const replacementAct = `${activityBarMarkerStart}
      <ActivityBar 
        activeActivity={activeActivity}
        setActivity={setActivity}
        isDarkMode={isDarkMode}
        setDarkMode={setDarkMode}
        addToast={addToast}
      />
      
      `;
  content = content.substring(0, startIndexAct) + replacementAct + content.substring(endIndexAct);
} else {
  console.error("Could not find Activity Bar markers!");
}

// 5. Replace inline Sidebar Panel
const sidebarMarkerStart = `{/* 2. Explorer Sidebar (사이드바) - 작가님이 극찬하셨던 프리뷰 디자인 100% 완벽 복원 */}`;
const sidebarMarkerEnd = `{/* 3. Main Workspace (메인 캔버스 영역) - 100% 프리뷰 디자인 복원 및 실데이터 접합 */}`;

const startIndexSide = content.indexOf(sidebarMarkerStart);
const endIndexSide = content.indexOf(sidebarMarkerEnd);

if (startIndexSide !== -1 && endIndexSide !== -1) {
  const replacementSide = `${sidebarMarkerStart}
      <SidebarPanel 
        activeActivity={activeActivity}
        inspirationSubTab={inspirationSubTab}
        setInspirationSubTab={setInspirationSubTab}
        activeWorkspaceTab={activeWorkspaceTab}
        setWorkspaceTab={setWorkspaceTab}
        projects={projects}
        currentProject={currentProject}
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
        outline={outline}
        isResizingSidebar={isResizingSidebar}
        setIsResizingSidebar={setIsResizingSidebar}
        sidebarWidth={sidebarWidth}
        isDarkMode={isDarkMode}
        addToast={addToast}
      />
      
      `;
  content = content.substring(0, startIndexSide) + replacementSide + content.substring(endIndexSide);
} else {
  console.error("Could not find Sidebar markers!");
}

// 6. Replace EditNoteModal
const modalStartMarker = `{/* 1-2. 극작 메모 수정 모달 (신설) */}`;
const modalEndMarker = `{/* 1. 신규 영감 수집 모달 */}`;

const startIndexModal = content.indexOf(modalStartMarker);
const endIndexModal = content.indexOf(modalEndMarker);

if (startIndexModal !== -1 && endIndexModal !== -1) {
  const replacementModal = `${modalStartMarker}
      <EditNoteModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingNote(null);
        }}
        editingNote={editingNote}
        handleUpdateNote={handleUpdateNote}
        isUploading={isUploading}
        isDarkMode={isDarkMode}
        addToast={addToast}
      />
      
      `;
  content = content.substring(0, startIndexModal) + replacementModal + content.substring(endIndexModal);
} else {
  console.error("Could not find Modal markers!");
}

// Normalize line endings to LF to prevent CRLF duplicate matching issues
fs.writeFileSync(filePath, content, 'utf8');
console.log("Refactoring page.tsx completed successfully!");
