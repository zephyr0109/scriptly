import React, { useState, useRef, useCallback } from 'react';
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  getBezierPath, 
  type EdgeProps,
  useReactFlow
} from '@xyflow/react';
import { cn } from '@/lib/utils';
import { X, MessageSquare, Move } from 'lucide-react';

interface RelationshipEdgeData {
  label?: string;
  description?: string;
  isDarkMode?: boolean;
  onEditEdge?: (id: string) => void;
  curvature?: number;
  labelOffset?: { x: number, y: number };
  [key: string]: any;
}

export default function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected
}: EdgeProps) {
  const edgeData = data as RelationshipEdgeData;
  const { setEdges, getZoom } = useReactFlow();
  
  // 드래그 관련 상태
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const [localOffset, setLocalOffset] = useState(edgeData?.labelOffset || { x: 0, y: 0 });

  // 곡률 (사용자가 직선을 원하므로 기본값을 0으로 변경)
  const curvature = edgeData?.curvature !== undefined ? edgeData.curvature : 0;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature,
  });

  const onMouseDown = (evt: React.MouseEvent) => {
    if (evt.button !== 0) return; // 좌클릭만
    evt.stopPropagation();
    setIsDragging(true);
    movedRef.current = false;
    dragStart.current = { x: evt.clientX, y: evt.clientY };
  };

  const onMouseMove = useCallback((evt: MouseEvent) => {
    if (!isDragging) return;
    const zoom = getZoom();
    const dx = (evt.clientX - dragStart.current.x) / zoom;
    const dy = (evt.clientY - dragStart.current.y) / zoom;
    
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      movedRef.current = true;
    }

    setLocalOffset({
      x: (edgeData?.labelOffset?.x || 0) + dx,
      y: (edgeData?.labelOffset?.y || 0) + dy,
    });
  }, [isDragging, edgeData?.labelOffset, getZoom]);

  const onMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setEdges((eds) => eds.map((e) => {
        if (e.id === id) {
          return {
            ...e,
            data: {
              ...e.data,
              labelOffset: localOffset
            }
          };
        }
        return e;
      }));
    }
  }, [isDragging, id, localOffset, setEdges]);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, onMouseMove, onMouseUp]);

  const onEdgeClick = (evt: React.MouseEvent) => {
    // 드래그 중이었거나 드래그 직후라면 클릭 무시
    if (movedRef.current) return;
    
    evt.stopPropagation();
    if (edgeData?.onEditEdge) {
      edgeData.onEditEdge(id);
    }
  };

  const onRemoveClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    setEdges((es) => es.filter((e) => e.id !== id));
  };

  const isDarkMode = edgeData?.isDarkMode;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{
        ...style,
        stroke: selected ? (isDarkMode ? '#6366f1' : '#4f46e5') : (style.stroke || '#a1a1aa'),
        strokeWidth: selected ? 3 : 2,
        transition: isDragging ? 'none' : 'all 0.2s'
      }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX + localOffset.x}px,${labelY + localOffset.y}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div 
            onMouseDown={onMouseDown}
            title={edgeData?.description || edgeData?.label || "관계"}
            className={cn(
              "group relative flex flex-col items-center justify-center w-[46px] h-[46px] rounded-full border-2 transition-all shadow-md active:scale-95 text-center p-1 select-none",
              isDragging ? "cursor-grabbing scale-105 border-indigo-500 ring-4 ring-indigo-500/20" : "cursor-pointer hover:scale-105",
              isDarkMode 
                ? "bg-zinc-900 border-zinc-800 text-white" 
                : "bg-white border-zinc-200 text-zinc-950 font-medium",
              selected && !isDragging && (isDarkMode ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-indigo-600 ring-2 ring-indigo-500/10")
            )}
          >
            <span 
              onClick={onEdgeClick}
              className="text-[9px] font-black tracking-tighter leading-tight truncate w-full"
            >
              {edgeData?.label || "관계"}
            </span>

            {/* Actions on Selection */}
            {selected && !isDragging && (
              <div className="absolute -top-3 -right-3 flex gap-1 animate-in zoom-in duration-200">
                <button 
                  onClick={onRemoveClick}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all"
                >
                  <X size={10} />
                </button>
                <button 
                  onClick={onEdgeClick}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-all"
                >
                  <MessageSquare size={10} />
                </button>
              </div>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
