import { create } from "zustand";

interface UIState {
  // 1. 최외곽 라우팅 및 캔버스 스위칭
  activeActivity: "inspiration" | "workspace";
  inspirationSubTab: "search" | "archive";
  activeWorkspaceTab: "info" | "characters" | "plot" | "draft" | "editor";
  
  // 2. 패널 및 레이아웃 상태
  isRightPanelOpen: boolean;
  isDarkMode: boolean;
  sidebarWidth: number;
  
  // 3. 선택된 데이터 컨텍스트 ID
  selectedProjectId: string | null;
  selectedInspirationId: string | null;
  selectedArchiveId: string | null;
  
  // 4. 모달 활성화 제어
  isCollectModalOpen: boolean;
  isProjectModalOpen: boolean;
  isLinkArchiveModalOpen: boolean;
  isCharacterModalOpen: boolean;          // 캐릭터 모달 활성화 제어
  
  // 5. 등장인물 추가/수정 폼 임시 상태
  activeCharacterId: string | null;       // null 이면 등록, string 이면 수정 모드
  charName: string;
  charRole: string;
  charDesc: string;
  charDesire: string;
  charColor: string;

  // 6. 액션 함수
  setActivity: (activity: "inspiration" | "workspace") => void;
  setInspirationSubTab: (tab: "search" | "archive") => void;
  setWorkspaceTab: (tab: "info" | "characters" | "plot" | "draft" | "editor") => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  setSidebarWidth: (width: number) => void;
  selectProject: (projectId: string | null) => void;
  selectInspiration: (id: string | null) => void;
  selectArchive: (id: string | null) => void;
  setModalOpen: (modal: "collect" | "project" | "linkArchive" | "character", open: boolean) => void;
  setCharacterForm: (form: Partial<{ id: string | null; name: string; role: string; desc: string; desire: string; color: string }>) => void;
  resetCharacterForm: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // 1. 초기 상태값
  activeActivity: "inspiration",
  inspirationSubTab: "search",
  activeWorkspaceTab: "info",
  
  isRightPanelOpen: true,
  isDarkMode: true,
  sidebarWidth: 260,
  
  selectedProjectId: null,
  selectedInspirationId: null,
  selectedArchiveId: null,
  
  isCollectModalOpen: false,
  isProjectModalOpen: false,
  isLinkArchiveModalOpen: false,
  isCharacterModalOpen: false,

  activeCharacterId: null,
  charName: "",
  charRole: "주연 (검사)",
  charDesc: "",
  charDesire: "",
  charColor: "bg-blue-500/20 text-blue-400 border-blue-500/50",

  // 2. 액션 구현
  setActivity: (activity) => set({ activeActivity: activity }),
  setInspirationSubTab: (tab) => set({ inspirationSubTab: tab }),
  setWorkspaceTab: (tab) => set({ activeWorkspaceTab: tab }),
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  setRightPanelOpen: (open) => set({ isRightPanelOpen: open }),
  setDarkMode: (dark) => set({ isDarkMode: dark }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  selectProject: (projectId) => set({ selectedProjectId: projectId }),
  selectInspiration: (id) => set({ selectedInspirationId: id }),
  selectArchive: (id) => set({ selectedArchiveId: id }),
  setModalOpen: (modal, open) => set((state) => {
    if (modal === "collect") return { isCollectModalOpen: open };
    if (modal === "project") return { isProjectModalOpen: open };
    if (modal === "linkArchive") return { isLinkArchiveModalOpen: open };
    if (modal === "character") return { isCharacterModalOpen: open };
    return {};
  }),
  setCharacterForm: (form) => set((state) => ({
    activeCharacterId: form.id !== undefined ? form.id : state.activeCharacterId,
    charName: form.name !== undefined ? form.name : state.charName,
    charRole: form.role !== undefined ? form.role : state.charRole,
    charDesc: form.desc !== undefined ? form.desc : state.charDesc,
    charDesire: form.desire !== undefined ? form.desire : state.charDesire,
    charColor: form.color !== undefined ? form.color : state.charColor,
  })),
  resetCharacterForm: () => set({
    activeCharacterId: null,
    charName: "",
    charRole: "주연 (검사)",
    charDesc: "",
    charDesire: "",
    charColor: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  }),
}));
