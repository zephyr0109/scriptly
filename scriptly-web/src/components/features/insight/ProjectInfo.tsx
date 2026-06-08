"use client";

import React from "react";

/**
 * ProjectInfo 컴포넌트의 Props 인터페이스 정의
 */
interface ProjectInfoProps {
  currentProject: any;
  editProjectTitle: string;
  setEditProjectTitle: (val: string) => void;
  editProjectGenre: string;
  setEditProjectGenre: (val: string) => void;
  formatSelectMode: string;
  setFormatSelectMode: (val: string) => void;
  customFormat: string;
  setCustomFormat: (val: string) => void;
  editProjectAtmosphere: string;
  setEditProjectAtmosphere: (val: string) => void;
  editProjectIntendedPurpose: string;
  setEditProjectIntendedPurpose: (val: string) => void;
  editProjectCoreConflict: string;
  setEditProjectCoreConflict: (val: string) => void;
  editProjectTheme: string;
  setEditProjectTheme: (val: string) => void;
  editProjectLogline: string;
  setEditProjectLogline: (val: string) => void;
  handleSaveProjectInfo: () => Promise<void>;
}

/**
 * ProjectInfo 컴포넌트
 * 드라마 기획안 정보 탭(activeWorkspaceTab === "info")의 정보 조회 및 편집을 처리하는 프레젠테이션 컴포넌트입니다.
 */
export default function ProjectInfo({
  editProjectTitle,
  setEditProjectTitle,
  editProjectGenre,
  setEditProjectGenre,
  formatSelectMode,
  setFormatSelectMode,
  customFormat,
  setCustomFormat,
  editProjectAtmosphere,
  setEditProjectAtmosphere,
  editProjectIntendedPurpose,
  setEditProjectIntendedPurpose,
  editProjectCoreConflict,
  setEditProjectCoreConflict,
  editProjectTheme,
  setEditProjectTheme,
  editProjectLogline,
  setEditProjectLogline,
  handleSaveProjectInfo
}: ProjectInfoProps) {
  return (
    <div className="flex-grow overflow-y-auto custom-scrollbar-dark p-8 flex flex-col gap-6">
      <div className="max-w-2xl flex flex-col gap-5">
        <h2 className="text-xl font-black">드라마 기획안 정보</h2>
        
        {/* 기획 타이틀 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">기획 타이틀</span>
          <input 
            value={editProjectTitle} 
            onChange={(e) => setEditProjectTitle(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl w-full focus:border-amber-500/50 outline-none" 
          />
        </div>

        {/* 장르 스타일 & 기본 편성 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">장르 스타일</span>
            <input 
              value={editProjectGenre} 
              onChange={(e) => setEditProjectGenre(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl w-full focus:border-amber-500/50 outline-none" 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">기본 편성 정보</span>
            <div className="flex flex-col gap-2">
              <select 
                value={formatSelectMode} 
                onChange={(e) => setFormatSelectMode(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl w-full focus:border-amber-500/50 outline-none cursor-pointer"
              >
                <option value="단막극 (1부작)">단막극 (1부작)</option>
                <option value="2부작 단막극">2부작 단막극</option>
                <option value="4부작 연작">4부작 연작</option>
                <option value="8부작 시리즈">8부작 시리즈</option>
                <option value="12부작 미니시리즈">12부작 미니시리즈</option>
                <option value="16부작 미니시리즈">16부작 미니시리즈</option>
                <option value="영화 (Feature)">영화 (Feature)</option>
                <option value="custom">직접 입력 (커스텀)</option>
              </select>
              
              {formatSelectMode === "custom" && (
                <input 
                  value={customFormat} 
                  onChange={(e) => setCustomFormat(e.target.value)}
                  placeholder="원하는 편성 규격을 입력해 주세요... (예: 50부작 대하드라마)"
                  className="bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl w-full focus:border-amber-500/50 outline-none animate-in slide-in-from-top-1 duration-200" 
                />
              )}
            </div>
          </div>
        </div>

        {/* 분위기 / 톤 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">분위기 / 톤 (Atmosphere)</span>
          <input 
            value={editProjectAtmosphere} 
            onChange={(e) => setEditProjectAtmosphere(e.target.value)}
            placeholder="예: 차갑고 묵직한 하드보일드 수사극, 빠른 템포의 오피스 누아르 등"
            className="bg-zinc-900 border border-zinc-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl w-full focus:border-amber-500/50 outline-none" 
          />
        </div>

        {/* 작품의 기획 의도 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">작품의 기획 의도 (Intended Purpose)</span>
          <textarea 
            value={editProjectIntendedPurpose} 
            rows={4}
            onChange={(e) => setEditProjectIntendedPurpose(e.target.value)}
            placeholder="작품의 사회적 메시지, 집필 배경 및 기획 의도를 기술해 주세요..."
            className="bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white px-4 py-3 rounded-xl w-full resize-none leading-relaxed focus:border-amber-500/50 outline-none" 
          />
        </div>

        {/* 핵심 갈등 역학 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">핵심 갈등 역학 (Core Conflict)</span>
          <textarea 
            value={editProjectCoreConflict} 
            rows={3}
            onChange={(e) => setEditProjectCoreConflict(e.target.value)}
            placeholder="인물 간의 신념 대립이나 거대 세력과의 대립 구조 등 서사의 뼈대가 될 갈등 역학을 적어보세요..."
            className="bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white px-4 py-3 rounded-xl w-full resize-none leading-relaxed focus:border-amber-500/50 outline-none" 
          />
        </div>

        {/* 주제 및 인사이트 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">주제 및 인사이트 (Theme)</span>
          <textarea 
            value={editProjectTheme} 
            rows={2}
            onChange={(e) => setEditProjectTheme(e.target.value)}
            placeholder="작품이 궁극적으로 전달하고자 하는 핵심 주제와 인간상에 대한 인사이트를 기록합니다..."
            className="bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white px-4 py-3 rounded-xl w-full resize-none leading-relaxed focus:border-amber-500/50 outline-none" 
          />
        </div>

        {/* 작품의 핵심 로그라인 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">작품의 핵심 로그라인 (Logline)</span>
          <textarea 
            value={editProjectLogline} 
            rows={4}
            onChange={(e) => setEditProjectLogline(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-xs font-semibold text-white px-4 py-3 rounded-xl w-full resize-none leading-relaxed focus:border-amber-500/50 outline-none" 
          />
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end mt-2">
          <button 
            onClick={handleSaveProjectInfo} 
            className="px-5 py-2.5 bg-amber-500 text-black hover:bg-amber-400 text-xs font-black rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            기획 저장 완료
          </button>
        </div>
      </div>
    </div>
  );
}
