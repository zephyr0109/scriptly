/**
 * [Architecture Point: UI Layer - Custom Hook]
 * 컴포넌트에서 비즈니스 로직과 API 연동을 분리하여 재사용 가능하게 만든 Hook입니다.
 */
import { useState, useCallback, useMemo } from "react";
import { useNodesState, useEdgesState } from "@xyflow/react";
import { getUUID } from "@/lib/utils";
import api from "@/lib/api";

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
  // 0. 기반 데이터 로드
  // -----------------------------------------------------
  const fetchCharacters = useCallback(async (projectId: string) => {
    try {
      const resp = await api.get(`/characters/project/${projectId}`);
      setCharacters(resp.data);
    } catch (e) { console.error('Failed to fetch characters:', e); }
  }, []);

  const fetchEvents = useCallback(async (projectId: string) => {
    try {
      const resp = await api.get(`/projects/${projectId}/events`);
      setEvents(resp.data);
    } catch (e) { console.error('Failed to fetch events:', e); }
  }, []);

  // -----------------------------------------------------
  // 1. 프로젝트 관리
  // -----------------------------------------------------
  const fetchProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const resp = await api.get('/projects');
      setProjects(resp.data);
    } catch (e) { console.error('Failed to fetch projects:', e); }
    finally { setIsLoadingProjects(false); }
  }, []);

  const createProject = useCallback(async (data: any) => {
    try {
      const resp = await api.post('/projects', data);
      const newProj = resp.data;
      setProjects(prev => [newProj, ...prev]);
      setCurrentProject(newProj);
      return newProj;
    } catch (e) { console.error('Failed to create project:', e); }
    return null;
  }, []);

  const updateProject = useCallback(async (id: string, updateData: any) => {
    try {
      const resp = await api.patch(`/projects/${id}`, updateData);
      const updated = resp.data;
      setProjects(prev => prev.map(p => p.id === id ? updated : p));
      if (currentProject?.id === id) setCurrentProject(updated);
      return updated;
    } catch (e) { console.error('Failed to update project:', e); }
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

        const boardResp = await api.get(`/insight/boards/${project.id}`);
        const boards = boardResp.data;
        let activeBoard = boards.length > 0 ? boards[0] : null;
          
        if (!activeBoard) {
          const createResp = await api.post('/insight/board', { 
            project_id: project.id, 
            title: `기본 관계도` 
          });
          activeBoard = createResp.data;
        }
          
        if (activeBoard) {
          setBoard(activeBoard);
          const [nResp, eResp] = await Promise.all([
            api.get(`/insight/nodes/${activeBoard.id}`),
            api.get(`/insight/edges/${activeBoard.id}`)
          ]);
            
          const dbNodes = nResp.data;
          const dbEdges = eResp.data;
              
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
        
        if (project.linked_sources?.length > 0) {
          const sResp = await api.get('/archive/sources');
          const all = sResp.data;
          setLabSources(all.filter((s: any) => project.linked_sources.includes(s.id)));
        } else {
          setLabSources([]);
        }

      } catch (e) { console.error('Failed to select project:', e); }
    }
  }, [isDarkMode, setNodes, setEdges, fetchCharacters, fetchEvents]);

  // -----------------------------------------------------
  // 2. 캐릭터 관리
  // -----------------------------------------------------
  const createCharacter = useCallback(async (charData: any) => {
    try {
      const resp = await api.post('/characters', charData);
      const newChar = resp.data;
      setCharacters(prev => [...prev, newChar]);
      return newChar;
    } catch (e) { console.error('Failed to create character:', e); }
    return null;
  }, []);

  const updateCharacter = useCallback(async (id: string, updateData: any) => {
    try {
      const resp = await api.patch(`/characters/${id}`, updateData);
      const updated = resp.data;
      setCharacters(prev => prev.map(c => c.id === id ? updated : c));
      setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, label: updated.name, isLocked: updated.is_locked } } : n));
      return updated;
    } catch (e) { console.error('Failed to update character:', e); }
    return null;
  }, [setNodes]);

  const deleteCharacter = useCallback(async (id: string) => {
    try {
      await api.delete(`/characters/${id}`);
      setCharacters(prev => prev.filter(c => c.id !== id));
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      return true;
    } catch (e) { console.error('Failed to delete character:', e); }
    return false;
  }, [setNodes, setEdges]);

  const syncCharacters = useCallback(async (projectId: string, sourceIds: string[]) => {
    try {
      const resp = await api.post(`/characters/sync-from-sources/${projectId}`, { 
        source_ids: sourceIds 
      });
      const data = resp.data;
      setCharacters(data);
      return data;
    } catch (e) { console.error('Failed to sync characters:', e); }
    return null;
  }, []);

  // -----------------------------------------------------
  // 3. 플롯 관리
  // -----------------------------------------------------
  const createEvent = useCallback(async (eventData: any) => {
    try {
      const resp = await api.post(`/projects/${eventData.project_id}/events`, eventData);
      const newEvent = resp.data;
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (e) { console.error('Failed to create event:', e); }
    return null;
  }, []);

  const updateEvent = useCallback(async (id: string, updateData: any) => {
    try {
      const resp = await api.patch(`/projects/events/${id}`, updateData);
      const updated = resp.data;
      setEvents(prev => prev.map(e => e.id === id ? updated : e));
      return updated;
    } catch (e) { console.error('Failed to update event:', e); }
    return null;
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      await api.delete(`/projects/events/${id}`);
      setEvents(prev => prev.filter(e => e.id !== id));
      return true;
    } catch (e) { console.error('Failed to delete event:', e); }
    return false;
  }, []);

  const reorderEvents = useCallback(async (projectId: string, eventIds: string[]) => {
    try {
      const resp = await api.post(`/projects/${projectId}/events/reorder`, eventIds);
      const reordered = resp.data;
      setEvents(reordered);
      return reordered;
    } catch (e) { console.error('Failed to reorder events:', e); }
    return null;
  }, []);

  const generatePlotDraft = useCallback(async (projectId: string) => {
    setIsGeneratingPlot(true);
    try {
      const resp = await api.post(`/projects/${projectId}/events/generate-draft`);
      const result = resp.data;
      setEvents(result);
      return result;
    } catch (e: any) {
      console.error('Failed to generate plot draft:', e);
      throw e;
    } finally { setIsGeneratingPlot(false); }
  }, []);

  const generateLogline = useCallback(async (projectId: string) => {
    setIsGeneratingSynopsis(true);
    try {
      const resp = await api.post(`/projects/${projectId}/generate-logline`);
      const updated = resp.data;
      setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
      if (currentProject?.id === projectId) setCurrentProject(updated);
      return updated;
    } catch (e: any) { 
      console.error('Failed to generate logline:', e); 
      throw e;
    } finally { setIsGeneratingSynopsis(false); }
  }, [currentProject?.id]);

  const generateSynopsis = useCallback(async (projectId: string) => {
    setIsGeneratingSynopsis(true);
    try {
      const resp = await api.post(`/projects/${projectId}/generate-synopsis`);
      const updated = resp.data;
      setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
      if (currentProject?.id === projectId) setCurrentProject(updated);
      return updated;
    } catch (e: any) { 
      console.error('Failed to generate synopsis:', e); 
      throw e;
    } finally { setIsGeneratingSynopsis(false); }
  }, [currentProject?.id]);

  const exportProject = useCallback(async (projectId: string, format: string) => {
    try {
      const resp = await api.get(`/projects/${projectId}/export/${format}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject?.title || 'project'}_synopsis.${format === 'word' ? 'docx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e: any) {
      console.error('Failed to export project:', e);
      throw e;
    }
  }, [currentProject?.title]);

  const handleGenerateMapDraft = useCallback(async (projectId: string) => {
    try {
      const response = await api.post(`/insight/generate-map-draft/${projectId}`);
      const result = response.data;
      if (result.nodes && result.edges) {
        setNodes(result.nodes.map((n: any) => ({ ...n, data: { ...n.data, isDarkMode } })));
        setEdges(result.edges.map((e: any) => ({ ...e, data: { ...e.data, isDarkMode } })));
        await fetchCharacters(projectId);
      }
    } catch (e: any) {
      console.error('Failed to generate map draft:', e);
      throw e;
    }
  }, [isDarkMode, setNodes, setEdges, fetchCharacters]);

  const handleOnDeleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  }, [setNodes, setEdges]);

  const enrichedNodes = useMemo(() => {
    return nodes.map((n: any) => ({
      ...n,
      data: { ...n.data, isDarkMode, onDeleteNode: handleOnDeleteNode }
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
    if (type === 'character') { label = "인물 추출"; content = (analysis.people || []).map((p: any) => typeof p === 'string' ? p : p.name).join(", "); }
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

    setNodes(nds => [...nds, newNode]);
    setEdges(eds => [...eds, {
      id: getUUID(), source: nodeId, target: newNodeId, animated: true, label: "추출됨",
      style: { stroke: isDarkMode ? '#a1a1aa' : '#52525b', strokeWidth: 2 }
    }]);
  }, [nodes, isDarkMode, setNodes, setEdges]);

  const handleSynthesizeOnDemand = useCallback(async (nodeIds: string[]) => {
    if (!currentProject) return;
    setIsSynthesizing(true);
    try {
      const selectedNodes = nodes.filter(n => nodeIds.includes(n.id));
      const sourceIds = selectedNodes.map(n => n.data.ref_source_id).filter(Boolean);
      
      const resp = await api.post('/insight/synthesize-on-demand', {
        node_ids: nodeIds,
        source_ids: sourceIds,
        genre: currentProject.genre,
        tone: currentProject.atmosphere,
        instruction: "선택된 요소들을 바탕으로 새로운 인사이트나 전개를 제안해줘."
      });

      const result = resp.data;
      const firstNode = selectedNodes[0];
      const newNodeId = getUUID();
      setNodes(nds => [...nds, {
        id: newNodeId, type: 'detailNode', position: { x: firstNode.position.x, y: firstNode.position.y - 200 },
        data: { label: "AI 합성 인사이트", content: result.core_conflict || result.theme || "합성 결과 없음", type: 'ai', isDarkMode }
      }]);
      nodeIds.forEach(id => {
         setEdges(eds => [...eds, { id: getUUID(), source: id, target: newNodeId, animated: true, style: { stroke: '#fbbf24', strokeWidth: 2 } }]);
      });
    } catch (e) { console.error('Failed to synthesize:', e); }
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
      if (isUUID(id)) { localIdMap.set(id, id); return id; }
      const newId = getUUID();
      localIdMap.set(id, newId);
      return newId;
    };

    try {
      const nodesData = nodes.map((n: any) => ({
        id: getSafeUUID(n.id), board_id: board.id, type: n.type || "characterNode",
        position_x: Math.round(n.position.x), position_y: Math.round(n.position.y),
        width: n.width || 0, height: n.height || 0, data: n.data
      }));
      const validNodeIds = new Set(nodesData.map(n => n.id));
      const edgesData = edges.map((e: any) => {
        const safeSource = getSafeUUID(e.source);
        const safeTarget = getSafeUUID(e.target);
        if (!validNodeIds.has(safeSource) || !validNodeIds.has(safeTarget)) return null;
        return {
          id: getSafeUUID(e.id), board_id: board.id, source_node_id: safeSource, target_node_id: safeTarget, label: e.label || "",
          style: { ...(e.style || {}), type: e.type, markerEnd: e.markerEnd, animated: e.animated, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle },
          data: e.data || {}
        };
      }).filter(Boolean);

      const resp = await api.post(`/insight/session/${board.id}`, { nodes: nodesData, edges: edgesData });
      return resp.status === 200;
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
