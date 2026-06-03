"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";

interface ToastContainerProps {
  toasts: any[];
  setToasts: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function ToastContainer({ toasts, setToasts }: ToastContainerProps) {
  const { isDarkMode } = useUIStore();

  return (
    <div className="fixed bottom-6 left-6 flex flex-col-reverse gap-3.5 z-[2000] pointer-events-none">
      {toasts.map(toast => (
        <div 
          key={toast.id} 
          className={cn(
            "px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 animate-in slide-in-from-left-10 duration-500 pointer-events-auto",
            isDarkMode ? "bg-zinc-900 border border-zinc-800 text-white" : "bg-white border border-zinc-200 text-zinc-900"
          )}
        >
          <span className="text-xs font-black">{toast.message}</span>
          <button 
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} 
            className="text-[10px] text-zinc-500 hover:text-zinc-300 ml-2 shrink-0"
          >
            닫기
          </button>
        </div>
      ))}
    </div>
  );
}
