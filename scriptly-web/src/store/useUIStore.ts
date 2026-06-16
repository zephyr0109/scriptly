import { create } from "zustand";

interface UIState {
  // 1. 최외곽 라우팅 및 캔버스 스위칭
  activeActivity: "inspiration" | "workspace";
  inspirationSubTab: "search" | "archive";
  activeWorkspaceTab: "info" | "characters" | "plot" | "draft" | "editor" | "world";
  
  // 2. 패널 및 레이아웃 상태
  isRightPanelOpen: boolean;
  isDarkMode: boolean;
  sidebarWidth: number;
  rightPanelWidth: number;
  
  // 3. 선택된 데이터 컨텍스트 ID
  selectedProjectId: string | null;
  selectedInspirationId: string | null;
  selectedArchiveId: string | null;
  
  // 4. 모달 활성화 제어
  isCollectModalOpen: boolean;
  isProjectModalOpen: boolean;
  isLinkArchiveModalOpen: boolean;
  isCharacterModalOpen: boolean;          // 캐릭터 모달 활성화 제어
  isPlotEventModalOpen: boolean;          // 플롯 사건 모달 활성화 제어
  
  // 5. 등장인물 추가/수정 폼 임시 상태
  activeCharacterId: string | null;       // null 이면 등록, string 이면 수정 모드
  charName: string;
  charRole: string;
  charDesc: string;
  charDesire: string;
  charColor: string;
  charAge: string;
  charGender: string;
  charOccupation: string;
  charIsLocked: boolean;

  // 5.5 플롯 사건 추가/수정 폼 임시 상태
  activePlotEventId: string | null;       // null 이면 등록, string 이면 수정 모드
  plotEventTitle: string;
  plotEventTimeHint: string;
  plotEventContent: string;
  plotEventCharacterIds: string[];

  // 6. 액션 함수
  setActivity: (activity: "inspiration" | "workspace") => void;
  setInspirationSubTab: (tab: "search" | "archive") => void;
  setWorkspaceTab: (tab: "info" | "characters" | "plot" | "draft" | "editor" | "world") => void;
  toggleRightPanel: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setDarkMode: (dark: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  selectProject: (projectId: string | null) => void;
  selectInspiration: (id: string | null) => void;
  selectArchive: (id: string | null) => void;
  setModalOpen: (modal: "collect" | "project" | "linkArchive" | "character" | "plotEvent", open: boolean) => void;
  setCharacterForm: (form: Partial<{ id: string | null; name: string; role: string; desc: string; desire: string; color: string; age: string; gender: string; occupation: string; isLocked: boolean }>) => void;
  resetCharacterForm: () => void;
  setPlotEventForm: (form: Partial<{ id: string | null; title: string; timeHint: string; content: string; characterIds: string[] }>) => void;
  resetPlotEventForm: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // 1. 초기 상태값
  activeActivity: "inspiration",
  inspirationSubTab: "search",
  activeWorkspaceTab: "info",
  
  isRightPanelOpen: true,
  isDarkMode: true,
  sidebarWidth: 260,
  rightPanelWidth: 350,
  
  selectedProjectId: null,
  selectedInspirationId: null,
  selectedArchiveId: null,
  
  isCollectModalOpen: false,
  isProjectModalOpen: false,
  isLinkArchiveModalOpen: false,
  isCharacterModalOpen: false,
  isPlotEventModalOpen: false,

  activeCharacterId: null,
  charName: "",
  charRole: "주연",
  charDesc: "",
  charDesire: "",
  charColor: "bg-blue-500/20 text-blue-400 border-blue-500/50",
  charAge: "",
  charGender: "",
  charOccupation: "",
  charIsLocked: false,

  activePlotEventId: null,
  plotEventTitle: "",
  plotEventTimeHint: "",
  plotEventContent: "",
  plotEventCharacterIds: [],

  // 2. 액션 구현
  setActivity: (activity) => set({ activeActivity: activity }),
  setInspirationSubTab: (tab) => set({ inspirationSubTab: tab }),
  setWorkspaceTab: (tab) => set({ activeWorkspaceTab: tab }),
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  setRightPanelOpen: (open) => set({ isRightPanelOpen: open }),
  setDarkMode: (dark) => set({ isDarkMode: dark }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setRightPanelWidth: (width) => set({ rightPanelWidth: width }),
  selectProject: (projectId) => set({ selectedProjectId: projectId }),
  selectInspiration: (id) => set({ selectedInspirationId: id }),
  selectArchive: (id) => set({ selectedArchiveId: id }),
  setModalOpen: (modal, open) => set((state) => {
    if (modal === "collect") return { isCollectModalOpen: open };
    if (modal === "project") return { isProjectModalOpen: open };
    if (modal === "linkArchive") return { isLinkArchiveModalOpen: open };
    if (modal === "character") return { isCharacterModalOpen: open };
    if (modal === "plotEvent") return { isPlotEventModalOpen: open };
    return {};
  }),
  setCharacterForm: (form) => set((state) => ({
    activeCharacterId: form.id !== undefined ? form.id : state.activeCharacterId,
    charName: form.name !== undefined ? form.name : state.charName,
    charRole: form.role !== undefined ? form.role : state.charRole,
    charDesc: form.desc !== undefined ? form.desc : state.charDesc,
    charDesire: form.desire !== undefined ? form.desire : state.charDesire,
    charColor: form.color !== undefined ? form.color : state.charColor,
    charAge: form.age !== undefined ? form.age : state.charAge,
    charGender: form.gender !== undefined ? form.gender : state.charGender,
    charOccupation: form.occupation !== undefined ? form.occupation : state.charOccupation,
    charIsLocked: form.isLocked !== undefined ? form.isLocked : state.charIsLocked,
  })),
  resetCharacterForm: () => set({
    activeCharacterId: null,
    charName: "",
    charRole: "주연",
    charDesc: "",
    charDesire: "",
    charColor: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    charAge: "",
    charGender: "",
    charOccupation: "",
    charIsLocked: false,
  }),
  setPlotEventForm: (form) => set((state) => ({
    activePlotEventId: form.id !== undefined ? form.id : state.activePlotEventId,
    plotEventTitle: form.title !== undefined ? form.title : state.plotEventTitle,
    plotEventTimeHint: form.timeHint !== undefined ? form.timeHint : state.plotEventTimeHint,
    plotEventContent: form.content !== undefined ? form.content : state.plotEventContent,
    plotEventCharacterIds: form.characterIds !== undefined ? form.characterIds : state.plotEventCharacterIds,
  })),
  resetPlotEventForm: () => set({
    activePlotEventId: null,
    plotEventTitle: "",
    plotEventTimeHint: "",
    plotEventContent: "",
    plotEventCharacterIds: [],
  }),
}));
