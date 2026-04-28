import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { X, Lock } from 'lucide-react';

const CharacterNode = ({ id, data, selected }: any) => {
  const isDarkMode = data.isDarkMode;
  
  return (
    <div className={cn(
      "w-[60px] h-[60px] rounded-full flex items-center justify-center p-2 transition-all shadow-md relative group border-2",
      isDarkMode 
        ? "bg-zinc-800 border-zinc-600 text-zinc-100 hover:border-indigo-400" 
        : "bg-white border-zinc-300 text-zinc-900 hover:border-indigo-400",
      selected && "border-indigo-500 ring-4 ring-indigo-500/20 shadow-lg"
    )}>
      {/* 4방향 범용 핸들 (입/출력 겸용을 위해 Target/Source 분리 배치) */}
      <Handle type="target" position={Position.Top} id="t-top" className="!w-2 !h-2 !bg-zinc-400 !border-none" />
      <Handle type="source" position={Position.Top} id="s-top" className="!w-2 !h-2 !bg-indigo-500 !border-none !opacity-0" />
      
      <Handle type="target" position={Position.Right} id="t-right" className="!w-2 !h-2 !bg-zinc-400 !border-none" />
      <Handle type="source" position={Position.Right} id="s-right" className="!w-2 !h-2 !bg-indigo-500 !border-none !opacity-0" />
      
      <Handle type="target" position={Position.Bottom} id="t-bottom" className="!w-2 !h-2 !bg-zinc-400 !border-none" />
      <Handle type="source" position={Position.Bottom} id="s-bottom" className="!w-2 !h-2 !bg-indigo-500 !border-none !opacity-0" />
      
      <Handle type="target" position={Position.Left} id="t-left" className="!w-2 !h-2 !bg-zinc-400 !border-none" />
      <Handle type="source" position={Position.Left} id="s-left" className="!w-2 !h-2 !bg-indigo-500 !border-none !opacity-0" />

      {/* 오직 '이름'만 표시 (PPT 스타일) */}
      <div className="text-center w-full pointer-events-none">
         <h3 className="text-[11px] font-bold truncate">
           {data.label || "이름 없음"}
         </h3>
      </div>

      {/* Lock indicator */}
      {data.isLocked && (
        <div className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow z-50 animate-in fade-in zoom-in">
          <Lock size={12} />
        </div>
      )}

      {/* Delete button (캔버스에서만 삭제 제거용) */}
      {selected && !data.isLocked && (
        <button 
          onClick={(e) => { e.stopPropagation(); data.onDeleteNode(id); }}
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow hover:bg-rose-600 transition-all z-50 animate-in zoom-in"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

export default memo(CharacterNode);
