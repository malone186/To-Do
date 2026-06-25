"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  const handleSelect = (selectedTheme: string) => {
    setTheme(selectedTheme);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors shadow-sm"
        aria-label="테마 설정 열기"
      >
        <Sun className="h-5 w-5 transition-all scale-100 rotate-0 dark:scale-0 dark:-rotate-90 absolute" />
        <Moon className="h-5 w-5 transition-all scale-0 rotate-90 dark:scale-100 dark:rotate-0 absolute" />
      </button>

      {/* 모달 오버레이 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">테마 설정</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                닫기
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* 라이트 모드 미리보기 카드 */}
              <button
                onClick={() => handleSelect('light')}
                className={`flex flex-col items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                  theme === 'light' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' 
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="w-full h-20 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col p-2 gap-1.5 overflow-hidden">
                  <div className="w-full h-3 bg-white rounded shadow-sm border border-zinc-100"></div>
                  <div className="w-2/3 h-2 bg-zinc-200 rounded"></div>
                  <div className="w-1/2 h-2 bg-zinc-200 rounded"></div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  <Sun className="w-4 h-4" /> 라이트
                </div>
              </button>

              {/* 다크 모드 미리보기 카드 */}
              <button
                onClick={() => handleSelect('dark')}
                className={`flex flex-col items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                  theme === 'dark' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' 
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="w-full h-20 rounded-xl bg-[#0a0a0a] border border-zinc-800 flex flex-col p-2 gap-1.5 overflow-hidden">
                  <div className="w-full h-3 bg-zinc-900 rounded border border-zinc-800"></div>
                  <div className="w-2/3 h-2 bg-zinc-800 rounded"></div>
                  <div className="w-1/2 h-2 bg-zinc-800 rounded"></div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  <Moon className="w-4 h-4" /> 다크
                </div>
              </button>

              {/* 시스템 모드 미리보기 카드 */}
              <button
                onClick={() => handleSelect('system')}
                className={`flex flex-col items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                  theme === 'system' 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' 
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="w-full h-20 rounded-xl bg-gradient-to-br from-zinc-50 to-[#0a0a0a] border border-zinc-300 dark:border-zinc-700 flex flex-col p-2 gap-1.5 overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-[1px]">
                     <Monitor className="w-6 h-6 text-zinc-500 dark:text-zinc-400 opacity-50" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  <Monitor className="w-4 h-4" /> 시스템
                </div>
              </button>
            </div>
            
            <p className="text-xs text-center text-zinc-500 mt-6">
              선택한 테마는 브라우저에 저장되어 다음 접속 시에도 유지됩니다.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
