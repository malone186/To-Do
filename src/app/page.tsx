import TodoListContainer from "@/components/TodoListContainer";
import { getTodos } from "@/app/actions";
import { getSession } from "@/lib/auth";
import AppLayout from "@/components/AppLayout";
import { getNotices, stopImpersonate } from "@/app/admin/adminActions";

// 캐시를 무효화하여 매 요청 시 데이터베이스에서 최신 데이터를 동적으로 새로 조회하도록 설정합니다.
export const revalidate = 0;

export default async function Home() {
  // 현재 로그인된 유저 세션 정보 파싱
  const session = await getSession();
  const userEmail = session?.email || "User";
  const isImpersonating = !!session?.impersonatorId;

  // 대행 복귀 래퍼 Server Action (TypeScript 호환용)
  const handleStopImpersonate = async () => {
    "use server";
    await stopImpersonate();
  };

  // 서버 사이드에서 직접 데이터베이스 쿼리를 수행해 초기 렌더링 성능을 극대화합니다.
  const res = await getTodos();

  // 최신 시스템 공지 로드
  const noticeRes = await getNotices();
  const latestNotice = noticeRes.success && noticeRes.data && noticeRes.data.length > 0
    ? noticeRes.data[0]
    : null;

  // 사이드바 진척도용 개수 계산
  const todosList = res.success && res.data ? res.data : [];
  const totalCount = todosList.length;
  const completedCount = todosList.filter((t: any) => t.isCompleted).length;

  return (
    <AppLayout
      userEmail={userEmail}
      userRole={session?.role || "USER"}
      isImpersonating={isImpersonating}
      totalTodosCount={totalCount}
      completedTodosCount={completedCount}
    >
      <main className="min-h-screen bg-zinc-50 dark:bg-[#070708] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans relative overflow-hidden pb-16">
        {/* 1. 권한 대행 로그인 경보 배너 */}
        {isImpersonating && (
          <div className="w-full bg-amber-500/90 backdrop-blur-md text-white text-xs font-bold py-2.5 px-4 flex items-center justify-between z-50 shadow-md">
            <div className="flex items-center gap-2">
              <span>🛡️ [권한 대행 중] 관리자 권한으로 '{userEmail}' 유저의 계정을 시뮬레이션하고 있습니다.</span>
            </div>
            <form action={handleStopImpersonate}>
              <button 
                type="submit" 
                className="px-3.5 py-1 bg-white text-amber-700 hover:bg-zinc-100 rounded-xl font-bold transition-all shadow-sm cursor-pointer"
              >
                어드민으로 복귀
              </button>
            </form>
          </div>
        )}

        {/* 백그라운드 그라데이션 구체 (글래스모피즘 무드 극대화) */}
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
        <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-600/5 blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          {/* 헤더 영역 (Descriptive Title & Notice Banner) */}
          <header className="py-12 text-center flex flex-col items-center">
            {/* 시스템 공지사항 노출 배너 */}
            {latestNotice && (
              <div className="w-full max-w-xl mb-8 p-4 rounded-2xl bg-white/60 dark:bg-zinc-900/40 border border-blue-500/10 dark:border-blue-500/20 text-left shadow-lg backdrop-blur-md relative overflow-hidden animate-fade-in">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500/5 blur-2xl pointer-events-none" />
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold tracking-wider uppercase">System Notice</span>
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">{latestNotice.title}</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed pl-1">
                  {latestNotice.content}
                </p>
              </div>
            )}

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-4 tracking-wider uppercase">
              💻 CS Project Workspace
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-zinc-50 dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
              Task Scheduler
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-md">
              Next.js Server Actions와 로컬 SQLite 데이터베이스를 연동한 모던 할 일 관리 솔루션입니다.
            </p>
          </header>

          {/* ToDo 리스트 렌더링 (예외 및 방어적 프로그래밍 적용) */}
          {res.success && res.data ? (
            <TodoListContainer initialTodos={res.data as any} />
          ) : (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-md mx-auto">
              <h3 className="text-sm font-bold text-red-400">데이터 로딩 에러</h3>
              <p className="text-xs text-red-300 mt-1">{res.error || "할 일을 불러오는 도중 오류가 발생했습니다."}</p>
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
