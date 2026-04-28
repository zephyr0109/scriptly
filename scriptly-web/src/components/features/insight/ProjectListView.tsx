import React, { useState } from "react";
import { FolderPlus, BookOpen, Clock, ChevronRight, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectListViewProps {
  projects: any[];
  onSelectProject: (p: any) => void;
  onCreateProject: (data: any) => void;
  isDarkMode: boolean;
  isLoading: boolean;
}

const ProjectListView = ({ projects, onSelectProject, onCreateProject, isDarkMode, isLoading }: ProjectListViewProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    format: "16부작",
    genre: "",
    atmosphere: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title) return;
    onCreateProject(newProject);
    setShowCreateForm(false);
  };

  if (showCreateForm) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 animate-in fade-in zoom-in duration-300">
        <div className={cn(
          "w-full max-w-2xl rounded-[3rem] p-12 space-y-10 shadow-3xl border",
          isDarkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
        )}>
          <div className="text-center space-y-2">
            <h2 className={cn("text-3xl font-black", isDarkMode ? "text-white" : "text-zinc-900")}>새 프로젝트 시작</h2>
            <p className="text-zinc-500 font-bold tracking-tight">당신의 상상을 구체화할 프로젝트 정보를 입력하세요.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 ml-2">프로젝트 제목</label>
              <input 
                autoFocus
                value={newProject.title}
                onChange={e => setNewProject({...newProject, title: e.target.value})}
                placeholder="예: 경성 크리처, 킹덤, 그랜드 부다페스트 호텔"
                className={cn(
                  "w-full px-8 py-5 rounded-3xl text-lg font-bold outline-none border transition-all",
                  isDarkMode ? "bg-zinc-800 border-zinc-700 text-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" : "bg-zinc-50 border-zinc-100 text-zinc-900 focus:border-indigo-500 focus:bg-white focus:shadow-xl"
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">작품 형식</label>
                <select 
                  value={newProject.format}
                  onChange={e => setNewProject({...newProject, format: e.target.value})}
                  className={cn(
                    "w-full px-6 py-4 rounded-2xl font-bold outline-none border",
                    isDarkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-100 text-zinc-900"
                  )}
                >
                  <option>단막극</option>
                  <option>2부작</option>
                  <option>4부작</option>
                  <option>8부작</option>
                  <option>12부작</option>
                  <option>16부작</option>
                  <option>20부작</option>
                  <option>영화</option>
                  <option>연극</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">주요 장르</label>
                <input 
                  value={newProject.genre}
                  onChange={e => setNewProject({...newProject, genre: e.target.value})}
                  placeholder="예: 스릴러, 로코"
                  className={cn(
                    "w-full px-6 py-4 rounded-2xl font-bold outline-none border",
                    isDarkMode ? "bg-zinc-800 border-zinc-700 text-white" : "bg-zinc-50 border-zinc-100 text-zinc-900"
                  )}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6">
              <button 
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="flex-1 py-5 rounded-2xl font-black text-zinc-500 hover:bg-zinc-100 transition-all border border-transparent"
              >
                취소
              </button>
              <button 
                type="submit"
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 active:scale-95 transition-all"
              >
                연구소 시작하기
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-16 overflow-y-auto space-y-16 animate-in fade-in duration-500">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <div className="space-y-3">
          <h2 className={cn("text-4xl font-black tracking-tighter", isDarkMode ? "text-white" : "text-zinc-900")}>
            인사이트 연구소
          </h2>
          <p className="text-zinc-500 font-bold text-lg">기존 프로젝트를 선택하거나 새로운 집필 프로젝트를 생성하세요.</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(true)}
          className="px-8 py-5 bg-indigo-600 text-white rounded-[2rem] font-black flex items-center gap-3 shadow-2xl shadow-indigo-600/40 hover:bg-indigo-500 hover:-translate-y-1 transition-all"
        >
          <Plus size={24} /> 새 프로젝트 생성
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          <div className="col-span-full py-20 text-center opacity-30 font-black animate-pulse">프로젝트를 불러오는 중...</div>
        ) : projects.length === 0 ? (
          <div className={cn(
            "col-span-full py-32 rounded-[3.5rem] border-4 border-dashed text-center space-y-6 flex flex-col items-center justify-center transition-all",
            isDarkMode ? "border-zinc-800/50 hover:bg-zinc-900/40" : "border-zinc-100/80 hover:bg-zinc-50"
          )}>
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mb-4">
              <Sparkles size={40} />
            </div>
            <p className="text-xl font-bold text-zinc-400">등록된 프로젝트가 없습니다.<br/>첫 번째 프로젝트를 만들어 영감을 현실로 바꾸세요!</p>
          </div>
        ) : (
          projects.map((p, i) => (
            <div 
              key={p.id}
              onClick={() => onSelectProject(p)}
              className={cn(
                "p-8 rounded-[3rem] space-y-8 border transition-all cursor-pointer group hover:scale-[1.02] hover:shadow-3xl",
                isDarkMode ? "bg-zinc-900 border-zinc-800 hover:border-indigo-500/50" : "bg-white border-zinc-100 hover:border-indigo-500/50"
              )}
            >
              <div className="flex justify-between items-start">
                 <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                   <BookOpen size={24} />
                 </div>
                 <span className={cn(
                   "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                   isDarkMode ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"
                 )}>{p.format}</span>
              </div>
              
              <div className="space-y-2">
                <h3 className={cn("text-2xl font-black group-hover:text-indigo-500 transition-colors", isDarkMode ? "text-white" : "text-zinc-900")}>
                  {p.title}
                </h3>
                <p className="text-zinc-500 font-bold text-sm line-clamp-1">{p.genre} — {p.atmosphere || "아직 분위기가 설정되지 않았습니다."}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-tighter">
                  <Clock size={12} />
                  {new Date(p.updated_at).toLocaleDateString()} 업데이트
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProjectListView;
