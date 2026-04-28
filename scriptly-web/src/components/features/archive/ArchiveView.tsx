/**
 * [Architecture Point: UI Layer - Feature Component]
 * 영감 보관소(Archive) 기능을 담당하는 메인 뷰 컴포넌트입니다.
 * 필사 시 필터링 로직과 데이터 렌더링 패턴을 관찰하십시오.
 */
import React, { useState } from "react";
import { Archive, FileUp, FileText, Sparkles, CheckCircle2, Trash2, Brain, Link as LinkIcon, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const ArchiveView = ({ 
  archiveItems, 
  selectedArchiveIndex, 
  setSelectedArchiveIndex, 
  selectedSourceIds,
  setSelectedSourceIds,
  isDarkMode,
  handleDelete,
  handleFileUpload,
  isUploading,
  handleSynthesize,
  handleUrlArchive
}: any) => {
  const [urlInput, setUrlInput] = useState("");

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSourceIds((prev: string[]) => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const onUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    handleUrlArchive(urlInput);
    setUrlInput("");
  };

  return (
    <div className={cn(
      "flex-1 overflow-y-auto p-8 space-y-10 font-sans scroll-smooth relative",
      isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar-light"
    )}>
      <header className="flex justify-between items-end border-b border-zinc-100 dark:border-zinc-800 pb-8">
        <div>
          <h1 className={cn("text-3xl font-bold mb-2 tracking-tight", isDarkMode ? "text-white" : "text-zinc-900")}>
            영감 보관함
          </h1>
          <p className="text-zinc-500 font-medium font-sans text-sm">
            드라마틱한 순간들을 보관하고 프로젝트의 자산으로 관리합니다.
          </p>
        </div>
        {selectedSourceIds.length > 0 && (
          <button 
            onClick={() => setSelectedSourceIds([])}
            className="text-xs font-bold text-rose-500 hover:underline transition-all"
          >
            선택 해제 ({selectedSourceIds.length})
          </button>
        )}
      </header>

      {/* 자료 수집 영역 (파일 + URL) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 파일 업로드 */}
        <div className={cn(
          "p-10 rounded-[2.5rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-6 group",
          isDarkMode ? "bg-zinc-900/20 border-zinc-800 hover:border-amber-500/50" : "bg-zinc-50 border-zinc-200 hover:border-amber-500 hover:bg-white shadow-inner"
        )}>
          <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center transition-all group-hover:scale-110", isDarkMode ? "bg-zinc-800 text-zinc-500 group-hover:text-amber-500" : "bg-white text-zinc-300 group-hover:text-amber-500 shadow-sm")}>
             <FileUp size={32} />
          </div>
          <div className="text-center space-y-2">
             <h3 className={cn("text-sm font-black uppercase tracking-widest", isDarkMode ? "text-zinc-400" : "text-zinc-600")}>파일 업로드</h3>
             <p className="text-[11px] text-zinc-500 font-medium italic">PDF, TXT, DOCX 자료 보관</p>
          </div>
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }} 
            accept=".pdf,.txt,.docx"
          />
          <button 
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isUploading}
            className={cn(
              "px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all",
              isDarkMode ? "bg-amber-500 text-black hover:bg-amber-400" : "bg-zinc-900 text-white hover:bg-zinc-800"
            )}
          >
            {isUploading ? "업로드 중..." : "파일 선택하기"}
          </button>
        </div>

        {/* URL 링크 수집 */}
        <div className={cn(
          "p-10 rounded-[2.5rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-6 group",
          isDarkMode ? "bg-zinc-900/20 border-zinc-800 hover:border-indigo-500/50" : "bg-zinc-50 border-zinc-200 hover:border-indigo-500 hover:bg-white shadow-inner"
        )}>
          <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center transition-all group-hover:scale-110", isDarkMode ? "bg-zinc-800 text-zinc-500 group-hover:text-indigo-500" : "bg-white text-zinc-300 group-hover:text-indigo-500 shadow-sm")}>
             <LinkIcon size={32} />
          </div>
          <div className="text-center space-y-2 w-full px-4">
             <h3 className={cn("text-sm font-black uppercase tracking-widest", isDarkMode ? "text-zinc-400" : "text-zinc-600")}>외부 링크 분석</h3>
             <form onSubmit={onUrlSubmit} className="mt-4 flex gap-2">
                <input 
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://news.naver.com/..."
                  className={cn(
                    "flex-1 px-4 py-3 rounded-xl text-xs border transition-all outline-none",
                    isDarkMode ? "bg-zinc-800 border-zinc-700 text-white focus:border-indigo-500" : "bg-white border-zinc-200 text-zinc-900 focus:border-indigo-500"
                  )}
                />
                <button 
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all active:scale-95"
                >
                   <Zap size={16} />
                </button>
             </form>
             <p className="text-[11px] text-zinc-500 font-medium italic mt-2">웹 페이지의 내용을 추출하여 영감으로 변환합니다.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
        {archiveItems.length > 0 ? (
          archiveItems.map((item: any, index: number) => (
            <div 
              key={item.id || index} 
              onClick={() => setSelectedArchiveIndex(index)}
              className={cn(
                "p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-64",
                selectedArchiveIndex === index 
                  ? (isDarkMode ? "bg-zinc-900 border-amber-500/50 shadow-2xl" : "bg-white border-amber-500 shadow-xl shadow-amber-500/10") 
                  : (isDarkMode ? "bg-zinc-900/30 border-zinc-800/50 hover:border-zinc-700" : "bg-white border-zinc-100 hover:border-zinc-200 shadow-sm"),
                selectedSourceIds.includes(item.id) && "ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-[#0A0A0A]"
              )}
            >
              {/* 선택 체크박스 */}
              <div 
                onClick={(e) => toggleSelect(item.id, e)}
                className={cn(
                  "absolute top-6 left-6 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all z-10",
                  selectedSourceIds.includes(item.id) 
                    ? "bg-indigo-600 border-indigo-600 text-white" 
                    : "bg-white/10 border-zinc-700 opacity-0 group-hover:opacity-100"
                )}
              >
                {selectedSourceIds.includes(item.id) && <CheckCircle2 size={12} />}
              </div>

              <div className="flex justify-between items-start mb-4 pl-8">
                <div className="flex items-center gap-2">
                   {item.type === "FILE" ? <FileText size={12} className="text-sky-500" /> : <Sparkles size={12} className="text-amber-500" />}
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.type} • {new Date(item.ingested_at).toLocaleDateString()}</span>
                </div>
                
                <div className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-black tracking-tight",
                  item.analysis_status === "COMPLETED" ? "bg-amber-500 text-black" :
                  item.analysis_status === "PROCESSING" ? "bg-indigo-500 text-white animate-pulse" :
                  item.analysis_status === "FAILED" ? "bg-rose-500 text-white" : "bg-zinc-700 text-zinc-400"
                )}>
                  {item.analysis_status === "COMPLETED" ? `TENSION ${item.tension_score}` : 
                   item.analysis_status === "PROCESSING" ? "AI 분석 중" : 
                   item.analysis_status === "FAILED" ? "분석 실패" : "대기 중"}
                </div>
              </div>

              <h3 className={cn("text-lg font-bold mb-3 line-clamp-2 group-hover:text-amber-500 transition-colors duration-300 leading-tight pl-8", isDarkMode ? "text-white" : "text-zinc-900")}>{item.title}</h3>
              <p className={cn("text-xs line-clamp-3 mb-6 leading-relaxed opacity-60 font-medium pl-8", isDarkMode ? "text-zinc-400" : "text-zinc-600")}>{item.summary}</p>
              
              <div className="mt-auto flex justify-between items-center pl-8">
                <div className="flex gap-1">
                   {item.source_metadata?.detailed_analysis?.keywords?.slice(0, 2).map((kw: string, i: number) => (
                     <span key={i} className="text-[9px] font-bold text-zinc-500">#{kw}</span>
                   ))}
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                     className="p-2 rounded-lg hover:bg-rose-500/10 text-zinc-500 hover:text-rose-500 transition-colors"
                   >
                      <Trash2 size={14} />
                   </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-40 flex flex-col items-center justify-center gap-6 opacity-20 text-center">
             <Archive size={48} />
             <p className="text-sm font-black uppercase tracking-widest">보관된 영감이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 멀티 선택 플로팅 바 */}
      {selectedSourceIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-500">
           <div className={cn(
             "px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-8 border backdrop-blur-xl",
             isDarkMode ? "bg-zinc-900/90 border-indigo-500/30" : "bg-white/90 border-indigo-100"
           )}>
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Selection</span>
                 <span className={cn("text-sm font-bold", isDarkMode ? "text-white" : "text-zinc-900")}>{selectedSourceIds.length}개의 영감 선택됨</span>
              </div>
              <button 
                onClick={handleSynthesize}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center gap-2"
              >
                <Brain size={16} /> 연구소 전송 및 합성
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default ArchiveView;
