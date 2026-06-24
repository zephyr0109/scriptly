'use client';

import React from "react";
import { useWorldBuilding } from "@/hooks/useWorldBuilding";
import WorldBuildingPresenter from "./WorldBuildingPresenter";

interface WorldBuildingViewProps {
  projectId: string;
  isDarkMode: boolean;
  addToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
}

export default function WorldBuildingView({ projectId, isDarkMode, addToast }: WorldBuildingViewProps) {
  const props = useWorldBuilding({ projectId, addToast });
  
  return (
    <WorldBuildingPresenter
      {...props}
      projectId={projectId}
      isDarkMode={isDarkMode}
      addToast={addToast}
    />
  );
}
