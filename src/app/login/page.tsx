"use client";

import { useActionState, useState } from "react";
import { login, signUp } from "./actions";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // React 19의 useActionState 훅 활용
  const [loginState, loginAction, isLoginPending] = useActionState(login, null);
  const [signupState, signupAction, isSignupPending] = useActionState(signUp, null);

  const errorMsg = activeTab === "login" ? loginState?.error : signupState?.error;
  const isPending = activeTab === "login" ? isLoginPending : isSignupPending;

  return (
    <main className="min-h-screen bg-[#070708] text-zinc-100 flex flex-col items-center justify-center font-sans relative overflow-hidden px-4">
      {/* 백그라운드 그라데이션 구체 */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* 헤더 타이틀 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-400 mb-4 tracking-wider uppercase">
            🔒 Secure Workspace
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Task Scheduler
          </h1>
          <p className="text-xs text-zinc-500 mt-2">
            개인 할 일 관리를 위한 시큐어 워크스페이스에 오신 것을 환영합니다.
          </p>
        </div>

        {/* 메인 로그인/회원가입 컨테이너 */}
        <div className="backdrop-blur-md bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl transition-all duration-300">
          {/* 탭 네비게이션 */}
          <div className="flex bg-zinc-950/60 p-1.5 rounded-2xl mb-8 border border-zinc-800/50">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeTab === "login"
                  ? "bg-zinc-800 text-white shadow-md shadow-black/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                activeTab === "signup"
                  ? "bg-zinc-800 text-white shadow-md shadow-black/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              회원가입
            </button>
          </div>

          {/* 에러 메시지 표시 */}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400 text-center animate-shake">
              {errorMsg}
            </div>
          )}

          {/* 로그인 폼 */}
          {activeTab === "login" && (
            <form action={loginAction} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">사용자 ID (또는 이메일)</label>
                <input
                  type="text"
                  name="email"
                  required
                  placeholder="아이디 입력"
                  className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">비밀번호</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-2xl shadow-lg shadow-blue-900/10 transition-all duration-200 hover:scale-[1.01]"
              >
                {isPending ? "로그인 중..." : "로그인 완료"}
              </button>
            </form>
          )}

          {/* 회원가입 폼 */}
          {activeTab === "signup" && (
            <form action={signupAction} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">사용자 ID</label>
                <input
                  type="text"
                  name="email"
                  required
                  placeholder="아이디 입력"
                  className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">비밀번호 (4자 이상)</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">비밀번호 확인</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-zinc-950/50 border border-zinc-800/80 rounded-2xl text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-2xl shadow-lg shadow-purple-900/10 transition-all duration-200 hover:scale-[1.01]"
              >
                {isPending ? "계정 생성 중..." : "회원가입 완료"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
