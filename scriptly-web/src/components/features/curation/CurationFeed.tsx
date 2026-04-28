/**
 * [Architecture Point: UI Layer - Feature Component]
 * 뉴스 큐레이션(Curation) 기능을 담당하는 메인 피드 컴포넌트입니다.
 * 필사 시 외부 API 데이터를 어떻게 리스트 형태로 렌더링하고 상태를 관리하는지 보십시오.
 */
import React from "react";
import { Zap, ExternalLink, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";

const CurationFeed = ({ 
  newsResults, 
  selectedNewsIndex, 
  setSelectedNewsIndex, 
  isLoading, 
  isLoadingMore, 
  searchQuery, 
  isDarkMode, 
  handleLoadMore 
}: any) => {
  return (
    <div className={cn(
      "flex-1 overflow-y-auto p-8 space-y-12 font-sans scroll-smooth",
      isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar-light"
    )} style={{ overflowAnchor: 'none' }}>
      <header className="flex justify-between items-end border-b border-zinc-100 dark:border-zinc-800 pb-8">
        <div>
          <h1 className={cn("text-3xl font-bold mb-2 tracking-tight", isDarkMode ? "text-white" : "text-zinc-900")}>
            영감 스카우터
          </h1>
          <p className="text-zinc-500 font-medium font-sans text-sm">
            {searchQuery ? (
              <><span>'{searchQuery}'</span>에 대한 AI 분석 결과입니다.</>
            ) : (
              "실시간 사건들을 드라마틱한 시선으로 스카우팅합니다."
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {isLoading && <div className="flex items-center gap-2 px-4 py-2 text-amber-500 text-xs font-bold animate-pulse"><Zap size={14} /> 스카우팅 중...</div>}
        </div>
      </header>

      <div className="space-y-4 font-sans pb-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-zinc-500 font-bold italic animate-pulse">
            <Zap className="text-amber-500" size={32} />
            <p>세상의 영감을 가져오고 있습니다...</p>
          </div>
        ) : newsResults.length > 0 ? (
          newsResults.map((item: any, index: number) => (
            <div 
              key={item.id || index} 
              onClick={() => setSelectedNewsIndex(index)}
              className={cn(
                "p-6 rounded-2xl border-2 transition-all cursor-pointer group relative overflow-hidden",
                selectedNewsIndex === index 
                  ? (isDarkMode ? "bg-zinc-900 border-amber-500/50 shadow-2xl" : "bg-white border-amber-500 shadow-xl shadow-amber-500/10") 
                  : (isDarkMode ? "bg-transparent border-zinc-800/50 hover:border-zinc-700" : "bg-white border-zinc-100 hover:border-zinc-200 shadow-sm")
              )}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500/80">NEWS • {item.article?.pubDate || "RECENT"}</span>
                <div className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-black tracking-tight",
                  item.analysis_status === "PENDING" || item.analysis_status === "PROCESSING" ? "bg-amber-500/10 text-amber-500 animate-pulse" :
                  (item.tension_evaluation?.score === 0 && (item.tension_evaluation?.reason?.includes("실패") || item.tension_evaluation?.reason?.includes("할당량")))
                    ? "bg-rose-500 text-white" :
                  item.tension_evaluation?.score > 0 ? "bg-amber-500 text-black" : (isDarkMode ? "bg-zinc-800 text-zinc-500" : "bg-zinc-100 text-zinc-400")
                )}>
                  {item.analysis_status === "PENDING" || item.analysis_status === "PROCESSING" ? "AI 분석 대기" : 
                   (item.tension_evaluation?.score === 0 && (item.tension_evaluation?.reason?.includes("실패") || item.tension_evaluation?.reason?.includes("할당량")))
                    ? "분석 실패" :
                   item.tension_evaluation?.score > 0 ? `TENSION ${item.tension_evaluation.score}` : "READY"}
                </div>
              </div>
              <h3 className={cn("text-xl font-bold mb-2 group-hover:text-amber-500 transition-colors duration-300", isDarkMode ? "text-white" : "text-zinc-900")} dangerouslySetInnerHTML={{ __html: item.article?.title || "제목 없음" }}></h3>
              <p className={cn("text-sm line-clamp-2 mb-6 leading-relaxed opacity-70", isDarkMode ? "text-zinc-400" : "text-zinc-600")} dangerouslySetInnerHTML={{ __html: item.article?.description || "내용 요약이 없습니다." }}></p>
              
              <div className="flex justify-end mt-auto">
                <a 
                  href={item.article?.link} 
                  target="_blank" 
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()} 
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all border",
                    isDarkMode 
                      ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-amber-500" 
                      : "bg-zinc-50 border-zinc-200 text-zinc-500 hover:text-amber-600 shadow-sm"
                  )}
                >
                  원문 기사 <ExternalLink size={12} />
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-zinc-500 font-bold italic">
            데이터를 불러올 수 없습니다.
          </div>
        )}

        {newsResults.length >= 10 && searchQuery && !isLoading && !isLoadingMore && (
           <button 
             onClick={handleLoadMore}
             className={cn("w-full py-5 font-bold rounded-2xl transition-all border-2 text-xs uppercase tracking-widest", isDarkMode ? "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-amber-500" : "bg-white border-zinc-200 text-zinc-400 hover:bg-zinc-50 hover:text-amber-600 shadow-sm")}
           >
             더 많은 기사 불러오기
           </button>
        )}
      </div>
    </div>
  );
};

export default CurationFeed;
