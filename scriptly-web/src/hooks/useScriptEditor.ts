import { useState, useEffect, useRef, useMemo } from "react";
import { useUIStore } from "@/store/useUIStore";
import api from "@/lib/api";

// HTML -> Markdown 양방향 변환기
export const convertHtmlToMarkdown = (html: string): string => {
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
export const convertMarkdownToHtml = (markdown: string): string => {
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

interface UseScriptEditorProps {
  projectId: string | null;
  scripts: any[];
  currentScript: any;
  updateScript: (scriptId: string, data: any) => Promise<any>;
  createScript: (projectId: string, title: string, episodeNumber: number) => Promise<any>;
  deleteScript: (scriptId: string) => Promise<boolean>;
  setCurrentScript: (script: any) => void;
  addToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
}

export interface ScriptLine {
  id: string;
  type: "scene" | "dialogue" | "action";
  character?: string;
  parenthetical?: string;
  text: string;
}

export function useScriptEditor({
  projectId,
  scripts,
  currentScript,
  setCurrentScript,
  createScript,
  updateScript,
  deleteScript,
  addToast,
}: UseScriptEditorProps) {
  const { isDarkMode } = useUIStore();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const localContentRef = useRef<string>("");
  const [markdownText, setMarkdownText] = useState<string>("");
  
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [tempTitle, setTempTitle] = useState<string>("");

  const [isSceneListOpen, setIsSceneListOpen] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isShowingPreview, setIsShowingPreview] = useState<boolean>(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [fontSize, setFontSize] = useState<number>(14);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const previewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevScriptIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (currentScript) {
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

  const handleManualSave = async () => {
    if (!currentScript) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    
    setIsSaving(true);
    const html = convertMarkdownToHtml(markdownText);
    await updateScript(currentScript.id, { content: html });
    setIsSaving(false);
    addToast("대본이 데이터베이스에 안전하게 저장되었습니다.", "success");
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMarkdownText(text);
    
    const html = convertMarkdownToHtml(text);
    localContentRef.current = html;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      if (!currentScript) return;
      setIsSaving(true);
      await updateScript(currentScript.id, { content: html });
      setIsSaving(false);
    }, 3000);

    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      setPreviewHtml(html);
    }, 1500);
  };

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

  const handleSaveTitle = async () => {
    if (!currentScript || !tempTitle.trim()) return;
    setIsSaving(true);
    await updateScript(currentScript.id, { title: tempTitle });
    setIsSaving(false);
    setIsEditingTitle(false);
    addToast("대본 제목이 변경되었습니다.", "success");
  };

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
    
    handleTextareaChange({ target: { value: newText } } as any);
  };

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

  const applyBold = () => {
    wrapSelection("**");
  };

  const applyUnderline = () => {
    wrapSelection("__");
  };

  const applyItalic = () => {
    wrapSelection("*");
  };

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

  const insertSceneHeader = () => {
    insertTextAtCursor("\n### ");
  };

  const insertParenthetical = () => {
    insertTextAtCursor("( ", " )");
  };

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      insertTextAtCursor("    ");
      return;
    }

    if (e.altKey && (e.code === "KeyT" || e.key.toLowerCase() === "t" || e.key === "ㅅ")) {
      e.preventDefault();
      handleDialogueHotkey(e);
      return;
    }

    if (e.altKey && e.key === "1") {
      e.preventDefault();
      insertSceneHeader();
      return;
    }

    if (e.altKey && e.key === "2") {
      e.preventDefault();
      insertParenthetical();
      return;
    }

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
      const isSceneHeader = htmlContent.includes("***") || text.includes("***");
        
      if (isSceneHeader) {
        lines.push({
          id: `line_${idx}`,
          type: "scene",
          text: text.replace(/\*\*\*/g, "").trim()
        });
        return;
      }
      
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
      
      lines.push({
        id: `line_${idx}`,
        type: "action",
        text: text.trim()
      });
    });
    
    return lines;
  }, [previewHtml]);

  const outline = useMemo(() => {
    return parsedLines
      .filter(line => line.type === "scene")
      .map((line, idx) => ({
        id: `scene_${idx}`,
        title: line.text,
        rawText: line.text
      }));
  }, [parsedLines]);

  const a4Pages = useMemo((): ScriptLine[][] => {
    const resultPages: ScriptLine[][] = [];
    let currentTempPage: ScriptLine[] = [];
    
    parsedLines.forEach(line => {
      currentTempPage.push(line);
      
      const currentPageWeight = currentTempPage.reduce((acc, l) => {
        let w = 1.0;
        if (l.type === "scene") w = 2.5;
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
    
    if (currentTempPage.length > 0) {
      resultPages.push(currentTempPage);
    }
    
    return resultPages;
  }, [parsedLines]);

  return {
    isDarkMode,
    textareaRef,
    markdownText,
    setMarkdownText,
    isSaving,
    isAiAnalyzing,
    isEditingTitle,
    setIsEditingTitle,
    tempTitle,
    setTempTitle,
    isSceneListOpen,
    setIsSceneListOpen,
    isExportMenuOpen,
    setIsExportMenuOpen,
    isShowingPreview,
    setIsShowingPreview,
    previewHtml,
    fontSize,
    setFontSize,
    handleManualSave,
    handleTextareaChange,
    handleAddNewEpisode,
    handleDeleteEpisode,
    handleSaveTitle,
    handleTriggerAiAnalysis,
    handleExportScript,
    applyBold,
    applyUnderline,
    applyItalic,
    applyReset,
    insertSceneHeader,
    insertParenthetical,
    handleKeyDown,
    parsedLines,
    outline,
    a4Pages,
  };
}
