import React, { useState, useCallback, useRef } from "react";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  addEdge, 
  Connection, 
  MarkerType,
  useReactFlow,
  ReactFlowProvider
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { 
  Users, Edit2, Trash2, X, UserPlus, RefreshCw, Square, Circle, Sparkles, Lock, Loader2
} from "lucide-react";
import { 
  getUUID,
  cn 
} from "@/lib/utils";
import CharacterNode from "./CharacterNode";
import RelationshipEdge from "./RelationshipEdge";

const nodeTypes = {
  characterNode: CharacterNode,
};

const edgeTypes = {
  relationshipEdge: RelationshipEdge,
};

// 기본 엣지 옵션
const edgeOptions = {
  type: 'relationshipEdge',
  style: { strokeWidth: 2, stroke: '#a1a1aa' },
};

interface CharacterBoardProps {
  characters: any[];
  syncCharacters: (id: string, sourceIds: string[]) => void;
  createCharacter: (data: any) => void;
  updateCharacter: (id: string, data: any) => void;
  deleteCharacter: (id: string) => void;
  handleGenerateMapDraft: (projectId: string) => Promise<void>;
  project: any;
  isDarkMode: boolean;
  nodes: any[];
  setNodes: any;
  onNodesChange: any;
  edges: any[];
  setEdges: any;
  onEdgesChange: any;
  linkedSources: string[];
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const CharacterBoardInner = ({ 
  characters, syncCharacters, createCharacter, updateCharacter, deleteCharacter, handleGenerateMapDraft, project, isDarkMode,
  nodes, setNodes, onNodesChange, edges, setEdges, onEdgesChange, linkedSources, addToast
}: CharacterBoardProps) => {
  const [isEditingChar, setIsEditingChar] = useState<any>(null);
  const [isEditingRelation, setIsEditingRelation] = useState<string | null>(null);
  const [relationLabel, setRelationLabel] = useState("");
  const [relationDescription, setRelationDescription] = useState("");
  const [relationCurvature, setRelationCurvature] = useState(0.5);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect = useCallback((params: Connection) => {
    const newEdge = {
      ...params,
      id: getUUID(),
      ...edgeOptions,
      data: { 
        label: "관계", 
        description: "",
        curvature: 0,
        isDarkMode 
      }
    };
    setEdges((eds: any) => addEdge(newEdge, eds));
  }, [setEdges, isDarkMode]);

  // 캐릭터 관리 액션
  const handleSync = async () => {
    setIsSyncing(true);
    await syncCharacters(project.id, linkedSources);
    setIsSyncing(false);
  };

  const handleAddCharacter = () => {
    setIsEditingChar({ isNew: true, name: "", age: "", gender: "미설정", role: "조연", occupation: "", description: "", is_locked: false });
  };

  // 캔버스 노드 제어
  const spawnCharacterNode = (char: any) => {
    if (nodes.find(n => n.id === char.id)) return; // 이미 캔버스에 있으면 추가 안함
    
    const newNode = {
      id: char.id,
      type: 'characterNode',
      position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100 },
      data: { label: char.name, isLocked: char.is_locked, isDarkMode },
    };
    setNodes((prev: any) => [...prev, newNode]);
  };

  // 관계(Edge) 수정 시 상태 동기화
  React.useEffect(() => {
    if (isEditingRelation) {
      const edge = edges.find((e: any) => e.id === isEditingRelation);
      if (edge) {
        setRelationLabel(edge.data?.label || edge.label || "");
        setRelationDescription(edge.data?.description || "");
        setRelationCurvature(edge.data?.curvature ?? 0.5);
      }
    }
  }, [isEditingRelation, edges]);

  const spawnRelationshipNode = () => {
    // 이제 관계 노드 대신 메시지로 안내
    addToast("인물 원을 끌어 다른 인물에 연결하면 관계선이 생깁니다.", "info");
  };

  // 노드 드래그 앤 드롭 지원 (사이드바 -> 캔버스)
  const onDragStart = (event: React.DragEvent, char: any) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: 'characterNode', char }));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const rawData = event.dataTransfer.getData('application/reactflow');
      if (!rawData || !reactFlowBounds) return;

      const { type, char } = JSON.parse(rawData);
      if (typeof type === 'undefined' || !type) return;
      if (nodes.find(n => n.id === char.id)) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: char.id,
        type,
        position,
        data: { label: char.name, isLocked: char.is_locked, isDarkMode },
      };

      setNodes((nds: any) => nds.concat(newNode));
    },
    [nodes, setNodes, screenToFlowPosition, isDarkMode]
  );
  
  // 캔버스에서 노드 및 엣지 완전 삭제 시 주입
  const onNodesDelete = useCallback((deleted: any[]) => {
    const deletedIds = new Set(deleted.map((n) => n.id));
    setNodes((nds: any) => nds.filter((n: any) => !deletedIds.has(n.id)));
    setEdges((eds: any) => eds.filter((e: any) => !deletedIds.has(e.source) && !deletedIds.has(e.target)));
  }, [setNodes, setEdges]);
  const onEdgesDelete = useCallback((deleted: any[]) => {
    const deletedIds = new Set(deleted.map((e) => e.id));
    setEdges((eds: any) => eds.filter((e: any) => !deletedIds.has(e.id)));
  }, [setEdges]);

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      {/* 구역 1: 인물 매니지먼트 영역 */}
      <aside className={cn(
        "w-80 border-r flex flex-col shrink-0 z-20 transition-all",
        isDarkMode ? "bg-zinc-950 border-zinc-900 shadow-2xl" : "bg-white border-zinc-200 shadow-xl"
      )}>
        <div className="p-5 border-b dark:border-zinc-900 border-zinc-100 flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.1em] text-zinc-500">Character Management</h3>
              <div className="flex gap-2">
                 <button onClick={handleSync} disabled={isSyncing} className={cn("p-2 rounded-lg border dark:border-zinc-800 hover:bg-zinc-800 transition-all", isSyncing && "animate-spin text-zinc-600")} title="영감 보관함에서 인물 동기화">
                    <RefreshCw size={14} />
                 </button>
                 <button onClick={handleAddCharacter} className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-md" title="수동 인물 추가">
                    <UserPlus size={14} />
                 </button>
              </div>
           </div>
           <p className="text-[10px] text-zinc-500">보관함에서 스크랩한 인물을 가져오거나 직접 생성하세요. 캔버스로 드래그하여 배치합니다.</p>
        </div>

        <div className={cn("flex-1 overflow-y-auto p-4 space-y-3", isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar-light")}>
          {characters.length === 0 ? (
            <div className="py-20 text-center opacity-40 flex flex-col items-center gap-3">
               <Users size={32} />
               <p className="text-[11px] font-bold">등록된 인물이 없습니다.</p>
            </div>
          ) : (
            characters.map(char => {
              const isOnCanvas = nodes.some(n => n.id === char.id);
              return (
                <div 
                  key={char.id} 
                  draggable={!isOnCanvas}
                  onDragStart={(e) => onDragStart(e, char)}
                  onClick={() => !isOnCanvas && spawnCharacterNode(char)}
                  className={cn(
                    "p-4 rounded-xl border group transition-all relative flex flex-col gap-1",
                    isOnCanvas ? "opacity-60 cursor-default border-zinc-200 dark:border-zinc-800" : "cursor-grab border-zinc-200 hover:border-indigo-400 dark:border-zinc-800 dark:hover:border-indigo-500 shadow-sm",
                    isDarkMode ? "bg-zinc-900/50" : "bg-white"
                  )}
                >
                  <div className="flex items-start justify-between min-w-0 gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                         {char.is_locked ? <Lock size={14} className="text-amber-500" /> : <Circle size={14} />}
                      </div>
                      <h5 className={cn("text-xs font-black truncate min-w-0", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>{char.name}</h5>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                       <button onClick={(e) => { e.stopPropagation(); setIsEditingChar(char); }} className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-indigo-500">
                          <Edit2 size={12} />
                       </button>
                       <button onClick={(e) => { e.stopPropagation(); deleteCharacter(char.id); }} className="p-1.5 rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-rose-500">
                          <Trash2 size={12} />
                       </button>
                    </div>
                  </div>
                  {isOnCanvas && <span className="absolute bottom-2 right-3 text-[9px] font-bold text-indigo-500">캔버스에 배치됨</span>}
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* 구역 2: 관계도 캔버스 영역 */}
      <main className={cn("flex-1 relative h-full flex flex-col", isDarkMode ? "bg-zinc-950/50" : "bg-zinc-50/50")}>
        {/* Canvas Toolbar */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
           <div className={cn(
             "px-4 py-2 rounded-xl border shadow-sm flex items-center gap-3 backdrop-blur-md",
             isDarkMode ? "bg-zinc-900/80 border-zinc-800" : "bg-white/80 border-zinc-200"
           )}>
              {/* <span className="text-[11px] font-black text-zinc-500 mr-2 border-r pr-3 border-zinc-300 dark:border-zinc-700">캔버스 도구</span> */}
              <button 
                onClick={spawnRelationshipNode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 transition-all text-xs font-bold whitespace-nowrap flex-shrink-0"
              >
                <Circle size={14} /> 관계 연결 도움말
              </button>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-700 mx-1" />
              <button 
                onClick={() => setShowConfirmModal(true)}
                disabled={isGeneratingMap}
                className={cn(
                  "flex items-center gap-3 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95",
                  isDarkMode ? "bg-zinc-900 text-indigo-400 border border-indigo-500/30 hover:bg-zinc-800" : "bg-white text-indigo-600 border border-indigo-100 hover:bg-zinc-50"
                )}
              >
                {isGeneratingMap ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
                AI Support
              </button>
           </div>
        </div>

        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes.map(n => ({
              ...n,
              data: {
                ...n.data,
                onEditNode: (id: string) => {
                  setIsEditingRelation(id);
                  setRelationLabel(n.data.label || "");
                }
              }
            }))}
            edges={edges.map(e => ({
              ...e,
              data: {
                ...e.data,
                isDarkMode,
                onEditEdge: (id: string) => {
                  setIsEditingRelation(id);
                }
              }
            }))}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodesDelete={onNodesDelete}
            onEdgesDelete={onEdgesDelete}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            colorMode={isDarkMode ? 'dark' : 'light'}
            className="bg-transparent"
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background color={isDarkMode ? "#333" : "#ddd"} gap={24} size={2} />
            <Controls className={cn("!border-none !p-1 !rounded-xl !shadow-lg", isDarkMode ? "!bg-zinc-900 border !border-zinc-800" : "!bg-white border !border-zinc-100")} />
          </ReactFlow>
        </div>
      </main>

      {/* 인물 정보 수정 모달 */}
      {isEditingChar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className={cn(
             "w-[400px] rounded-2xl border p-8 space-y-6 relative overflow-hidden",
             isDarkMode ? "bg-zinc-900 border-zinc-800 shadow-2xl" : "bg-white border-zinc-200 shadow-xl"
           )}>
              <button onClick={() => setIsEditingChar(null)} className="absolute top-5 right-5 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
                <X size={18} />
              </button>
              <div>
                 <h2 className="text-lg font-black tracking-tight uppercase">{isEditingChar.isNew ? "새 캐릭터 추가" : "캐릭터 수정"}</h2>
              </div>
              <div className="space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">이름</label>
                    <input className={cn("w-full border rounded-lg py-2 px-3 text-sm outline-none transition-all", isDarkMode ? "bg-zinc-950 border-zinc-800 focus:border-indigo-500" : "bg-zinc-50 border-zinc-200 focus:border-indigo-500")} value={isEditingChar.name} onChange={e => setIsEditingChar({...isEditingChar, name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-zinc-500 uppercase">나이</label>
                       <input className={cn("w-full border rounded-lg py-2 px-3 text-sm outline-none", isDarkMode ? "bg-zinc-950 border-zinc-800 focus:border-indigo-500" : "bg-zinc-50 border-zinc-200 focus:border-indigo-500")} value={isEditingChar.age || ''} onChange={e => setIsEditingChar({...isEditingChar, age: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-zinc-500 uppercase">성별</label>
                       <select className={cn("w-full border rounded-lg py-2 px-3 text-sm outline-none", isDarkMode ? "bg-zinc-950 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200")} value={isEditingChar.gender || '미설정'} onChange={e => setIsEditingChar({...isEditingChar, gender: e.target.value})}>
                          <option value="미설정">미설정</option>
                          <option value="남성">남성</option>
                          <option value="여성">여성</option>
                          <option value="기타">기타</option>
                       </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">역할 (Role)</label>
                        <select 
                          className={cn("w-full border rounded-lg py-2 px-3 text-sm outline-none", isDarkMode ? "bg-zinc-950 border-zinc-800 text-white" : "bg-zinc-50 border-zinc-200")} 
                          value={isEditingChar.role || '조연'} 
                          onChange={e => setIsEditingChar({...isEditingChar, role: e.target.value})}
                        >
                           <option value="주연">주연</option>
                           <option value="주조연">주조연</option>
                           <option value="조연">조연</option>
                           <option value="단역">단역</option>
                           <option value="카메오">카메오</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase">직업 (Occupation)</label>
                        <input 
                          className={cn("w-full border rounded-lg py-2 px-3 text-sm outline-none", isDarkMode ? "bg-zinc-950 border-zinc-800 focus:border-indigo-500" : "bg-zinc-50 border-zinc-200 focus:border-indigo-500")}
                          value={isEditingChar.occupation || ''} 
                          onChange={e => setIsEditingChar({...isEditingChar, occupation: e.target.value})}
                          placeholder="예: 형사, 백수 등"
                        />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">상세 설명</label>
                    <textarea className={cn("w-full border rounded-lg py-2 px-3 text-sm outline-none h-24 resize-none", isDarkMode ? "bg-zinc-950 border-zinc-800 focus:border-indigo-500" : "bg-zinc-50 border-zinc-200 focus:border-indigo-500")} value={isEditingChar.description || ''} onChange={e => setIsEditingChar({...isEditingChar, description: e.target.value})} />
                 </div>
                 
                 <div className="flex items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                    <input 
                      type="checkbox" 
                      id="isLocked" 
                      checked={isEditingChar.is_locked || false} 
                      onChange={e => setIsEditingChar({...isEditingChar, is_locked: e.target.checked})}
                      className="w-4 h-4 accent-indigo-600 rounded border-zinc-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="isLocked" className="text-xs font-bold text-zinc-500 cursor-pointer flex items-center gap-1.5">
                      <Lock size={14} className={isEditingChar.is_locked ? "text-amber-500" : "text-zinc-400"} />
                      AI 맵 생성 시 고정 (설정 보존)
                    </label>
                 </div>
              </div>
              <button 
                onClick={() => { 
                  if (isEditingChar.isNew) {
                    createCharacter({ project_id: project.id, ...isEditingChar });
                  } else {
                    updateCharacter(isEditingChar.id, isEditingChar); 
                  }
                  setIsEditingChar(null); 
                }} 
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-xs font-black uppercase text-center shadow-md hover:bg-indigo-500 transition-all"
              >
                {isEditingChar.isNew ? "추가 완료" : "수정 완료"}
              </button>
           </div>
        </div>
      )}

      {/* 관계 텍스트 수정 플로팅 UI */}
      {isEditingRelation && (
        <div className="fixed inset-0 z-[150] bg-black/40 flex items-center justify-center backdrop-blur-sm" onClick={() => setIsEditingRelation(null)}>
          <div 
            className={cn("p-5 rounded-xl border shadow-2xl flex flex-col gap-3 min-w-[240px] animate-in zoom-in-95", isDarkMode ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200")}
            onClick={e => e.stopPropagation()}
          >
            <span className="text-xs font-black text-zinc-500">관계 정보 입력</span>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500">관계 이름</label>
              <input 
                autoFocus
                value={relationLabel}
                onChange={(e) => setRelationLabel(e.target.value)}
                className={cn("w-full px-3 py-2 rounded-lg text-sm border outline-none", isDarkMode ? "bg-zinc-950 border-zinc-800 focus:border-indigo-500" : "bg-zinc-50 border-zinc-200 focus:border-indigo-500")}
                placeholder="예: 라이벌, 연인..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500">상세 설명</label>
              <textarea 
                value={relationDescription}
                onChange={(e) => setRelationDescription(e.target.value)}
                className={cn("w-full px-3 py-2 rounded-lg text-sm border outline-none resize-none h-20", isDarkMode ? "bg-zinc-950 border-zinc-800 focus:border-indigo-500" : "bg-zinc-50 border-zinc-200 focus:border-indigo-500")}
                placeholder="관계의 구체적인 내용..."
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-zinc-500">곡률 (중첩 방지)</label>
                <span className="text-[10px] text-indigo-500 font-mono">{relationCurvature.toFixed(1)}</span>
              </div>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={relationCurvature}
                onChange={(e) => setRelationCurvature(parseFloat(e.target.value))}
                className="w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <button 
              onClick={() => {
                setEdges((eds: any[]) => eds.map((e: any) => e.id === isEditingRelation ? { ...e, label: relationLabel, data: { ...e.data, label: relationLabel, description: relationDescription } } : e));
                setIsEditingRelation(null);
              }}
              className="w-full bg-indigo-600 text-white rounded-lg py-2 text-xs font-bold hover:bg-indigo-500 transition-colors"
            >
              적용
            </button>
          </div>
        </div>
      )}
      {/* AI 생성 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className={cn(
             "w-[420px] rounded-2xl border p-8 space-y-6 relative shadow-2xl",
             isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
           )}>
              <div className="flex flex-col items-center text-center space-y-4">
                 <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <Sparkles size={32} />
                 </div>
                 <h2 className="text-xl font-black">AI 맵 초안을 생성하시겠습니까?</h2>
                 <p className="text-sm text-zinc-500 leading-relaxed">
                    새로운 초안을 생성하면 캔버스에 있는 <strong>고정되지 않은 인물과 모든 관계</strong>가 초기화됩니다.<br />
                    고정된 핵심 인물을 중심으로 다시 인물 관계도를 재구성합니다.
                 </p>
              </div>
              <div className="flex gap-3 pt-2">
                 <button 
                   onClick={() => setShowConfirmModal(false)}
                   className={cn("flex-1 py-3 rounded-xl text-xs font-bold transition-all", isDarkMode ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600")}
                 >
                    취소
                 </button>
                 <button 
                   onClick={async () => {
                     setShowConfirmModal(false);
                     setIsGeneratingMap(true);
                     try {
                        await handleGenerateMapDraft(project.id);
                        addToast("AI 인물 관계도 초안이 생성되었습니다.", "success");
                     } catch (err: any) {
                        console.error(err);
                        addToast(err.message || "AI 생성 중 오류가 발생했습니다.", "error");
                     } finally {
                        setIsGeneratingMap(false);
                     }
                   }}
                   className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-900/20 transition-all"
                 >
                    네, 생성하겠습니다
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* 로딩 오버레이 */}
      {isGeneratingMap && (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md transition-all">
           <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.2)]" />
              <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-amber-500">
                 <Sparkles size={32} className="animate-pulse" />
              </div>
           </div>
           <h2 className="text-xl font-black text-white tracking-widest uppercase animate-pulse mb-2">AI Generating...</h2>
           <p className="text-zinc-400 text-sm">기획안과 영감을 모아 드라마틱한 캐릭터들을 빚어내고 있습니다.</p>
        </div>
      )}
    </div>
  );
};

// ReactFlowProvider 래핑 (드래그앤드랍용 Hooks 사용시 필수)
const CharacterBoard = (props: CharacterBoardProps) => (
  <ReactFlowProvider>
    <CharacterBoardInner {...props} />
  </ReactFlowProvider>
);

export default CharacterBoard;
