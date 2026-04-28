import React, { useState, useEffect } from "react";
import { Search, Archive, Plus, X, FileText, Sparkles, Wind, CheckCircle2, Loader2 } from "lucide-react";
import { cn, API_BASE_URL } from "@/lib/utils";

interface ArchiveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: any[]) => void;
  isDarkMode: boolean;
  existingSourceIds?: string[];
}

const ArchiveImportModal = ({ isOpen, onClose, onImport, isDarkMode, existingSourceIds = [] }: ArchiveImportModalProps) => {
  const [sources, setSources] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSources();
    }
  }, [isOpen]);

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/archive/sources`);
      if (resp.ok) {
        const data = await resp.json();
        setSources(data);
      }
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  const filteredSources = sources.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.summary?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className={cn(
        "w-full max-w-5xl h-[85vh] rounded-[4rem] shadow-4xl flex flex-col overflow-hidden",
        isDarkMode ? "bg-zinc-950 border border-zinc-900" : "bg-white border border-zinc-100 shadow-2xl"
      )}>
        {/* Header Section */}
        <div className={cn("p-10 border-b flex justify-between items-center", isDarkMode ? "border-zinc-900 bg-zinc-900/40" : "border-zinc-100 bg-zinc-50")}>
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-500/20 text-black">
                <Archive size={32} />
             </div>
             <div>
                <h2 className={cn("text-3xl font-black tracking-tight", isDarkMode ? "text-white" : "text-zinc-900")}>영감 불러오기</h2>
                <p className={cn("text-[11px] font-bold uppercase tracking-widest mt-1", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>영감 보관함에서 작품 기획에 참고할 자료를 가져오세요.</p>
             </div>
          </div>
          <button onClick={onClose} className="p-4 rounded-3xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-rose-500 transition-all">
             <X size={24} />
          </button>
        </div>

        {/* Search & Statistics Bar */}
        <div className="px-10 py-6 border-b dark:border-zinc-800 flex items-center gap-8">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="제목, 키워드, 내용으로 검색..." 
              className={cn(
                "w-full pl-16 pr-8 py-5 rounded-3xl font-black outline-none border-2 transition-all",
                isDarkMode ? "bg-black border-zinc-900 text-white focus:border-indigo-500/50" : "bg-zinc-50 border-zinc-100 text-zinc-900 focus:border-indigo-500 focus:bg-white focus:shadow-xl shadow-zinc-200/40"
              )}
            />
          </div>
          <div className="flex items-center gap-4 px-6 py-4 bg-indigo-500/10 rounded-2xl">
             <div className="text-right">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Selected</p>
                <p className={cn("text-xl font-black", isDarkMode ? "text-white" : "text-indigo-600")}>{selectedIds.length}개</p>
             </div>
          </div>
        </div>

        {/* Sources Grid/List */}
        <div className={cn(
          "flex-1 overflow-y-auto p-10 grid grid-cols-2 gap-6 items-start content-start",
          isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar-light"
        )}>
          {isLoading ? (
             <div className="col-span-2 py-40 text-center flex flex-col items-center gap-4 opacity-30">
                <Loader2 size={40} className="animate-spin" />
                <p className="font-black uppercase tracking-widest text-xs">Loading Archive...</p>
             </div>
          ) : filteredSources.length === 0 ? (
             <div className="col-span-2 py-40 text-center opacity-30 flex flex-col items-center gap-4">
                <Search size={40} />
                <p className="text-sm font-bold">검색 결과가 없거나 보관함이 비어있습니다.</p>
             </div>
          ) : (
            filteredSources.map(s => (
              <div 
                key={s.id}
                className={cn(
                  "p-6 rounded-[2.5rem] border-2 transition-all flex items-center justify-between group h-28 relative overflow-hidden",
                  existingSourceIds.includes(s.id) 
                    ? "opacity-40 cursor-not-allowed border-dashed grayscale" 
                    : "cursor-pointer",
                  selectedIds.includes(s.id) 
                    ? (isDarkMode ? "bg-indigo-600/10 border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.1)]" : "bg-indigo-50 border-indigo-200 shadow-xl shadow-indigo-200/40")
                    : (!existingSourceIds.includes(s.id) && (isDarkMode ? "bg-zinc-950 border-zinc-900 hover:border-zinc-700" : "bg-white border-zinc-100 hover:shadow-2xl hover:border-indigo-100"))
                )}
                onClick={() => !existingSourceIds.includes(s.id) && toggleSelect(s.id)}
              >
                <div className="flex items-center gap-6 relative z-10">
                   <div className={cn(
                     "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg",
                     selectedIds.includes(s.id) ? "bg-indigo-600 text-white animate-in zoom-in" : (isDarkMode ? "bg-black text-zinc-600" : "bg-zinc-100 text-zinc-500")
                   )}>
                      {s.type === 'NEWS' ? <FileText size={24} /> : <Wind size={24} />}
                   </div>
                   <div className="space-y-1 min-w-0 pr-4">
                      <h4 className={cn("text-base font-black truncate", isDarkMode ? "text-white" : "text-zinc-900")}>{s.title}</h4>
                      <p className="text-[11px] text-zinc-500 font-bold line-clamp-1">{s.summary || "인사이트 요약 없음"}</p>
                   </div>
                </div>
                
                {selectedIds.includes(s.id) ? (
                  <CheckCircle2 size={28} className="text-indigo-500 animate-in fade-in slide-in-from-right-4 relative z-10" />
                ) : existingSourceIds.includes(s.id) ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800/50 rounded-full text-[9px] font-black text-zinc-500 uppercase tracking-tight relative z-10">
                    Already Linked
                  </div>
                ) : (
                  <Plus size={24} className="text-zinc-300 dark:text-zinc-800 opacity-0 group-hover:opacity-100 transition-all relative z-10" />
                )}
                
                {/* Visual Background Accent for Selected */}
                {selectedIds.includes(s.id) && (
                   <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-10 -mt-10 blur-3xl animate-pulse" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Action Bar */}
        <div className={cn("p-10 border-t flex justify-between items-center", isDarkMode ? "border-zinc-900 bg-zinc-900/40" : "border-zinc-100 bg-zinc-50")}>
           <div className="flex items-center gap-3">
              <Archive size={18} className="text-zinc-400" />
              <p className={cn("text-xs font-bold", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>프로젝트의 영감 자료로 연결됩니다.</p>
           </div>
           <div className="flex gap-4">
              <button 
                onClick={onClose}
                className="px-8 py-3.5 rounded-2xl font-black text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                닫기
              </button>
              <button 
                onClick={() => {
                  onImport(sources.filter(s => selectedIds.includes(s.id)));
                  onClose();
                }}
                disabled={selectedIds.length === 0}
                className="px-12 py-3.5 bg-zinc-900 dark:bg-white dark:text-black rounded-2xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                {selectedIds.length}개의 영감 프로젝트에 추가
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveImportModal;
