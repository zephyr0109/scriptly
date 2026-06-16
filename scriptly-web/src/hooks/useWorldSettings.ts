"use client";

import { useState, useCallback } from "react";
import axios from "axios";
import { useAuthStore } from "@/hooks/useAuth";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "") + "/api/v1";

export interface WorldStage {
  id: string;
  project_id: string;
  name: string;
  era?: string;
  parent_id?: string;
  description?: string;
  atmosphere?: string;
  technology_level?: string;
  created_at: string;
  updated_at: string;
}

export interface WorldFaction {
  id: string;
  project_id: string;
  name: string;
  type?: string;
  ideology_goal?: string;
  base_stage_id?: string;
  scale_status?: string;
  hierarchy?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface WorldRuleCulture {
  id: string;
  project_id: string;
  name: string;
  type: "RULE" | "CULTURE";
  scope_stage_id?: string;
  scope_faction_id?: string;
  content?: string;
  impact?: string;
  exceptions?: string;
  created_at: string;
  updated_at: string;
}

export interface WorldGlossary {
  id: string;
  project_id: string;
  term: string;
  definition?: string;
  usage_example?: string;
  created_at: string;
  updated_at: string;
}

export interface WorldNote {
  id: string;
  project_id: string;
  title: string;
  content?: string;
  created_at: string;
  updated_at: string;
}

export function useWorldSettings() {
  const [stages, setStages] = useState<WorldStage[]>([]);
  const [factions, setFactions] = useState<WorldFaction[]>([]);
  const [rules, setRules] = useState<WorldRuleCulture[]>([]);
  const [glossary, setGlossary] = useState<WorldGlossary[]>([]);
  const [notes, setNotes] = useState<WorldNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 런타임에 동적으로 토큰 헤더 생성 (순환 참조 방지)
  const getHeaders = useCallback(() => {
    const token = useAuthStore.getState().accessToken;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }, []);

  const fetchAllWorldData = useCallback(async (projectId: string) => {
    setIsLoading(true);
    const headers = getHeaders();
    try {
      const [resStages, resFactions, resRules, resGlossary, resNotes] = await Promise.all([
        axios.get(`${API_BASE_URL}/projects/${projectId}/world-stages`, { headers }),
        axios.get(`${API_BASE_URL}/projects/${projectId}/world-factions`, { headers }),
        axios.get(`${API_BASE_URL}/projects/${projectId}/world-rules-cultures`, { headers }),
        axios.get(`${API_BASE_URL}/projects/${projectId}/world-glossary`, { headers }),
        axios.get(`${API_BASE_URL}/projects/${projectId}/world-notes`, { headers })
      ]);

      setStages(resStages.data);
      setFactions(resFactions.data);
      setRules(resRules.data);
      setGlossary(resGlossary.data);
      setNotes(resNotes.data);
    } catch (e) {
      console.error("Failed to fetch world settings data:", e);
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  // --- Stages API Actions ---
  const handleCreateStage = async (projectId: string, name: string) => {
    const res = await axios.post(`${API_BASE_URL}/projects/${projectId}/world-stages`, { name, project_id: projectId }, { headers: getHeaders() });
    setStages(prev => [...prev, res.data]);
    return res.data;
  };
  const handleUpdateStage = async (id: string, updates: Partial<WorldStage>) => {
    const cleanUpdates = {
      ...updates,
      parent_id: updates.parent_id === "" ? null : updates.parent_id
    };
    const res = await axios.put(`${API_BASE_URL}/world-stages/${id}`, cleanUpdates, { headers: getHeaders() });
    setStages(prev => prev.map(item => item.id === id ? res.data : item));
    return res.data;
  };
  const handleDeleteStage = async (id: string) => {
    await axios.delete(`${API_BASE_URL}/world-stages/${id}`, { headers: getHeaders() });
    setStages(prev => prev.filter(item => item.id !== id));
  };

  // --- Factions API Actions ---
  const handleCreateFaction = async (projectId: string, name: string) => {
    const res = await axios.post(`${API_BASE_URL}/projects/${projectId}/world-factions`, { name, project_id: projectId }, { headers: getHeaders() });
    setFactions(prev => [...prev, res.data]);
    return res.data;
  };
  const handleUpdateFaction = async (id: string, updates: Partial<WorldFaction>) => {
    const cleanUpdates = {
      ...updates,
      base_stage_id: updates.base_stage_id === "" ? null : updates.base_stage_id
    };
    const res = await axios.put(`${API_BASE_URL}/world-factions/${id}`, cleanUpdates, { headers: getHeaders() });
    setFactions(prev => prev.map(item => item.id === id ? res.data : item));
    return res.data;
  };
  const handleDeleteFaction = async (id: string) => {
    await axios.delete(`${API_BASE_URL}/world-factions/${id}`, { headers: getHeaders() });
    setFactions(prev => prev.filter(item => item.id !== id));
  };

  // --- Rules/Cultures API Actions ---
  const handleCreateRuleCulture = async (projectId: string, name: string, type: "RULE" | "CULTURE") => {
    const res = await axios.post(`${API_BASE_URL}/projects/${projectId}/world-rules-cultures`, { name, type, project_id: projectId }, { headers: getHeaders() });
    setRules(prev => [...prev, res.data]);
    return res.data;
  };
  const handleUpdateRuleCulture = async (id: string, updates: Partial<WorldRuleCulture>) => {
    const cleanUpdates = {
      ...updates,
      scope_stage_id: updates.scope_stage_id === "" ? null : updates.scope_stage_id,
      scope_faction_id: updates.scope_faction_id === "" ? null : updates.scope_faction_id
    };
    const res = await axios.put(`${API_BASE_URL}/world-rules-cultures/${id}`, cleanUpdates, { headers: getHeaders() });
    setRules(prev => prev.map(item => item.id === id ? res.data : item));
    return res.data;
  };
  const handleDeleteRuleCulture = async (id: string) => {
    await axios.delete(`${API_BASE_URL}/world-rules-cultures/${id}`, { headers: getHeaders() });
    setRules(prev => prev.filter(item => item.id !== id));
  };

  // --- Glossary API Actions ---
  const handleCreateGlossary = async (projectId: string, term: string) => {
    const res = await axios.post(`${API_BASE_URL}/projects/${projectId}/world-glossary`, { term, project_id: projectId }, { headers: getHeaders() });
    setGlossary(prev => [...prev, res.data]);
    return res.data;
  };
  const handleUpdateGlossary = async (id: string, updates: Partial<WorldGlossary>) => {
    const res = await axios.put(`${API_BASE_URL}/world-glossary/${id}`, updates, { headers: getHeaders() });
    setGlossary(prev => prev.map(item => item.id === id ? res.data : item));
    return res.data;
  };
  const handleDeleteGlossary = async (id: string) => {
    await axios.delete(`${API_BASE_URL}/world-glossary/${id}`, { headers: getHeaders() });
    setGlossary(prev => prev.filter(item => item.id !== id));
  };

  // --- Notes API Actions ---
  const handleCreateNote = async (projectId: string, title: string) => {
    const res = await axios.post(`${API_BASE_URL}/projects/${projectId}/world-notes`, { title, project_id: projectId }, { headers: getHeaders() });
    setNotes(prev => [...prev, res.data]);
    return res.data;
  };
  const handleUpdateNote = async (id: string, updates: Partial<WorldNote>) => {
    const res = await axios.put(`${API_BASE_URL}/world-notes/${id}`, updates, { headers: getHeaders() });
    setNotes(prev => prev.map(item => item.id === id ? res.data : item));
    return res.data;
  };
  const handleDeleteNote = async (id: string) => {
    await axios.delete(`${API_BASE_URL}/world-notes/${id}`, { headers: getHeaders() });
    setNotes(prev => prev.filter(item => item.id !== id));
  };

  return {
    stages,
    factions,
    rules,
    glossary,
    notes,
    isLoading,
    fetchAllWorldData,
    handleCreateStage,
    handleUpdateStage,
    handleDeleteStage,
    handleCreateFaction,
    handleUpdateFaction,
    handleDeleteFaction,
    handleCreateRuleCulture,
    handleUpdateRuleCulture,
    handleDeleteRuleCulture,
    handleCreateGlossary,
    handleUpdateGlossary,
    handleDeleteGlossary,
    handleCreateNote,
    handleUpdateNote,
    handleDeleteNote
  };
}
