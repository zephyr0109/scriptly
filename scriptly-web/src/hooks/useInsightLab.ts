/**
 * [Architecture Point: UI Layer - Custom Hook]
 * 컴포넌트에서 비즈니스 로직과 API 연동을 분리하여 재사용 가능하게 만든 Hook입니다.
 * 필사 시 상태 변화와 비동기 처리 로직의 흐름을 파악하십시오.
 */
import { useState, useCallback, useMemo } from "react";
import { useNodesState, useEdgesState } from "@xyflow/react";
import { API_BASE_URL, getUUID } from "@/lib/utils";

export function useInsightLab(isDarkMode: boolean) {
  // 프로젝트 & 캐릭터 상태
  const [projects, setProjects] = useState<any[]>([]);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [characters, setCharacters] = useState<any[]>([]);
  const [labSources, setLabSources] = useState<any[]>([]);
  
  // 캔버스 상태
  const [board, setBoard] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // 사건(Plot) 상태
  const [events, setEvents] = useState<any[]>([]);
  const [isGeneratingPlot, setIsGeneratingPlot] = useState(false);
  const [isGeneratingSynopsis, setIsGeneratingSynopsis] = useState(false);

  // -----------------------------------------------------
  // 0. 기반 데이터 로드 (사건/캐릭터 등)
  // -----------------------------------------------------
  const fetchCharacters = useCallback(async (projectId: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/characters/project/${projectId}`);
      if (resp.ok) setCharacters(await resp.json());
    } catch (e) { console.error(e); }
  }, []);

  const fetchEvents = useCallback(async (projectId: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/events`);
      if (resp.ok) setEvents(await resp.json());
    } catch (e) { console.error(e); }
  }, []);

  // -----------------------------------------------------
  // 1. 프로젝트 관리
  // -----------------------------------------------------
  const fetchProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/projects`);
      if (resp.ok) setProjects(await resp.json());
    } catch (e) { console.error(e); }
    finally { setIsLoadingProjects(false); }
  }, []);

  const createProject = useCallback(async (data: any) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (resp.ok) {
        const newProj = await resp.json();
        setProjects(prev => [newProj, ...prev]);
        setCurrentProject(newProj);
        return newProj;
      }
    } catch (e) { console.error(e); }
    return null;
  }, []);

  const updateProject = useCallback(async (id: string, updateData: any) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });
      if (resp.ok) {
        const updated = await resp.json();
        setProjects(prev => prev.map(p => p.id === id ? updated : p));
        if (currentProject?.id === id) setCurrentProject(updated);
        return updated;
      }
    } catch (e) { console.error(e); }
    return null;
  }, [currentProject?.id]);

  const selectProject = useCallback(async (project: any) => {
    setCurrentProject(project);
    setNodes([]); 
    setEdges([]);
    setBoard(null);
    setCharacters([]);
    setEvents([]);
    
    if (project) {
      try {
        await fetchCharacters(project.id);
        await fetchEvents(project.id);

        const boardResp = await fetch(`${API_BASE_URL}/api/v1/insight/boards/${project.id}`);
        if (boardResp.ok) {
          const boards = await boardResp.json();
          let activeBoard = boards.length > 0 ? boards[0] : null;
          
          if (!activeBoard) {
            const createResp = await fetch(`${API_BASE_URL}/api/v1/insight/board`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ project_id: project.id, title: `기본 관계도` })
            });
            if (createResp.ok) activeBoard = await createResp.json();
          }
          
          if (activeBoard) {
            setBoard(activeBoard);
            const nResp = await fetch(`${API_BASE_URL}/api/v1/insight/nodes/${activeBoard.id}`);
            const eResp = await fetch(`${API_BASE_URL}/api/v1/insight/edges/${activeBoard.id}`);
            
            if (nResp.ok && eResp.ok) {
              const dbNodes = await nResp.json();
              const dbEdges = await eResp.json();
              
              setNodes(dbNodes.map((n: any) => ({
                id: n.id,
                type: n.type,
                position: { x: n.position_x, y: n.position_y },
                data: { ...n.data, isDarkMode }
              })));
              
              setEdges(dbEdges.map((e: any) => {
                const { type, markerEnd, animated, sourceHandle, targetHandle, ...cssStyle } = e.style || {};
                const edge: any = {
                  id: e.id,
                  source: e.source_node_id,
                  target: e.target_node_id,
                  type: type || 'smoothstep',
                  animated: !!animated,
                  style: { strokeWidth: 2, stroke: '#a1a1aa', ...cssStyle }
                };
                if (sourceHandle) edge.sourceHandle = sourceHandle;
                if (targetHandle) edge.targetHandle = targetHandle;
                if (markerEnd) edge.markerEnd = markerEnd;
                if (e.label) edge.label = e.label;
                if (e.data) edge.data = { ...e.data, isDarkMode };
                else edge.data = { isDarkMode };
                return edge;
              }));
            }
          }
        }
        
        // 영감 보관함 리스트 로드 (BugFix)
        if (project.linked_sources?.length > 0) {
          const sResp = await fetch(`${API_BASE_URL}/api/v1/archive/sources`);
          if (sResp.ok) {
            const all = await sResp.json();
            setLabSources(all.filter((s: any) => project.linked_sources.includes(s.id)));
          }
        } else {
          setLabSources([]);
        }

      } catch (e) { console.error(e); }
    }
  }, [isDarkMode, setNodes, setEdges, fetchCharacters, fetchEvents]);

  // -----------------------------------------------------
  // 2. 캐릭터 관리
  // -----------------------------------------------------
  const createCharacter = useCallback(async (charData: any) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/characters`, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(charData) 
      });
      if (resp.ok) {
        const newChar = await resp.json();
        setCharacters(prev => [...prev, newChar]);
        return newChar;
      }
    } catch (e) { console.error(e); }
    return null;
  }, []);

  const updateCharacter = useCallback(async (id: string, updateData: any) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/characters/${id}`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(updateData) 
      });
      if (resp.ok) {
        const updated = await resp.json();
        setCharacters(prev => prev.map(c => c.id === id ? updated : c));
        setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, label: updated.name, isLocked: updated.is_locked } } : n));
        return updated;
      }
    } catch (e) { console.error(e); }
    return null;
  }, [setNodes]);

  const deleteCharacter = useCallback(async (id: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/characters/${id}`, { method: "DELETE" });
      if (resp.ok) {
        setCharacters(prev => prev.filter(c => c.id !== id));
        setNodes((nds) => nds.filter((n) => n.id !== id));
        setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  }, [setNodes, setEdges]);

  const syncCharacters = useCallback(async (projectId: string, sourceIds: string[]) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/characters/sync-from-sources/${projectId}`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_ids: sourceIds })
      });
      if (resp.ok) {
        const data = await resp.json();
        setCharacters(data);
        return data;
      }
    } catch (e) { console.error(e); }
    return null;
  }, []);

  // -----------------------------------------------------
  // 3. 플롯(사건) 관리
  // -----------------------------------------------------
  const createEvent = useCallback(async (eventData: any) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/projects/${eventData.project_id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData)
      });
      if (resp.ok) {
        const newEvent = await resp.json();
        setEvents(prev => [...prev, newEvent]);
        return newEvent;
      }
    } catch (e) { console.error(e); }
    return null;
  }, []);

  const updateEvent = useCallback(async (id: string, updateData: any) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/projects/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData)
      });
      if (resp.ok) {
        const updated = await resp.json();
        setEvents(prev => prev.map(e => e.id === id ? updated : e));
        return updated;
      }
    } catch (e) { console.error(e); }
    return null;
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/projects/events/${id}`, { method: "DELETE" });
      if (resp.ok) {
        setEvents(prev => prev.filter(e => e.id !== id));
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  }, []);

  const reorderEvents = useCallback(async (projectId: string, eventIds: string[]) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/events/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventIds)
      });
      if (resp.ok) {
        const reordered = await resp.json();
        setEvents(reordered);
        return reordered;
      }
    } catch (e) { console.error(e); }
    return null;
  }, []);

  const generatePlotDraft = useCallback(async (projectId: string) => {
    setIsGeneratingPlot(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/events/generate-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (resp.ok) {
        const result = await resp.json();
        setEvents(result);
        return result;
      } else {
        const errData = await resp.json();
        throw new Error(errData.detail || "플롯 초안 생성에 실패했습니다.");
      }
    } catch (e: any) {
      console.error(e);
      throw e;
    }
    finally { setIsGeneratingPlot(false); }
  }, []);

  const generateLogline = useCallback(async (projectId: string) => {
    setIsGeneratingSynopsis(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/generate-logline`, { method: "POST" });
      if (resp.ok) {
        const updated = await resp.json();
        setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
        if (currentProject?.id === projectId) setCurrentProject(updated);
        return updated;
      } else {
        const errorData = await resp.json().catch(() => ({ detail: "로그라인 생성 중 오류가 발생했습니다." }));
        throw new Error(errorData.detail || "로그라인 생성 실패");
      }
    } catch (e: any) { 
      console.error(e); 
      throw e;
    } finally {
      setIsGeneratingSynopsis(false);
    }
  }, [currentProject?.id]);

  const generateSynopsis = useCallback(async (projectId: string) => {
    setIsGeneratingSynopsis(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/generate-synopsis`, { method: "POST" });
      if (resp.ok) {
        const updated = await resp.json();
        setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
        if (currentProject?.id === projectId) setCurrentProject(updated);
        return updated;
      } else {
        const errorData = await resp.json().catch(() => ({ detail: "시놉시스 생성 중 오류가 발생했습니다." }));
        throw new Error(errorData.detail || "시놉시스 생성 실패");
      }
    } catch (e: any) { 
      console.error(e); 
      throw e;
    } finally {
      setIsGeneratingSynopsis(false);
    }
  }, [currentProject?.id]);

  const exportProject = useCallback(async (projectId: string, format: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/api/v1/projects/${projectId}/export/${format}`);
      if (resp.ok) {
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentProject?.title || 'project'}_synopsis.${format === 'word' ? 'docx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const err = await resp.json();
        throw new Error(err.detail || "Export failed");
      }
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  }, [currentProject?.title]);

  // -----------------------------------------------------
  // 4. AI 기반 맵 초안 (Phase 7)
  // -----------------------------------------------------
  const handleGenerateMapDraft = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/insight/generate-map-draft/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.nodes && result.edges) {
          setNodes(result.nodes.map((n: any) => ({
            ...n,
            data: { ...n.data, isDarkMode }
          })));
          setEdges(result.edges.map((e: any) => ({
            ...e,
            data: { ...e.data, isDarkMode }
          })));
          await fetchCharacters(projectId);
        }
      } else {
        const errData = await response.json();
        throw new Error(errData.detail || "AI 맵 생성에 실패했습니다.");
      }
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  }, [isDarkMode, setNodes, setEdges, fetchCharacters]);

  // -----------------------------------------------------
  // 5. 정비 및 기타 핸들러
  // -----------------------------------------------------
  const handleOnDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  }, [setNodes, setEdges]);

  const enrichedNodes = useMemo(() => {
    return nodes.map((n: any) => ({
      ...n,
      data: {
        ...n.data,
        isDarkMode,
        onDeleteNode: handleOnDeleteNode
      }
    }));
  }, [nodes, isDarkMode, handleOnDeleteNode]);

  const handleSendToLab = useCallback((item: any, setActiveTab: (tab: string) => void) => {
    if (!item) return;
    const sourceData = item.id ? item : { id: `temp-${Date.now()}`, type: "NEWS", title: item.article?.title || "제목 없음", content: item.article?.description || "", ...item };
    setLabSources(prev => prev.some(s => s.id === sourceData.id) ? prev : [...prev, sourceData]);
    setActiveTab("insight");
  }, []);

  const handleMoveToLab = useCallback((selectedSourceIds: string[], archiveItems: any[], setSelectedSourceIds: (ids: string[]) => void, setActiveTab: (tab: string) => void) => {
    const selectedItems = archiveItems.filter(item => selectedSourceIds.includes(item.id));
    setLabSources(prev => {
      const existingIds = prev.map(p => p.id);
      return [...prev, ...selectedItems.filter(item => !existingIds.includes(item.id))];
    });
    setSelectedSourceIds([]);
    setActiveTab("insight");
  }, []);

  const handleExtract = useCallback((nodeId: string, type: 'character' | 'event' | 'conflict' | 'atmosphere') => {
    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode) return;

    const analysis = sourceNode.data.detailed_analysis;
    if (!analysis) return;

    let content = "";
    let label = "";
    if (type === 'character') { label = "인물 추출"; content = (analysis.people || []).join(", "); }
    else if (type === 'event') { label = "주요 사건"; content = (analysis.incidents || []).join("\n"); }
    else if (type === 'conflict') { label = "핵심 갈등"; content = analysis.core_conflict || ""; }
    else if (type === 'atmosphere') { label = "분위기"; content = analysis.atmosphere || ""; }

    const newNodeId = getUUID();
    const newNode = {
      id: newNodeId,
      type: 'detailNode',
      position: { x: sourceNode.position.x + 300, y: sourceNode.position.y },
      data: { label, content, type, isDarkMode }
    };

    const newEdge = {
      id: getUUID(),
      source: nodeId,
      target: newNodeId,
      animated: true,
      label: "추출됨",
      style: { stroke: isDarkMode ? '#a1a1aa' : '#52525b', strokeWidth: 2 }
    };

    setNodes(nds => [...nds, newNode]);
    setEdges(eds => [...eds, newEdge]);
  }, [nodes, isDarkMode, setNodes, setEdges]);

  const handleSynthesizeOnDemand = useCallback(async (nodeIds: string[]) => {
    if (!currentProject) return;
    setIsSynthesizing(true);
    try {
      const selectedNodes = nodes.filter(n => nodeIds.includes(n.id));
      const sourceIds = selectedNodes.map(n => n.data.ref_source_id).filter(Boolean);
      
      const resp = await fetch(`${API_BASE_URL}/api/v1/insight/synthesize-on-demand`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          node_ids: nodeIds,
          source_ids: sourceIds,
          genre: currentProject.genre,
          tone: currentProject.atmosphere,
          instruction: "선택된 요소들을 바탕으로 새로운 인사이트나 전개를 제안해줘."
        })
      });

      if (resp.ok) {
        const result = await resp.json();
        const firstNode = selectedNodes[0];
        const newNodeId = getUUID();
        const newNode = {
          id: newNodeId,
          type: 'detailNode',
          position: { x: firstNode.position.x, y: firstNode.position.y - 200 },
          data: { 
            label: "AI 합성 인사이트", 
            content: result.core_conflict || result.theme || "합성 결과 없음", 
            type: 'ai', 
            isDarkMode 
          }
        };
        setNodes(nds => [...nds, newNode]);
        nodeIds.forEach(id => {
           setEdges(eds => [...eds, {
             id: getUUID(),
             source: id,
             target: newNodeId,
             animated: true,
             style: { stroke: '#fbbf24', strokeWidth: 2 }
           }]);
        });
      }
    } catch (e) { console.error(e); }
    finally { setIsSynthesizing(false); }
  }, [currentProject, nodes, isDarkMode, setNodes, setEdges]);

  const handleImportSources = useCallback((items: any[]) => {
    setLabSources(prev => {
      const existingIds = prev.map(s => s.id);
      return [...prev, ...items.filter(s => !existingIds.includes(s.id))];
    });
  }, []);

  const handleRemoveLabSource = useCallback((id: string) => setLabSources(prev => prev.filter(s => s.id !== id)), []);

  const handleSaveLabSession = useCallback(async () => {
    if (!board) return false;
    const localIdMap = new Map<string, string>();
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = (s: string) => uuidRegex.test(s);
    const getSafeUUID = (id: string) => {
      if (localIdMap.has(id)) return localIdMap.get(id)!;
      if (isUUID(id)) {
        localIdMap.set(id, id);
        return id;
      }
      const newId = getUUID();
      localIdMap.set(id, newId);
      return newId;
    };

    try {
      const nodesData = nodes.map((n: any) => ({
        id: getSafeUUID(n.id),
        board_id: board.id,
        type: n.type || "characterNode",
        position_x: Math.round(n.position.x),
        position_y: Math.round(n.position.y),
        width: n.width || 0,
        height: n.height || 0,
        data: n.data
      }));
      const validNodeIds = new Set(nodesData.map(n => n.id));
      const edgesData = edges.map((e: any) => {
        const safeSource = getSafeUUID(e.source);
        const safeTarget = getSafeUUID(e.target);
        if (!validNodeIds.has(safeSource) || !validNodeIds.has(safeTarget)) return null;
        return {
          id: getSafeUUID(e.id),
          board_id: board.id,
          source_node_id: safeSource,
          target_node_id: safeTarget,
          label: e.label || "",
          style: {
            ...(e.style || {}),
            type: e.type,
            markerEnd: e.markerEnd,
            animated: e.animated,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle
          },
          data: e.data || {}
        };
      }).filter(Boolean);

      const resp = await fetch(`${API_BASE_URL}/api/v1/insight/session/${board.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes: nodesData, edges: edgesData })
      });
      return resp.ok;
    } catch (e) { return false; }
  }, [board, nodes, edges]);

  return {
    projects, currentProject, isLoadingProjects, characters, labSources, nodes: enrichedNodes, setNodes, edges, setEdges,
    events, isGeneratingPlot,
    fetchProjects, createProject, selectProject, updateProject, fetchCharacters, createCharacter, updateCharacter, deleteCharacter, syncCharacters,
    fetchEvents, createEvent, updateEvent, deleteEvent, reorderEvents, generatePlotDraft,
    generateLogline, generateSynopsis, exportProject,
    handleSendToLab, handleMoveToLab, handleSynthesizeOnDemand, handleExtract, handleImportSources, handleRemoveLabSource,
    handleSaveLabSession, handleGenerateMapDraft, onNodesChange, onEdgesChange, isSynthesizing, isGeneratingSynopsis
  };
}
