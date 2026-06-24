'use client';

import React from "react";
import { 
  Save, Play, BookOpenCheck, Plus, Trash2, Edit2, Check, Loader2, 
  Eye, EyeOff, ChevronDown, Bold, Underline, Italic, AlignLeft, List, Download 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useScriptEditor } from "@/hooks/useScriptEditor";

interface ScriptEditorPresenterProps extends ReturnType<typeof useScriptEditor> {
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

export default function ScriptEditorPresenter({
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
  projectId,
  scripts,
  currentScript,
  setCurrentScript,
  isLoading,
  addToast,
}: ScriptEditorPresenterProps) {

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
      
      {/* 1. 좌측 에피소드 리스트 패널 */}
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

      {/* 2. 우측 집필 공간 */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        
        {/* [A] 상단 툴바 영역 */}
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

        {/* [B] 에디터 바로 위 툴바 영역 */}
        {currentScript && (
          <div className={cn(
            "flex items-center justify-between px-6 py-2.5 border-b gap-4 flex-wrap",
            isDarkMode ? "bg-[#09090C]/50 border-zinc-800/60" : "bg-zinc-50/50 border-zinc-200"
          )}>
            {/* 서식 편집 버튼들 */}
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

        {/* 중앙 편집 + A4 프리뷰 이원화 레이아웃 */}
        <div className="flex-1 p-6 overflow-hidden flex gap-6">
          {currentScript ? (
            <>
              {/* [2-1] 리치 에디터 본문 */}
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
