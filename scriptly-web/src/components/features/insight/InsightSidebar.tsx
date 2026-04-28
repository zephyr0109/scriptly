import React from "react";
import { FileText, Sparkles, Trash2, Zap, Brain, LayoutList, Target, X as LucideX } from "lucide-react";
import { cn } from "@/lib/utils";

const InsightSidebar = ({ 
  labSources = [], 
  onRemoveSource, 
  isDarkMode,
  project
}: any) => {
  const onDragStart = (event: React.DragEvent, source: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(source));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={cn(
      "flex flex-col h-full transition-colors",
      isDarkMode ? "bg-[#0C0C0C]" : "bg-zinc-50/50"
    )}>
      <div className="p-6 border-b border-zinc-800/50">
        <h2 className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-2", isDarkMode ? "text-zinc-500" : "text-zinc-400")}>
          <LayoutList size={14} className="text-zinc-500" /> Active Drawing Space
        </h2>
        <p className={cn("text-xs font-black truncate", isDarkMode ? "text-white" : "text-zinc-900")}>{project?.title}</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className={cn("text-[11px] font-black uppercase tracking-widest text-zinc-500")}>관련 영감 ({labSources.length})</h3>
          </div>
          
          <div className="space-y-3">
            {labSources.length > 0 ? (
              labSources.map((source: any) => (
                <div 
                  key={source.id} 
                  draggable={true}
                  onDragStart={(event) => onDragStart(event, source)}
                  className={cn(
                    "p-3 rounded-2xl border transition-all group relative cursor-grab active:cursor-grabbing",
                    isDarkMode ? "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800" : "bg-white border-zinc-100 shadow-sm hover:shadow-md"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {source.type === "FILE" ? <FileText size={14} className="text-sky-500 mt-0.5" /> : <Sparkles size={14} className="text-amber-500 mt-0.5" />}
                    <div className="flex-1">
                       <p className={cn("text-[11px] font-bold line-clamp-2 leading-snug", isDarkMode ? "text-zinc-300" : "text-zinc-700")}>{source.title}</p>
                       {source.source_metadata?.detailed_analysis?.keywords && (
                         <div className="flex flex-wrap gap-1 mt-2">
                           {source.source_metadata.detailed_analysis.keywords.slice(0, 3).map((kw: string, i: number) => (
                             <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium">#{kw}</span>
                           ))}
                         </div>
                       )}
                    </div>
                  </div>
                  <button 
                    onClick={() => onRemoveSource(source.id)}
                    className="absolute -top-1 -right-1 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-10 text-center border-2 border-dashed border-zinc-800/50 rounded-3xl">
                <p className="text-[10px] font-bold text-zinc-600">선택된 영감이 없습니다.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="p-6 border-t border-zinc-800/50">
        <p className="text-[10px] text-zinc-500 text-center font-medium leading-relaxed bg-zinc-900/30 p-3 rounded-xl">
          카드를 <span className="text-indigo-400 font-bold">오른쪽 캔버스로 드래그</span>하세요.
        </p>
      </div>
    </div>
  );
};

const X = ({ size, className }: any) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
);

export default InsightSidebar;
