"use client";

import React, { useState } from "react";
import { X, Globe, FileText, Plus, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";

interface CollectModalProps {
  isOpen: boolean;
  onClose: () => void;
  handleUrlArchive: (url: string, onSuccess: () => void, onError: (err: string) => void) => Promise<void>;
  handleFileUpload: (file: File, onSuccess: () => void, onError: (err: string) => void) => Promise<void>;
  handleCreateNote: (title: string, content: string, onSuccess: () => void, onError: (err: string) => void) => Promise<void>;
  addToast: (message: string, type?: "success" | "info" | "warning" | "error") => void;
}

export default function CollectModal({
  isOpen,
  onClose,
  handleUrlArchive,
  handleFileUpload,
  handleCreateNote,
  addToast
}: CollectModalProps) {
  const { isDarkMode } = useUIStore();
  
  // 모달 수집 입력용 Local State 캡슐화
  const [collectTab, setCollectTab] = useState<"url" | "file" | "note">("url");
  const [collectUrl, setCollectUrl] = useState<string>("");
  const [collectFile, setCollectFile] = useState<File | null>(null);
  const [collectNoteTitle, setCollectNoteTitle] = useState<string>("");
  const [collectNoteContent, setCollectNoteContent] = useState<string>("");

  if (!isOpen) return null;

  const handleCollectInspiration = async () => {
    if (collectTab === "url") {
      if (!collectUrl.trim()) {
        addToast("수집할 URL을 입력해주세요.", "error");
        return;
      }
      await handleUrlArchive(collectUrl, () => {
        addToast("외부 링크 수집 및 변환이 완료되었습니다.", "success");
        setCollectUrl("");
        onClose();
      }, (err) => {
        addToast(err, "error");
      });
    } else if (collectTab === "file") {
      if (!collectFile) {
        addToast("업로드할 파일을 선택해주세요.", "error");
        return;
      }
      await handleFileUpload(collectFile, () => {
        addToast(`파일 '${collectFile.name}' 업로드 및 보관 처리가 완료되었습니다.`, "success");
        setCollectFile(null);
        onClose();
      }, (err) => {
        addToast(err, "error");
      });
    } else if (collectTab === "note") {
      if (!collectNoteTitle.trim() || !collectNoteContent.trim()) {
        addToast("메모의 제목과 내용을 모두 입력해주세요.", "error");
        return;
      }
      await handleCreateNote(collectNoteTitle, collectNoteContent, () => {
        addToast(`직접 작성한 극작 메모 '${collectNoteTitle}'이(가) 보관함에 적재되었습니다.`, "success");
        setCollectNoteTitle("");
        setCollectNoteContent("");
        onClose();
      }, (err) => {
        addToast(err, "error");
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-[1000] p-4 animate-in fade-in duration-300">
      <div className="bg-[#14141A] border border-zinc-800 rounded-3xl w-full max-w-xl overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-zinc-800/40 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-black text-white">영감 수집</h3>
            <span className="text-[10px] text-zinc-500">기사 링크나 파일을 가져오거나, 메모를 직접 작성하여 저장합니다.</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="flex border-b border-zinc-800/30 p-2 bg-[#0E0E12] gap-1">
          {[
            { id: "url", label: "🔗 외부 기사 링크", icon: Globe },
            { id: "file", label: "📁 첨부 파일 업로드", icon: FileText },
            { id: "note", label: "✍️ 극작 메모 직접작성", icon: Plus }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCollectTab(tab.id as any)}
              className={cn(
                "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5",
                collectTab === tab.id ? "bg-amber-500 text-black font-black" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <tab.icon size={13} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 flex flex-col gap-4 flex-1">
          {collectTab === "url" && (
            <div className="flex flex-col gap-2 animate-in fade-in duration-250">
              <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">수집 기사 및 블로그 URL 주소</label>
              <input 
                value={collectUrl} 
                onChange={(e) => setCollectUrl(e.target.value)} 
                placeholder="https://news.naver.com/main/read..." 
                className="w-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-3 rounded-xl outline-none focus:border-amber-500/50" 
              />
            </div>
          )}

          {collectTab === "file" && (
            <div className="flex flex-col gap-2 animate-in fade-in duration-250">
              <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">로컬 PDF/TXT/DOCX 파일 첨부</label>
              <div className="border-2 border-dashed border-zinc-800 hover:border-amber-500/50 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center gap-2 bg-zinc-950/30 relative">
                <Upload size={24} className="text-zinc-600" />
                <span className="text-xs text-zinc-400 font-bold">클릭하여 파일을 선택하거나 이 영역에 드래그</span>
                <input 
                  type="file" 
                  onChange={(e) => setCollectFile(e.target.files?.[0] || null)} 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  id="collect-file" 
                />
                {collectFile && <span className="text-[10px] text-amber-400 font-bold mt-2">선택된 파일: {collectFile.name}</span>}
              </div>
            </div>
          )}

          {collectTab === "note" && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-250">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">메모 제목</label>
                <input 
                  value={collectNoteTitle} 
                  onChange={(e) => setCollectNoteTitle(e.target.value)} 
                  placeholder="강남 로비 장부의 4번째 씬 단서 기획" 
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl outline-none focus:border-amber-500/50" 
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">메모 내용 및 극화 아이디어</label>
                <textarea 
                  value={collectNoteContent} 
                  onChange={(e) => setCollectNoteContent(e.target.value)} 
                  rows={5} 
                  placeholder="서부지검 씬에서 대리석 바닥을 걷는 소리와 함께 검찰 내부의 뇌물 수수 동선을 사실적으로 구성할 계획..." 
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white px-4 py-3 rounded-xl outline-none resize-none leading-relaxed focus:border-amber-500/50" 
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800/40 bg-[#0E0E12] flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition-all">
            취소
          </button>
          <button onClick={handleCollectInspiration} className="px-5 py-2.5 bg-amber-500 text-black text-xs font-black rounded-xl transition-all shadow-md active:scale-95">
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
