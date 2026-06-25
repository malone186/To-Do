"use client";

import React, { useState } from "react";

interface Todo {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate: string | Date | null;
  priority: string;
  category: string;
}

interface CalendarViewProps {
  initialTodos: Todo[];
}

export default function CalendarView({ initialTodos }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed (0=1월, 11=12월)

  // 이전 달, 다음 달 이동
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 해당 월의 첫 날과 마지막 날 계산
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0(일) ~ 6(토)
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // 캘린더 그리드를 위한 날짜 어레이 빌드
  const calendarCells: (number | null)[] = [];
  
  // 첫 주 시작 전 빈 칸 채우기
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(null);
  }
  
  // 실제 날짜 채우기
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(i);
  }

  // To-Do 필터링 유틸 (날짜 매칭)
  const getTodosForDate = (day: number) => {
    return initialTodos.filter(todo => {
      if (!todo.dueDate) return false;
      const d = new Date(todo.dueDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 shadow-xl backdrop-blur-md">
      
      {/* 캘린더 헤더 콘트롤부 */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-150 dark:border-zinc-800">
        <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
          {year}년 {month + 1}월
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-150 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-400 cursor-pointer font-bold transition-all text-xs"
          >
            ◀ 이전 달
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-150 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 font-bold transition-all text-xs cursor-pointer"
          >
            오늘
          </button>
          <button
            onClick={handleNextMonth}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-150 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-400 cursor-pointer font-bold transition-all text-xs"
          >
            다음 달 ▶
          </button>
        </div>
      </div>

      {/* 요일 헤더 그리드 */}
      <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-black text-zinc-500 uppercase tracking-wider">
        {weekDays.map((day, idx) => (
          <div key={day} className={idx === 0 ? "text-red-500" : idx === 6 ? "text-blue-500" : ""}>
            {day}
          </div>
        ))}
      </div>

      {/* 달력 본체 셀 그리드 (일정이 넘치는 경우 스크롤 처리) */}
      <div className="grid grid-cols-7 gap-2.5">
        {calendarCells.map((day, idx) => {
          if (day === null) {
            return (
              <div key={`empty-${idx}`} className="aspect-square bg-zinc-100/5 dark:bg-zinc-950/5 border border-transparent rounded-2xl" />
            );
          }

          const dateTodos = getTodosForDate(day);
          const isToday =
            new Date().getDate() === day &&
            new Date().getMonth() === month &&
            new Date().getFullYear() === year;

          return (
            <div
              key={`day-${day}`}
              className={`aspect-square p-2 border rounded-2xl flex flex-col justify-between overflow-hidden relative transition-all min-h-[95px] ${
                isToday
                  ? "bg-blue-500/5 border-blue-500 dark:border-blue-500/70 shadow-md shadow-blue-500/5"
                  : "bg-white dark:bg-zinc-950/20 border-zinc-200 dark:border-zinc-850 hover:border-zinc-500"
              }`}
            >
              {/* 날짜 번호 */}
              <span className={`text-xs font-bold font-mono ${
                isToday 
                  ? "text-blue-500 dark:text-blue-400 font-extrabold" 
                  : (idx % 7 === 0 ? "text-red-500" : idx % 7 === 6 ? "text-blue-500" : "text-zinc-850 dark:text-zinc-300")
              }`}>
                {day}
              </span>

              {/* 해당 일 마감 To-Do 리스트 */}
              <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto mt-1.5 pr-0.5 scrollbar-thin max-h-[60px]">
                {dateTodos.map(todo => (
                  <div
                    key={todo.id}
                    title={todo.title}
                    className={`text-[9px] px-1.5 py-0.5 rounded border leading-snug truncate font-bold shrink-0 ${
                      todo.isCompleted
                        ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 line-through"
                        : todo.priority === "HIGH"
                        ? "bg-red-500/10 border-red-500/20 text-red-400"
                        : todo.priority === "MEDIUM"
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                    }`}
                  >
                    {todo.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
