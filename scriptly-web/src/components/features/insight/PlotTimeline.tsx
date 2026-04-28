import React, { useState, useMemo } from "react";
import { 
  Plus, Trash2, GripVertical, Sparkles, Loader2, ArrowUpDown, 
  Calendar, Users, Clock, MessageSquare, AlertCircle, LayoutList, BookOpen, X
} from "lucide-react";
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import InspirationDrawer from "./InspirationDrawer";

interface PlotEvent {
  id: string;
  project_id: string;
  sequence: number;
  time_hint: string;
  title: string;
  content: string;
  related_character_ids: string[];
}

interface SortableRowProps {
  event: PlotEvent;
  characters: any[];
  isDarkMode: boolean;
  onEdit: (e: PlotEvent) => void;
  onDelete: (id: string) => void;
}

const SortableRow = ({ event, characters, isDarkMode, onEdit, onDelete }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? 'relative' : 'static' as any,
  };

  const eventCharacters = characters.filter(c => event.related_character_ids.includes(c.id));

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "group transition-all",
        isDragging ? (isDarkMode ? "bg-zinc-800 shadow-2xl" : "bg-white shadow-2xl") : 
        (isDarkMode ? "hover:bg-zinc-900/40 border-b border-zinc-800/50" : "hover:bg-zinc-50 border-b border-zinc-100")
      )}
    >
      <td className="p-4 w-10">
        <button 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <GripVertical size={16} />
        </button>
      </td>
      <td className="p-4 w-24">
        <span className="text-[11px] font-black tracking-widest text-zinc-500 uppercase">
          {event.time_hint || "-"}
        </span>
      </td>
      <td className="p-4 min-w-[200px]">
        <div className="space-y-1">
          <h5 className={cn("text-sm font-black tracking-tight", isDarkMode ? "text-zinc-100" : "text-zinc-900")}>
            {event.title}
          </h5>
          <p className={cn("text-[11px] font-medium line-clamp-2 leading-relaxed opacity-60", isDarkMode ? "text-zinc-400" : "text-zinc-600")}>
            {event.content}
          </p>
        </div>
      </td>
      <td className="p-4">
        <div className="flex flex-wrap gap-1.5">
          {eventCharacters.map(c => (
            <span key={c.id} className={cn(
              "px-2 py-0.5 rounded-full text-[9px] font-bold border",
              isDarkMode ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-indigo-50 border-indigo-100 text-indigo-600"
            )}>
              {c.name}
            </span>
          ))}
        </div>
      </td>
      <td className="p-4 w-24 text-right">
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(event)} className="p-2 rounded-xl border border-transparent hover:bg-zinc-800 transition-all text-zinc-500 hover:text-white">
            <Calendar size={14} />
          </button>
          <button onClick={() => onDelete(event.id)} className="p-2 rounded-xl border border-transparent hover:bg-rose-500/10 transition-all text-zinc-500 hover:text-rose-500">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

interface PlotTimelineProps {
  projectId: string;
  events: PlotEvent[];
  characters: any[];
  isGenerating: boolean;
  onCreateEvent: (data: any) => Promise<any>;
  onUpdateEvent: (id: string, data: any) => Promise<any>;
  onDeleteEvent: (id: string) => Promise<boolean>;
  onReorder: (projectId: string, ids: string[]) => Promise<any>;
  onGenerateDraft: (projectId: string) => Promise<any>;
  isDarkMode: boolean;
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  labSources: any[];
}

const PlotTimeline = ({
  projectId, events, characters, isGenerating,
  onCreateEvent, onUpdateEvent, onDeleteEvent, onReorder, onGenerateDraft,
  isDarkMode, addToast, labSources
}: PlotTimelineProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PlotEvent | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    time_hint: "",
    content: "",
    related_character_ids: [] as string[]
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = events.findIndex(e => e.id === active.id);
      const newIndex = events.findIndex(e => e.id === over?.id);
      
      const newOrder = arrayMove(events, oldIndex, newIndex);
      const ids = newOrder.map(e => e.id);
      await onReorder(projectId, ids);
    }
  };

  const handleGenerateAI = async () => {
    if (!showConfirmModal) {
      setShowConfirmModal(true);
      return;
    }

    setShowConfirmModal(false);
    try {
      await onGenerateDraft(projectId);
      addToast("AI 플롯 초안이 생성되었습니다.", "success");
    } catch (e: any) {
      addToast(e.message, "error");
    }
  };

  const openAddModal = () => {
    setEditingEvent(null);
    setFormData({ title: "", time_hint: "", content: "", related_character_ids: [] });
    setIsAddModalOpen(true);
    setIsModalOpen(true);
  };

  const openEditModal = (event: PlotEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      time_hint: event.time_hint,
      content: event.content,
      related_character_ids: [...event.related_character_ids]
    });
    setIsAddModalOpen(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEvent) {
      await onUpdateEvent(editingEvent.id, formData);
      addToast("사건이 수정되었습니다.", "success");
    } else {
      await onCreateEvent({ project_id: projectId, ...formData });
      addToast("새로운 사건이 추가되었습니다.", "success");
    }
    setIsModalOpen(false);
  };

  const toggleCharacter = (charId: string) => {
    setFormData(prev => ({
      ...prev,
      related_character_ids: prev.related_character_ids.includes(charId)
        ? prev.related_character_ids.filter((id: string) => id !== charId)
        : [...prev.related_character_ids, charId]
    }));
  };

  return (
    <div className={cn(
      "flex-1 h-full flex flex-col p-6 space-y-4 animate-in fade-in duration-700 overflow-y-auto min-h-0",
      isDarkMode ? "bg-black custom-scrollbar-dark" : "bg-white custom-scrollbar-light shadow-inner shadow-zinc-100/50"
    )}>
      {/* Header (Buttons Only) */}
      <div className="flex justify-end max-w-full w-full mx-auto gap-4">
        <button 
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className={cn(
            "flex items-center gap-3 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95",
            isDrawerOpen 
              ? (isDarkMode ? "bg-indigo-600 text-white" : "bg-zinc-900 text-white")
              : (isDarkMode ? "bg-zinc-900 text-zinc-400 hover:bg-zinc-800" : "bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-100")
          )}
        >
          <BookOpen size={14} /> Reference
        </button>
        <button 
          onClick={handleGenerateAI}
          disabled={isGenerating}
          className={cn(
            "flex items-center gap-3 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95",
            isDarkMode ? "bg-zinc-900 text-indigo-400 border border-indigo-500/30 hover:bg-zinc-800" : "bg-white text-indigo-600 border border-indigo-100 hover:bg-zinc-50"
          )}
        >
          {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
          AI Support
        </button>
        <button 
          onClick={openAddModal}
          className={cn(
            "flex items-center gap-3 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95",
            isDarkMode ? "bg-white text-black hover:bg-zinc-200" : "bg-zinc-900 text-white hover:bg-zinc-800"
          )}
        >
          <Plus size={14} /> Add Event
        </button>
      </div>

      <div className={cn(
        "max-w-full w-full mx-auto rounded-[3rem] border overflow-auto shadow-2xl",
        isDarkMode 
          ? "bg-zinc-950/50 border-zinc-900 shadow-indigo-500/5 custom-scrollbar-dark" 
          : "bg-white border-zinc-100 custom-scrollbar-light"
      )}>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={events.map(e => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
              <thead className="sticky top-0 z-20 shadow-sm">
                <tr className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  isDarkMode ? "bg-zinc-900 border-b border-zinc-800 text-zinc-500" : "bg-zinc-50 border-b border-zinc-100 text-zinc-400"
                )}>
                  <th className="p-6 w-10"></th>
                  <th className="p-6 w-24">Time</th>
                  <th className="p-6">Event Details</th>
                  <th className="p-6">Characters</th>
                  <th className="p-6 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/10">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-32 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-20">
                        <LayoutList size={48} />
                        <p className="text-[10px] font-black uppercase tracking-widest">No events registered yet</p>
                        <p className="text-[10px] font-bold">Use AI draft or add manually</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <SortableRow 
                      key={event.id} 
                      event={event} 
                      characters={characters} 
                      isDarkMode={isDarkMode}
                      onEdit={openEditModal}
                      onDelete={onDeleteEvent}
                    />
                  ))
                )}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>

      {/* Reference Drawer */}
      <InspirationDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        sources={labSources}
        isDarkMode={isDarkMode}
        onAddEvent={(data) => {
          setFormData({
            title: data.title,
            time_hint: "",
            content: data.content,
            related_character_ids: []
          });
          setIsAddModalOpen(true);
          setIsModalOpen(true);
        }}
      />

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12 animate-in fade-in zoom-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className={cn(
            "relative w-full max-w-2xl rounded-[3rem] border overflow-hidden shadow-2xl",
            isDarkMode ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-100"
          )}>
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h3 className={cn("text-2xl font-black tracking-tighter", isDarkMode ? "text-white" : "text-zinc-900")}>
                    {isAddModalOpen ? "새로운 사건 추가" : "사건 내용 수정"}
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    {isAddModalOpen ? "Add a new milestone to your plot" : "Update this event details"}
                  </p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-sm">
                  <X size={20} className="text-zinc-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">발생 시간</label>
                    <input 
                      className={cn("w-full px-4 py-3 rounded-2xl border outline-none font-bold text-sm", isDarkMode ? "bg-zinc-900 border-zinc-800 focus:border-indigo-500" : "bg-zinc-50 border-zinc-200 focus:border-indigo-500")}
                      value={formData.time_hint}
                      placeholder="예: Day 1, 오후"
                      onChange={e => setFormData({...formData, time_hint: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">사건 제목</label>
                    <input 
                      className={cn("w-full px-4 py-3 rounded-2xl border outline-none font-bold text-sm", isDarkMode ? "bg-zinc-900 border-zinc-800 focus:border-indigo-500" : "bg-zinc-50 border-zinc-200 focus:border-indigo-500")}
                      value={formData.title}
                      required
                      placeholder="무슨 일이 벌어지나요?"
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase ml-1">주요 내용 (드라마틱 묘사)</label>
                  <textarea 
                    className={cn(
                      "w-full px-4 py-4 rounded-[2rem] border outline-none font-medium text-sm h-32 resize-none", 
                      isDarkMode 
                        ? "bg-zinc-900 border-zinc-800 focus:border-indigo-500 custom-scrollbar-dark" 
                        : "bg-zinc-50 border-zinc-100 focus:border-indigo-500 custom-scrollbar-light"
                    )}
                    value={formData.content}
                    required
                    placeholder="이 사건의 갈등과 감정을 구체적으로 적어주세요."
                    onChange={e => setFormData({...formData, content: e.target.value})}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 flex items-center gap-2">
                    <Users size={12}/> 참여 인물 선별
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {characters.map(char => (
                      <button
                        key={char.id}
                        type="button"
                        onClick={() => toggleCharacter(char.id)}
                        className={cn(
                          "px-4 py-2 rounded-full text-[10px] font-black transition-all border",
                          formData.related_character_ids.includes(char.id)
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                            : (isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50")
                        )}
                      >
                        {char.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button className="w-full bg-indigo-600 text-white py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all">
                    {isAddModalOpen ? "Create Event" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* AI 생성 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className={cn(
             "w-[420px] rounded-2xl border p-8 space-y-6 relative shadow-2xl",
             isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
           )}>
              <div className="flex flex-col items-center text-center space-y-4">
                 <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <Sparkles size={32} />
                 </div>
                 <h2 className="text-xl font-black">AI 플롯 초안을 생성하시겠습니까?</h2>
                 <p className="text-sm text-zinc-500 leading-relaxed">
                    AI가 현재 설정을 바탕으로 새로운 플롯 초안을 생성합니다.<br/>
                    <strong>기존 데이터가 대체</strong>될 수 있습니다. 계속하시겠습니까?
                 </p>
              </div>
              <div className="flex gap-3 pt-2">
                 <button 
                   onClick={() => setShowConfirmModal(false)}
                   className={cn("flex-1 py-3 rounded-xl text-xs font-bold transition-all", isDarkMode ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600")}
                 >
                    취소
                 </button>
                 <button 
                   onClick={handleGenerateAI}
                   className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/20 transition-all"
                 >
                    네, 생성하겠습니다
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PlotTimeline;
