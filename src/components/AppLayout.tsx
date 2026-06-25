"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { logout } from "@/app/login/actions";

interface AppLayoutProps {
  children: React.ReactNode;
  userEmail: string;
  userRole: string;
  isImpersonating?: boolean;
  totalTodosCount?: number;
  completedTodosCount?: number;
}

export default function AppLayout({
  children,
  userEmail,
  userRole,
  isImpersonating = false,
  totalTodosCount = 0,
  completedTodosCount = 0,
}: AppLayoutProps) {
  const pathname = usePathname();

  // 미니 진행도 계산
  const activeTodosCount = totalTodosCount - completedTodosCount;
  const completionRate = totalTodosCount > 0 ? Math.round((completedTodosCount / totalTodosCount) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-zinc-50 dark:bg-[#070708] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      {/* 사이드바 / 상단 탑바 (반응형 대응) */}
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/20 backdrop-blur-md sticky top-0 h-auto lg:h-screen flex flex-col justify-between py-4 lg:py-6 px-4 z-40">
        
        {/* 상단 브랜딩 & 네비게이션 영역 */}
        <div className="flex flex-col gap-4 lg:gap-6">
          {/* 모바일 대응 브랜드 로고 헤더 */}
          <div className="flex items-center justify-between lg:justify-start lg:gap-2">
            <Link href="/" className="font-extrabold text-sm tracking-wider uppercase bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
              ✅ Task Scheduler
            </Link>
            
            {/* 모바일 화면용 간단 이메일 표시 */}
            <div className="lg:hidden text-[10px] font-semibold px-2.5 py-1 rounded-full bg-zinc-200 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400">
              👤 {userEmail.split('@')[0]}
            </div>
          </div>

          {/* 프로필 카드 (데스크톱 전용) */}
          <div className="hidden lg:flex flex-col gap-1.5 p-3.5 rounded-2xl bg-zinc-100/50 dark:bg-zinc-900/60 border border-zinc-200/50 dark:border-zinc-800/50 relative overflow-hidden">
            {isImpersonating && (
              <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold tracking-wide uppercase">Active User</div>
            <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate" title={userEmail}>
              👤 {userEmail}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                userRole === "ADMIN" 
                  ? "bg-purple-500/10 border border-purple-500/20 text-purple-400"
                  : "bg-zinc-800 border border-zinc-700 text-zinc-400"
              }`}>
                {userRole}
              </span>
              {isImpersonating && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                  🛡️ 대행 중
                </span>
              )}
            </div>
          </div>

          {/* 메뉴 리스트 */}
          <nav className="flex flex-row lg:flex-col gap-1.5 lg:w-full">
            <Link
              href="/"
              className={`flex-1 lg:flex-initial text-xs font-semibold px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center lg:justify-start gap-2 ${
                pathname === "/"
                  ? "bg-blue-600/10 dark:bg-blue-600/10 border-blue-500/20 text-blue-500 font-bold"
                  : "bg-transparent border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <span>🏠</span>
              <span>할 일 관리 홈</span>
            </Link>

            {userRole === "ADMIN" && (
              <Link
                href="/admin"
                className={`flex-1 lg:flex-initial text-xs font-semibold px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center lg:justify-start gap-2 ${
                  pathname.startsWith("/admin")
                    ? "bg-purple-500/10 dark:bg-purple-500/10 border-purple-500/20 text-purple-400 font-bold"
                    : "bg-transparent border-transparent text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <span>⚙️</span>
                <span>관리자 대시보드</span>
              </Link>
            )}
          </nav>
        </div>

        {/* 하단 진척도 & 테마 토글 & 로그아웃 영역 */}
        <div className="flex flex-row lg:flex-col items-center lg:items-stretch justify-between lg:justify-start gap-3 pt-3 lg:pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60 lg:mt-6">
          
          {/* 미니 진행도 게이지 (데스크톱 전용) */}
          {totalTodosCount > 0 && (
            <div className="hidden lg:flex flex-col gap-2 p-3.5 rounded-2xl bg-zinc-100/30 dark:bg-zinc-900/20 border border-zinc-200/40 dark:border-zinc-800/40">
              <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500">
                <span>오늘 진척률</span>
                <span className="font-mono text-blue-400">{completionRate}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  style={{ width: `${completionRate}%` }}
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                />
              </div>
              <div className="text-[9px] text-zinc-500 mt-0.5">
                남음: {activeTodosCount}개 / 완료: {completedTodosCount}개
              </div>
            </div>
          )}

          {/* 테마 및 로그아웃 중합 제어부 */}
          <div className="flex lg:flex-col items-center lg:items-stretch gap-3 w-auto lg:w-full justify-end lg:justify-start flex-1 lg:flex-none">
            <div className="flex items-center justify-between lg:px-1.5 w-auto lg:w-full">
              <span className="hidden lg:inline text-[10px] font-semibold text-zinc-500">화면 테마</span>
              <ThemeToggle />
            </div>

            <form action={logout} className="w-auto lg:w-full">
              <button
                type="submit"
                className="text-xs px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800/80 text-zinc-650 dark:text-zinc-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all font-semibold shadow-sm cursor-pointer w-full flex items-center justify-center gap-1.5"
              >
                <span>🚪</span>
                <span className="hidden lg:inline">로그아웃</span>
              </button>
            </form>
          </div>

        </div>

      </aside>

      {/* 우측 메인 콘텐츠 영역 */}
      <main className="flex-1 min-h-screen relative overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
