import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';
import { X, Lock } from 'lucide-react';

const CharacterNode = ({ id, data, selected }: any) => {
  const isDarkMode = data.isDarkMode;

  // 배역 등급에 따른 차별화된 HSL/RGB 소프트 뱃지 테마 적용 (프리미엄 룩앤필)
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case '주연':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case '주조연':
        return 'bg-orange-500/10 text-orange-500 border border-orange-500/20';
      case '조연':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case '단역':
        return 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20';
      case '카메오':
        return 'bg-purple-500/10 text-purple-500 border border-purple-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20';
    }
  };
  
  return (
    <div className={cn(
      "w-[130px] h-[65px] rounded-xl flex flex-col justify-between p-2.5 transition-all shadow-md relative group border border-2",
      isDarkMode 
        ? "bg-[#14141E] border-zinc-800 text-zinc-100 hover:border-indigo-500/50" 
        : "bg-white border-zinc-200 text-zinc-900 hover:border-indigo-400",
      selected && "border-indigo-500 ring-4 ring-indigo-500/20 shadow-lg"
    )}>
      {/* 4방향 범용 핸들 (입/출력 겸용을 위해 Target/Source 분리 배치) */}
      <Handle type="target" position={Position.Top} id="t-top" className="!w-1.5 !h-1.5 !bg-zinc-400 !border-none" />
      <Handle type="source" position={Position.Top} id="s-top" className="!w-1.5 !h-1.5 !bg-indigo-500 !border-none !opacity-0" />
      
      <Handle type="target" position={Position.Right} id="t-right" className="!w-1.5 !h-1.5 !bg-zinc-400 !border-none" />
      <Handle type="source" position={Position.Right} id="s-right" className="!w-1.5 !h-1.5 !bg-indigo-500 !border-none !opacity-0" />
      
      <Handle type="target" position={Position.Bottom} id="t-bottom" className="!w-1.5 !h-1.5 !bg-zinc-400 !border-none" />
      <Handle type="source" position={Position.Bottom} id="s-bottom" className="!w-1.5 !h-1.5 !bg-indigo-500 !border-none !opacity-0" />
      
      <Handle type="target" position={Position.Left} id="t-left" className="!w-1.5 !h-1.5 !bg-zinc-400 !border-none" />
      <Handle type="source" position={Position.Left} id="s-left" className="!w-1.5 !h-1.5 !bg-indigo-500 !border-none !opacity-0" />

      {/* 상단: 이름과 배역 뱃지 */}
      <div className="flex items-center justify-between gap-1 w-full min-w-0 select-none">
        <span 
          className={cn(
            "text-[10px] font-black truncate max-w-[80px]",
            isDarkMode ? "text-zinc-100" : "text-zinc-950"
          )}
          title={data.label}
        >
          {data.label || "이름 없음"}
        </span>
        {data.role && (
          <span className={cn("text-[7px] px-1 py-0.2 rounded font-black shrink-0", getRoleBadgeClass(data.role))}>
            {data.role}
          </span>
        )}
      </div>

      {/* 하단: 직업 & 설명 */}
      <div className="flex flex-col gap-0.5 w-full min-w-0 select-none text-left">
        {data.occupation && (
          <span 
            className="text-[8px] text-zinc-400 font-bold truncate leading-none"
            title={data.occupation}
          >
            {data.occupation}
          </span>
        )}
        {data.desc && (
          <p 
            className="text-[7.5px] text-zinc-500 truncate leading-none mt-0.5"
            title={data.desc}
          >
            {data.desc}
          </p>
        )}
      </div>

      {/* Lock indicator */}
      {data.isLocked && (
        <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow z-50 animate-in fade-in zoom-in">
          <Lock size={10} />
        </div>
      )}

      {/* Delete button (캔버스에서만 삭제 제거용) */}
      {selected && !data.isLocked && (
        <button 
          onClick={(e) => { e.stopPropagation(); data.onDeleteNode(id); }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow hover:bg-rose-600 transition-all z-50 animate-in zoom-in"
        >
          <X size={10} />
        </button>
      )}
    </div>
  );
};

export default memo(CharacterNode);
