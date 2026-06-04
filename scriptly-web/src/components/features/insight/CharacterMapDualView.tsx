"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  addEdge, 
  Connection, 
  useReactFlow,
  ReactFlowProvider
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Sparkles, Save, X, Layers, Trash2, Edit2, Info, Loader2 } from "lucide-react";
import { cn, getUUID } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import CharacterNode from "./CharacterNode";
import RelationshipEdge from "./RelationshipEdge";

// Node & Edge types
const nodeTypes = {
  characterNode: CharacterNode,
};

const edgeTypes = {
  relationshipEdge: RelationshipEdge,
};

const edgeOptions = {
  type: 'relationshipEdge',
  style: { strokeWidth: 2, stroke: '#3b82f6' }, // 기본 파란색 계열 매칭
};

interface CharacterMapDualViewProps {
  characters: any[];
  handleOpenCharacterAdd: () => void;
  handleOpenCharacterEdit: (char: any) => void;
  syncCharacters: (projectId: string, sourceIds: string[]) => Promise<any>;
  project: any;
  isDarkMode: boolean;
  nodes: any[];
  setNodes: React.Dispatch<React.SetStateAction<any[]>>;
  onNodesChange: any;
  edges: any[];
  setEdges: React.Dispatch<React.SetStateAction<any[]>>;
  onEdgesChange: any;
  handleSaveLabSession: () => Promise<boolean>;
  addToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
}

function CharacterMapDualViewInner({
  characters,
  handleOpenCharacterAdd,
  handleOpenCharacterEdit,
  syncCharacters,
  project,
  isDarkMode,
  nodes,
  setNodes,
  onNodesChange,
  edges,
  setEdges,
  onEdgesChange,
  handleSaveLabSession,
  addToast
}: CharacterMapDualViewProps) {
  const [isEditingRelation, setIsEditingRelation] = useState<string | null>(null);
  const [relationLabel, setRelationLabel] = useState("");
  const [relationDescription, setRelationDescription] = useState("");
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, setCenter } = useReactFlow();

  // Edge 연결 설정
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

  // 관계 설정 변경 실시간 동기화
  useEffect(() => {
    if (isEditingRelation) {
      const edge = edges.find((e: any) => e.id === isEditingRelation);
      if (edge) {
        setRelationLabel(edge.data?.label || edge.label || "");
        setRelationDescription(edge.data?.description || "");
      }
    }
  }, [isEditingRelation, edges]);

  // 노드 드래그 앤 드롭 지원
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
      if (nodes.some(n => n.id === char.id)) {
        addToast("이미 캔버스에 추가된 인물입니다.", "info");
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: char.id,
        type,
        position,
        data: { 
          label: char.name, 
          role: char.role || "조연",
          occupation: char.occupation || "",
          desc: char.description || char.desc || "",
          isLocked: char.is_locked || false, 
          isDarkMode, 
          color: char.color || "bg-blue-500/20 text-blue-400 border-blue-500/50"
        },
      };

      setNodes((nds: any) => nds.concat(newNode));
      addToast(`인물 '${char.name}'이 캔버스에 배치되었습니다.`, "info");
    },
    [nodes, setNodes, screenToFlowPosition, isDarkMode, addToast]
  );

  // 사이드바 클릭으로 노드 배치/선택
  const handleSidebarCardClick = (char: any) => {
    const isOnCanvas = nodes.some(n => n.id === char.id);
    if (isOnCanvas) {
      // 캔버스에 이미 존재하면 선택 효과 부여 및 화면 중앙 이동
      setNodes((nds) => nds.map((n) => ({
        ...n,
        selected: n.id === char.id
      })));
      const node = nodes.find(n => n.id === char.id);
      if (node) {
        setCenter(node.position.x, node.position.y, { zoom: 1.2, duration: 800 });
      }
      addToast(`캔버스 내 '${char.name}' 위치로 이동했습니다.`, "info");
    } else {
      // 캔버스에 기본 위치로 스폰
      const newNode = {
        id: char.id,
        type: 'characterNode',
        position: { x: 150, y: 150 },
        data: { 
          label: char.name, 
          role: char.role || "조연",
          occupation: char.occupation || "",
          desc: char.description || char.desc || "",
          isLocked: char.is_locked || false, 
          isDarkMode,
          color: char.color || "bg-blue-500/20 text-blue-400 border-blue-500/50"
        },
      };
      setNodes((prev: any) => [...prev, newNode]);
      addToast(`인물 '${char.name}'이 캔버스 좌상단에 배치되었습니다.`, "info");
    }
  };

  // 캔버스 배치 회수 핸들러
  const handleRemoveFromCanvas = (charId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== charId));
    setEdges((eds) => eds.filter((e) => e.source !== charId && e.target !== charId));
    const char = characters.find(c => c.id === charId);
    addToast(char ? `'${char.name}'이 캔버스에서 회수되었습니다.` : "캔버스 배치가 취소되었습니다.", "info");
  };

  // 노드 더블클릭 시 글로벌 에디터 모달 열기
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: any) => {
    const char = characters.find(c => c.id === node.id);
    if (char) {
      handleOpenCharacterEdit(char);
    }
  }, [characters, handleOpenCharacterEdit]);

  // 노드/엣지 삭제 핸들러 연동
  const onNodesDelete = useCallback((deleted: any[]) => {
    const deletedIds = new Set(deleted.map((n) => n.id));
    setNodes((nds: any) => nds.filter((n: any) => !deletedIds.has(n.id)));
    setEdges((eds: any) => eds.filter((e: any) => !deletedIds.has(e.source) && !deletedIds.has(e.target)));
  }, [setNodes, setEdges]);

  const onEdgesDelete = useCallback((deleted: any[]) => {
    const deletedIds = new Set(deleted.map((e) => e.id));
    setEdges((eds: any) => eds.filter((e: any) => !deletedIds.has(e.id)));
  }, [setEdges]);

  // AI Support 자동 생성 핸들러 (기존 데이터 유지 보존 보장)
  const handleSyncCharacters = async () => {
    if (!project) {
      addToast("선택된 프로젝트를 찾을 수 없습니다.", "error");
      return;
    }
    setIsSyncing(true);
    try {
      const sourceIds = project.linked_sources || [];
      if (sourceIds.length === 0) {
        addToast("분석할 기사나 영감 소스가 연결되어 있지 않습니다. [Linked Archive]에 소스를 추가해 주세요.", "warning");
        return;
      }
      await syncCharacters(project.id, sourceIds);
      addToast("AI 캐릭터 추출 동기화가 완료되었습니다. (기존 캐릭터는 유지됩니다.)", "success");
    } catch (err: any) {
      console.error(err);
      addToast("AI 캐릭터 동기화 중 오류가 발생했습니다.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // 관계도 캔버스 저장 핸들러
  const handleSaveCanvas = async () => {
    setIsSaving(true);
    try {
      const success = await handleSaveLabSession();
      if (success) {
        addToast("관계도 캔버스가 완벽히 저장되었습니다.", "success");
      } else {
        addToast("관계도 저장 처리에 실패했습니다. 서버 상태를 확인해 주세요.", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("관계도 저장 중 알 수 없는 에러가 발생했습니다.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-hidden p-8 flex flex-col gap-6 select-none h-full relative">
      
      {/* 캔버스 상단 대시보드 헤더 */}
      <div className="flex items-center justify-between border-b border-zinc-800/20 pb-4 shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className={cn("text-xl font-black tracking-tight", isDarkMode ? "text-white" : "text-zinc-950")}>
            인물 관계도 & 캐릭터 프로필 캔버스
          </h2>
          <p className="text-xs text-zinc-500">
            좌측 인덱스에서 인물 카드를 드래그하여 캔버스에 올리고, 캐릭터 노드 간 연결 선을 이어 인물 관계도를 완성해 보세요.
          </p>
        </div>
        
        {/* 상단 버튼 그룹 */}
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSyncCharacters}
            disabled={isSyncing}
            className="px-4 py-2.5 text-xs font-black bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 disabled:opacity-50 hover:brightness-110"
            title="기사 분석 내용을 기반으로 인물 자동 추출 추가"
          >
            {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            <span>AI Support</span>
          </button>
          
          <button 
            onClick={handleSaveCanvas}
            disabled={isSaving}
            className="px-4 py-2.5 text-xs font-black bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 disabled:opacity-50"
            title="관계도 배치 상태 영구 저장"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>관계도 저장</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden min-h-0 relative">
        
        {/* 1. 좌측 영역 (등장인물 인덱스 패널) */}
        <div className={cn(
          "w-[290px] border rounded-3xl p-5 flex flex-col gap-4 shrink-0 overflow-y-auto custom-scrollbar-dark",
          isDarkMode ? "bg-[#14141E]/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
        )}>
          <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/20">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                인물 목록 ({characters.length})
              </span>
              <span className="text-[8px] text-zinc-500 font-bold mt-0.5">
                Drag or Click
              </span>
            </div>
            
            <button
              onClick={handleOpenCharacterAdd}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-sm active:scale-95 flex items-center gap-1 text-[9px] font-black"
              title="새 인물 캐릭터 등록"
            >
              <Plus size={10} />
              <span>인물 추가</span>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {characters.map((char) => {
              const isOnCanvas = nodes.some(n => n.id === char.id);
              return (
                <div 
                  key={char.id}
                  draggable={!isOnCanvas}
                  onDragStart={(e) => onDragStart(e, char)}
                  onClick={() => handleSidebarCardClick(char)}
                  className={cn(
                    "p-4 rounded-2xl border flex flex-col gap-2 transition-all group",
                    isOnCanvas 
                      ? "opacity-60 border-zinc-800/40 bg-zinc-900/10 cursor-default" 
                      : "cursor-grab border-zinc-800/80 bg-[#14141E]/80 hover:border-indigo-500/50 hover:bg-zinc-900 hover:-translate-y-0.5 shadow-sm"
                  )}
                >
                  <div className="flex items-start justify-between min-w-0 gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={cn("text-xs font-black truncate", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
                        {char.name}
                      </span>
                      {char.age && (
                        <span className="text-[9px] text-zinc-500 font-bold shrink-0">
                          {char.age}
                        </span>
                      )}
                      {char.gender && (
                        <span className="text-[9px] text-zinc-500 font-bold shrink-0 border-l border-zinc-800 pl-1.5">
                          {char.gender}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCharacterEdit(char);
                      }}
                      className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors shrink-0"
                      title="프로필 수정"
                    >
                      <Edit2 size={11} />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[9px] bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded font-black">
                      {char.role || "주연"}
                    </span>
                    {char.occupation && (
                      <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold truncate max-w-[120px]">
                        {char.occupation}
                      </span>
                    )}
                  </div>

                  {char.internal_desire && (
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg px-2.5 py-1.5 mt-0.5">
                      <p className="text-[9px] text-amber-400/90 font-bold leading-normal">
                        🎯 {char.internal_desire}
                      </p>
                    </div>
                  )}

                  {char.description && (
                    <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold line-clamp-2">
                      {char.description}
                    </p>
                  )}

                  {isOnCanvas && (
                    <div className="flex items-center justify-between w-full mt-1 border-t border-zinc-800/40 pt-1.5 shrink-0">
                      <span className="text-[9px] text-indigo-500 font-black flex items-center gap-1">
                        ✓ 캔버스 배치됨
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromCanvas(char.id);
                        }}
                        className="text-[9px] text-rose-500 hover:text-rose-400 font-bold hover:underline transition-all"
                        title="캔버스에서 배치 제거 및 인덱스로 회수"
                      >
                        배치 취소
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {characters.length === 0 && (
              <div className="text-center py-20 text-zinc-500 text-xs font-semibold">
                등록된 인물이 없습니다.<br />우측 상단의 [인물 추가] 또는<br />[AI Support]로 인물을 더해 보세요.
              </div>
            )}
          </div>
        </div>
 
        {/* 2. 우측 영역 (관계도 캔버스 작업실) */}
        <div 
          ref={reactFlowWrapper}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={cn(
            "flex-grow rounded-3xl border relative overflow-hidden h-full min-h-0",
            isDarkMode ? "bg-[#09090C] border-zinc-800" : "bg-[#F0F2F7] border-zinc-200"
          )}
        >
          <ReactFlow
            nodes={nodes.map(n => {
              const char = characters.find(c => c.id === n.id);
              return {
                ...n,
                data: {
                  ...n.data,
                  label: char ? char.name : (n.data?.label || "이름 없음"),
                  role: char ? (char.role || "조연") : (n.data?.role || "조연"),
                  occupation: char ? (char.occupation || "") : (n.data?.occupation || ""),
                  desc: char ? (char.description || char.desc || "") : (n.data?.desc || ""),
                  isLocked: char ? (char.is_locked || false) : (n.data?.isLocked || false),
                  isDarkMode,
                  onDeleteNode: (id: string) => {
                    handleRemoveFromCanvas(id);
                  }
                }
              };
            })}
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
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeDoubleClick={onNodeDoubleClick}
            fitView
            colorMode={isDarkMode ? 'dark' : 'light'}
            className="bg-transparent"
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background color={isDarkMode ? "#333" : "#ddd"} gap={24} size={2} />
            <Controls className={cn(
              "!border-none !p-1.5 !rounded-xl !shadow-lg", 
              isDarkMode ? "!bg-zinc-900 border !border-zinc-800" : "!bg-white border !border-zinc-100"
            )} />
          </ReactFlow>
        </div>

      </div>

      {/* 관계 텍스트 수정 플로팅 다이얼로그 모달 */}
      {isEditingRelation && (
        <div 
          className="fixed inset-0 z-[1000] bg-black/70 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200" 
          onClick={() => setIsEditingRelation(null)}
        >
          <div 
            className={cn(
              "p-6 rounded-3xl border shadow-2xl flex flex-col gap-4 w-[280px] animate-in zoom-in-95 duration-150", 
              isDarkMode ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200"
            )}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800/40">
              <span className="text-xs font-black tracking-tight uppercase text-zinc-400">관계 정보 입력</span>
              <button 
                onClick={() => setIsEditingRelation(null)}
                className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-all"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">관계 설명문 (Label)</label>
              <input 
                autoFocus
                value={relationLabel}
                onChange={(e) => setRelationLabel(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-xs font-bold text-white px-3 py-2 rounded-xl outline-none focus:border-amber-500/50"
                placeholder="예: 조력자, 라이벌, 연인..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest">구체적 갈등 관계/상세 서사</label>
              <textarea 
                value={relationDescription}
                onChange={(e) => setRelationDescription(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-xs font-semibold text-white px-3 py-2 rounded-xl outline-none resize-none h-20 focus:border-amber-500/50 leading-relaxed"
                placeholder="인물 간 갈등 지점이나 관계 설정 서사를 적어주세요..."
              />
            </div>

            <button 
              onClick={handleSaveRelation}
              className="w-full bg-indigo-600 text-white rounded-xl py-2.5 text-xs font-black hover:bg-indigo-500 transition-colors shadow-md active:scale-95 mt-2"
            >
              확인 및 관계 적용
            </button>
          </div>
        </div>
      )}

      {/* AI 추출 동기화 로딩 오버레이 */}
      {isSyncing && (
        <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md transition-all">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-orange-500">
              <Sparkles size={28} className="animate-pulse" />
            </div>
          </div>
          <h2 className="text-lg font-black text-white tracking-widest uppercase animate-pulse mb-1">Extracting Characters...</h2>
          <p className="text-zinc-500 text-xs font-semibold">연결된 영감 아카이브 소스로부터 인물들을 추출하여 동기화하고 있습니다.</p>
        </div>
      )}
    </div>
  );

  function handleSaveRelation() {
    if (!isEditingRelation) return;
    setEdges((eds: any[]) => eds.map((e: any) => {
      if (e.id === isEditingRelation) {
        return {
          ...e,
          label: relationLabel,
          data: {
            ...e.data,
            label: relationLabel,
            description: relationDescription
          }
        };
      }
      return e;
    }));
    setIsEditingRelation(null);
  }
}

// ReactFlowProvider wrapper to enable useReactFlow coordinate conversion context
export default function CharacterMapDualView(props: CharacterMapDualViewProps) {
  return (
    <ReactFlowProvider>
      <CharacterMapDualViewInner {...props} />
    </ReactFlowProvider>
  );
}
