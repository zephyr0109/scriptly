"use client";
 
import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Check, Folder, FolderPlus, Bookmark, Pencil, Trash2, Search, Plus, X, 
  MoreVertical, ChevronDown, FileText, Sparkles, FolderOpen 
} from "lucide-react";
import { cn, getUUID } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
 
interface ArchiveFilterGridProps {
  rawArchiveItems: any[];
  localFolders: string[];
  handleCreateLocalFolder: (name: string) => void;
  handleMoveToFolder: (id: string, folder: string | null, onSuccess?: () => void) => Promise<void>;
  handleRenameFolder: (oldName: string, newName: string, onSuccess?: () => void) => Promise<void>;
  handleDeleteFolder: (folderName: string, onSuccess?: () => void) => Promise<void>;
  addToast: (msg: string, type?: "success" | "info" | "warning" | "error") => void;
  selectArchive?: (id: string) => void;
  onEditClick?: (item: any) => void;
  onDeleteClick?: (id: string) => void;
  archiveFilter: string; // 사이드바 대분류 필터 (all, text, url, file)
  archiveSort: string;   // 사이드바 정렬 (date, name)
}
 
export default function ArchiveFilterGrid({
  rawArchiveItems,
  localFolders,
  handleCreateLocalFolder,
  handleMoveToFolder,
  handleRenameFolder,
  handleDeleteFolder,
  addToast,
  selectArchive,
  onEditClick,
  onDeleteClick,
  archiveFilter,
  archiveSort
}: ArchiveFilterGridProps) {
  const {
    isDarkMode,
    selectedArchiveId,
    selectArchive: storeSelectArchive
  } = useUIStore();

  // 1. 검색 및 폴더 필터 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolder, setCurrentFolder] = useState("all"); // 'all' (전체), 'unclassified' (미분류), '특정폴더명'

  // 2. 인라인 폴더 생성 상태
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  // 3. 인라인 폴더 이름 편집 상태
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const editFolderInputRef = useRef<HTMLInputElement>(null);

  // 4. 개별 카드 폴더 이동 팝오버 상태
  const [activeMoveMenuId, setActiveMoveMenuId] = useState<string | null>(null);
  const moveMenuRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 카드 폴더 팝오버 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moveMenuRef.current && !moveMenuRef.current.contains(event.target as Node)) {
        setActiveMoveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 포커스 보정
  useEffect(() => {
    if (isCreatingFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [isCreatingFolder]);

  useEffect(() => {
    if (editingFolder && editFolderInputRef.current) {
      editFolderInputRef.current.focus();
    }
  }, [editingFolder]);

  // 5. 고유 폴더 목록 집계 (DB 로드된 실제 폴더명 + 로컬 스토리지에 생성된 빈 폴더들)
  const allFolders = useMemo(() => {
    const fromItems = rawArchiveItems
      .map(item => item.folder)
      .filter((folder): folder is string => typeof folder === "string" && folder.trim() !== "");
    const merged = Array.from(new Set([...localFolders, ...fromItems]));
    return merged.sort();
  }, [rawArchiveItems, localFolders]);

  // 6. 새 폴더 추가 액션
  const onCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    if (name === "전체" || name === "미분류") {
      addToast("사용할 수 없는 폴더 이름입니다.", "warning");
      return;
    }
    if (allFolders.includes(name)) {
      addToast("이미 존재하는 폴더 이름입니다.", "warning");
      return;
    }
    handleCreateLocalFolder(name);
    setNewFolderName("");
    setIsCreatingFolder(false);
    setCurrentFolder(name); // 신규 폴더로 자동 탭 포커싱
    addToast(`'${name}' 폴더가 생성되었습니다.`, "success");
  };

  // 7. 폴더 이름 수정 완료 액션
  const onRenameFolderSubmit = async (oldName: string) => {
    const name = editFolderName.trim();
    if (!name || name === oldName) {
      setEditingFolder(null);
      return;
    }
    if (name === "전체" || name === "미분류") {
      addToast("사용할 수 없는 폴더 이름입니다.", "warning");
      return;
    }
    if (allFolders.includes(name) && name !== oldName) {
      addToast("이미 존재하는 폴더 이름입니다.", "warning");
      return;
    }
    await handleRenameFolder(oldName, name, () => {
      addToast("폴더 이름이 수정되었습니다.", "success");
      if (currentFolder === oldName) {
        setCurrentFolder(name);
      }
    });
    setEditingFolder(null);
  };

  // 8. 폴더 삭제 액션 (폴더 자체만 날리고 안의 카드는 folder = null 로 보존)
  const onDeleteFolderClick = async (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`'${folderName}' 폴더를 삭제하시겠습니까?\n(폴더 안의 영감들은 삭제되지 않고 '미분류'로 이동됩니다.)`)) {
      await handleDeleteFolder(folderName, () => {
        addToast("폴더가 삭제되었습니다.", "info");
        if (currentFolder === folderName) {
          setCurrentFolder("all");
        }
      });
    }
  };

  // 9. 카드 개별 폴더 이동 액션
  const onMoveCardFolder = async (cardId: string, folderName: string | null) => {
    await handleMoveToFolder(cardId, folderName, () => {
      addToast(folderName ? `'${folderName}' 폴더로 이동되었습니다.` : "미분류 보관함으로 이동되었습니다.", "success");
    });
    setActiveMoveMenuId(null);
  };

  // 10. 복합 필터링 체인 (사이드바 필터 + 검색 필터 + 폴더 칩 필터 + 정렬)
  const computedFilteredArchives = useMemo(() => {
    let list = [...rawArchiveItems];

    // [A] 사이드바 대분류 필터 (all, text, url, file)
    if (archiveFilter !== "all") {
      if (archiveFilter === "text") {
        list = list.filter(item => item.type === "NOTE");
      } else if (archiveFilter === "url") {
        list = list.filter(item => item.type === "NEWS");
      } else if (archiveFilter === "file") {
        list = list.filter(item => item.type === "FILE");
      }
    }

    // [B] 가로 칩 폴더 필터
    if (currentFolder === "unclassified") {
      // 미분류 (folder가 없거나 빈 값)
      list = list.filter(item => !item.folder || item.folder.trim() === "");
    } else if (currentFolder !== "all") {
      // 특정 폴더명 매칭
      list = list.filter(item => item.folder === currentFolder);
    }

    // [C] 보관함 검색 인풋 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(item => 
        item.title.toLowerCase().includes(q) || 
        (item.content && item.content.toLowerCase().includes(q)) ||
        (item.summary && item.summary.toLowerCase().includes(q))
      );
    }

    // [D] 사이드바 정렬 (date, name)
    if (archiveSort === "name") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // date (최신순)
      list.sort((a, b) => new Date(b.ingested_at || b.created_at).getTime() - new Date(a.ingested_at || a.created_at).getTime());
    }

    return list;
  }, [rawArchiveItems, archiveFilter, currentFolder, searchQuery, archiveSort]);

  // HTML 클리너 Helper
  const cleanHtml = (text: string): string => {
    if (!text) return "";
    return text
      .replace(/<[^>]*>/g, "")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .trim();
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar-dark p-8 flex flex-col gap-6">
      
      {/* 1. 헤더 */}
      <div className="flex flex-col gap-1 shrink-0">
        <h2 className="text-2xl font-black tracking-tight">수집된 영감 보관함</h2>
        <p className="text-xs text-zinc-500 font-medium">대본 및 캐릭터 관계 설계 시 갈등의 축으로 삼을 수 있는 극화 변환 조각들입니다.</p>
      </div>

      {/* 2. 보관함 검색 인풋 */}
      <div className="relative shrink-0 w-full max-w-2xl mt-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
        <input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="보관함 내 영감 검색 (제목, 요약, 메모 내용 등)..." 
          className={cn(
            "w-full pl-11 pr-8 py-3.5 rounded-2xl text-xs font-black outline-none border transition-all shadow-inner",
            isDarkMode 
              ? "bg-[#09090C] border-zinc-800 text-white focus:border-indigo-500/50" 
              : "bg-white border-zinc-200 text-zinc-900 focus:border-indigo-500"
          )}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 3. 검색칸 아래 가로형 폴더 칩 필터 바 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 shrink-0 select-none custom-scrollbar-horizontal w-full">
        
        {/* 전체 칩 */}
        <button
          onClick={() => { setCurrentFolder("all"); setEditingFolder(null); }}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 flex items-center gap-1.5 border",
            currentFolder === "all"
              ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
              : (isDarkMode ? "bg-[#14141A] border-zinc-800 text-zinc-400 hover:text-white" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50")
          )}
        >
          📁 전체보기
        </button>

        {/* 미분류 칩 */}
        <button
          onClick={() => { setCurrentFolder("unclassified"); setEditingFolder(null); }}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 flex items-center gap-1.5 border",
            currentFolder === "unclassified"
              ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
              : (isDarkMode ? "bg-[#14141A] border-zinc-800 text-zinc-400 hover:text-white" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50")
          )}
        >
          📂 미분류 (기본 보관함)
        </button>

        {/* 사용자 정의 폴더 칩 목록 */}
        {allFolders.map(folder => {
          const isSelected = currentFolder === folder;
          const isEditing = editingFolder === folder;

          if (isEditing) {
            return (
              <form 
                key={folder} 
                onSubmit={(e) => { e.preventDefault(); onRenameFolderSubmit(folder); }}
                className="flex items-center bg-zinc-900 border border-indigo-500 rounded-xl px-2.5 py-1.5 shrink-0"
              >
                <input 
                  ref={editFolderInputRef}
                  value={editFolderName}
                  onChange={(e) => setEditFolderName(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white border-none outline-none w-28"
                  onBlur={() => onRenameFolderSubmit(folder)}
                />
                <button type="submit" className="p-0.5 text-indigo-400 hover:text-indigo-300">
                  <Check size={12} />
                </button>
              </form>
            );
          }

          return (
            <div 
              key={folder}
              onClick={() => { setCurrentFolder(folder); setEditingFolder(null); }}
              className={cn(
                "group/chip px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 flex items-center gap-1.5 border cursor-pointer select-none",
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-500 shadow-md"
                  : (isDarkMode ? "bg-[#14141A] border-zinc-800 text-zinc-400 hover:text-white" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50")
              )}
            >
              <span>📁 {folder}</span>
              
              {/* 폴더 편집/삭제 아이콘 (호버 시 인디고 또는 회색 칩 우측 노출) */}
              <div className="flex items-center gap-1 ml-1 opacity-0 group-hover/chip:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingFolder(folder);
                    setEditFolderName(folder);
                  }}
                  className="p-0.5 hover:bg-black/30 rounded text-zinc-400 hover:text-white"
                  title="폴더 이름 수정"
                >
                  <Pencil size={10} />
                </button>
                <button 
                  onClick={(e) => onDeleteFolderClick(folder, e)}
                  className="p-0.5 hover:bg-black/30 rounded text-zinc-400 hover:text-rose-400"
                  title="폴더 삭제"
                >
                  <X size={10} />
                </button>
              </div>
            </div>
          );
        })}

        {/* 플러스 버튼을 활용한 모달 없는 인라인 폴더 추가 */}
        {isCreatingFolder ? (
          <form 
            onSubmit={onCreateFolderSubmit}
            className="flex items-center bg-zinc-900 border border-amber-500/50 rounded-xl px-2.5 py-1.5 shrink-0 animate-in zoom-in-95 duration-100"
          >
            <input 
              ref={newFolderInputRef}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="새 폴더 이름..."
              className="bg-transparent text-xs font-bold text-white border-none outline-none w-28 placeholder:text-zinc-650"
              onBlur={() => {
                if (!newFolderName.trim()) {
                  setIsCreatingFolder(false);
                }
              }}
            />
            <button type="submit" className="p-0.5 text-amber-500 hover:text-amber-400">
              <Check size={12} />
            </button>
            <button 
              type="button" 
              onClick={() => setIsCreatingFolder(false)}
              className="p-0.5 text-zinc-500 hover:text-zinc-300 ml-0.5"
            >
              <X size={12} />
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsCreatingFolder(true)}
            className={cn(
              "px-3 py-2 rounded-xl text-xs font-bold shrink-0 transition-all active:scale-95 flex items-center gap-1 border border-dashed",
              isDarkMode 
                ? "border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 bg-transparent" 
                : "border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800 bg-white"
            )}
            title="새 폴더 추가"
          >
            <Plus size={12} />
            <span>폴더 추가</span>
          </button>
        )}

      </div>

      {/* 4. 필터링된 보관함 그리드 리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-1 pb-16">
        {computedFilteredArchives.map(item => (
          <div 
            key={item.id}
            onClick={() => {
              if (selectArchive) {
                selectArchive(item.id);
              } else {
                storeSelectArchive(item.id);
              }
            }}
            className={cn(
              "p-6 rounded-2xl border cursor-pointer transition-all duration-300 hover:-translate-y-0.5 flex flex-col gap-3 relative overflow-hidden group",
              selectedArchiveId === item.id 
                ? (isDarkMode ? "bg-[#1E1E28] border-amber-500 shadow-xl shadow-amber-500/5" : "bg-amber-50/40 border-amber-500 shadow-md")
                : (isDarkMode ? "bg-[#14141A] border-zinc-800 hover:border-zinc-700" : "bg-white border-zinc-200 hover:border-zinc-300 shadow-sm")
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded-full font-black">
                {item.type === "NOTE" ? "✍️ 극작 메모" : item.type === "NEWS" ? "🔗 뉴스기사" : "📁 문서파일"}
              </span>
              
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-zinc-500 font-semibold mr-1">
                  {new Date(item.ingested_at || item.created_at).toISOString().split("T")[0]}
                </span>
                
                {/* 수정 및 삭제 버튼 제어 바 */}
                <div className="flex items-center gap-1 opacity-45 group-hover:opacity-100 transition-all duration-300">
                  {item.type === "NOTE" && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEditClick) onEditClick(item);
                      }}
                      className={cn(
                        "p-1.5 rounded-lg transition-all active:scale-90 hover:scale-110",
                        isDarkMode ? "hover:bg-zinc-800 text-zinc-400 hover:text-white" : "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950"
                      )}
                      title="메모 수정"
                    >
                      <Pencil size={11} />
                    </button>
                  )}
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDeleteClick) onDeleteClick(item.id);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg transition-all active:scale-90 hover:scale-110 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500"
                    )}
                    title="영감 삭제"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
            
            <h3 className={cn(
              "text-sm font-black leading-relaxed hover:text-amber-400 transition-colors line-clamp-1",
              isDarkMode ? "text-white" : "text-zinc-900"
            )}>
              {item.title}
            </h3>
            
            <p className={cn(
              "text-xs leading-relaxed font-medium flex-1",
              item.type === "NOTE" 
                ? (isDarkMode ? "text-zinc-300 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800 whitespace-pre-wrap line-clamp-3" : "text-zinc-800 bg-zinc-100/50 p-3.5 rounded-xl border border-zinc-200 whitespace-pre-wrap line-clamp-3")
                : "text-zinc-400 line-clamp-3"
            )}>
              {item.type === "NOTE" ? item.content : cleanHtml(item.summary || item.content)}
            </p>
            
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/10 relative">
              <span className="text-[10px] text-zinc-500 font-bold">
                {item.analysis_status === "COMPLETED" && item.tension_score > 0
                  ? `갈등 지수: ${item.tension_score}%`
                  : item.analysis_status === "PROCESSING" ? "AI 분석 중..." : ""}
              </span>
              
              {/* 폴더 이동 및 배속 단추 (클릭 시 팝오버 메뉴 활성화) */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMoveMenuId(activeMoveMenuId === item.id ? null : item.id);
                  }}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tight border transition-all active:scale-95 hover:bg-zinc-800",
                    item.folder 
                      ? "bg-indigo-950/20 border-indigo-900/50 text-indigo-400"
                      : "bg-zinc-900/40 border-zinc-800 text-zinc-500"
                  )}
                  title="폴더로 이동 및 분류"
                >
                  <Folder size={10} />
                  <span>{item.folder ? item.folder : "미분류"}</span>
                  <ChevronDown size={8} />
                </button>

                {/* 폴더 배정 팝오버 컨텍스트 메뉴 */}
                {activeMoveMenuId === item.id && (
                  <div 
                    ref={moveMenuRef}
                    className="absolute bottom-7 right-0 z-50 bg-[#16161E] border border-zinc-800 rounded-xl p-2 shadow-2xl flex flex-col gap-1 w-44 select-none animate-in zoom-in-95 duration-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-2 py-1 border-b border-zinc-800/60 mb-1">폴더로 분류 이동</span>
                    
                    {/* 미분류로 복귀 옵션 */}
                    <button
                      onClick={() => onMoveCardFolder(item.id, null)}
                      className="text-[10px] text-zinc-400 font-bold hover:bg-zinc-800 hover:text-white px-2 py-1.5 rounded-lg text-left transition-colors flex items-center justify-between"
                    >
                      <span>📂 미분류 보관함</span>
                      {!item.folder && <Check size={10} className="text-amber-500" />}
                    </button>

                    {/* 폴더 리스트 옵션 */}
                    {allFolders.map(f => (
                      <button
                        key={f}
                        onClick={() => onMoveCardFolder(item.id, f)}
                        className="text-[10px] text-zinc-400 font-bold hover:bg-zinc-800 hover:text-white px-2 py-1.5 rounded-lg text-left transition-colors flex items-center justify-between"
                      >
                        <span className="truncate">📁 {f}</span>
                        {item.folder === f && <Check size={10} className="text-indigo-400" />}
                      </button>
                    ))}

                    {allFolders.length === 0 && (
                      <span className="text-[8px] text-zinc-650 font-bold italic px-2 py-2">생성된 폴더가 없습니다. 상단에서 폴더를 먼저 추가하세요.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {computedFilteredArchives.length === 0 && (
          <div className="col-span-3 text-center py-24 text-zinc-550 text-xs flex flex-col items-center justify-center gap-3">
            <Bookmark size={24} className="text-zinc-700" />
            <span className="font-black">해당 폴더나 검색 조건에 부합하는 수집 자산이 없습니다.</span>
          </div>
        )}
      </div>

    </div>
  );
}
