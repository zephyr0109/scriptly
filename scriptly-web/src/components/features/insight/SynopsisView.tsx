import React, { useState } from "react";
import { 
  Sparkles, Loader2, Download, FileText, 
  Users, BookOpen, Layout, ChevronRight,
  Printer, Share2, Save
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SynopsisViewProps {
  project: any;
  characters: any[];
  isGenerating: boolean;
  isDarkMode: boolean;
  editData: { logline: string; full_synopsis: string };
  setEditData: React.Dispatch<React.SetStateAction<any>>;
  onUpdateProject: (id: string, data: any) => Promise<any>;
  onGenerateLogline: (projectId: string) => Promise<any>;
  onGenerateSynopsis: (projectId: string) => Promise<any>;
  onExport: (projectId: string, format: string) => Promise<any>;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const SynopsisView = ({
  project, characters, isGenerating, isDarkMode,
  editData, setEditData,
  onUpdateProject, onGenerateLogline, onGenerateSynopsis, onExport,
  addToast
}: SynopsisViewProps) => {
  const [showLoglineConfirm, setShowLoglineConfirm] = useState(false);
  const [showSynopsisConfirm, setShowSynopsisConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateProject(project.id, {
        logline: editData.logline,
        full_synopsis: editData.full_synopsis
      });
      addToast("시놉시스가 저장되었습니다.", "success");
    } catch (e) {
      addToast("저장에 실패했습니다.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAIAction = async (type: 'logline' | 'synopsis') => {
    try {
        if (type === 'logline') {
            setShowLoglineConfirm(false);
            const updated = await onGenerateLogline(project.id);
            if (updated) setEditData((prev: any) => ({ ...prev, logline: updated.logline }));
        } else {
            setShowSynopsisConfirm(false);
            const updated = await onGenerateSynopsis(project.id);
            if (updated) setEditData((prev: any) => ({ ...prev, full_synopsis: updated.full_synopsis }));
        }
        addToast("AI 초안이 생성되었습니다.", "success");
    } catch (e: any) {
        addToast(e.message || "AI 생성 실패", "error");
    }
  };

  const handleExport = async (format: string) => {
    try {
      await onExport(project.id, format);
      addToast(`${format.toUpperCase()} 문서 다운로드를 시작합니다.`, "info");
    } catch (e: any) {
      addToast(e.message || "내보내기 실패", "error");
    }
  };

  if (!project) return null;

  return (
    <div className={cn(
      "flex-1 h-full flex flex-col items-center p-12 overflow-y-auto",
      isDarkMode ? "bg-black custom-scrollbar-dark" : "bg-zinc-100 custom-scrollbar-light"
    )}>
      {/* 툴바 (상단 고정/플로팅 느낌) */}
      <div className="max-w-[800px] w-full flex justify-end gap-3 mb-8 animate-in slide-in-from-top duration-500">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg",
            isDarkMode ? "bg-zinc-900 text-zinc-300 hover:bg-zinc-800" : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
          )}
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
        </button>
        <button 
          onClick={() => handleExport('word')}
          className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/20 active:scale-95"
        >
          <Download size={14} /> Export Word
        </button>
      </div>

      {/* 리포트 문서 본체 */}
      <div className={cn(
        "max-w-[800px] w-full p-16 md:p-24 space-y-20 shadow-2xl animate-in zoom-in-95 duration-700 min-h-[1000px] mb-20",
        isDarkMode ? "bg-zinc-950 border border-zinc-900 text-zinc-200" : "bg-white border border-zinc-100 text-zinc-900"
      )}>
        
        {/* 1. 제목 섹션 */}
        <header className="text-center space-y-6 pb-12 border-b dark:border-zinc-900">
          <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            Official Synopsis Report
          </div>
          <h1 className="text-5xl font-black tracking-tighter leading-tight">
            {project.title}
          </h1>
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
            <span>{project.format || "드라마"}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>{project.genre || "장르 미정"}</span>
            <span className="w-1 h-1 rounded-full bg-zinc-700" />
            <span>{new Date().toLocaleDateString('ko-KR')}</span>
          </div>
        </header>

        {/* 2. 로그라인 섹션 */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500 bg-indigo-500/5 px-3 py-1 rounded">01. Logline</h3>
            <button 
              onClick={() => setShowLoglineConfirm(true)}
              disabled={isGenerating}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95",
                isDarkMode ? "bg-zinc-900 text-indigo-400 border border-indigo-500/30 hover:bg-zinc-800" : "bg-white text-indigo-600 border border-indigo-100 hover:bg-zinc-50"
              )}
            >
              {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI Support
            </button>
          </div>
          <textarea 
            value={editData.logline}
            onChange={e => setEditData((prev: any) => ({ ...prev, logline: e.target.value }))}
            className={cn(
              "w-full bg-transparent text-xl font-black italic border-none outline-none resize-none leading-relaxed text-center overflow-hidden",
              isDarkMode ? "text-white placeholder:text-zinc-800" : "text-zinc-800 placeholder:text-zinc-200"
            )}
            style={{ height: 'auto', minHeight: '180px' }}
            placeholder="이야기의 정수를 한 문장으로 정의하세요."
          />
        </section>

        {/* 3. 기획의도 섹션 */}
        <section className="space-y-6">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500 bg-indigo-500/5 px-3 py-1 rounded w-fit">02. Planning Intention</h3>
          <div className={cn(
            "text-base leading-8 font-medium",
            isDarkMode ? "text-zinc-400" : "text-zinc-600"
          )}>
            {project.intended_purpose || (
              <p className="italic opacity-50 uppercase text-xs tracking-widest">No intention data. Please update in Project Info.</p>
            )}
          </div>
        </section>

        {/* 4. 등장인물 섹션 */}
        <section className="space-y-8">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500 bg-indigo-500/5 px-3 py-1 rounded w-fit">03. Key Characters</h3>
          <div className="grid grid-cols-1 gap-10">
            {characters.length === 0 ? (
               <p className="italic opacity-50 uppercase text-xs tracking-widest text-center py-10">No characters registered in Character Map.</p>
            ) : (
              characters.map((char, idx) => (
                <div key={char.id} className="flex gap-8 group">
                  <div className="shrink-0 flex flex-col items-center space-y-2">
                    <div className="w-12 h-12 rounded-full border border-dashed flex items-center justify-center text-xs font-black border-zinc-700 text-zinc-500">
                      {String(idx + 1).padStart(2, '0')}
                    </div>
                  </div>
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-black">{char.name}</h4>
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter bg-indigo-500/10 px-2.5 py-0.5 rounded-full">{char.role || "조연"}</span>
                    </div>
                    <p className={cn("text-sm leading-relaxed", isDarkMode ? "text-zinc-500" : "text-zinc-500")}>
                      {char.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 5. 전체 줄거리 섹션 */}
        <section className="space-y-8 pb-12">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500 bg-indigo-500/5 px-3 py-1 rounded">04. Full Synopsis</h3>
            <button 
              onClick={() => setShowSynopsisConfirm(true)}
              disabled={isGenerating}
              className={cn(
                "flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95",
                isDarkMode ? "bg-zinc-900 text-indigo-400 border border-indigo-500/30 hover:bg-zinc-800" : "bg-white text-indigo-600 border border-indigo-100 hover:bg-zinc-50"
              )}
            >
              {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} AI Support
            </button>
          </div>
          <textarea 
            value={editData.full_synopsis}
            onChange={e => setEditData((prev: any) => ({ ...prev, full_synopsis: e.target.value }))}
            className={cn(
              "w-full bg-transparent text-base leading-[2.2] font-medium outline-none resize-none border-t border-dashed pt-8",
              isDarkMode 
                ? "text-zinc-300 placeholder:text-zinc-900 custom-scrollbar-dark" 
                : "text-zinc-700 placeholder:text-zinc-200 custom-scrollbar-light"
            )}
            style={{ minHeight: '800px' }}
            placeholder="인물들의 갈등과 사건의 흐름을 유기적으로 서술하세요."
          />
        </section>

        {/* 리포트 푸터 */}
        <footer className="pt-20 border-t dark:border-zinc-950 flex flex-col items-center space-y-4 opacity-30">
          <p className="text-[9px] font-black uppercase tracking-[0.5em]">The Final Documentation by Scriptly AI</p>
          <div className="flex gap-2">
            {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-700" />)}
          </div>
        </footer>

      </div>


      {/* 확인 모달들 */}
      {(showLoglineConfirm || showSynopsisConfirm) && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className={cn(
             "w-[420px] rounded-2xl border p-8 space-y-6 relative shadow-2xl",
             isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
           )}>
              <div className="flex flex-col items-center text-center space-y-4">
                 <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <Sparkles size={32} />
                 </div>
                 <h2 className="text-xl font-black">AI 초안을 생성하시겠습니까?</h2>
                 <p className="text-sm text-zinc-500 leading-relaxed">
                    작성된 플롯 이벤트를 바탕으로 {showLoglineConfirm ? "로그라인" : "전체 줄거리"}를 AI가 제안합니다. <br/>
                    <strong>기존 내용이 대체</strong>될 수 있습니다. 계속하시겠습니까?
                 </p>
              </div>
              <div className="flex gap-3 pt-2">
                 <button 
                   onClick={() => { setShowLoglineConfirm(false); setShowSynopsisConfirm(false); }}
                   className={cn("flex-1 py-3 rounded-xl text-xs font-bold transition-all", isDarkMode ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600")}
                 >
                    취소
                 </button>
                 <button 
                   onClick={() => handleAIAction(showLoglineConfirm ? 'logline' : 'synopsis')}
                   className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/20 transition-all"
                 >
                    네, 적용하겠습니다
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SynopsisView;
