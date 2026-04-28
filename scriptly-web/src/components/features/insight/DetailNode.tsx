import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { User, Zap, ArrowRightLeft, Wind } from 'lucide-react';
import { cn } from '@/lib/utils';

const DetailNode = ({ data }: any) => {
  const isDarkMode = data.isDarkMode;
  
  const getIcon = () => {
    switch (data.type) {
      case 'character': return <User size={14} className="text-indigo-400" />;
      case 'event': return <Zap size={14} className="text-amber-400" />;
      case 'conflict': return <ArrowRightLeft size={14} className="text-rose-400" />;
      case 'atmosphere': return <Wind size={14} className="text-sky-400" />;
      default: return null;
    }
  };

  const getLabel = () => {
    switch (data.type) {
      case 'character': return 'Character';
      case 'event': return 'Incident';
      case 'conflict': return 'Conflict';
      case 'atmosphere': return 'Mood';
      default: return 'Element';
    }
  };

  const getColorClass = () => {
    switch (data.type) {
      case 'character': return 'border-indigo-500/50 bg-indigo-500/5';
      case 'event': return 'border-amber-500/50 bg-amber-500/5';
      case 'conflict': return 'border-rose-500/50 bg-rose-500/5';
      case 'atmosphere': return 'border-sky-500/50 bg-sky-500/5';
      default: return 'border-zinc-500/50';
    }
  };

  return (
    <div className={cn(
      "px-4 py-3 rounded-2xl border-2 transition-all w-52 shadow-lg relative",
      isDarkMode ? "bg-zinc-900" : "bg-white",
      getColorClass(),
      data.type === 'character' && (isDarkMode ? "border-indigo-500 shadow-indigo-500/20" : "border-indigo-600 shadow-indigo-600/10")
    )}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 bg-zinc-500" />
      
      <div className="flex items-center gap-2 mb-1.5 opacity-80">
        <div className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center",
          data.type === 'character' ? "bg-indigo-500/20" : "bg-zinc-500/10"
        )}>
          {getIcon()}
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.15em]">{getLabel()}</span>
      </div>
      
      <div className="space-y-1 mt-1">
        <h4 className={cn("text-sm font-black leading-tight", isDarkMode ? "text-white" : "text-zinc-900")}>
          {data.label}
        </h4>
        {data.subtext && (
          <p className={cn("text-[10px] line-clamp-3 leading-relaxed opacity-60 font-medium", isDarkMode ? "text-zinc-400" : "text-zinc-600")}>
            {data.subtext}
          </p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="w-2 h-2 bg-zinc-500" />
    </div>
  );
};

export default memo(DetailNode);
