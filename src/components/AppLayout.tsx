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
  userCategories?: string[];
}

export default function AppLayout({
  children,
  userEmail,
  userRole,
  isImpersonating = false,
  totalTodosCount = 0,
  completedTodosCount = 0,
  userCategories = [],
}: AppLayoutProps) {
  const pathname = usePathname();

  // 미니 진행도 계산
  const activeTodosCount = totalTodosCount - completedTodosCount;
  const completionRate = totalTodosCount > 0 ? Math.round((completedTodosCount / totalTodosCount) * 100) : 0;

  // 카테고리 디폴팅 처리 (중복 방지 및 청소)
  const categoriesClean = Array.from(new Set(userCategories.map(c => c.trim()).filter(Boolean)));

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-zinc-50 dark:bg-[#070708] text-zinc-900 dark:text-zinc-100 transition-colors duration-300">
      
      {/* 윈도우 스타일 사이드바 (데스크톱에서는 상시 고정 및 꽉 차게, 모바일은 탑바로) */}
      <aside className="w-full lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md sticky top-0 h-auto lg:h-screen flex flex-col justify-between py-6 lg:py-8 px-5 z-40 overflow-y-auto max-h-screen">
        
        {/* 상단 브랜딩 & 네비게이션 영역 */}
        <div className="flex flex-col gap-6 lg:gap-8">
          {/* 브랜드 대형 로고 */}
          <div className="flex items-center justify-between lg:justify-start lg:gap-3">
            <Link href="/" className="font-black text-lg tracking-wider uppercase bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
              ✅ Task Scheduler
            </Link>
            
            {/* 모바일 화면용 사용자 정보 */}
            <div className="lg:hidden text-xs font-bold px-3 py-1.5 rounded-full bg-zinc-200 dark:bg-zinc-900/80 text-zinc-650 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-800">
              👤 {userEmail.split('@')[0]}
            </div>
          </div>

          {/* 프로필 대형 카드 (데스크톱 전용) */}
          <div className="hidden lg:flex flex-col gap-2 p-4.5 rounded-2xl bg-zinc-100/60 dark:bg-zinc-900/60 border border-zinc-250/70 dark:border-zinc-800/80 relative overflow-hidden">
            {isImpersonating && (
              <div className="absolute top-0 right-0 w-3 h-3 rounded-full bg-amber-500 animate-ping" />
            )}
            <div className="text-[10px] text-zinc-450 dark:text-zinc-500 font-extrabold tracking-widest uppercase">Active User</div>
            <div className="text-sm font-black text-zinc-900 dark:text-zinc-100 truncate" title={userEmail}>
              👤 {userEmail}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase border ${
                userRole === "ADMIN" 
                  ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400"
              }`}>
                {userRole}
              </span>
              {isImpersonating && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-400 border border-amber-500/20 animate-pulse">
                  🛡️ 대행 로그인
                </span>
              )}
            </div>
          </div>

          {/* 메인 네비게이션 메뉴 그룹 (글자 크기 text-sm -> bold & 패딩 확장) */}
          <div className="flex flex-col gap-5">
            <div className="hidden lg:block text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold tracking-widest uppercase px-1">Menu</div>
            <nav className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full">
              <Link
                href="/"
                className={`w-full text-sm font-bold px-4 py-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                  pathname === "/"
                    ? "bg-blue-600/10 dark:bg-blue-600/10 border-blue-500/30 text-blue-500"
                    : "bg-transparent border-transparent text-zinc-500 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <span className="text-base">🏠</span>
                <span>할 일 관리 홈</span>
              </Link>

              <Link
                href="/calendar"
                className={`w-full text-sm font-bold px-4 py-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                  pathname === "/calendar"
                    ? "bg-blue-600/10 dark:bg-blue-600/10 border-blue-500/30 text-blue-500"
                    : "bg-transparent border-transparent text-zinc-500 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <span className="text-base">📅</span>
                <span>마감 캘린더</span>
              </Link>

              <Link
                href="/?filter=HIGH"
                className={`w-full text-sm font-bold px-4 py-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                  pathname === "/" && typeof window !== "undefined" && window.location.search.includes("filter=HIGH")
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-transparent border-transparent text-zinc-500 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <span className="text-base">🔥</span>
                <span>중요 할 일</span>
              </Link>

              <Link
                href="/analytics"
                className={`w-full text-sm font-bold px-4 py-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                  pathname === "/analytics"
                    ? "bg-blue-600/10 dark:bg-blue-600/10 border-blue-500/30 text-blue-500"
                    : "bg-transparent border-transparent text-zinc-500 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <span className="text-base">📈</span>
                <span>내 생산성 리포트</span>
              </Link>

              {userRole === "ADMIN" && (
                <Link
                  href="/admin"
                  className={`w-full text-sm font-bold px-4 py-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                    pathname.startsWith("/admin")
                      ? "bg-purple-500/10 dark:bg-purple-500/10 border-purple-500/30 text-purple-400"
                      : "bg-transparent border-transparent text-zinc-500 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-900/60 hover:text-zinc-800 dark:hover:text-zinc-200"
                  }`}
                >
                  <span className="text-base">⚙️</span>
                  <span>관리자 대시보드</span>
                </Link>
              )}
            </nav>
          </div>

          {/* 카테고리 모아보기 필터 리스트 (사이드바 공간 꽉 채우는 역할) */}
          <div className="hidden lg:flex flex-col gap-3">
            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-extrabold tracking-widest uppercase px-1">Categories</div>
            <div className="flex flex-col gap-1 max-h-[180px] overflow-y-auto pr-1">
              {categoriesClean.length > 0 ? (
                categoriesClean.map((cat) => (
                  <Link
                    key={cat}
                    href={`/?category=${encodeURIComponent(cat)}`}
                    className="text-xs font-semibold px-4 py-2.5 rounded-lg text-zinc-450 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-900/50 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all flex items-center justify-between border border-transparent hover:border-zinc-200 dark:hover:border-zinc-850"
                  >
                    <span>🏷️ {cat}</span>
                    <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-500">View</span>
                  </Link>
                ))
              ) : (
                <div className="text-xs text-zinc-650 italic pl-4 py-2">등록된 카테고리가 없습니다.</div>
              )}
            </div>
          </div>

        </div>

        {/* 하단 진척도 & 테마 토글 & 로그아웃 영역 */}
        <div className="flex flex-row lg:flex-col items-center lg:items-stretch justify-between lg:justify-start gap-4 pt-5 border-t border-zinc-200/80 dark:border-zinc-800/80 lg:mt-8">
          
          {/* 미니 진행도 게이지 (데스크톱 전용) */}
          {totalTodosCount > 0 && (
            <div className="hidden lg:flex flex-col gap-2.5 p-4 rounded-2xl bg-zinc-100/30 dark:bg-zinc-900/20 border border-zinc-200/50 dark:border-zinc-800/65 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                <span>내 할 일 달성도</span>
                <span className="font-mono text-blue-400">{completionRate}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden p-[1px]">
                <div
                  style={{ width: `${completionRate}%` }}
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                />
              </div>
              <div className="text-[10px] text-zinc-500 flex justify-between font-medium">
                <span>남음: {activeTodosCount}개</span>
                <span>완료: {completedTodosCount}개</span>
              </div>
            </div>
          )}

          {/* 테마 및 로그아웃 중합 제어부 (데스크톱 꽉 채우기) */}
          <div className="flex lg:flex-col items-center lg:items-stretch gap-3 w-auto lg:w-full justify-end lg:justify-start flex-1 lg:flex-none">
            <div className="flex items-center justify-between lg:px-2 w-auto lg:w-full">
              <span className="hidden lg:inline text-xs font-bold text-zinc-500">테마 전환</span>
              <ThemeToggle />
            </div>

            <form action={logout} className="w-auto lg:w-full">
              <button
                type="submit"
                className="text-sm px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all font-bold shadow-sm cursor-pointer w-full flex items-center justify-center gap-2.5"
              >
                <span>🚪</span>
                <span className="hidden lg:inline">세션 로그아웃</span>
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
