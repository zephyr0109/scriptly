import React, { useCallback, useMemo } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  Panel,
  addEdge,
  Connection,
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Brain, Save, History, Plus, Target, Sparkles } from 'lucide-react';
import { API_BASE_URL, getUUID, cn } from "@/lib/utils";

import SourceCardNode from './SourceCardNode';
import DetailNode from './DetailNode';
import CharacterCircleNode from './CharacterCircleNode';

const nodeTypes = {
  sourceCard: SourceCardNode,
  detailNode: DetailNode,
  characterCircle: CharacterCircleNode,
};

const FlowContent = (props: any) => {
  const { 
    nodes, 
    setNodes, 
    edges, 
    setEdges, 
    isDarkMode,
    onSaveSession,
    onSynthesize
  } = props;
  const { screenToFlowPosition } = useReactFlow();

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds: Node[]) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds: Edge[]) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds: Edge[]) => addEdge({ ...params, animated: true, style: { stroke: isDarkMode ? '#a1a1aa' : '#52525b', strokeWidth: 2 } }, eds)),
    [setEdges, isDarkMode]
  );

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    const newLabel = window.prompt("관계(메모)를 입력하세요:", edge.label as string || "");
    if (newLabel !== null) {
      setEdges((eds: Edge[]) => eds.map((e) => {
        if (e.id === edge.id) {
          return {
            ...e,
            label: newLabel,
            labelStyle: { fill: isDarkMode ? '#fff' : '#000', fontSize: 11, fontWeight: 'bold' },
            labelBgStyle: { fill: isDarkMode ? '#18181b' : '#f4f4f5', opacity: 0.8 }
          };
        }
        return e;
      }));
    }
  }, [setEdges, isDarkMode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      const reactFlowData = event.dataTransfer.getData('application/reactflow');
      if (!reactFlowData) return;
      
      const sourceData = JSON.parse(reactFlowData);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: getUUID(),
        type: 'sourceCard',
        position,
        data: { 
          title: sourceData.title,
          type: sourceData.type,
          summary: sourceData.summary || sourceData.article?.description,
          keywords: sourceData.source_metadata?.detailed_analysis?.keywords || [],
          tension_score: sourceData.tension_score || 0,
          detailed_analysis: sourceData.source_metadata?.detailed_analysis,
          ref_source_id: sourceData.id,
          isDarkMode
        },
      };

      setNodes((nds: any) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes, isDarkMode]
  );
  
  // 노드 데이터에 콜백 주입
  const enrichedNodes = useMemo(() => {
    return nodes.map((n: Node) => ({
      ...n,
      data: {
        ...n.data,
        isDarkMode,
        onExtract: props.onExtract // 상위에서 전달받은 handleExtract
      }
    }));
  }, [nodes, isDarkMode, props.onExtract]);

  const selectedNodes = nodes.filter((n: any) => n.selected);

  return (
    <div className="flex-1 relative h-full w-full outline-none">
      <ReactFlow
        nodes={enrichedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        colorMode={isDarkMode ? 'dark' : 'light'}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
        <Controls />
        
        {/* 상단 툴바 */}
        <Panel position="top-left" className="flex gap-2">
           <div className={cn(
             "px-4 py-3 rounded-2xl border shadow-2xl flex items-center gap-4 backdrop-blur-xl",
             isDarkMode ? "bg-zinc-900/80 border-zinc-800" : "bg-white/80 border-zinc-100"
           )}>
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                 <Brain size={18} />
              </div>
              <div>
                 <h2 className={cn("text-xs font-black uppercase tracking-widest", isDarkMode ? "text-zinc-400" : "text-zinc-500")}>Insight Lab</h2>
                 <p className={cn("text-[10px] font-bold", isDarkMode ? "text-white" : "text-zinc-900")}>인물 관계 및 서사 설계</p>
              </div>
           </div>
        </Panel>

        {/* 액션 버튼 패널 */}
        <Panel position="top-right" className="flex gap-2">
           {selectedNodes.length > 0 && (
             <button 
               onClick={() => onSynthesize(selectedNodes.map((n:any) => n.id))}
               className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/20 transition-all active:scale-95 animate-in fade-in zoom-in"
             >
                <Sparkles size={14} /> AI 초안 생성 ({selectedNodes.length}개 선택됨)
             </button>
           )}
           <button 
             onClick={onSaveSession}
             className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
           >
              <Save size={14} /> 세션 저장
           </button>
        </Panel>

        {/* 하단 안내 패널 */}
        <Panel position="bottom-center" className="mb-4">
           <div className={cn(
             "px-6 py-2 rounded-full border text-[10px] font-bold tracking-tight opacity-50",
             isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-500" : "bg-white border-zinc-100 text-zinc-400"
           )}>
             노드를 드래그하여 배치하고, 핸들을 연결하여 관계를 설정하세요.
           </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};

import { ReactFlowProvider, useReactFlow } from '@xyflow/react';

const InsightLabViewWrapper = (props: any) => (
  <ReactFlowProvider>
    <FlowContent {...props} />
  </ReactFlowProvider>
);

export default InsightLabViewWrapper;
