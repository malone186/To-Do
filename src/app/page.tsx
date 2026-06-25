import TodoListContainer from "@/components/TodoListContainer";
import { getTodos } from "@/app/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/login/actions";
import Link from "next/link";

// 캐시를 무효화하여 매 요청 시 데이터베이스에서 최신 데이터를 동적으로 새로 조회하도록 설정합니다.
export const revalidate = 0;

export default async function Home() {
  // 현재 로그인된 유저 세션 정보 파싱
  const session = await getSession();
  const userEmail = session?.email || "User";

  // 서버 사이드에서 직접 데이터베이스 쿼리를 수행해 초기 렌더링 성능을 극대화합니다.
  const res = await getTodos();

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-[#070708] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans relative overflow-hidden pb-16">
      {/* 백그라운드 그라데이션 구체 (글래스모피즘 무드 극대화) */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-purple-600/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        {/* 상단 툴바 영역 (사용자 정보 + 관리자 대시보드 + 로그아웃 + 테마 토글) */}
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50 flex items-center gap-3">
          <div className="hidden sm:block text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400">
            👤 {userEmail}
          </div>
          {session?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-xs px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 dark:text-purple-300 transition-all font-semibold shadow-sm cursor-pointer"
            >
              ⚙️ 관리자 대시보드
            </Link>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="text-xs px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all font-semibold shadow-sm cursor-pointer"
            >
              로그아웃
            </button>
          </form>
          <ThemeToggle />
        </div>

        {/* 헤더 영역 (Descriptive Title) */}
        <header className="py-12 text-center flex flex-col items-center">
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
  );
}
