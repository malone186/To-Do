import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AppLayout from "@/components/AppLayout";

export const revalidate = 0;

export default async function PersonalAnalyticsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // 본인의 전체 To-Do 로드
  const todos = await prisma.todo.findMany({
    where: { userId: session.userId }
  });

  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.isCompleted).length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // 우선순위 분포도
  const priorityStats = {
    high: todos.filter(t => t.priority === "HIGH").length,
    medium: todos.filter(t => t.priority === "MEDIUM").length,
    low: todos.filter(t => t.priority === "LOW").length,
  };

  // 카테고리 분포도
  const categoryMap: { [key: string]: number } = {};
  todos.forEach(t => {
    const cat = t.category?.trim() || "일반";
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const categoryStats = Object.entries(categoryMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 유니크 카테고리 (사이드바 카테고리 전송용)
  const uniqueCategoriesData = await prisma.todo.findMany({
    where: { userId: session.userId },
    select: { category: true },
    distinct: ["category"],
  });
  const userCategories = uniqueCategoriesData.map((c) => c.category || "일반");

  // SVG 도넛 계산 헬퍼
  const totalPriority = priorityStats.high + priorityStats.medium + priorityStats.low;
  const highPct = totalPriority > 0 ? (priorityStats.high / totalPriority) * 100 : 0;
  const medPct = totalPriority > 0 ? (priorityStats.medium / totalPriority) * 100 : 0;
  const lowPct = totalPriority > 0 ? (priorityStats.low / totalPriority) * 100 : 0;

  const highStroke = `${highPct} ${100 - highPct}`;
  const medStroke = `${medPct} ${100 - medPct}`;
  const lowStroke = `${lowPct} ${100 - lowPct}`;

  const highOffset = 0;
  const medOffset = 100 - highPct;
  const lowOffset = 100 - highPct - medPct;

  return (
    <AppLayout
      userEmail={session.email}
      userRole={session.role}
      isImpersonating={!!session.impersonatorId}
      totalTodosCount={totalCount}
      completedTodosCount={completedCount}
      userCategories={userCategories}
    >
      <main className="min-h-screen bg-zinc-50 dark:bg-[#070708] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans relative overflow-hidden pb-16">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-4xl relative z-10 py-12">
          <header className="mb-8 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-zinc-50 dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
              📈 개인 생산성 리포트
            </h1>
            <p className="text-sm text-zinc-500 mt-1">내가 생성한 할 일의 완결성 및 구조 통계를 시각적으로 제공합니다.</p>
          </header>

          {/* 통계 지표 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-lg">
              <span className="text-xs font-bold text-zinc-500">누적 등록 개수</span>
              <h2 className="text-3xl font-black text-zinc-900 dark:text-white mt-2 font-mono">{totalCount}개</h2>
            </div>
            <div className="p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-lg">
              <span className="text-xs font-bold text-zinc-500">완료한 목표 개수</span>
              <h2 className="text-3xl font-black text-emerald-500 mt-2 font-mono">{completedCount}개</h2>
            </div>
            <div className="p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-lg">
              <span className="text-xs font-bold text-zinc-500">목표 평균 달성률</span>
              <h2 className="text-3xl font-black text-blue-500 mt-2 font-mono">{completionRate}%</h2>
            </div>
          </div>

          {/* 그래프 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 우선순위 */}
            <div className="p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-lg flex flex-col justify-between">
              <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-4 flex items-center gap-1.5">
                📊 우선순위 집중도
              </h3>
              
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                <div className="relative w-36 h-36 shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(63, 63, 70, 0.2)" strokeWidth="3.5" />
                    {totalPriority > 0 && (
                      <>
                        {priorityStats.high > 0 && (
                          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="3.5" strokeDasharray={highStroke} strokeDashoffset={highOffset} />
                        )}
                        {priorityStats.medium > 0 && (
                          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="3.5" strokeDasharray={medStroke} strokeDashoffset={medOffset} />
                        )}
                        {priorityStats.low > 0 && (
                          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#71717a" strokeWidth="3.5" strokeDasharray={lowStroke} strokeDashoffset={lowOffset} />
                        )}
                      </>
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Total</span>
                    <span className="text-lg font-black text-zinc-900 dark:text-white font-mono">{totalPriority}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 flex-1 w-full max-w-[160px]">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <span className="text-zinc-500">높음</span>
                    </div>
                    <span className="text-zinc-800 dark:text-zinc-350">{priorityStats.high}개</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-550" />
                      <span className="text-zinc-500">보통</span>
                    </div>
                    <span className="text-zinc-800 dark:text-zinc-350">{priorityStats.medium}개</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-550" />
                      <span className="text-zinc-500">낮음</span>
                    </div>
                    <span className="text-zinc-800 dark:text-zinc-350">{priorityStats.low}개</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 카테고리 */}
            <div className="p-6 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-lg flex flex-col justify-between">
              <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-4 flex items-center gap-1.5">
                📊 선호 카테고리 TOP 5
              </h3>
              
              <div className="flex flex-col justify-center gap-3.5 flex-1 py-1">
                {categoryStats.length > 0 ? (
                  (() => {
                    const maxVal = Math.max(...categoryStats.map(c => c.count), 1);
                    return categoryStats.map((item, idx) => {
                      const widthPercent = `${(item.count / maxVal) * 100}%`;
                      const gradient = idx === 0
                        ? "from-blue-600 to-indigo-500"
                        : idx === 1
                        ? "from-purple-600 to-pink-500"
                        : "from-zinc-600 to-zinc-500";
                      return (
                        <div key={item.name} className="flex flex-col gap-1 text-xs">
                          <div className="flex justify-between font-semibold px-0.5">
                            <span className="text-zinc-650 dark:text-zinc-400">{item.name}</span>
                            <span className="text-zinc-550 font-mono font-bold">{item.count}개</span>
                          </div>
                          <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-950 rounded-full overflow-hidden p-[1px]">
                            <div style={{ width: widthPercent }} className={`h-full rounded-full bg-gradient-to-r ${gradient}`} />
                          </div>
                        </div>
                      );
                    });
                  })()
                ) : (
                  <div className="text-center py-12 text-xs text-zinc-500">지표가 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
