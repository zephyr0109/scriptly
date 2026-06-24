'use client';

import React from "react";
import { useMainDashboard } from "@/hooks/useMainDashboard";
import MainDashboardPresenter from "./MainDashboardPresenter";

export default function MainDashboardContainer() {
  const props = useMainDashboard();
  return <MainDashboardPresenter {...props} />;
}
