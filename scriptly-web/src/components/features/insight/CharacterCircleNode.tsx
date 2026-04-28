import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const CharacterCircleNode = ({ id, data, selected }: any) => {
  const isDarkMode = data.isDarkMode;
  
  return (
    <div className={cn(
      "w-[100px] h-[32px] rounded-full flex items-center justify-center px-3 transition-all duration-300 shadow-md relative border group",
      isDarkMode 
        ? "bg-zinc-900 border-zinc-800 text-zinc-100" 
        : "bg-white border-zinc-200 text-zinc-900",
      selected && "border-indigo-500 ring-2 ring-indigo-500/30"
    )}>
      {/* Standard Handles: Consistent with original IDs and standard workflow */}
      {/* Left Area (Target & Source) */}
      <Handle type="target" position={Position.Left} id="t-left" className="!w-1.5 !h-1.5 !bg-zinc-500 !-left-0.5" />
      <Handle type="source" position={Position.Left} id="s-left" className="!w-1.5 !h-1.5 !bg-indigo-500 !-left-0.5 !mt-1" />
      
      {/* Right Area (Target & Source) */}
      <Handle type="target" position={Position.Right} id="t-right" className="!w-1.5 !h-1.5 !bg-zinc-500 !-right-0.5" />
      <Handle type="source" position={Position.Right} id="s-right" className="!w-1.5 !h-1.5 !bg-indigo-500 !-right-0.5 !mt-1" />

      <div className="flex items-center gap-2 w-full truncate text-center justify-center pointer-events-none">
         <h3 className="text-[10px] font-black tracking-tighter truncate leading-none">
           {data.label || "Unnamed"}
         </h3>
      </div>

      {/* Delete button */}
      {selected && (
        <button 
          onClick={(e) => { e.stopPropagation(); data.onDeleteNode(id); }}
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all z-50 animate-in zoom-in"
        >
          <X size={8} />
        </button>
      )}
    </div>
  );
};

export default memo(CharacterCircleNode);
