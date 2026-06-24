'use client';

import React from "react";
import { useScriptEditor } from "@/hooks/useScriptEditor";
import ScriptEditorPresenter from "./ScriptEditorPresenter";

interface ScriptEditorProps {
  projectId: string | null;
  scripts: any[];
  currentScript: any;
  setCurrentScript: (script: any) => void;
  createScript: (projectId: string, title: string, episodeNumber: number) => Promise<any>;
  updateScript: (scriptId: string, data: any) => Promise<any>;
  deleteScript: (scriptId: string) => Promise<boolean>;
  isLoading: boolean;
  addToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
}

export default function ScriptEditor(props: ScriptEditorProps) {
  const editorProps = useScriptEditor(props);
  
  return (
    <ScriptEditorPresenter
      {...props}
      {...editorProps}
    />
  );
}
