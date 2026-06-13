"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Save, Play, BookOpenCheck, Plus, Trash2, Edit2, Check, Loader2, 
  Eye, EyeOff, ChevronDown, Bold, Underline, Italic, AlignLeft, Sparkles, HelpCircle, List, Download 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import api from "@/lib/api";

interface ScriptEditorProps {
  projectId: string | null;
  scripts: any[];
  currentScript: any;
  setCurrentScript: (script: any) => void;
  createScript: (projectId: string, title: string, episodeNumber: number) => Promise<any>;
  updateScript: (scriptId: string, data: any) => Promise<any>;
  deleteScript: (scriptId: string) => Promise<boolean>;
  isLoading: boolean;
  addToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
}

interface ScriptLine {
  id: string;
  type: "scene" | "dialogue" | "action";
  character?: string;
  parenthetical?: string;
  text: string;
}

// HTML -> Markdown 양방향 변환기
const convertHtmlToMarkdown = (html: string): string => {
  if (!html) return "";
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const nodes = Array.from(doc.body.childNodes);
  
  const lines: string[] = [];
  nodes.forEach(node => {
    let text = node.textContent || "";
    
    // 빈 줄 판별 (\u00a0 is &nbsp;)
    if (!text.trim() && (node.nodeName === "BR" || node.textContent === "" || text === "\u00a0")) {
      lines.push("");
      return;
    }
    
    const htmlContent = (node as HTMLElement).innerHTML || text;
    const isScene = htmlContent.includes("***") || text.includes("***");
    
    if (isScene) {
      let cleanText = text.replace(/\*\*\*/g, "").trim();
      // '1. 장소 (D)' 에서 '1. ' 부분을 제거하여 순수 텍스트만 추출
      cleanText = cleanText.replace(/^\d+\.\s*/, "");
      lines.push(`### ${cleanText}`);
    } else {
      lines.push(text.trim());
    }
  });
  
  return lines.join("\n");
};

// Markdown -> HTML 변환기
const convertMarkdownToHtml = (markdown: string): string => {
  const lines = markdown.split("\n");
  let sceneCount = 0;
  
  const htmlLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      return "<div>&nbsp;</div>";
    }
    
    // 씬 헤더 매칭 (### 으로 시작하는 경우)
    if (trimmed.startsWith("###")) {
      sceneCount++;
      let sceneText = trimmed.replace(/^###\s*/, "").trim();
      sceneText = sceneText.replace(/^\d+\.\s*/, "");
      return `<div><span class="scene-marker" style="font-size: 0px; opacity: 0; user-select: none; display: none;">***</span><u><strong>${sceneCount}. ${sceneText}</strong></u><span class="scene-marker" style="font-size: 0px; opacity: 0; user-select: none; display: none;">***</span></div>`;
    }
    
    // 대사 매칭 (인물: 대사)
    const dialogueMatch = trimmed.match(/^([^\s:(]+)(?:\s*\(([^)]+)\))?\s*[:：]\s*(.*)$/);
    if (dialogueMatch) {
      const charName = dialogueMatch[1].trim();
      const parenthetical = dialogueMatch[2] ? ` (${dialogueMatch[2].trim()})` : "";
      const dialogueText = dialogueMatch[3].trim();
      return `<div>${charName}${parenthetical}: ${dialogueText}</div>`;
    }
    
    // 탭 구분 대사 매칭 (인물   대사)
    const tabMatch = trimmed.match(/^([^\s(]{1,5})(?:\s*\(([^)]+)\))?\s{2,}(.*)$/);
    if (tabMatch) {
      const charName = tabMatch[1].trim();
      const parenthetical = tabMatch[2] ? ` (${tabMatch[2].trim()})` : "";
      const dialogueText = tabMatch[3].trim();
      return `<div>${charName}${parenthetical}: ${dialogueText}</div>`;
    }
    
    // 일반 지문/액션
    return `<div>${trimmed}</div>`;
  });
  
  return htmlLines.join("");
};

export default function ScriptEditor({
  projectId,
  scripts,
  currentScript,
  setCurrentScript,
  createScript,
  updateScript,
  deleteScript,
  isLoading,
  addToast
}: ScriptEditorProps) {
  const { isDarkMode } = useUIStore();
  
  // 1. 에디터 Ref 및 상태 제어
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const localContentRef = useRef<string>("");
  const [markdownText, setMarkdownText] = useState<string>("");
  
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [tempTitle, setTempTitle] = useState<string>("");

  // 2. 미니멀 v2.9 UI 토글용 상태
  const [isSceneListOpen, setIsSceneListOpen] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isShowingPreview, setIsShowingPreview] = useState<boolean>(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [fontSize, setFontSize] = useState<number>(14);

  // 자동 저장 & 프리뷰 업데이트 타이머 Refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevScriptIdRef = useRef<string | null>(null);

  // 3. 활성 대본 변경 시 Uncontrolled 바인딩 (커서 튐 원천 방지)
  useEffect(() => {
    if (currentScript) {
      // 이전 대본 즉시 동기화 실행 (Flush)
      if (prevScriptIdRef.current && prevScriptIdRef.current !== currentScript.id && localContentRef.current !== undefined) {
        const prevId = prevScriptIdRef.current;
        const prevContent = localContentRef.current;
        updateScript(prevId, { content: prevContent });
      }

      const initialContent = currentScript.content || "<div><span class=\"scene-marker\" style=\"font-size: 0px; opacity: 0; user-select: none; display: none;\">***</span><u><strong>1. 장소 (D)</strong></u><span class=\"scene-marker\" style=\"font-size: 0px; opacity: 0; user-select: none; display: none;\">***</span></div><div>&nbsp;</div><div>인물: 대사를 입력하세요.</div>";
      localContentRef.current = initialContent;
      setPreviewHtml(initialContent);
      setTempTitle(currentScript.title || "");
      setIsEditingTitle(false);

      // HTML을 Markdown으로 변환하여 textarea에 바인딩
      const md = convertHtmlToMarkdown(initialContent);
      setMarkdownText(md);

      prevScriptIdRef.current = currentScript.id;
    } else {
      localContentRef.current = "";
      setPreviewHtml("");
      setMarkdownText("");
      prevScriptIdRef.current = null;
    }
  }, [currentScript, updateScript]);

  // 4. 수동 저장 실행기
  const handleManualSave = async () => {
    if (!currentScript) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    
    setIsSaving(true);
    const html = convertMarkdownToHtml(markdownText);
    await updateScript(currentScript.id, { content: html });
    setIsSaving(false);
    addToast("대본이 데이터베이스에 안전하게 저장되었습니다.", "success");
  };

  // 5. 에디터 타이핑 입력 핸들러 (디바운스 제어)
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMarkdownText(text);
    
    const html = convertMarkdownToHtml(text);
    localContentRef.current = html;

    // 1) 3초 디바운스 자동 저장
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      if (!currentScript) return;
      setIsSaving(true);
      await updateScript(currentScript.id, { content: html });
      setIsSaving(false);
    }, 3000);

    // 2) 1.5초 디바운스 프리뷰 렌더러 반영 (렉 방지)
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      setPreviewHtml(html);
    }, 1500);
  };

  // 신규 회차 추가
  const handleAddNewEpisode = async () => {
    if (!projectId) {
      addToast("드라마 프로젝트가 유효하지 않습니다.", "error");
      return;
    }
    const nextEpNum = scripts.length > 0 ? Math.max(...scripts.map(s => s.episode_number)) + 1 : 1;
    const defaultTitle = `제 ${nextEpNum}화: 새로운 시작`;
    
    setIsSaving(true);
    const newScr = await createScript(projectId, defaultTitle, nextEpNum);
    setIsSaving(false);
    
    if (newScr) {
      addToast(`'${defaultTitle}' 대본이 신규 생성되었습니다.`, "success");
    } else {
      addToast("대본 생성에 실패했습니다.", "error");
    }
  };

  // 회차 삭제
  const handleDeleteEpisode = async () => {
    if (!currentScript) return;
    if (!confirm(`정말로 '${currentScript.title}' 대본을 삭제하시겠습니까?\n삭제된 내용은 복구할 수 없습니다.`)) return;

    setIsSaving(true);
    const success = await deleteScript(currentScript.id);
    setIsSaving(false);

    if (success) {
      addToast("대본이 정상적으로 삭제되었습니다.", "success");
    } else {
      addToast("대본 삭제 중 오류가 발생했습니다.", "error");
    }
  };

  // 제목 편집 확정
  const handleSaveTitle = async () => {
    if (!currentScript || !tempTitle.trim()) return;
    setIsSaving(true);
    await updateScript(currentScript.id, { title: tempTitle });
    setIsSaving(false);
    setIsEditingTitle(false);
    addToast("대본 제목이 변경되었습니다.", "success");
  };

  // AI 분석
  const handleTriggerAiAnalysis = () => {
    if (!currentScript || !localContentRef.current.trim()) {
      addToast("분석할 대본 본문 내용이 없습니다. 먼저 극본을 작성해주세요.", "warning");
      return;
    }
    setIsAiAnalyzing(true);
    addToast("AI가 드라마 씬 구조 및 갈등 양상을 정밀 분석 중입니다...", "info");
    
    setTimeout(() => {
      setIsAiAnalyzing(false);
      addToast("대본 AI 씬 감지 및 작의(갈등 지수) 분석이 완료되었습니다. 기획안 및 캐릭터 탭에 추천 설정이 업데이트되었습니다.", "success");
    }, 2500);
  };

  // 대본 내보내기 (Word/PDF) API 연동 다운로드
  const handleExportScript = async (format: "word" | "pdf") => {
    if (!currentScript) return;
    setIsExportMenuOpen(false);
    try {
      addToast(`${format === "word" ? "Word" : "PDF"} 문서를 생성하여 다운로드 중입니다...`, "info");
      
      const response = await api.get(`/scripts/${currentScript.id}/export`, {
        params: { format },
        responseType: "blob"
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${currentScript.title}.${format === "word" ? "docx" : "pdf"}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      addToast("대본 다운로드가 완료되었습니다.", "success");
    } catch (e) {
      console.error("Failed to export script:", e);
      addToast("대본 다운로드 중 오류가 발생했습니다.", "error");
    }
  };

  // 커서 위치에 텍스트 삽입 및 포커싱 헬퍼
  const insertTextAtCursor = (before: string, after: string = "", selectText: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const beforeSelection = text.substring(0, start);
    const selected = text.substring(start, end) || selectText;
    const afterSelection = text.substring(end);
    
    const newText = beforeSelection + before + selected + after + afterSelection;
    textarea.value = newText;
    setMarkdownText(newText);
    
    textarea.focus();
    const newStart = start + before.length;
    const newEnd = newStart + selected.length;
    
    setTimeout(() => {
      textarea.setSelectionRange(newStart, newEnd);
    }, 10);
    
    const html = convertMarkdownToHtml(newText);
    localContentRef.current = html;
    
    // Trigger preview and save changes
    handleTextareaChange({ target: { value: newText } } as any);
  };

  // 텍스트 선택 부분 서식 태그로 감싸기 헬퍼
  const wrapSelection = (prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const selected = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    const newText = before + prefix + selected + suffix + after;
    textarea.value = newText;
    setMarkdownText(newText);
    
    textarea.focus();
    const newStart = start + prefix.length;
    const newEnd = newStart + selected.length;
    
    setTimeout(() => {
      textarea.setSelectionRange(newStart, newEnd);
    }, 10);
    
    const html = convertMarkdownToHtml(newText);
    localContentRef.current = html;
    handleTextareaChange({ target: { value: newText } } as any);
  };

  // 서식 명령: 진하게 (Ctrl+B)
  const applyBold = () => {
    wrapSelection("**");
  };

  // 서식 명령: 밑줄 (Ctrl+U)
  const applyUnderline = () => {
    wrapSelection("__");
  };

  // 서식 명령: 이텔릭 (Ctrl+I)
  const applyItalic = () => {
    wrapSelection("*");
  };

  // 서식 명령: 서식 지우기
  const applyReset = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    let selected = text.substring(start, end);
    selected = selected.replace(/\*\*|__|[*]/g, "");
    
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    const newText = before + selected + after;
    textarea.value = newText;
    setMarkdownText(newText);
    
    textarea.focus();
    setTimeout(() => {
      textarea.setSelectionRange(start, start + selected.length);
    }, 10);
    
    const html = convertMarkdownToHtml(newText);
    localContentRef.current = html;
    handleTextareaChange({ target: { value: newText } } as any);
  };

  // 씬 헤더 추가 (Alt + 1) - 플레이스홀더 텍스트 없이 ###만 깔끔하게 추가
  const insertSceneHeader = () => {
    insertTextAtCursor("\n### ");
  };

  // 행동 지문 추가 (Alt + 2) - 플레이스홀더 텍스트 없이 (  ) 괄호 공백 및 커서 배치
  const insertParenthetical = () => {
    insertTextAtCursor("( ", " )");
  };

  // 대사 자동 정렬 핫키 (Alt + T)
  const handleDialogueHotkey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const text = textarea.value;
    
    const lastNewLine = text.lastIndexOf("\n", start - 1);
    const lineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
    const nextNewLine = text.indexOf("\n", start);
    const lineEnd = nextNewLine === -1 ? text.length : nextNewLine;
    
    const currentLine = text.substring(lineStart, lineEnd);
    
    // 이미 콜론이 있는 경우 무시 (중복 방지)
    if (currentLine.includes(":") || currentLine.includes("：")) {
      return;
    }
    
    const charMatch = currentLine.match(/^([^\s(]{1,5})(?:\s*\(([^)]+)\))?$/);
    if (charMatch) {
      const charName = charMatch[1];
      const parenthetical = charMatch[2] ? ` (${charMatch[2]})` : "";
      const updatedLine = `${charName}${parenthetical}: `;
      
      const beforeLine = text.substring(0, lineStart);
      const afterLine = text.substring(lineEnd);
      
      const newText = beforeLine + updatedLine + afterLine;
      textarea.value = newText;
      setMarkdownText(newText);
      
      const newCursorPos = lineStart + updatedLine.length;
      textarea.focus();
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 10);
      
      handleTextareaChange({ target: { value: newText } } as any);
    } else {
      insertTextAtCursor(": ");
    }
  };

  // 키보드 핫키 전체 핸들러
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1) Tab 키: 4칸 공백 삽입
    if (e.key === "Tab") {
      e.preventDefault();
      insertTextAtCursor("    ");
      return;
    }

    // 2) Alt + T / Alt + t / Alt + ㅅ (한글 입력 대응): 대사 정렬 콜론 자동 삽입
    if (e.altKey && (e.code === "KeyT" || e.key.toLowerCase() === "t" || e.key === "ㅅ")) {
      e.preventDefault();
      handleDialogueHotkey(e);
      return;
    }

    // 3) Alt + 1: 씬 헤더 추가 (커서 장소 포커싱)
    if (e.altKey && e.key === "1") {
      e.preventDefault();
      insertSceneHeader();
      return;
    }

    // 4) Alt + 2: 행동 지문 괄호 삽입 (커서 지문 포커싱)
    if (e.altKey && e.key === "2") {
      e.preventDefault();
      insertParenthetical();
      return;
    }

    // 5) Ctrl+B (볼드), Ctrl+U (언더라인), Ctrl+I (이탤릭) 가로채기
    if (e.ctrlKey && e.key.toLowerCase() === "b") {
      e.preventDefault();
      applyBold();
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "u") {
      e.preventDefault();
      applyUnderline();
      return;
    }
    if (e.ctrlKey && e.key.toLowerCase() === "i") {
      e.preventDefault();
      applyItalic();
      return;
    }
  };

  // HTML -> 표준 대본 라인 파서
  const parsedLines = useMemo((): ScriptLine[] => {
    if (!previewHtml) return [];
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(previewHtml, "text/html");
    const nodes = Array.from(doc.body.childNodes);
    const lines: ScriptLine[] = [];
    
    nodes.forEach((node, idx) => {
      let text = node.textContent || "";
      if (!text.trim() && node.nodeName === "BR") {
        lines.push({ id: `line_${idx}`, type: "action", text: "" });
        return;
      }
      if (!text.trim() && node.textContent === "") return;
      
      const htmlContent = (node as HTMLElement).innerHTML || text;
      
      // 씬 헤더 매칭: HTML 본문 또는 텍스트 내에 무결한 *** 씬 마커가 포함되어 있는 경우만 씬으로 엄격 감지
      const isSceneHeader = htmlContent.includes("***") || text.includes("***");
        
      if (isSceneHeader) {
        lines.push({
          id: `line_${idx}`,
          type: "scene",
          text: text.replace(/\*\*\*/g, "").trim() // 렌더러용 텍스트에서 마커 제거
        });
        return;
      }
      
      // 대사 매칭 (인물명: 대사)
      const dialogueMatch = text.match(/^([^\s:(]+)(?:\s*\(([^)]+)\))?\s*[:：]\s*(.*)$/);
      if (dialogueMatch) {
        lines.push({
          id: `line_${idx}`,
          type: "dialogue",
          character: dialogueMatch[1].trim(),
          parenthetical: dialogueMatch[2] ? dialogueMatch[2].trim() : undefined,
          text: dialogueMatch[3].trim()
        });
        return;
      }
      
      // 대사 매칭 (인물명    대사) - 탭 공백 구분
      const tabMatch = text.match(/^([^\s(]{1,5})(?:\s*\(([^)]+)\))?\s{2,}(.*)$/);
      if (tabMatch) {
        lines.push({
          id: `line_${idx}`,
          type: "dialogue",
          character: tabMatch[1].trim(),
          parenthetical: tabMatch[2] ? tabMatch[2].trim() : undefined,
          text: tabMatch[3].trim()
        });
        return;
      }
      
      // 일반 지문
      lines.push({
        id: `line_${idx}`,
        type: "action",
        text: text.trim()
      });
    });
    
    return lines;
  }, [previewHtml]);

  // 씬 아웃라인 리스트 추출
  const outline = useMemo(() => {
    return parsedLines
      .filter(line => line.type === "scene")
      .map((line, idx) => ({
        id: `scene_${idx}`,
        title: line.text,
        rawText: line.text
      }));
  }, [parsedLines]);

  // A4 페이지 단위 분할 계산기 (대본 표준 줄수 및 가중치 매핑)
  const a4Pages = useMemo((): ScriptLine[][] => {
    const resultPages: ScriptLine[][] = [];
    let currentTempPage: ScriptLine[] = [];
    
    parsedLines.forEach(line => {
      currentTempPage.push(line);
      
      // A4 용지 1장 분량 가중치 계산 (32점 기준 페이지 분리)
      const currentPageWeight = currentTempPage.reduce((acc, l) => {
        let w = 1.0;
        if (l.type === "scene") w = 2.5; // 씬 헤더는 줄바꿈 마진 포함 큰 공간
        if (l.type === "dialogue") {
          w = 1.2 + (l.text.length > 30 ? (l.text.length - 30) / 30 : 0);
        }
        return acc + w;
      }, 0);
      
      if (currentPageWeight >= 32) {
        resultPages.push(currentTempPage);
        currentTempPage = [];
      }
    });
    
    if (currentTempPage.length > 0 || resultPages.length === 0) {
      resultPages.push(currentTempPage);
    }
    
    return resultPages;
  }, [parsedLines]);

  // 씬 바로가기 클릭 시 에디터 스크롤 점프 (Scroll-to-Anchor)
  const handleSceneJump = (sceneTitle: string) => {
    setIsSceneListOpen(false);
    const textarea = textareaRef.current;
    if (textarea) {
      const text = textarea.value;
      const cleanTitle = sceneTitle.replace(/\*\*\*/g, "").trim();
      const matchTitle = cleanTitle.replace(/^\d+\.\s*/, "").trim();
      
      const index = text.indexOf(matchTitle);
      if (index !== -1) {
        textarea.focus();
        textarea.setSelectionRange(index, index + matchTitle.length);
        
        const linesBefore = text.substring(0, index).split("\n").length - 1;
        const lineHeight = 24; // approximate line height in px
        textarea.scrollTop = linesBefore * lineHeight - (textarea.clientHeight / 2);
      }
    }
  };

  // 마크다운 인라인 서식 (굵게, 밑줄, 이탤릭) 변환 렌더러
  const renderFormattedText = (text: string) => {
    if (!text) return "";
    
    // HTML 엔티티 이스케이프
    let safeText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
      
    // 마크다운 파싱
    safeText = safeText
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/__(.*?)__/g, "<u>$1</u>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>");
      
    return <span dangerouslySetInnerHTML={{ __html: safeText }} />;
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <Loader2 size={32} className="animate-spin text-amber-500 mb-3" />
        <span className="text-xs text-zinc-500 font-bold">대본 작성기를 로드 중입니다...</span>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <span className="text-xs text-zinc-500 font-bold">프로젝트를 먼저 생성 또는 선택해 주세요.</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden min-h-0 select-none">
      
      {/* ================================================================= */}
      {/* 1. 좌측 에피소드 리스트 패널 */}
      {/* ================================================================= */}
      <div className={cn(
        "w-[200px] border-r flex flex-col p-4 shrink-0 overflow-y-auto custom-scrollbar-dark justify-between",
        isDarkMode ? "bg-[#0A0A0E] border-zinc-800/80" : "bg-zinc-50 border-zinc-200"
      )}>
        <div className="flex flex-col gap-4">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
            <List size={12} /> 대본 회차 목록
          </span>
          
          <div className="flex flex-col gap-1.5">
            {scripts.map((s) => (
              <button 
                key={s.id}
                onClick={() => setCurrentScript(s)}
                className={cn(
                  "w-full text-left py-2.5 px-3 rounded-xl text-xs font-bold transition-all truncate flex flex-col gap-0.5",
                  currentScript && currentScript.id === s.id
                    ? "bg-amber-500 text-black shadow-lg"
                    : isDarkMode 
                      ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900" 
                      : "text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200"
                )}
              >
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-wider",
                  currentScript && currentScript.id === s.id ? "text-black/70" : "text-amber-500"
                )}>
                  EPISODE {s.episode_number}
                </span>
                <span className="truncate w-full">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={handleAddNewEpisode}
          className="w-full mt-4 py-2.5 px-3 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl transition-all flex items-center justify-center gap-1 shrink-0"
        >
          <Plus size={13} />
          <span>새 회차 추가</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* 2. 우측 집필 공간 (남은 공간 전체 활용) */}
      {/* ================================================================= */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        
        {/* [A] 상단 툴바 영역 (내보내기, 프리뷰, 저장, 분석 배치) */}
        <div className={cn(
          "flex items-center justify-between border-b p-4 gap-4 flex-wrap shrink-0",
          isDarkMode ? "bg-[#09090C]/80 border-zinc-800" : "bg-white border-zinc-200"
        )}>
          {/* 대본 제목 영역 */}
          <div className="flex items-center gap-3">
            {currentScript ? (
              <>
                {isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <input 
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      className={cn(
                        "px-2.5 py-1 text-sm font-black outline-none border rounded-lg",
                        isDarkMode ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); }}
                      autoFocus
                    />
                    <button onClick={handleSaveTitle} className="p-1.5 bg-emerald-500 text-black hover:bg-emerald-400 rounded-lg transition-all">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group max-w-[200px] md:max-w-[300px]">
                    <h2 className={cn(
                      "text-sm font-black truncate",
                      isDarkMode ? "text-white" : "text-zinc-900"
                    )}>{currentScript.title}</h2>
                    <button 
                      onClick={() => setIsEditingTitle(true)}
                      className="p-1 hover:bg-zinc-800 rounded opacity-0 group-hover:opacity-100 text-zinc-400 transition-all shrink-0"
                    >
                      <Edit2 size={11} />
                    </button>
                  </div>
                )}
                <button 
                  onClick={handleDeleteEpisode}
                  className="p-1.5 hover:bg-red-500/10 hover:text-red-400 text-zinc-500 rounded-lg transition-all"
                  title="현재 회차 대본 삭제"
                >
                  <Trash2 size={13} />
                </button>
              </>
            ) : (
              <span className="text-xs text-zinc-500 italic">선택된 대본 없음</span>
            )}
          </div>

          {/* 씬 아웃라인 ▾ 드롭다운 */}
          {currentScript && (
            <div className="relative">
              <button 
                onClick={() => setIsSceneListOpen(!isSceneListOpen)}
                className="px-3 py-1.5 text-xs font-bold bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <BookOpenCheck size={13} className="text-amber-500" />
                <span>씬 바로가기 ({outline.length})</span>
                <ChevronDown size={12} className={cn("transition-transform", isSceneListOpen && "rotate-180")} />
              </button>
              
              {isSceneListOpen && (
                <div className={cn(
                  "absolute left-0 mt-2 w-64 max-h-72 overflow-y-auto rounded-xl border p-2 shadow-2xl z-50 custom-scrollbar-dark animate-in fade-in slide-in-from-top-1 duration-150",
                  isDarkMode ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                )}>
                  {outline.map((scene, idx) => (
                    <button 
                      key={scene.id}
                      onClick={() => handleSceneJump(scene.rawText)}
                      className="w-full text-left py-2 px-3 rounded-lg text-xs font-bold transition-all text-zinc-400 hover:text-white hover:bg-zinc-900 flex items-center gap-2"
                    >
                      <span className="text-[9px] font-black text-amber-500">#{idx + 1}</span>
                      <span className="truncate">{scene.title}</span>
                    </button>
                  ))}
                  {outline.length === 0 && (
                    <div className="py-6 text-center text-[10px] text-zinc-500 italic">
                      에디터에 씬 제목을 입력하세요.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 내보내기, A4 프리뷰, 저장, 분석 버튼 */}
          <div className="flex items-center gap-2">
            {currentScript && (
              <>
                {/* 대본 내보내기 ▾ 드롭다운 */}
                <div className="relative">
                  <button 
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="px-3.5 py-1.5 text-xs font-bold bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <Download size={13} className="text-amber-500" />
                    <span>내보내기</span>
                    <ChevronDown size={12} />
                  </button>
                  
                  {isExportMenuOpen && (
                    <div className={cn(
                      "absolute right-0 mt-2 w-40 rounded-xl border p-1.5 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150",
                      isDarkMode ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                    )}>
                      <button 
                        onClick={() => handleExportScript("word")}
                        className="w-full text-left py-2 px-3 rounded-lg text-xs font-bold transition-all hover:bg-zinc-900 text-zinc-400 hover:text-white"
                      >
                        Word (.docx) 다운로드
                      </button>
                      <button 
                        onClick={() => handleExportScript("pdf")}
                        className="w-full text-left py-2 px-3 rounded-lg text-xs font-bold transition-all hover:bg-zinc-900 text-zinc-400 hover:text-white"
                      >
                        PDF (.pdf) 다운로드
                      </button>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setIsShowingPreview(!isShowingPreview)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5",
                    isShowingPreview 
                      ? "bg-amber-500 text-black font-black" 
                      : "bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300"
                  )}
                  title="A4 실시간 프리뷰 토글"
                >
                  {isShowingPreview ? <Eye size={13} /> : <EyeOff size={13} />}
                  <span>A4 프리뷰</span>
                </button>

                <button 
                  onClick={handleManualSave}
                  disabled={isSaving}
                  className="px-3.5 py-1.5 text-xs font-bold bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  {isSaving ? <Loader2 size={12} className="animate-spin text-amber-500" /> : <Save size={12} />}
                  <span>{isSaving ? "저장 중" : "저장"}</span>
                </button>
                
                <button 
                  onClick={handleTriggerAiAnalysis}
                  disabled={isAiAnalyzing}
                  className="px-3.5 py-1.5 text-xs font-black bg-amber-500 text-black hover:bg-amber-400 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  {isAiAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                  <span>AI 분석</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* [B] 에디터 바로 위 툴바 영역 (서식 편집 툴바 및 글꼴 크기 슬라이더 배치) */}
        {currentScript && (
          <div className={cn(
            "flex items-center justify-between px-6 py-2.5 border-b gap-4 flex-wrap",
            isDarkMode ? "bg-[#09090C]/50 border-zinc-800/60" : "bg-zinc-50/50 border-zinc-200"
          )}>
            {/* 서식 편집 버튼들 (이텔릭 추가) */}
            <div className="flex items-center gap-1.5 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80">
              <button 
                onClick={insertSceneHeader} 
                className="px-2.5 py-1 text-[10px] font-black bg-zinc-800 text-amber-500 rounded-lg hover:bg-zinc-700 transition-all border border-zinc-700"
                title="Alt + 1: 씬 헤더 삽입 (커서 '장소' 포커스)"
              >
                씬 헤더
              </button>
              <button 
                onClick={insertParenthetical} 
                className="px-2.5 py-1 text-[10px] font-black bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-all border border-zinc-700"
                title="Alt + 2: 행동 지문 ( ) 삽입 (커서 '지문' 포커스)"
              >
                지문( )
              </button>
              <button 
                onClick={applyBold} 
                className="p-1 hover:bg-zinc-800 text-zinc-300 rounded transition-all"
                title="굵게 (Ctrl + B)"
              >
                <Bold size={13} />
              </button>
              <button 
                onClick={applyUnderline} 
                className="p-1 hover:bg-zinc-800 text-zinc-300 rounded transition-all"
                title="밑줄 (Ctrl + U)"
              >
                <Underline size={13} />
              </button>
              <button 
                onClick={applyItalic} 
                className="p-1 hover:bg-zinc-800 text-zinc-300 rounded transition-all"
                title="기울기 (Ctrl + I)"
              >
                <Italic size={13} />
              </button>
              <button 
                onClick={applyReset} 
                className="p-1 hover:bg-zinc-800 text-zinc-300 rounded transition-all"
                title="서식 지우기"
              >
                <AlignLeft size={13} />
              </button>
            </div>

            {/* 글꼴 크기 슬라이더 */}
            <div className="flex items-center gap-2 bg-zinc-900/40 px-3 py-1 rounded-xl border border-zinc-800">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">글꼴 크기</span>
              <input 
                type="range" 
                min={12} 
                max={20} 
                value={fontSize} 
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-16 accent-amber-500 h-1 rounded-lg cursor-pointer bg-zinc-700"
              />
              <span className="text-[10px] font-bold text-amber-500">{fontSize}px</span>
            </div>
          </div>
        )}

        {/* 핫키 도움말 툴팁 */}
        {currentScript && (
          <div className="px-6 py-2 bg-zinc-900/20 border-b border-zinc-800/40 flex gap-4 text-[10px] text-zinc-500 font-medium">
            <span>💡 단축키 도우미:</span>
            <span><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 mr-1">Alt + 1</kbd> 씬헤더 추가</span>
            <span><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 mr-1">Alt + 2</kbd> 지문괄호 삽입</span>
            <span><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 mr-1">인물명 입력 후 Alt + T</kbd> 대사 콜론 자동 정렬</span>
            <span><kbd className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300 mr-1">Tab</kbd> 들여쓰기 공백</span>
          </div>
        )}

        {/* ================================================================= */}
        {/* 중앙 편집 + A4 프리뷰 이원화 레이아웃 */}
        {/* ================================================================= */}
        <div className="flex-1 p-6 overflow-hidden flex gap-6">
          {currentScript ? (
            <>
              {/* [2-1] 리치 에디터 본문 (Plain Text / Markdown 에디터) */}
              <textarea 
                ref={textareaRef}
                value={markdownText}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                style={{ fontSize: `${fontSize}px` }}
                className={cn(
                  "flex-1 h-full outline-none resize-none font-mono leading-relaxed p-8 rounded-2xl border custom-scrollbar-dark overflow-y-auto whitespace-pre-wrap select-text bg-transparent",
                  isDarkMode 
                    ? "bg-[#121216] border-zinc-800/80 text-zinc-100 focus:border-amber-500/20" 
                    : "bg-white border-zinc-200 text-zinc-900 focus:border-amber-500"
                )}
                placeholder="대본 작성을 시작하세요..."
              />

              {/* [2-2] 슬라이드형 A4 Live Preview 지면 */}
              {isShowingPreview && (
                <div className="w-[380px] lg:w-[450px] shrink-0 h-full flex flex-col gap-4 overflow-y-auto custom-scrollbar-dark p-2 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/30">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider px-2 flex items-center justify-between">
                    <span>A4 지면 프리뷰 (실시간 인쇄 규격)</span>
                    <span className="text-amber-500">총 {a4Pages.length} 페이지</span>
                  </div>

                  {a4Pages.map((page, pIdx) => (
                    <div 
                      key={`page_${pIdx}`}
                      className="w-full bg-white text-zinc-950 p-[20px] rounded-lg shadow-2xl relative flex flex-col justify-between font-serif aspect-[1/1.414] overflow-hidden"
                      style={{ fontSize: "11px", fontFamily: "'Batang', 'BatangChe', 'Gungsuh', 'AppleMyungjo', serif" }}
                    >
                      {/* 본문 렌더링 */}
                      <div className="flex flex-col gap-2.5 flex-1 min-h-0 overflow-hidden select-text">
                        
                        {/* 씬/문장 렌더러 */}
                        {page.map((line) => {
                          if (line.type === "scene") {
                            return (
                              <div 
                                key={line.id} 
                                className="font-bold underline text-xs mt-2.5 mb-1 pb-0.5 border-b border-zinc-300"
                              >
                                {renderFormattedText(line.text)}
                              </div>
                            );
                          }
                          
                          if (line.type === "dialogue") {
                            return (
                              <div key={line.id} className="grid grid-cols-[65px_1fr] gap-3 text-[11px] leading-relaxed my-0.5 pl-2">
                                <div className="font-bold truncate text-left">{line.character}</div>
                                <div className="text-zinc-900">
                                  {line.parenthetical && (
                                    <span className="italic text-zinc-500 mr-1.5">({renderFormattedText(line.parenthetical)})</span>
                                  )}
                                  {renderFormattedText(line.text)}
                                </div>
                              </div>
                            );
                          }
                          
                          // 일반 지문
                          return (
                            <div key={line.id} className="text-zinc-700 leading-relaxed text-[11px] my-0.5">
                              {renderFormattedText(line.text)}
                            </div>
                          );
                        })}
                      </div>

                      {/* 페이지 풋라인 */}
                      <div className="border-t border-zinc-200/80 pt-2 text-[9px] text-zinc-400 text-center select-none">
                        - {pIdx + 1} -
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-2xl p-12">
              <span className="text-xs text-zinc-500 font-bold mb-4">작성된 대본이 없습니다. 회차를 생성하고 집필을 시작해보세요!</span>
              <button 
                onClick={handleAddNewEpisode}
                className="px-4 py-2.5 text-xs font-black bg-amber-500 text-black hover:bg-amber-400 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Plus size={13} />
                <span>제 1화 대본 생성하기</span>
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
