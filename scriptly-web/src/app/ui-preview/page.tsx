"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, Archive, Folder, Plus, Info, Users, GitCommit, FileText, 
  PenTool, Settings, LogOut, ChevronRight, ChevronDown, Eye, EyeOff,
  Sun, Moon, Search, Trash2, Send, CornerDownRight, Check, Save, Play,
  BookOpen, HelpCircle, FileCheck, ArrowRight, MessageSquare, Filter, 
  ExternalLink, Upload, Globe, File, Calendar, SortAsc, X, Flame, ShieldAlert,
  Compass, UserCheck, CheckSquare, FolderPlus, Palette, Bookmark, BookOpenCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

// 인터랙티브 데모를 위한 더미 데이터 정의
const INITIAL_PROJECTS = [
  { id: "proj_1", name: "프로젝트: 시그널 시즌2", genre: "스릴러/판타지", logline: "과거로부터 걸려온 간절한 신호(무전), 다시 한 번 미제 사건의 매듭을 풀기 위해 과거와 현재의 형사들이 시공간을 초월해 교신한다." },
  { id: "proj_2", name: "프로젝트: 비밀의 숲 3", genre: "정치/범죄/스릴러", logline: "감정을 잃어버린 외톨이 검사 황시목과 따뜻한 형사 한여진이 거대한 재계와 사법부의 밀실 커넥션을 다시 한번 추적한다." },
  { id: "proj_3", name: "프로젝트: 태양의 후예 2", genre: "로맨스/휴먼", logline: "낯선 땅, 극한의 환경 속에서 사랑과 성공을 꿈꾸는 젊은 군인과 의사들의 삶의 가치를 담아내는 블록버스터급 대하드라마." }
];

const DUMMY_CHARACTERS = [
  { id: "char_1", name: "황시목", role: "주연 (검사)", desc: "감정을 느끼지 못하며 냉철하고 이성적인 판단만 내리는 서부지검 검사.", color: "bg-blue-500/20 text-blue-400 border-blue-500/50" },
  { id: "char_2", name: "한여진", role: "주연 (형사)", desc: "강력계 출신의 따뜻하고 정의로운 타협 없는 행동파 형사.", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" },
  { id: "char_3", name: "이창준", role: "조연 (전 검사장)", desc: "내면에 야망과 정의를 동시에 품었던 어둠의 조율자.", color: "bg-purple-500/20 text-purple-400 border-purple-500/50" }
];

const DUMMY_EVENTS = [
  { id: "ev_1", title: "스카우터에서 포착한 미제 사건 뉴스 보관", duration: "1화 15분", desc: "서부지검 인근 쓰레기통에서 발견된 의문의 암호화된 USB 뉴스 기사 분석 자료 보관." },
  { id: "ev_2", title: "황시목과 한여진의 우연한 현장 재회", duration: "1화 30분", desc: "검찰청 로비에서 의문의 자살 사건을 수사하던 도중 강력반 한여진 형사와 우연히 부딪히며 공조 재개." },
  { id: "ev_3", title: "첫 번째 내부 커넥션 폭로 및 반전", duration: "1화 50분", desc: "자살로 위장되었던 부장검사가 타살이었음이 밝혀지고 내부 검사가 유력한 용의자로 지목되는 반전." }
];

// 피드백 반영: 첫 번째 기사를 작가님이 제공해주신 실제 학생인권조례 & 교권 침해 뉴스 속보로 매핑
const DUMMY_INSPIRATIONS = [
  { 
    id: "insp_1", 
    title: "서울 교육감 후보들, 학생인권조례 존폐 두고 격렬한 끝장 토론 진행", 
    desc: "학생인권조례가 일선 교육 현장의 교권 보호와 상충하는지에 대해 서울 교육감 후보 간의 상반된 입장이 정면 충돌했습니다. 조례 유무에 따른 교권 침해 통계 해석을 둘러싸고 날선 대립이 이어졌습니다.", 
    date: "2026-05-24", 
    source: "교육평론일보", 
    keyword: "교권 vs 학생인권", 
    url: "https://edu-news.co.kr/article/student-rights-debate" 
  },
  { 
    id: "insp_2", 
    title: "의문의 대기업 비자금 조성 및 내부 폭로 USB 습득 사건 단독 보도", 
    desc: "정관계 로비용으로 사용된 비밀 외화 계좌의 해킹 분석 자료. 검찰 내부 커넥션과 연계된 정황 포착.", 
    date: "2026-05-22", 
    source: "서울일보", 
    keyword: "비자금", 
    url: "https://news.seoul.co.kr/article/12345" 
  },
  { 
    id: "insp_3", 
    title: "20년 전 미제 실종자, 의외의 장소에서 성인이 된 채 극적 생존 확인", 
    desc: "공소시효가 만료된 유명 아동 납치 사건의 피해자가 성인이 된 채 발견. 가해자가 본인을 친부모라 속이고 양육해온 잔혹한 진실.", 
    date: "2026-05-20", 
    source: "사건기록24", 
    keyword: "실종", 
    url: "https://incident24.com/missing-case" 
  }
];

const DUMMY_ARCHIVES = [
  { id: "ar_1", title: "강남 유흥업소 소유주 비자금 장부 유출", desc: "회계 조작 및 비자금 배달원 진술 확보서. 드라마 갈등 자산으로 AI 심층 분석 완료.", type: "직접 작성 메모", date: "2026-05-24", source: "작가 집필 기록", keyword: "유흥업소 비자금" },
  { id: "ar_2", title: "사법부 인물 인과관계 프로파일링 기록", desc: "의문의 교통사고로 숨진 수사관의 직전 행적 및 법조계 로비 동선 분석.", type: "외부 링크 기사", date: "2026-05-22", source: "법조포커스", keyword: "교통사고 의문사" },
  { id: "ar_3", title: "가상 자산 거래소 우회 송금 루트 시나리오", desc: "해외 페이퍼 컴퍼니를 통한 무기 거래 및 세탁 송금 분석용 PDF 데이터 파일.", type: "첨부 파일 문서", date: "2026-05-18", source: "디지털포렌식센터 자료", keyword: "가상자산 세탁" }
];

// 작가님이 전달해주신 실제 퀵 인사이트 정밀 데이터셋 (기본 기사 insp_1 전용)
const ACTUAL_QUICK_INSIGHT_DATA = {
  score: 90,
  scoreDesc: "이 소재는 대한민국 교육 시스템의 가장 뜨거운 감자 중 하나이며, 학생, 교사, 학부모 등 전 국민의 이해관계가 얽혀 있어 즉각적인 감정 이입과 격렬한 논쟁을 불러일으킨다. 단순히 정책을 넘어 교육의 본질과 인간의 존엄성이라는 보편적 가치에 대한 질문을 던지므로, 그 어떤 갈등보다 깊고 폭넓은 드라마틱한 긴장감을 내포한다.",
  conflictStructure: "학생의 자율성과 인권 존중이라는 진보적 가치와 교사의 권위 및 학교 질서 유지라는 전통적 가치가 교육 현장에서 첨예하게 충돌하는 지점. 이는 '무엇이 진정으로 학생들을 위하는 길인가'에 대한 근본적인 질문과, '누구의 권리가 더 우선되어야 하는가'라는 구조적 모순에서 비롯된 갈등이다.",
  summaryAndVibe: "교육감 토론에서 학생인권조례를 둘러싼 뜨거운 논쟁은 교권 침해 문제의 근본적인 원인을 두고 상반된 입장이 격돌하는 현장을 보여준다. 한편에서는 조례가 오히려 교권을 보호한다고 주장하고, 다른 한편에서는 조례가 교권 침해를 야기한다고 반박하며 교육 현장의 해묵은 갈등을 수면 위로 끌어올린다. 이는 단순히 정책 논쟁을 넘어, 학생의 자유와 교사의 권위라는 두 가지 핵심 가치가 부딪히는 드라마틱한 서사의 씨앗이 된다.",
  recommendedVibe: "리얼리즘 기반의 사회 고발 드라마, 혹은 정치 스릴러적 긴장감을 품은 교육 드라마. 다크하면서도 인간적인 고뇌가 담긴 톤으로, 서늘한 현실 비판과 함께 따뜻한 휴머니즘을 잃지 않는 균형감이 필요하다.",
  keywords: ["학생인권조례", "교권 침해", "교육감 토론", "가치 충돌", "교육 현장 갈등"],
  relatedPeople: [
    {
      role: "진보적 교육 개혁가 (학생 인권 옹호자)",
      desc: "학생의 자율과 인권을 최우선 가치로 여기며, 통계적 근거를 바탕으로 조례의 순기능을 옹호한다. 교육 현장의 변화를 통해 더 나은 미래를 꿈꾸는 이상주의자.",
      desire: "교육의 본질적 가치 회복과 학생의 주체성 확립"
    },
    {
      role: "교권 수호론자 (교사의 권위 회복 주장자)",
      desc: "흔들리는 교사의 권위를 바로 세우고 학교 질서를 확립하려는 강한 의지를 가졌다. 학생인권조례가 야기하는 현장 문제에 주목하며, 교사의 고충에 깊이 공감한다.",
      desire: "교사의 존엄성 회복과 효과적인 교육 환경 재건"
    },
    {
      role: "일선 교사 (시스템의 희생양 또는 변화의 주체)",
      desc: "학생인권조례와 교권 침해 논란의 최전선에서 고통받거나, 혹은 그 속에서 새로운 교육 방식을 모색하는 인물. 이상과 현실 사이에서 번뇌하며, 진정한 교육의 가치를 찾고자 한다.",
      desire: "존중받는 교육 환경 속에서 아이들을 가르치는 것"
    },
    {
      role: "학생 대표 (신생 인권 의식의 상징)",
      desc: "조례로 인해 부여된 권리를 때로는 이상적으로, 때로는 현실적으로 행사하며 학교에 새로운 파장을 불러일으키는 인물. 기성세대의 관점과는 다른 자신들만의 논리로 학교 시스템에 도전한다.",
      desire: "자유로운 주체로서 학교에서 인정받는 것"
    }
  ],
  keyEvents: [
    "서울 교육감 후보들의 학생인권조례 존폐를 둘러싼 격렬한 토론.",
    "\"조례 있는 지역이 교권 침해 사례 적다\"는 통계적 근거 제시와 이에 대한 즉각적인 반발.",
    "교수 출신 후보에게 '근거'를 바탕으로 판단하라는 요구가 제기되는 상황.",
    "학생 인권과 교권 보호 중 어느 것이 우선이거나, 혹은 서로 상충하는지에 대한 현장의 혼란과 논쟁 심화."
  ]
};

// 보관함 아이템 전용 더미 AI 분석 데이터셋 (피드백 반영: 보관함 항목도 동일한 폼으로 렌더링되게 설계)
const ARCHIVE_QUICK_INSIGHT_DATA = {
  score: 85,
  scoreDesc: "정관계 세력의 비호를 받는 대기업과 비밀 회계 대리인의 갈등으로, 법적 테두리를 우회하는 자금의 흐름을 쫓는 고도의 정치 수사 스릴러적 긴장감을 품고 있다. 작가의 서부지검 수사물 설정에서 대립각을 세우는 핵심 기폭제 역할을 충실히 감당한다.",
  conflictStructure: "합법의 가면을 쓰고 불법을 자행하는 거대 카르텔과, 감정이 배제된 채 오직 팩트와 수사망만으로 압박하는 외톨이 검사의 이념 충돌.",
  summaryAndVibe: "유흥업소 바지사장의 진술과 외환 거래 위조 전표가 일치하는 현장을 잡으며 비자금 세탁의 몸통인 청와대 민정수석비서관을 수사 선상에 올리는 결정적 단서.",
  recommendedVibe: "다크한 누아르 스타일의 사회 고발물, 템포가 빠른 사법 카르텔 스릴러.",
  keywords: ["비자금 세탁", "부패 척결", "외환 조작 장부", "검찰 커넥션"],
  relatedPeople: [
    {
      role: "비자금 운반책 (바지 사장)",
      desc: "세탁된 비자금을 전달하는 직접적 행동파이지만, 토사구팽될 위험에 처하자 황시목에게 결정적 장부를 폭로하고 거래를 시도하는 인물.",
      desire: "검찰의 기소유예 확보 및 개인적 신변 안전"
    },
    {
      role: "청와대 수석비서관 (로비 배후)",
      desc: "사법부 요직 인사를 관리하며 권력의 정점에서 장부를 덮으려는 절대적 어둠의 설계자.",
      desire: "비자금 장부의 영구적 은폐 및 법적 단죄 회피"
    }
  ],
  keyEvents: [
    "유흥업소 장부 탈취 및 검찰청 우회 제출 과정에서의 긴장감 넘치는 격돌.",
    "장부 번역 및 포렌식 USB 해독 과정에서의 내부 첩자 적발씬."
  ]
};

export default function UIPreviewPage() {
  const router = useRouter();

  // 글로벌 레이아웃 & UI 상태 관리
  const [activeActivity, setActiveActivity] = useState<"inspiration" | "workspace">("inspiration"); 
  const [inspirationSubTab, setInspirationSubTab] = useState<"search" | "archive">("search");
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"info" | "characters" | "plot" | "draft" | "editor">("info");
  
  // 실시간 추가 및 관리되는 프로젝트 상태 리스트 (동적 프로젝트 생성 대응)
  const [projectsList, setProjectsList] = useState<any[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("proj_1");
  
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [sidebarWidth, setSidebarWidth] = useState<number>(260);
  const [isResizingSidebar, setIsResizingSidebar] = useState<boolean>(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [toasts, setToasts] = useState<any[]>([]);

  // 퀵 인사이트 수동 분석 연동 상태
  const [selectedInspId, setSelectedInspId] = useState<string>("insp_1");
  
  // 피드백 반영: 보관함 항목(selectedArchiveId) 선택 상태 신설
  const [selectedArchiveId, setSelectedArchiveId] = useState<string>("ar_1");

  // 피드백 반영: 프로젝트에 추가한 연동된 영감 ID 리스트 관리 (기본 2개 연동되어 있다고 설정)
  const [projectLinkedInspirations, setProjectLinkedInspirations] = useState<string[]>(["insp_1", "ar_1"]);

  // 피드백 반영: 프로젝트 참고 서랍 내 뉴스 기사의 아코디언 열림 상태 관리
  const [openReferenceAccordionId, setOpenReferenceAccordionId] = useState<string | null>("insp_1");

  const [isAnalyzingQuick, setIsAnalyzingQuick] = useState<boolean>(false);
  const [analyzedProjects, setAnalyzedProjects] = useState<Record<string, any>>({});

  // 모달창 활성화 상태
  const [isCollectModalOpen, setIsCollectModalOpen] = useState<boolean>(false);
  const [collectUrl, setCollectUrl] = useState<string>("");
  const [collectFile, setCollectFile] = useState<File | null>(null);

  // 신규 프로젝트 생성 모달창 상태 관리
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [newProjectGenre, setNewProjectGenre] = useState<string>("스릴러");
  const [newProjectLogline, setNewProjectLogline] = useState<string>("");

  // 피드백 반영: 프로젝트 화면(작업 공간) 우측 패널에서 보관함 영감 불러오기 모달창 상태
  const [isLinkArchiveModalOpen, setIsLinkArchiveModalOpen] = useState<boolean>(false);

  // 피드백 반영: 인물 추가/수정 모달창 상태 및 입력 폼 필드
  const [charactersList, setCharactersList] = useState<any[]>(DUMMY_CHARACTERS);
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState<boolean>(false);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null); // null이면 추가, string이면 수정
  const [charName, setCharName] = useState<string>("");
  const [charRole, setCharRole] = useState<string>("");
  const [charDesc, setCharDesc] = useState<string>("");
  const [charDesire, setCharDesire] = useState<string>("");
  const [charColor, setCharColor] = useState<string>("bg-blue-500/20 text-blue-400 border-blue-500/50");

  // 보관함 필터 및 정렬 상태
  const [archiveFilter, setArchiveFilter] = useState<string>("all");
  const [archiveSort, setArchiveSort] = useState<string>("date");
  
  // 가상의 업로드 보관함 목록 리스트 관리
  const [archivesList, setArchivesList] = useState<any[]>(DUMMY_ARCHIVES);

  // 1단계 자유 대본 작성기 에디터 텍스트 상태
  const [scriptText, setScriptText] = useState<string>(
    `# 1. 서부지검 검사장실 - 낮\n\n대리석으로 마감된 널찍한 검사장실. 무거운 침묵이 방 안을 채운다.\n검사장 자리에 앉은 강원철이 골치 아프다는 듯 미간을 짚고 있다.\n그 앞에 단정히 서 있는 황시목(30대 후반, 검사).\n\n강원철\n(한숨을 푹 쉬며)\n또 네 녀석이군. 이번엔 청와대 수석비서관을 건드려? 제정신인가?\n\n황시목\n(표정의 변화 없이 냉정히)\n법 앞에 성역이 없다고 배우지 않았습니까.\n\n강원철\n(벌떡 일어선다)\n성역? 그 성역이 네 목을 칠 수도 있어! 적당히 타협하는 법을 배워라!\n\n황시목\n그럼 검사복을 벗어야지요. 법이 아닌 세력을 쫓을 거라면.\n\n강원철\n(말문이 막혀 씩씩대다가 다시 주저앉는다)\n나가 봐. 오늘부로 너에 대한 감찰 부서 내사가 시작될 거다.\n\n# 2. 강력계 회의실 - 밤\n\n화이트보드에 빼곡히 적힌 용의자 관계도.\n스탠드 불빛 아래 한여진(30대 후반, 경감)이 컵라면을 불며 자료를 노려보고 있다.\n이때, 문이 조용히 열리며 황시목이 들어선다.\n\n한여진\n(라면을 먹다 멈칫하고 웃음 띤 얼굴로)\n어, 검사님? 이 야밤에 강력반까지 웬일이에요? 또 쫓겨나기 직전인가 보죠?\n\n황시목\n(주머니에 손을 넣은 채 걸어온다)\n의문사가 발견된 USB의 암호 해석이 끝났습니다. 강남 유흥업소 비자금 리스트입니다.`
  );

  // Outline 실시간 파싱 씬 리스트
  const outline = useMemo(() => {
    return scriptText.split("\n")
      .filter(line => line.startsWith("#"))
      .map((line, idx) => ({
        id: `scene_${idx}`,
        title: line.replace(/^#+\s*/, ""),
        rawLine: line
      }));
  }, [scriptText]);

  // 피드백 반영: 보관함에서 프로젝트로 불러올 수 있는 전체 영감 자산 리스트 통합
  const allAvailableInspirations = useMemo(() => {
    const list: any[] = [];
    DUMMY_INSPIRATIONS.forEach(item => {
      list.push({
        id: item.id,
        title: item.title,
        desc: item.desc,
        type: "기사 검색 소스",
        date: item.date,
        source: item.source
      });
    });
    archivesList.forEach(item => {
      list.push({
        id: item.id,
        title: item.title,
        desc: item.desc,
        type: item.type,
        date: item.date,
        source: item.source || "보관함 소스"
      });
    });
    return list;
  }, [archivesList]);

  // Toast 알림 헬퍼
  const addToast = (message: string, type: "success" | "info" | "error" = "success") => {
    const id = Date.now();
    setToasts(prev => [{ id, message, type }, ...prev]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // 피드백 반영: 캐릭터 추가/수정 관련 액션 핸들러
  const handleOpenCharacterAdd = () => {
    setActiveCharacterId(null);
    setCharName("");
    setCharRole("주연 (검사)");
    setCharDesc("");
    setCharDesire("");
    setCharColor("bg-blue-500/20 text-blue-400 border-blue-500/50");
    setIsCharacterModalOpen(true);
    addToast("신규 캐릭터 등록 창을 엽니다.", "info");
  };

  const handleOpenCharacterEdit = (char: any) => {
    setActiveCharacterId(char.id);
    setCharName(char.name);
    setCharRole(char.role);
    setCharDesc(char.desc);
    setCharDesire(char.desire || "존중받는 환경에서의 올바른 가치 실현");
    setCharColor(char.color || "bg-blue-500/20 text-blue-400 border-blue-500/50");
    setIsCharacterModalOpen(true);
    addToast(`인물 '${char.name}'의 정보 수정 창을 엽니다.`, "info");
  };

  const handleSaveCharacter = () => {
    if (!charName.trim()) {
      addToast("인물의 이름을 입력해주세요.", "error");
      return;
    }

    if (activeCharacterId) {
      // 수정 모드
      setCharactersList(prev => prev.map(c => {
        if (c.id === activeCharacterId) {
          return {
            ...c,
            name: charName,
            role: charRole,
            desc: charDesc,
            desire: charDesire,
            color: charColor
          };
        }
        return c;
      }));
      addToast(`인물 '${charName}'의 설정이 수정되었습니다.`, "success");
    } else {
      // 추가 모드
      const newChar = {
        id: `char_${Date.now()}`,
        name: charName,
        role: charRole,
        desc: charDesc,
        desire: charDesire,
        color: charColor
      };
      setCharactersList(prev => [...prev, newChar]);
      addToast(`신규 인물 '${charName}'이(가) 등록되었습니다!`, "success");
    }
    setIsCharacterModalOpen(false);
  };

  const handleDeleteCharacter = (id: string) => {
    setCharactersList(prev => prev.filter(c => c.id !== id));
    addToast("인물 정보가 삭제되었습니다.", "info");
    setIsCharacterModalOpen(false);
  };

  // 수동 AI 극화 분석 요청 시뮬레이션 (검색 소스 및 보관함 소스 대응)
  const handleTriggerQuickAnalysis = (id: string, isFromArchive = false) => {
    if (isAnalyzingQuick) return;
    setIsAnalyzingQuick(true);
    addToast(isFromArchive ? "보관함 자산에 대해 정밀 극화 추론을 개시합니다." : "선택된 기사에 대해 정밀 극화 자산 도출을 개시합니다.", "info");

    setTimeout(() => {
      setAnalyzedProjects(prev => ({
        ...prev,
        [id]: isFromArchive ? ARCHIVE_QUICK_INSIGHT_DATA : ACTUAL_QUICK_INSIGHT_DATA
      }));
      setIsAnalyzingQuick(false);
      addToast("기존 퀵 인사이트 정밀 가공 분석이 완벽히 완료되었습니다.", "success");
    }, 1200);
  };

  // 보관함 필터링 및 정렬 조건 연동 계산
  const filteredAndSortedArchives = useMemo(() => {
    let list = [...archivesList];
    if (archiveFilter !== "all") {
      list = list.filter(item => {
        if (archiveFilter === "text") return item.type === "직접 작성 메모";
        if (archiveFilter === "url") return item.type === "외부 링크 기사";
        if (archiveFilter === "file") return item.type === "첨부 파일 문서";
        return true;
      });
    }

    list.sort((a, b) => {
      if (archiveSort === "name") {
        return a.title.localeCompare(b.title, "ko");
      } else {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return list;
  }, [archivesList, archiveFilter, archiveSort]);

  // 모달창을 통한 신규 영감 수집 완료 처리
  const handleCollectInspiration = () => {
    if (collectUrl) {
      const newItem = {
        id: `ar_${Date.now()}`,
        title: `외부 링크 기사: ${collectUrl.replace("https://", "").substring(0, 20)}...`,
        desc: "수집된 외부 URL 소스 기사. 작가의 수동 AI 퀵 인사이트 분석 대기 중.",
        type: "외부 링크 기사",
        date: new Date().toISOString().split("T")[0],
        source: "외부 연동 기사",
        keyword: "수집 소스"
      };
      setArchivesList(prev => [newItem, ...prev]);
      addToast("외부 링크 수집 및 변환이 완료되었습니다.", "success");
      setCollectUrl("");
      setIsCollectModalOpen(false);
    } else if (collectFile) {
      const newItem = {
        id: `ar_${Date.now()}`,
        title: `첨부 파일 문서: ${collectFile.name}`,
        desc: `업로드된 파일(${collectFile.name}) 분석 자산 저장 완료.`,
        type: "첨부 파일 문서",
        date: new Date().toISOString().split("T")[0],
        source: "로컬 파일",
        keyword: "문서 자산"
      };
      setArchivesList(prev => [newItem, ...prev]);
      addToast(`파일 '${collectFile.name}' 업로드 및 보관 처리가 완료되었습니다.`, "success");
      setCollectFile(null);
      setIsCollectModalOpen(false);
    } else {
      addToast("수집할 URL을 입력하거나 파일을 선택해주세요.", "error");
    }
  };

  // 신규 드라마 프로젝트 동적 생성 처리 함수
  const handleCreateNewProject = () => {
    if (!newProjectName.trim()) {
      addToast("드라마 프로젝트의 제목을 입력해주세요.", "error");
      return;
    }

    const newId = `proj_${Date.now()}`;
    const newProj = {
      id: newId,
      name: `프로젝트: ${newProjectName}`,
      genre: newProjectGenre,
      logline: newProjectLogline || "작품의 로그라인이 아직 입력되지 않았습니다. 기획 정보에서 채워주세요."
    };

    setProjectsList(prev => [...prev, newProj]);
    setSelectedProjectId(newId); 
    setIsProjectModalOpen(false);
    
    setNewProjectName("");
    setNewProjectGenre("스릴러");
    setNewProjectLogline("");

    addToast(`신규 드라마 '${newProjectName}' 기획 워크스페이스가 생성되었습니다!`, "success");
  };

  // 사이드바 리사이즈 이벤트
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) {
        setSidebarWidth(Math.max(200, Math.min(450, e.clientX - 60))); 
      }
    };
    const handleMouseUp = () => setIsResizingSidebar(false);
    
    if (isResizingSidebar) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingSidebar]);

  const currentProject = useMemo(() => {
    return projectsList.find(p => p.id === selectedProjectId) || projectsList[0];
  }, [selectedProjectId, projectsList]);

  // 피드백 반영: 기사 검색 탭인지 보관함 탭인지에 따라 현재 선택된 액티브 소스 자동 분리 매핑
  const selectedInspiration = useMemo(() => {
    if (inspirationSubTab === "search") {
      return DUMMY_INSPIRATIONS.find(i => i.id === selectedInspId) || DUMMY_INSPIRATIONS[0];
    } else {
      // 보관함 아이템 1:1 대응
      const item = archivesList.find(a => a.id === selectedArchiveId);
      if (item) {
        return {
          id: item.id,
          title: item.title,
          desc: item.desc,
          date: item.date,
          source: item.source || "보관함 소스",
          keyword: item.keyword || "보관 데이터",
          url: "https://scriptly.co.kr/archive-view"
        };
      }
      return {
        id: "ar_1",
        title: "강남 유흥업소 소유주 비자금 장부 유출",
        desc: "회계 조작 및 비자금 배달원 진술 확보서.",
        date: "2026-05-24",
        source: "작가 집필 기록",
        keyword: "유흥업소 비자금",
        url: "https://scriptly.co.kr/archive-view"
      };
    }
  }, [selectedInspId, selectedArchiveId, inspirationSubTab, archivesList]);

  // 피드백 반영: 현재 프로젝트에 연동되어 참고 패널(Reference Shelf)에 보여질 영감 상세 리스트 계산
  const linkedReferenceItems = useMemo(() => {
    const list: any[] = [];
    
    // 1. DUMMY_INSPIRATIONS 에서 매칭
    DUMMY_INSPIRATIONS.forEach(item => {
      if (projectLinkedInspirations.includes(item.id)) {
        list.push({
          id: item.id,
          title: item.title,
          desc: item.desc,
          type: "기사 검색 소스",
          date: item.date,
          source: item.source,
          vibe: "리얼리즘 사회 고발 정치 스릴러"
        });
      }
    });

    // 2. DUMMY_ARCHIVES 에서 매칭
    archivesList.forEach(item => {
      if (projectLinkedInspirations.includes(item.id)) {
        list.push({
          id: item.id,
          title: item.title,
          desc: item.desc,
          type: item.type,
          date: item.date,
          source: item.source || "보관함 소스",
          vibe: "다크 누아르 사법 카르텔 스릴러"
        });
      }
    });

    return list;
  }, [projectLinkedInspirations, archivesList]);

  return (
    <div className={cn(
      "flex h-screen w-screen overflow-hidden font-sans transition-all duration-300 antialiased selection:bg-amber-500/30 selection:text-amber-200 relative", 
      isDarkMode ? "dark bg-[#0D0D11] text-[#E4E4ED]" : "bg-[#F8F9FC] text-[#1E202B]"
    )}>
      
      {/* 1. Activity Bar (맨 왼쪽) */}
      <aside className={cn(
        "w-[64px] flex flex-col items-center py-6 gap-8 border-r z-45 shrink-0",
        isDarkMode ? "bg-[#09090C] border-zinc-800/80" : "bg-[#F0F2F7] border-zinc-200"
      )}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
          <PenTool size={20} className="text-white" />
        </div>

        <nav className="flex flex-col gap-3 w-full px-2 flex-1">
          {[
            { id: "inspiration", icon: Sparkles, label: "영감 검색 & 보관" },
            { id: "workspace", icon: Folder, label: "작업 공간" }
          ].map(tab => {
            const isActive = activeActivity === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveActivity(tab.id as any);
                  addToast(`'${tab.label}' 메뉴로 전환되었습니다.`, "info");
                }}
                title={tab.label}
                className={cn(
                  "relative group w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                  isActive 
                    ? (isDarkMode ? "bg-amber-500 text-black shadow-lg shadow-amber-500/10 font-bold" : "bg-[#1E202B] text-white shadow-md font-bold")
                    : (isDarkMode ? "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-200" : "text-zinc-500 hover:bg-zinc-300/40 hover:text-zinc-900")
                )}
              >
                <tab.icon size={22} className="transition-transform group-hover:scale-105" />
                <div className={cn(
                  "absolute left-16 px-3 py-1.5 rounded-lg text-xs font-bold pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 shadow-xl whitespace-nowrap",
                  isDarkMode ? "bg-[#181822] text-zinc-100 border border-zinc-800" : "bg-white text-zinc-900 border border-zinc-200"
                )}>
                  {tab.label}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-4 w-full">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
              isDarkMode ? "text-amber-400 hover:bg-zinc-900" : "text-zinc-600 hover:bg-zinc-200"
            )}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button 
            onClick={() => addToast("설정 패널은 정식 오픈 버전에서 활성화됩니다.", "info")}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
              isDarkMode ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200"
            )}
          >
            <Settings size={18} />
          </button>

          <div className="w-9 h-9 rounded-full bg-zinc-700/60 border border-zinc-500/30 overflow-hidden flex items-center justify-center shadow-md active:scale-95 transition-all">
            <span className="text-xs font-bold text-amber-500">작가</span>
          </div>
        </div>
      </aside>

      {/* 2. Explorer Sidebar (사이드바) */}
      <aside 
        style={{ width: `${sidebarWidth}px` }}
        className={cn(
          "relative flex flex-col h-full border-r shrink-0 select-none transition-all duration-75 z-40",
          isDarkMode ? "bg-[#111115] border-zinc-800/80" : "bg-[#F5F6FA] border-zinc-200"
        )}
      >
        <div 
          onMouseDown={() => setIsResizingSidebar(true)}
          className={cn(
            "absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-amber-500/50 transition-colors z-50",
            isResizingSidebar ? "bg-amber-500 w-1.5" : ""
          )} 
        />
        
        {/* A. 영감 검색 & 보관 통합 사이드바 */}
        {activeActivity === "inspiration" && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="p-5 border-b border-zinc-800/20 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black tracking-wider uppercase text-amber-500">영감 기획실</h3>
                
              </div>
              
              <div className={cn(
                "p-1 rounded-xl flex gap-1",
                isDarkMode ? "bg-zinc-900/80" : "bg-zinc-200/50"
              )}>
                <button
                  onClick={() => {
                    setInspirationSubTab("search");
                    addToast("메인 패널에 '영감 검색' 화면이 넓게 열립니다.", "info");
                  }}
                  className={cn(
                    "flex-1 text-center py-2 text-[11px] font-bold rounded-lg transition-all",
                    inspirationSubTab === "search"
                      ? (isDarkMode ? "bg-zinc-800 text-amber-400 shadow-md" : "bg-white text-zinc-900 shadow-sm")
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  영감 검색
                </button>
                <button
                  onClick={() => {
                    setInspirationSubTab("archive");
                    addToast("메인 패널에 '영감 보관함' 화면이 넓게 열립니다.", "info");
                  }}
                  className={cn(
                    "flex-1 text-center py-2 text-[11px] font-bold rounded-lg transition-all",
                    inspirationSubTab === "archive"
                      ? (isDarkMode ? "bg-zinc-800 text-amber-400 shadow-md" : "bg-white text-zinc-900 shadow-sm")
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  영감 보관함
                </button>
              </div>
            </div>

            <div className="p-4 flex flex-col gap-5 flex-1">
              {inspirationSubTab === "search" ? (
                <>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">검색 설정</span>
                  <div className="flex flex-col gap-3">
                    <div className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all",
                      isDarkMode ? "bg-zinc-900/50 border-zinc-800 focus-within:border-amber-500/50" : "bg-white border-zinc-200 focus-within:border-amber-500"
                    )}>
                      <Search size={14} className="text-zinc-500" />
                      <input 
                        placeholder="사건 키워드 입력..." 
                        className="bg-transparent border-none outline-none text-xs w-full font-medium"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] text-zinc-500 font-bold">인기 검색 태그</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["비자금", "납치", "딥페이크", "로비"].map(tag => (
                          <span key={tag} className="text-[9px] bg-zinc-800 text-zinc-400 hover:text-amber-400 hover:bg-zinc-700/50 px-2 py-1 rounded-md cursor-pointer transition-all">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* 필터 조건 및 정렬 조건을 명확히 이원화하여 분리 설계 */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-1">
                        <Filter size={10} />
                        필터 조건
                      </span>
                      <select 
                        value={archiveFilter}
                        onChange={(e) => {
                          setArchiveFilter(e.target.value);
                          addToast(`필터가 '${e.target.value === "all" ? "전체" : e.target.value === "text" ? "직접 작성 메모" : e.target.value === "url" ? "외부 링크 기사" : "첨부 파일 문서"}'(으)로 적용되었습니다.`, "info");
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-xs font-bold outline-none border rounded-xl appearance-none cursor-pointer",
                          isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-800"
                        )}
                      >
                        <option value="all">전체 자산 보기</option>
                        <option value="text">✍️ 직접 작성 메모</option>
                        <option value="url">🔗 외부 링크 기사</option>
                        <option value="file">📁 첨부 파일 문서</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-1">
                        <SortAsc size={10} />
                        정렬 방식
                      </span>
                      <select 
                        value={archiveSort}
                        onChange={(e) => {
                          setArchiveSort(e.target.value);
                          addToast(`정렬 조건이 '${e.target.value === "date" ? "최신 날짜순" : "제목 이름순"}'으로 변경되었습니다.`, "info");
                        }}
                        className={cn(
                          "w-full px-3 py-2 text-xs font-bold outline-none border rounded-xl appearance-none cursor-pointer",
                          isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-800"
                        )}
                      >
                        <option value="date">⏳ 수집 날짜순</option>
                        <option value="name">🔤 제목 이름순</option>
                      </select>
                    </div>

                    {/* 신규 영감 수집 클릭 시 모달창 실행 버튼 */}
                    <button 
                      onClick={() => setIsCollectModalOpen(true)}
                      className="w-full py-3 bg-amber-500 text-black hover:bg-amber-400 text-xs font-black rounded-xl transition-all text-center flex items-center justify-center gap-1.5 shadow-md active:scale-95 mt-4"
                    >
                      <Plus size={14} />
                      <span>신규 영감 수집</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* B. 작업 공간 (Workspace) 사이드바 */}
        {activeActivity === "workspace" && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            {/* 프로젝트 선택기 및 신설 헤더 */}
            <div className="p-5 border-b border-zinc-800/20 flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black tracking-wider uppercase text-zinc-500">ACTIVE WORKSPACE</span>
                <button 
                  onClick={() => setIsProjectModalOpen(true)}
                  className="p-1.5 hover:bg-zinc-800 rounded text-amber-500 hover:text-amber-400 transition-all"
                  title="신규 드라마 프로젝트 기획"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="relative">
                <select 
                  value={selectedProjectId}
                  onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    addToast(`프로젝트가 '${projectsList.find(p => p.id === e.target.value)?.name}'로 변경되었습니다.`, "success");
                  }}
                  className={cn(
                    "w-full px-3 py-2.5 rounded-xl border text-xs font-extrabold outline-none appearance-none cursor-pointer pr-8 transition-all",
                    isDarkMode ? "bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800/50" : "bg-white border-zinc-200 text-zinc-900"
                  )}
                >
                  {projectsList.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* 프로젝트 세부 집필/기획 하위 메뉴 트리 */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2 mb-2 block">드라마 기획 & 집필 도구</span>
                
                {[
                  { id: "info", label: "프로젝트 정보", icon: Info, color: "text-blue-400" },
                  { id: "characters", label: "캐릭터 맵", icon: Users, color: "text-emerald-400" },
                  { id: "plot", label: "플롯 이벤트", icon: GitCommit, color: "text-purple-400" },
                  { id: "draft", label: "초안 & 시놉시스", icon: FileText, color: "text-pink-400" },
                  { id: "editor", label: "대본 작성기", icon: PenTool, color: "text-amber-400" }
                ].map(menu => {
                  const isSelected = activeWorkspaceTab === menu.id;
                  return (
                    <button
                      key={menu.id}
                      onClick={() => {
                        setActiveWorkspaceTab(menu.id as any);
                        addToast(`'${menu.label}' 캔버스가 활성화되었습니다.`, "info");
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-3.5 rounded-xl text-left transition-all active:scale-95 group",
                        isSelected
                          ? (isDarkMode ? "bg-[#252535] text-white border border-[#3b3b55] font-bold shadow-xl shadow-black/10" : "bg-[#EAEFFD] text-[#3b59f6] border border-[#d2dcfb] font-bold")
                          : (isDarkMode ? "text-zinc-400 hover:bg-zinc-900 hover:text-white" : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900")
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <menu.icon size={16} className={cn(menu.color, isSelected ? "scale-110" : "group-hover:scale-105 transition-transform")} />
                        <span className="text-xs font-semibold">{menu.label}</span>
                      </div>
                      <ChevronRight size={12} className={cn("text-zinc-600 group-hover:translate-x-0.5 transition-transform", isSelected ? "text-white" : "")} />
                    </button>
                  );
                })}
              </div>

              {activeWorkspaceTab === "editor" && (
                <div className="mt-4 border-t border-zinc-800/40 pt-4 flex flex-col gap-2 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">OUTLINE (실시간 파싱)</span>
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-black">{outline.length} Scenes</span>
                  </div>
                  <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto custom-scrollbar-dark p-1">
                    {outline.map((scene, index) => (
                      <div 
                        key={scene.id}
                        onClick={() => addToast(`선택된 '${scene.title}'로 에디터 스크롤을 이동(시뮬레이션)합니다.`, "info")}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg text-[11px] cursor-pointer hover:bg-zinc-800/30 transition-all min-w-0 group",
                          isDarkMode ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-600 hover:text-zinc-900"
                        )}
                      >
                        <CornerDownRight size={10} className="text-zinc-600 group-hover:text-amber-500" />
                        <span className="truncate font-medium">{scene.title}</span>
                      </div>
                    ))}
                    {outline.length === 0 && (
                      <span className="text-[10px] text-zinc-600 text-center py-4">대본에 # 씬 소제목을 입력해보세요.</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* 3. Main Workspace (메인 에디터 및 캔버스 영역) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* 상단 통합 헤더 */}
        <header className={cn(
          "h-16 border-b flex items-center justify-between px-8 z-40 shrink-0",
          isDarkMode ? "bg-[#0D0D11] border-zinc-800/80" : "bg-white border-zinc-200"
        )}>
          <div className="flex items-center gap-2.5 text-xs font-medium">
            {activeActivity === "inspiration" ? (
              <>
                <Sparkles size={14} className="text-amber-500" />
                <span className="font-bold">영감 기획실</span>
                <ChevronRight size={12} className="text-zinc-600" />
                <span className={cn("font-extrabold uppercase tracking-wide", isDarkMode ? "text-zinc-300" : "text-zinc-800")}>
                  {inspirationSubTab === "search" ? "영감 검색 (스카우터)" : "영감 보관함"}
                </span>
              </>
            ) : (
              <>
                <Folder size={14} className="text-amber-500" />
                <span className="font-bold">{currentProject.name}</span>
                <ChevronRight size={12} className="text-zinc-600" />
                <span className={cn("font-extrabold uppercase tracking-wide", isDarkMode ? "text-zinc-300" : "text-zinc-800")}>
                  {activeWorkspaceTab === "info" && "프로젝트 정보"}
                  {activeWorkspaceTab === "characters" && "캐릭터 관계도"}
                  {activeWorkspaceTab === "plot" && "플롯 타임라인"}
                  {activeWorkspaceTab === "draft" && "AI 초안 & 시놉시스"}
                  {activeWorkspaceTab === "editor" && "대본 작성기 (Markdown)"}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setIsRightPanelOpen(!isRightPanelOpen);
                addToast(isRightPanelOpen ? "우측 분할 참고 뷰를 접었습니다." : "우측 분할 참고 뷰를 열었습니다.", "info");
              }}
              className={cn(
                "p-2 rounded-lg border transition-all",
                isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white" : "bg-white border-zinc-200 text-zinc-600 hover:text-zinc-950"
              )}
              title="우측 참고 분할 뷰 토글"
            >
              {isRightPanelOpen ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </header>

        {/* 중앙 워크스페이스 컨텐츠 영역 */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* 영감(Inspiration) 대메뉴 탭일 때 */}
          {activeActivity === "inspiration" && (
            <div className="flex-1 flex overflow-hidden animate-in fade-in duration-300">
              
              {/* 1. 영감 검색 (Scouter) 메인 화면 */}
              {inspirationSubTab === "search" && (
                <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-black tracking-tight">영감 스카우터 (LIVE 기사 검색)</h2>
                    <p className="text-xs text-zinc-500">사실 기반의 뉴스를 실시간으로 검색하여 드라마 갈등 자산으로 발굴합니다.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                    {DUMMY_INSPIRATIONS.map(insp => (
                      <div 
                        key={insp.id}
                        onClick={() => {
                          setSelectedInspId(insp.id);
                          addToast(`'${insp.title}'의 퀵 인사이트 정보를 우측 패널에 불러왔습니다.`, "success");
                        }}
                        className={cn(
                          "p-6 rounded-2xl border cursor-pointer transition-all duration-300 hover:scale-[1.01] flex flex-col gap-3 group relative overflow-hidden",
                          selectedInspId === insp.id 
                            ? (isDarkMode ? "bg-[#1E1E28] border-amber-500 shadow-xl shadow-amber-500/5" : "bg-amber-50/40 border-amber-500 shadow-md")
                            : (isDarkMode ? "bg-[#14141A] border-zinc-800 hover:border-zinc-700" : "bg-white border-zinc-200 hover:border-zinc-300")
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-black">{insp.keyword}</span>
                          <span className="text-[10px] text-zinc-500 font-semibold">{insp.source}</span>
                        </div>
                        <h3 className={cn(
                          "text-sm font-black leading-relaxed group-hover:text-amber-400 transition-colors",
                          selectedInspId === insp.id ? "text-amber-400" : "text-white"
                        )}>
                          {insp.title}
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed font-semibold line-clamp-3">
                          {insp.desc}
                        </p>
                        
                        <div className="flex items-center justify-between border-t border-zinc-800/10 pt-3 mt-1">
                          <span className="text-[10px] text-zinc-500">{insp.date}</span>
                          <span className="text-[10px] text-amber-500 hover:underline font-bold flex items-center gap-1">
                            <Sparkles size={10} />
                            우측 퀵 인사이트 보기 →
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. 영감 보관함 (Archive) 메인 화면 */}
              {inspirationSubTab === "archive" && (
                <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-black tracking-tight">수집된 영감 보관함</h2>
                    <p className="text-xs text-zinc-500">대본 및 캐릭터 관계 설계 시 갈등의 축으로 삼을 수 있는 극화 변환 조각들입니다.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
                    {filteredAndSortedArchives.map(item => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          // 피드백 반영: 보관함 항목 클릭 시 우측 패널 연동!
                          setSelectedArchiveId(item.id);
                          addToast(`보관 자산 '${item.title}'의 퀵 인사이트 정보를 우측 패널에 1:1 불러왔습니다.`, "success");
                        }}
                        className={cn(
                          "p-6 rounded-2xl border cursor-pointer transition-all duration-300 hover:-translate-y-0.5 flex flex-col gap-3 relative overflow-hidden",
                          selectedArchiveId === item.id && activeActivity === "inspiration" && inspirationSubTab === "archive"
                            ? (isDarkMode ? "bg-[#1E1E28] border-amber-500 shadow-xl shadow-amber-500/5" : "bg-amber-50/40 border-amber-500 shadow-md")
                            : (isDarkMode ? "bg-[#14141A] border-zinc-800 hover:border-zinc-700" : "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm")
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full font-black">{item.type}</span>
                          <span className="text-[10px] text-zinc-500 font-semibold">{item.date}</span>
                        </div>
                        <h3 className="text-sm font-black leading-relaxed hover:text-amber-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed font-medium flex-1">
                          {item.desc}
                        </p>
                        
                        <div className="flex items-center justify-between border-t border-zinc-800/10 pt-3">
                          <span className="text-[10px] text-zinc-500 font-bold">갈등 지수: 85%</span>
                          {/* 피드백 반영: 프로젝트 연결(Link) 및 연결해제 동적 시뮬레이션 */}
                          {projectLinkedInspirations.includes(item.id) ? (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjectLinkedInspirations(prev => prev.filter(id => id !== item.id));
                                addToast("현재 프로젝트 연결을 해제했습니다.", "info");
                              }}
                              className="text-[10px] bg-amber-500/15 border border-amber-500/30 text-amber-400 px-2 py-1 rounded font-bold transition-all flex items-center gap-1"
                            >
                              <Check size={10} />
                              연결됨
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjectLinkedInspirations(prev => [...prev, item.id]);
                                addToast("현재 드라마 프로젝트에 자산으로 연결(Link)했습니다!", "success");
                              }}
                              className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-1 rounded font-bold transition-all"
                            >
                              프로젝트 연결
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredAndSortedArchives.length === 0 && (
                      <div className="col-span-3 text-center py-16 text-zinc-500 text-xs">
                        해당 필터 조건에 부합하는 수집 자산이 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* B. 프로젝트 정보 탭 */}
          {activeActivity === "workspace" && activeWorkspaceTab === "info" && (
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="max-w-3xl flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-2xl font-black tracking-tight">드라마 프로젝트 기획안</h2>
                  <p className="text-xs text-zinc-500">작품의 핵심 정체성과 기획 방향을 기록하고 관리합니다.</p>
                </div>

                <div className={cn(
                  "p-6 rounded-2xl border flex flex-col gap-5",
                  isDarkMode ? "bg-[#14141A] border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
                )}>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider">드라마 제목</label>
                    <input 
                      key={currentProject.id}
                      defaultValue={currentProject.name.replace("프로젝트: ", "")}
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl border text-sm font-bold outline-none",
                        isDarkMode ? "bg-zinc-900/50 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200"
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider">편성 및 장르</label>
                      <input 
                        key={currentProject.id}
                        defaultValue={currentProject.genre}
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl border text-sm font-bold outline-none",
                          isDarkMode ? "bg-zinc-900/50 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200"
                        )}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider">포커스 에이전트 모드</label>
                      <div className={cn(
                        "px-4 py-2.5 rounded-xl border text-sm font-bold flex items-center justify-between",
                        isDarkMode ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                      )}>
                        <span>극본 집중형 (자동화 꺼짐)</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider">로그라인 (줄거리 핵심요약)</label>
                    <textarea 
                      key={currentProject.id}
                      rows={3}
                      defaultValue={currentProject.logline}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border text-xs font-semibold leading-relaxed outline-none resize-none",
                        isDarkMode ? "bg-zinc-900/50 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200"
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      onClick={() => addToast("기획안이 임시 저장되었습니다.", "success")}
                      className="px-4 py-2 text-xs font-bold bg-amber-500 text-black hover:bg-amber-400 rounded-xl transition-all shadow-md active:scale-95"
                    >
                      기획 정보 저장
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* C. 캐릭터 맵 (Character Map) 탭 */}
          {activeActivity === "workspace" && activeWorkspaceTab === "characters" && (
            <div className="flex-1 flex flex-col p-8 overflow-hidden animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-black">시각적 캐릭터 관계도 & 인물 목록</h2>
                  <p className="text-xs text-zinc-500">전체 등장인물의 명단을 한눈에 살피며(나열), 그들 간의 갈등/공조 역학 관계(캔버스)를 설계합니다.</p>
                </div>
                <button 
                  onClick={handleOpenCharacterAdd}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 text-white border border-zinc-700 text-xs font-bold rounded-xl hover:bg-zinc-700/80 active:scale-95 transition-all"
                >
                  <Plus size={14} />
                  <span>인물 추가</span>
                </button>
              </div>

              {/* 피드백 반영: 좌측 인물 나열 패널 + 우측 관계도 캔버스 공존 레이아웃 설계 */}
              <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                
                {/* 1. 좌측 영역 (인물 나열 인덱스 - 290px 고정 폭) */}
                <div className={cn(
                  "w-[290px] border rounded-2xl p-4 flex flex-col gap-3 shrink-0 overflow-y-auto custom-scrollbar-dark select-none",
                  isDarkMode ? "bg-[#14141E]/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
                )}>
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800/20">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">등장인물 인덱스 ({charactersList.length})</span>
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-bold">List</span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {charactersList.map((char) => (
                      <div 
                        key={char.id}
                        onClick={() => handleOpenCharacterEdit(char)}
                        className={cn(
                          "p-3.5 rounded-xl border cursor-pointer transition-all hover:-translate-y-0.5 flex flex-col gap-1.5",
                          isDarkMode ? "bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700" : "bg-zinc-50 border-zinc-200 hover:border-zinc-300"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white">{char.name}</span>
                            <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold">주역</span>
                          </div>
                          <span className="text-[9px] text-zinc-500 font-semibold">{char.role.replace("주연 (", "").replace(")", "").replace("조연 (", "")}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed line-clamp-2">
                          {char.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. 우측 영역 (관계도 캔버스) */}
                <div className={cn(
                  "flex-grow rounded-2xl border relative overflow-hidden flex items-center justify-center p-6 min-h-0",
                  isDarkMode ? "bg-[#09090C] border-zinc-800" : "bg-[#F0F2F7] border-zinc-200"
                )}>
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

                  <div className="relative w-full h-full flex items-center justify-around z-10">
                    {charactersList.map((char, index) => (
                      <div 
                        key={char.id}
                        onClick={() => handleOpenCharacterEdit(char)}
                        style={{ transform: `translateY(${index % 2 === 0 ? '-30px' : '40px'})` }}
                        className={cn(
                          "w-48 p-4 rounded-xl border shadow-2xl cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 hover:border-amber-500/80",
                          isDarkMode ? "bg-[#14141E] border-zinc-800" : "bg-white border-zinc-200"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", char.color.split(" ")[0])} />
                          <span className="text-xs font-black">{char.name}</span>
                          <span className="text-[9px] text-zinc-500 font-bold ml-auto">{char.role}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-medium line-clamp-3">
                          {char.desc}
                        </p>
                      </div>
                    ))}
                    
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
                      <path 
                        d="M 180 180 Q 280 120 400 240" 
                        fill="none" 
                        stroke="#f59e0b" 
                        strokeWidth="2" 
                        strokeDasharray="4 4" 
                      />
                      <path 
                        d="M 400 240 Q 520 180 620 180" 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="2" 
                      />
                    </svg>
                    <div className="absolute top-[130px] left-[32%] bg-amber-500/20 text-amber-400 text-[9px] px-2 py-0.5 rounded font-black border border-amber-500/30">
                      불안한 대립 공조 관계
                    </div>
                    <div className="absolute top-[200px] left-[55%] bg-emerald-500/20 text-emerald-400 text-[9px] px-2 py-0.5 rounded font-black border border-emerald-500/30">
                      전폭적 신뢰 및 파트너
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* D. 플롯 이벤트 (Plot Events) 탭 */}
          {activeActivity === "workspace" && activeWorkspaceTab === "plot" && (
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between shrink-0">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-black">에피소드 플롯 타임라인</h2>
                  <p className="text-xs text-zinc-500">사건의 인과관계와 플롯 단계별 흐름을 드래그하여 순서를 기획합니다.</p>
                </div>
                <button 
                  onClick={() => addToast("새로운 플롯 카드 추가가 활성화됩니다.", "success")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-black text-xs font-bold rounded-xl hover:bg-amber-400 active:scale-95 transition-all"
                >
                  <Plus size={14} />
                  <span>플롯 추가</span>
                </button>
              </div>

              <div className="relative flex flex-col gap-8 pl-8 py-4">
                <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-zinc-800" />

                {DUMMY_EVENTS.map((event, idx) => (
                  <div 
                    key={event.id}
                    className="relative flex flex-col gap-2"
                  >
                    <div className="absolute -left-[27px] top-1.5 w-[16px] h-[16px] rounded-full bg-amber-500 border-4 border-[#0D0D11] flex items-center justify-center z-10" />

                    <div className={cn(
                      "p-5 rounded-2xl border flex flex-col gap-2 hover:border-amber-500/40 transition-all cursor-grab active:cursor-grabbing",
                      isDarkMode ? "bg-[#14141E] border-zinc-800" : "bg-white border-zinc-200"
                    )}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500 font-bold">EVENT #{idx + 1} • {event.duration}</span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => addToast(`EVENT #${idx + 1}을 위로 이동합니다.`, "info")}
                            className="p-1 hover:bg-zinc-800 rounded text-xs"
                          >
                            ▲
                          </button>
                          <button 
                            onClick={() => addToast(`EVENT #${idx + 1}을 아래로 이동합니다.`, "info")}
                            className="p-1 hover:bg-zinc-800 rounded text-xs"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                      <h4 className="text-sm font-black text-amber-400">{event.title}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                        {event.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* E. 초안 및 시놉시스 탭 */}
          {activeActivity === "workspace" && activeWorkspaceTab === "draft" && (
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-black">AI 시놉시스 & 초안 생성기</h2>
                  <p className="text-xs text-zinc-500">기록된 기획안과 플롯을 조합하여 AI가 드라마의 초안을 생성합니다.</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className={cn(
                  "col-span-1 p-5 rounded-2xl border flex flex-col gap-4",
                  isDarkMode ? "bg-[#14141E] border-zinc-800" : "bg-white border-zinc-200"
                )}>
                  <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest">생성 옵션 설정</h3>
                  
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-500 font-bold">생성 톤앤매너</span>
                    <select className={cn("w-full p-2.5 rounded-xl border text-xs font-bold outline-none", isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200")}>
                      <option>어둡고 묵직한 하드보일드</option>
                      <option>위트 있고 빠른 속도감</option>
                      <option>디테일한 법정 수사 중심</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-zinc-500 font-bold">반영할 플롯 소스</span>
                    <div className="flex flex-col gap-1.5">
                      {DUMMY_EVENTS.map(ev => (
                        <label key={ev.id} className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-zinc-800/30 rounded-lg">
                          <input type="checkbox" defaultChecked className="rounded border-zinc-800 accent-amber-500" />
                          <span className="text-[11px] truncate">{ev.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => addToast("시놉시스 초안 AI 생성을 수동으로 시작합니다.", "success")}
                    className="w-full py-3 bg-amber-500 text-black hover:bg-amber-400 text-xs font-black rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
                  >
                    <Sparkles size={14} />
                    <span>시놉시스 AI 생성 요청</span>
                  </button>
                </div>

                <div className={cn(
                  "col-span-2 p-6 rounded-2xl border flex flex-col gap-4 min-h-[400px]",
                  isDarkMode ? "bg-[#14141E]/40 border-zinc-800/80" : "bg-white border-zinc-200"
                )}>
                  <div className="flex items-center justify-between border-b border-zinc-800/20 pb-3">
                    <span className="text-xs font-black text-amber-500">생성된 시놉시스 초안 결과</span>
                    <button 
                      onClick={() => {
                        setActiveWorkspaceTab("editor");
                        addToast("생성된 기획서 시놉시스 뼈대를 대본 에디터로 내보냈습니다(시뮬레이션).", "success");
                      }}
                      className="px-2.5 py-1.5 rounded bg-zinc-800 text-[10px] text-zinc-300 font-bold hover:bg-zinc-700 active:scale-95 transition-all"
                    >
                      에디터로 내보내기 (Export to Editor)
                    </button>
                  </div>
                  <div className="flex-1 text-xs leading-relaxed font-semibold text-zinc-400 flex flex-col gap-4 overflow-y-auto max-h-[350px] p-2">
                    <p className="font-extrabold text-sm text-white">제1화: 어둠 속에 무전이 울리다 (시놉시스)</p>
                    <p>어두운 밤, 낡은 창고에 홀로 남겨진 황시목 검사는 우연히 서랍 깊숙이 묻혀있던 구형 무전기를 발견한다. 작동할 리 없는 방전된 고철 덩어리에서 갑자기 기직거리는 잡음과 함께 한 남자의 목소리가 흘러나온다.</p>
                    <p>"황시목 검사님, 들리십니까? 여긴 2012년의 이창준입니다..."</p>
                    <p>목소리는 14년 전 미궁 속으로 사라졌던 이창준 검사장의 신호였다. 시목은 극도의 냉정함을 유지하려 하지만, 이창준의 무전에서 흘러나오는 암호 코드가 현재 수사 중인 대기업 비자금 사건의 핵심 USB 해독키와 정확히 일치함을 확인하고 혼란에 빠진다. 한편 강력반의 한여진 형사는 현장에서 발견된 단서가 단순 자살이 아님을 직감하고 시목의 집무실을 방문하는데...</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* F. 대본 작성기 (Script Editor) 탭 */}
          {activeActivity === "workspace" && activeWorkspaceTab === "editor" && (
            <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
              
              <div className={cn(
                "h-12 border-b px-6 flex items-center justify-between shrink-0",
                isDarkMode ? "bg-[#111116] border-zinc-800/80" : "bg-[#F5F6FA] border-zinc-200"
              )}>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-black border border-amber-500/20">WRITING MODE</span>
                  <div className="flex items-center gap-1.5 border-l border-zinc-800/40 pl-3">
                    <button 
                      onClick={() => addToast("씬 타이틀 서식(#)이 삽입됩니다.", "info")}
                      className="p-1 hover:bg-zinc-800 rounded text-xs font-bold text-zinc-400 hover:text-white"
                      title="씬 헤더 추가 (#)"
                    >
                      # 씬
                    </button>
                    <button 
                      onClick={() => addToast("인물 대사 괄호 서식()이 삽입됩니다.", "info")}
                      className="p-1 hover:bg-zinc-800 rounded text-xs font-bold text-zinc-400 hover:text-white"
                      title="지문 삽입"
                    >
                      (지문)
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-bold mr-2">320 Lines • 480 Characters</span>
                  <button 
                    onClick={() => addToast("대본 파일이 데이터베이스에 실시간 동기화 완료되었습니다.", "success")}
                    className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-bold rounded-lg hover:bg-zinc-700 active:scale-95 transition-all"
                  >
                    <Save size={12} className="text-amber-500" />
                    <span>저장 완료</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                <textarea 
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="대본 작성을 시작해보세요. # 기호로 씬 제목(예: # 1. 검사실 - 밤)을 입력하면 실시간으로 사이드바의 OUTLINE에 파싱됩니다."
                  className={cn(
                    "flex-1 p-8 outline-none border-none resize-none font-mono text-sm leading-relaxed overflow-y-auto custom-scrollbar-dark focus:ring-0",
                    isDarkMode ? "bg-[#09090C] text-zinc-200 focus:bg-[#07070a]" : "bg-white text-zinc-800 focus:bg-zinc-50/50"
                  )}
                  style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    letterSpacing: "0.03em"
                  }}
                />
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 4. 우측 보조 패널 (피드백 반영: 영감 기획실 vs 작업 공간 활성 탭에 따른 컨텍스트 이원화 탑재) */}
      {isRightPanelOpen && (
        <aside className={cn(
          "w-[390px] h-full border-l shrink-0 flex flex-col animate-in slide-in-from-right-4 duration-300 z-35 select-none",
          isDarkMode ? "bg-[#111115] border-zinc-800/80" : "bg-[#F5F6FA] border-zinc-200"
        )}>
          
          {/* A. [대메뉴: 영감 기획실] 일 때 우측 패널 -> 개별 퀵 인사이트(Quick Insight) 모드 */}
          {activeActivity === "inspiration" && (
            <>
              <div className="p-4 border-b border-zinc-800/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-500 animate-pulse" />
                  <span className="text-xs font-black tracking-wide">💡 퀵 인사이트 (Quick Insight)</span>
                </div>
                <button 
                  onClick={() => setIsRightPanelOpen(false)}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white"
                >
                  <XIcon size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 custom-scrollbar-dark">
                
                {/* 자산 정보 정보 */}
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">Active Source Info</span>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-black leading-snug text-white">
                      {selectedInspiration.title}
                    </h3>
                    <a 
                      href={selectedInspiration.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-zinc-800 hover:bg-zinc-700 rounded text-zinc-300 transition-all cursor-pointer shrink-0 mt-0.5"
                      title="기사 원문 링크 바로가기"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-semibold mt-1">
                    <span>{selectedInspiration.source}</span>
                    <span>•</span>
                    <span>{selectedInspiration.date}</span>
                  </div>
                </div>

                {/* AI 극화 분석 결과 */}
                <div className="flex flex-col gap-5 border-t border-zinc-800/30 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AI 극화 분석 리포트</span>
                    <span className="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded font-black">{selectedInspiration.keyword}</span>
                  </div>

                  {isAnalyzingQuick && (
                    <div className={cn(
                      "p-8 rounded-2xl border flex flex-col items-center justify-center gap-3 py-12 text-center",
                      isDarkMode ? "bg-[#14141E] border-zinc-800" : "bg-white border-zinc-200"
                    )}>
                      <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-bold text-amber-400 animate-pulse">드라마 갈등 가치 정밀 추출 중...</span>
                    </div>
                  )}

                  {!isAnalyzingQuick && !analyzedProjects[selectedInspiration.id] && (
                    <div className={cn(
                      "p-8 rounded-2xl border text-center flex flex-col items-center gap-3",
                      isDarkMode ? "bg-[#14141E]/40 border-zinc-800/60" : "bg-white border-zinc-200"
                    )}>
                      <HelpCircle size={24} className="text-zinc-600" />
                      <span className="text-[10px] text-zinc-500 leading-normal">
                        본 기사는 원문 그대로 수집된 상태입니다. 아래의 **[AI 분석 요청]** 버튼을 누르시면 긴장감 지수, 핵심 인물 욕망, 주요 사건 등 극화 핵심 요소가 실시간 설계됩니다.
                      </span>
                    </div>
                  )}

                  {/* 피드백 반영: 기사검색이든 보관함 아이템이든 1:1 통일된 극화 렌더링 */}
                  {!isAnalyzingQuick && analyzedProjects[selectedInspiration.id] && (
                    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                      
                      {/* 1. Dramatic Tension (긴장감 지수 게이지) */}
                      <div className={cn(
                        "p-4 rounded-xl border flex flex-col gap-3",
                        isDarkMode ? "bg-[#161622] border-zinc-800" : "bg-zinc-50 border-zinc-200"
                      )}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                            <Flame size={14} className="fill-amber-500" />
                            <span>Dramatic Tension</span>
                          </div>
                          <span className="text-xs font-black text-white">
                            <span className="text-amber-400 text-sm font-black">{analyzedProjects[selectedInspiration.id].score}</span> / 100
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-rose-600 rounded-full transition-all duration-1000"
                            style={{ width: `${analyzedProjects[selectedInspiration.id].score}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-semibold">
                          {analyzedProjects[selectedInspiration.id].scoreDesc}
                        </p>
                      </div>

                      {/* 2. 핵심 갈등 구조 */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                          <ShieldAlert size={12} className="text-rose-400" />
                          핵심 갈등 구조
                        </span>
                        <div className={cn(
                          "p-4 rounded-xl border-l-4 border-amber-500 border text-[11px] text-zinc-300 leading-relaxed font-extrabold",
                          isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                        )}>
                          "{analyzedProjects[selectedInspiration.id].conflictStructure}"
                        </div>
                      </div>

                      {/* 3. 자료 요약 및 분위기 제안 */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                          <Compass size={12} className="text-blue-400" />
                          자료 요약 및 분위기 제안
                        </span>
                        <div className={cn(
                          "p-4 rounded-xl border flex flex-col gap-3 text-[11px] text-zinc-400 leading-relaxed font-semibold",
                          isDarkMode ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-zinc-200"
                        )}>
                          <p>{analyzedProjects[selectedInspiration.id].summaryAndVibe}</p>
                          <div className="border-t border-zinc-800/30 pt-2 flex flex-col gap-1">
                            <span className="text-[10px] text-amber-500 font-black">추천 분위기</span>
                            <span className="text-white font-extrabold">{analyzedProjects[selectedInspiration.id].recommendedVibe}</span>
                          </div>
                        </div>
                      </div>

                      {/* 4. 주요 키워드 해시태그 */}
                      <div className="flex flex-wrap gap-1.5">
                        {analyzedProjects[selectedInspiration.id].keywords.map((kw: string) => (
                          <span key={kw} className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-1 rounded-md font-bold border border-zinc-700/50">
                            #{kw}
                          </span>
                        ))}
                      </div>

                      {/* 5. Related People (인물 추출) */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                          <UserCheck size={12} className="text-emerald-400" />
                          Related People (인물 추출)
                        </span>
                        <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto custom-scrollbar-dark pr-1">
                          {analyzedProjects[selectedInspiration.id].relatedPeople.map((person: any, idx: number) => (
                            <div 
                              key={idx}
                              className={cn(
                                "p-3 rounded-xl border flex flex-col gap-1.5",
                                isDarkMode ? "bg-zinc-900 border-zinc-800/80" : "bg-white border-zinc-200"
                              )}
                            >
                              <span className="text-[11px] font-extrabold text-white">{person.role}</span>
                              <p className="text-[10px] text-zinc-400 leading-normal">{person.desc}</p>
                              <div className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-black border border-emerald-500/20 w-fit">
                                욕망: {person.desire}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 6. Key Events / Incidents (사건 재료) */}
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                          <CheckSquare size={12} className="text-purple-400" />
                          Key Events / Incidents
                        </span>
                        <div className="flex flex-col gap-2">
                          {analyzedProjects[selectedInspiration.id].keyEvents.map((evt: string, idx: number) => (
                            <div key={idx} className="flex gap-2.5 items-start">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 mt-1.5" />
                              <span className="text-[11px] text-zinc-400 leading-relaxed font-semibold">{evt}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                </div>

                <div className="flex flex-col gap-3 border-t border-zinc-800/30 pt-4 shrink-0 mt-auto">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">드라마 갈등 자산화 제어</span>
                  
                  <div className="flex gap-2">
                    {analyzedProjects[selectedInspiration.id] ? (
                      <button 
                        disabled
                        className="flex-1 py-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1.5 opacity-80"
                      >
                        <Check size={12} />
                        <span>분석 완료</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleTriggerQuickAnalysis(selectedInspiration.id, inspirationSubTab === "archive")}
                        disabled={isAnalyzingQuick}
                        className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700/60 text-[11px] font-black rounded-lg transition-all text-center flex items-center justify-center gap-1.5"
                      >
                        <Sparkles size={12} />
                        <span>AI 분석 요청</span>
                      </button>
                    )}
                    
                    {/* 보관함 저장 / 또는 보관함 탭일 때는 프로젝트 연동 상태 토글 */}
                    {inspirationSubTab === "archive" ? (
                      projectLinkedInspirations.includes(selectedInspiration.id) ? (
                        <button 
                          onClick={() => {
                            setProjectLinkedInspirations(prev => prev.filter(id => id !== selectedInspiration.id));
                            addToast("프로젝트 연동을 해제했습니다.", "info");
                          }}
                          className="flex-1 py-2.5 bg-amber-500 text-black text-[11px] font-black rounded-lg transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Check size={12} />
                          프로젝트 연결됨
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setProjectLinkedInspirations(prev => [...prev, selectedInspiration.id]);
                            addToast("프로젝트에 참고 영감으로 연결했습니다!", "success");
                          }}
                          className="flex-1 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 text-[11px] font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          프로젝트 연결
                        </button>
                      )
                    ) : (
                      <button 
                        onClick={() => {
                          // 보관함에 아직 없는 경우 저장 시뮬레이션
                          addToast("영감 보관함에 영구 갈등 자산으로 저장 완료!", "success");
                        }}
                        className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-black rounded-lg transition-all text-center flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Archive size={12} />
                        보관함 저장
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}

          {/* B. [대메뉴: 작업 공간(Workspace)] 일 때 우측 패널 -> 프로젝트 참고 책장(Reference Shelf) 모드 */}
          {activeActivity === "workspace" && (
            <>
              <div className="p-4 border-b border-zinc-800/20 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <BookOpenCheck size={14} className="text-amber-500" />
                  <span className="text-xs font-black tracking-wide">📚 프로젝트 참고 책장 (Reference)</span>
                </div>
                <button 
                  onClick={() => setIsRightPanelOpen(false)}
                  className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white"
                >
                  <XIcon size={14} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar-dark">
                <div className="flex flex-col gap-2 shrink-0 mb-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      현재 프로젝트 연동 영감 자산 ({linkedReferenceItems.length})
                    </span>
                    <button 
                      onClick={() => {
                        setIsLinkArchiveModalOpen(true);
                        addToast("보관함에서 연동할 영감 목록 조회를 실행합니다.", "info");
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500 text-black hover:bg-amber-400 text-[10px] font-black rounded-xl transition-all shadow-md active:scale-95 shrink-0"
                    >
                      <Plus size={10} />
                      <span>보관함 영감 연동</span>
                    </button>
                  </div>
                  <p className="text-[9px] text-zinc-500 px-1 leading-relaxed">
                    작가가 대본을 쓰거나 인물을 설계할 때, 우측에 영감을 열어두고 실시간으로 대조하며 글을 쓸 수 있는 집필 밀착형 분할 뷰입니다.
                  </p>
                </div>

                {/* 아코디언 스타일의 연동 영감 목록 */}
                <div className="flex flex-col gap-3">
                  {linkedReferenceItems.map((refItem) => {
                    const isExpanded = openReferenceAccordionId === refItem.id;
                    return (
                      <div 
                        key={refItem.id}
                        className={cn(
                          "rounded-xl border transition-all duration-300 overflow-hidden flex flex-col",
                          isDarkMode 
                            ? (isExpanded ? "bg-[#191924] border-amber-500/40" : "bg-[#14141A] border-zinc-800/60 hover:border-zinc-700")
                            : (isExpanded ? "bg-amber-50/20 border-amber-500/40 shadow-sm" : "bg-white border-zinc-200 hover:border-zinc-300")
                        )}
                      >
                        {/* 아코디언 헤더 */}
                        <div 
                          onClick={() => {
                            setOpenReferenceAccordionId(isExpanded ? null : refItem.id);
                            addToast(`참고 자산 '${refItem.title}'이(가) ${isExpanded ? "접혔습니다." : "펼쳐졌습니다."}`, "info");
                          }}
                          className="p-3.5 flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <Bookmark size={12} className={isExpanded ? "text-amber-500" : "text-zinc-500"} />
                            <div className="flex flex-col min-w-0">
                              <span className={cn("text-xs font-black truncate", isExpanded ? "text-amber-400" : "text-white")}>
                                {refItem.title}
                              </span>
                              <span className="text-[9px] text-zinc-500 mt-0.5">{refItem.type} • {refItem.source}</span>
                            </div>
                          </div>
                          {isExpanded ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
                        </div>

                        {/* 아코디언 바디 (상세 요약 및 본문 노출) */}
                        {isExpanded && (
                          <div className={cn(
                            "px-4 pb-4 pt-2 text-[11px] leading-relaxed border-t flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200",
                            isDarkMode ? "border-zinc-800/50 bg-[#161620]/30 text-zinc-300 font-semibold" : "border-zinc-100 text-zinc-600"
                          )}>
                            <p className="font-extrabold text-white text-[11px]">📝 극화 리포트 & 씬 적용 단서</p>
                            <p className="bg-black/20 p-2.5 rounded-lg text-[10px] text-zinc-400 border border-zinc-800/40 leading-relaxed font-semibold">
                              {refItem.desc}
                            </p>
                            <div className="flex flex-col gap-1 border-t border-zinc-800/30 pt-2.5">
                              <span className="text-[9px] text-amber-500 font-black">추천 분위기 / 갈등 결</span>
                              <span className="text-[10px] text-white font-extrabold">{refItem.vibe}</span>
                            </div>
                            <div className="flex justify-end gap-2 mt-1 shrink-0">
                              <button 
                                onClick={() => addToast("본 영감에서 도출된 갈등 뼈대를 대본의 지문으로 자동 주입합니다 (데모).", "success")}
                                className="px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[9px] font-bold"
                              >
                                대본 지문 주입
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {linkedReferenceItems.length === 0 && (
                    <div className="text-center py-16 flex flex-col items-center gap-2 text-zinc-500 text-xs">
                      <Bookmark size={20} className="text-zinc-700" />
                      <span>본 프로젝트에 연동된 영감이 없습니다.</span>
                      <span className="text-[10px] text-zinc-600">영감 기획실 ＞ 보관함에서 원하는 자산의 '프로젝트 연결' 버튼을 눌러보세요!</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </aside>
      )}

      {/* 5. 신규 영감 수집 모달창 (Modal) */}
      {isCollectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div 
            className={cn(
              "w-full max-w-lg rounded-2xl border shadow-2xl p-6 flex flex-col gap-6 animate-in zoom-in-95 duration-200",
              isDarkMode ? "bg-[#14141D] border-zinc-800" : "bg-white border-zinc-200"
            )}
          >
            <div className="flex items-center justify-between border-b border-zinc-800/20 pb-4">
              <div className="flex items-center gap-2">
                <Archive size={16} className="text-amber-500" />
                <h3 className="text-sm font-black text-white">신규 극작 영감 자산 수집</h3>
              </div>
              <button 
                onClick={() => {
                  setIsCollectModalOpen(false);
                  setCollectUrl("");
                  setCollectFile(null);
                }}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={12} />
                외부 링크 (URL) 수집 및 드라마 자산 변환
              </label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={collectUrl}
                  onChange={(e) => {
                    setCollectUrl(e.target.value);
                    setCollectFile(null); 
                  }}
                  placeholder="https://로 시작하는 뉴스 기사 혹은 블로그 URL 입력..."
                  className={cn(
                    "flex-1 px-3 py-2 text-xs border rounded-xl outline-none font-medium",
                    isDarkMode ? "bg-zinc-900/50 border-zinc-800 text-white focus:border-amber-500/50" : "bg-zinc-50 border-zinc-200 focus:border-amber-500"
                  )}
                />
              </div>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-zinc-800/40"></div>
              <span className="flex-shrink mx-4 text-[9px] text-zinc-500 font-bold">OR</span>
              <div className="flex-grow border-t border-zinc-800/40"></div>
            </div>

            <div className="flex flex-col gap-2.5">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <Upload size={12} />
                첨부 파일 업로드 (PDF, TXT, DOCX)
              </label>
              <div 
                onClick={() => addToast("파일 탐색기가 실행되었습니다. (시뮬레이션)", "info")}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-amber-500/50 transition-all flex flex-col items-center justify-center gap-2",
                  collectFile 
                    ? "border-emerald-500/50 bg-emerald-500/5" 
                    : (isDarkMode ? "border-zinc-800 bg-zinc-900/30" : "border-zinc-200 bg-zinc-50")
                )}
              >
                <File size={24} className={collectFile ? "text-emerald-500" : "text-zinc-500"} />
                {collectFile ? (
                  <span className="text-xs font-bold text-emerald-400">{collectFile.name} 선택됨</span>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold">파일을 드래그앤드롭하거나 마우스로 클릭</span>
                    <span className="text-[10px] text-zinc-500">최대 용량 10MB • 극화 분석 자동 가공</span>
                  </div>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCollectFile({ name: "2026_정관계_비리수사기록_요약본.docx" } as any);
                    setCollectUrl(""); 
                    addToast("시뮬레이션 파일이 선택되었습니다.", "success");
                  }}
                  className="px-2 py-1 bg-zinc-800 text-[9px] text-zinc-300 font-bold rounded border border-zinc-700 hover:bg-zinc-700 mt-2"
                >
                  시뮬레이션 파일 선택
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-800/20 pt-4 mt-2">
              <button 
                onClick={() => {
                  setIsCollectModalOpen(false);
                  setCollectUrl("");
                  setCollectFile(null);
                }}
                className="px-4 py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl transition-all active:scale-95"
              >
                취소
              </button>
              <button 
                onClick={handleCollectInspiration}
                className="px-4 py-2 text-xs font-black bg-amber-500 text-black hover:bg-amber-400 rounded-xl transition-all shadow-md active:scale-95"
              >
                영감 자산 수집 시작
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. 신규 드라마 프로젝트 생성 모달창 (Modal) */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div 
            className={cn(
              "w-full max-w-lg rounded-2xl border shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200",
              isDarkMode ? "bg-[#14141D] border-zinc-800" : "bg-white border-zinc-200"
            )}
          >
            <div className="flex items-center justify-between border-b border-zinc-800/20 pb-4">
              <div className="flex items-center gap-2">
                <FolderPlus size={18} className="text-amber-500" />
                <h3 className="text-sm font-black text-white">신규 드라마 기획 워크스페이스 개설</h3>
              </div>
              <button 
                onClick={() => {
                  setIsProjectModalOpen(false);
                  setNewProjectName("");
                  setNewProjectLogline("");
                }}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <PenTool size={12} />
                드라마 제목 (프로젝트명)
              </label>
              <input 
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="예) 시그널 시즌2, 비밀의 숲 3..."
                className={cn(
                  "w-full px-3 py-2.5 text-xs border rounded-xl outline-none font-bold",
                  isDarkMode ? "bg-zinc-900/50 border-zinc-800 text-white focus:border-amber-500/50" : "bg-zinc-50 border-zinc-200 focus:border-amber-500"
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <Palette size={12} />
                작품 장르 및 연출 톤
              </label>
              <select 
                value={newProjectGenre}
                onChange={(e) => setNewProjectGenre(e.target.value)}
                className={cn(
                  "w-full px-3 py-2.5 text-xs border rounded-xl outline-none font-bold cursor-pointer",
                  isDarkMode ? "bg-zinc-900/50 border-zinc-800 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-800"
                )}
              >
                <option value="스릴러/판타지">스릴러 / 판타지</option>
                <option value="정치/범죄/스릴러">정치 / 범죄 / 리얼 수사극</option>
                <option value="로맨스/멜로">로맨스 / 정통 멜로</option>
                <option value="휴먼/가족">휴먼 드라마 / 가족극</option>
                <option value="퓨전 사극">퓨전 사극 / 역사 대하극</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={12} />
                로그라인 (시놉시스 핵심 한 줄 기획의도)
              </label>
              <textarea 
                rows={3}
                value={newProjectLogline}
                onChange={(e) => setNewProjectLogline(e.target.value)}
                placeholder="인물의 욕망과 극적인 핵심 갈등이 드러나는 전체 드라마의 뼈대 스토리를 한 줄로 요약해 적어주세요..."
                className={cn(
                  "w-full px-3 py-2.5 text-xs border rounded-xl outline-none font-medium leading-relaxed resize-none",
                  isDarkMode ? "bg-zinc-900/50 border-zinc-800 text-white focus:border-amber-500/50" : "bg-zinc-50 border-zinc-200 focus:border-amber-500"
                )}
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-800/20 pt-4 mt-2">
              <button 
                onClick={() => {
                  setIsProjectModalOpen(false);
                  setNewProjectName("");
                  setNewProjectLogline("");
                }}
                className="px-4 py-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl transition-all active:scale-95"
              >
                취소
              </button>
              <button 
                onClick={handleCreateNewProject}
                className="px-5 py-2 text-xs font-black bg-amber-500 text-black hover:bg-amber-400 rounded-xl transition-all shadow-md active:scale-95"
              >
                드라마 프로젝트 생성
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 7. 피드백 반영: 프로젝트에서 영감 불러오기(연동하기) 모달창 (Modal) */}
      {isLinkArchiveModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div 
            className={cn(
              "w-full max-w-2xl rounded-2xl border shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200",
              isDarkMode ? "bg-[#14141D] border-zinc-800" : "bg-white border-zinc-200"
            )}
          >
            <div className="flex items-center justify-between border-b border-zinc-800/20 pb-4">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-amber-500" />
                <h3 className="text-sm font-black text-white">보관함 영감 불러오기 및 프로젝트 연동</h3>
              </div>
              <button 
                onClick={() => setIsLinkArchiveModalOpen(false)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-xs text-zinc-400">보관함 및 기사 스카우터에서 수집된 극화 영감 자산 리스트입니다. 프로젝트에 연결할 영감을 체크하여 불러오세요.</p>
              <p className="text-[10px] text-zinc-500 mt-1">※ 연동된 영감은 대본 작성 화면의 우측 '참고 책장'에서 아코디언 형태로 펼쳐 대조하며 글을 쓸 수 있습니다.</p>
            </div>

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar-dark p-1">
              {allAvailableInspirations.map((item) => {
                const isLinked = projectLinkedInspirations.includes(item.id);
                return (
                  <div 
                    key={item.id}
                    onClick={() => {
                      if (isLinked) {
                        setProjectLinkedInspirations(prev => prev.filter(id => id !== item.id));
                        addToast(`'${item.title}' 연동을 해제했습니다.`, "info");
                      } else {
                        setProjectLinkedInspirations(prev => [...prev, item.id]);
                        addToast(`'${item.title}'을(를) 프로젝트에 연동 자산으로 연결했습니다!`, "success");
                      }
                    }}
                    className={cn(
                      "p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all hover:bg-zinc-800/30",
                      isLinked 
                        ? (isDarkMode ? "bg-amber-500/5 border-amber-500/30 animate-pulse" : "bg-amber-50/20 border-amber-500/30") 
                        : (isDarkMode ? "bg-zinc-900/40 border-zinc-800/60" : "bg-white border-zinc-200")
                    )}
                  >
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-black border border-zinc-700/40">{item.type}</span>
                        <span className="text-[10px] text-zinc-500 font-semibold">{item.source} • {item.date}</span>
                      </div>
                      <h4 className={cn("text-xs font-black truncate mt-1", isLinked ? "text-amber-400" : "text-white")}>
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-zinc-400 truncate font-medium">{item.desc}</p>
                    </div>

                    <div className="shrink-0 flex items-center justify-center">
                      <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                        isLinked 
                          ? "bg-amber-500 border-amber-500 text-black" 
                          : "border-zinc-700 hover:border-zinc-500"
                      )}>
                        {isLinked && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 border-t border-zinc-800/20 pt-4 mt-2">
              <button 
                onClick={() => setIsLinkArchiveModalOpen(false)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl transition-all shadow-md active:scale-95"
              >
                가져오기 및 연동 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. 피드백 반영: 캐릭터 추가 및 수정 모달창 (Modal) */}
      {isCharacterModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div 
            className={cn(
              "w-full max-w-lg rounded-2xl border shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200",
              isDarkMode ? "bg-[#14141D] border-zinc-800" : "bg-white border-zinc-200"
            )}
          >
            <div className="flex items-center justify-between border-b border-zinc-800/20 pb-4">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-amber-500" />
                <h3 className="text-sm font-black text-white">
                  {activeCharacterId ? "등장인물 설정 수정" : "신규 등장인물 등록"}
                </h3>
              </div>
              <button 
                onClick={() => setIsCharacterModalOpen(false)}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* 인물 이름 입력 */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                인물 성명
              </label>
              <input 
                type="text"
                value={charName}
                onChange={(e) => setCharName(e.target.value)}
                placeholder="예) 강원철, 서동재..."
                className={cn(
                  "w-full px-3 py-2.5 text-xs border rounded-xl outline-none font-bold",
                  isDarkMode ? "bg-zinc-900/50 border-zinc-800 text-white focus:border-amber-500/50" : "bg-zinc-50 border-zinc-200 focus:border-amber-500"
                )}
              />
            </div>

            {/* 인물 역할/포지션 입력 */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                극중 역할 및 소속
              </label>
              <input 
                type="text"
                value={charRole}
                onChange={(e) => setCharRole(e.target.value)}
                placeholder="예) 주연 (검사), 강력반 형사, 조연 (비서관)..."
                className={cn(
                  "w-full px-3 py-2.5 text-xs border rounded-xl outline-none font-bold",
                  isDarkMode ? "bg-zinc-900/50 border-zinc-800 text-white focus:border-amber-500/50" : "bg-zinc-50 border-zinc-200 focus:border-amber-500"
                )}
              />
            </div>

            {/* 인물 고유의 핵심 욕망 (Desire) */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                인물의 고유한 내면적 욕망 (Desire)
              </label>
              <input 
                type="text"
                value={charDesire}
                onChange={(e) => setCharDesire(e.target.value)}
                placeholder="예) 사법 카르텔의 붕괴와 사회 정의 실현, 출세와 부의 획득..."
                className={cn(
                  "w-full px-3 py-2.5 text-xs border rounded-xl outline-none font-bold",
                  isDarkMode ? "bg-zinc-900/50 border-zinc-800 text-white focus:border-amber-500/50" : "bg-zinc-50 border-zinc-200 focus:border-amber-500"
                )}
              />
            </div>

            {/* 인물 한 줄 묘사 (Description) */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                인물 상세 성격 및 특징
              </label>
              <textarea 
                rows={3}
                value={charDesc}
                onChange={(e) => setCharDesc(e.target.value)}
                placeholder="성격, 트라우마, 다른 인물들과 대립하는 모순점 등을 구체적으로 기록하세요..."
                className={cn(
                  "w-full px-3 py-2.5 text-xs border rounded-xl outline-none font-medium leading-relaxed resize-none",
                  isDarkMode ? "bg-zinc-900/50 border-zinc-800 text-white focus:border-amber-500/50" : "bg-zinc-50 border-zinc-200 focus:border-amber-500"
                )}
              />
            </div>

            {/* 인물 컬러 스키마 선택 (관계도 노드용) */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-wider">
                인물 고유 퍼스널 컬러
              </label>
              <div className="flex gap-2">
                {[
                  { value: "bg-blue-500/20 text-blue-400 border-blue-500/50", label: "블루 (지성)" },
                  { value: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50", label: "그린 (신뢰)" },
                  { value: "bg-purple-500/20 text-purple-400 border-purple-500/50", label: "퍼플 (야망)" },
                  { value: "bg-rose-500/20 text-rose-400 border-rose-500/50", label: "레드 (열정/대립)" }
                ].map(col => (
                  <button 
                    key={col.value}
                    onClick={() => setCharColor(col.value)}
                    className={cn(
                      "flex-grow py-2 text-[10px] font-bold border rounded-xl transition-all",
                      charColor === col.value 
                        ? "bg-amber-500 border-amber-500 text-black shadow-md"
                        : (isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-50 border-zinc-200 text-zinc-700")
                    )}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-zinc-800/20 pt-4 mt-2">
              <div>
                {activeCharacterId && (
                  <button 
                    onClick={() => handleDeleteCharacter(activeCharacterId)}
                    className="px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm active:scale-95"
                  >
                    <Trash2 size={12} />
                    <span>삭제</span>
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsCharacterModalOpen(false)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-bold rounded-xl transition-all active:scale-95"
                >
                  취소
                </button>
                <button 
                  onClick={handleSaveCharacter}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black rounded-xl transition-all shadow-md active:scale-95"
                >
                  {activeCharacterId ? "정보 수정 완료" : "등장인물 등록"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Toast 알림 포탈 컨테이너 */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-[999999]">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={cn(
              "px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-5 duration-300 border",
              isDarkMode 
                ? (toast.type === "success" ? "bg-[#141E19] border-emerald-500/30 text-emerald-400" : toast.type === "error" ? "bg-[#241416] border-rose-500/30 text-rose-400" : "bg-[#161622] border-zinc-800 text-zinc-300")
                : "bg-white border-zinc-200 text-zinc-800"
            )}
          >
            <div className={cn(
              "w-2 h-2 rounded-full",
              toast.type === "success" ? "bg-emerald-500" : toast.type === "error" ? "bg-rose-500" : "bg-sky-500"
            )} />
            <span className="text-xs font-bold leading-none">{toast.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

// 헬퍼 컴포넌트
function XIcon({ size = 16, className = "" }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
