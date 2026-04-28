import React from "react";
import { X, BookOpen, Lightbulb, Plus, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface InspirationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sources: any[];
  isDarkMode: boolean;
  onAddEvent: (eventData: { title: string, content: string }) => void;
}

const InspirationDrawer = ({ isOpen, onClose, sources, isDarkMode, onAddEvent }: InspirationDrawerProps) => {
  if (!isOpen) return null;

  return (
    <div className={cn(
      "absolute top-0 right-0 h-full w-[400px] z-[60] flex flex-col shadow-2xl border-l animate-in slide-in-from-right duration-300",
      isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
    )}>
      {/* Drawer Header */}
      <div className={cn(
        "p-6 border-b flex justify-between items-center",
        isDarkMode ? "border-zinc-800" : "border-zinc-100"
      )}>
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-indigo-500" />
          <h3 className={cn("text-sm font-black uppercase tracking-widest", isDarkMode ? "text-white" : "text-zinc-900")}>
            Inspiration Reference
          </h3>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
        >
          <X size={20} className="text-zinc-500" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className={cn(
        "flex-1 overflow-y-auto p-6 space-y-8",
        isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar-light"
      )}>
        {sources.length === 0 ? (
          <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
            <Info size={40} />
            <p className="text-[10px] font-black uppercase tracking-widest">No linked sources</p>
            <p className="text-[9px] font-bold">Link materials in the project sidebar</p>
          </div>
        ) : (
          sources.map((source) => {
            const incidents = source.source_metadata?.detailed_analysis?.incidents || [];
            if (incidents.length === 0) return null;

            return (
              <div key={source.id} className="space-y-4">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                   <h4 className={cn("text-[11px] font-black truncate max-w-[300px]", isDarkMode ? "text-zinc-400" : "text-zinc-600")}>
                     {source.title}
                   </h4>
                </div>
                
                <div className="space-y-3">
                  {incidents.map((incident: string, idx: number) => (
                    <div 
                      key={idx}
                      className={cn(
                        "p-4 rounded-2xl border transition-all group",
                        isDarkMode ? "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700" : "bg-zinc-50 border-zinc-100 hover:border-zinc-200"
                      )}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <p className={cn("text-xs font-bold leading-relaxed", isDarkMode ? "text-zinc-300" : "text-zinc-800")}>
                          {incident}
                        </p>
                        <button 
                          onClick={() => onAddEvent({ title: incident.slice(0, 20) + "...", content: incident })}
                          className="p-2 bg-indigo-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg shadow-indigo-600/20"
                          title="테스트에 추가"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Drawer Footer */}
      <div className={cn(
        "p-6 border-t text-center",
        isDarkMode ? "border-zinc-800" : "border-zinc-100"
      )}>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
          AI extracted key events from your research
        </p>
      </div>
    </div>
  );
};

export default InspirationDrawer;
