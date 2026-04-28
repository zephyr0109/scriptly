import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FileText, Sparkles, User, Zap, ArrowRightLeft, Wind, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const SourceCardNode = ({ id, data: rawData, selected }: any) => {
  const data = rawData as any;
  return (
    <div className={cn(
      "px-4 py-4 rounded-xl transition-all w-64 shadow-xl relative group",
      data.isDarkMode ? "bg-zinc-900 border border-zinc-700" : "bg-white border border-zinc-200",
      selected && (data.isDarkMode ? "border-indigo-500 shadow-indigo-500/30" : "border-indigo-500 shadow-indigo-500/30 ring-2 ring-indigo-500")
    )}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500 rounded-full border-2 border-white" />
      
      <div className="flex items-center gap-2 mb-2">
        {data.type === 'FILE' ? <FileText size={16} className="text-sky-500" /> : <Sparkles size={16} className="text-amber-500" />}
        <h3 className={cn("text-xs font-bold leading-tight line-clamp-2", data.isDarkMode ? "text-white" : "text-zinc-900")}>
          {data.title}
        </h3>
      </div>
      
      {data.summary && (
        <p className={cn("text-[10px] line-clamp-2 opacity-60 leading-normal mb-2", data.isDarkMode ? "text-zinc-400" : "text-zinc-600")}>
          {data.summary}
        </p>
      )}

      {data.keywords && data.keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {data.keywords.slice(0, 3).map((kw: string, idx: number) => (
            <span key={idx} className={cn(
              "px-2 py-0.5 text-[9px] rounded-full font-medium whitespace-nowrap",
              data.isDarkMode ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"
            )}>
              #{kw}
            </span>
          ))}
        </div>
      )}

      {/* Extraction Actions (Hover) */}
      <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Extract:</span>
        <div className="flex gap-2">
          {data.detailed_analysis?.people && (
            <button onClick={() => data.onExtract?.(id, 'character')} className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all" title="인물 추출">
              <User size={12} />
            </button>
          )}
          {data.detailed_analysis?.incidents && (
            <button onClick={() => data.onExtract?.(id, 'event')} className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white transition-all" title="사건 추출">
              <Zap size={12} />
            </button>
          )}
          {data.detailed_analysis?.core_conflict && (
            <button onClick={() => data.onExtract?.(id, 'conflict')} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all" title="갈등 추출">
              <ArrowRightLeft size={12} />
            </button>
          )}
          {data.detailed_analysis?.atmosphere && (
            <button onClick={() => data.onExtract?.(id, 'atmosphere')} className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-white transition-all" title="분위기 추출">
              <Wind size={12} />
            </button>
          )}
        </div>
      </div>

      {data.tension_score > 0 && (
         <div className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg text-[10px] font-black border-2 border-white dark:border-zinc-900">
            {data.tension_score}
         </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500 rounded-full border-2 border-white" />
    </div>
  );
};

export default memo(SourceCardNode);
