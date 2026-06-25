"use client";

import React, { useState } from "react";
import TodoForm from "./TodoForm";
import TodoItem from "./TodoItem";
import { clearCompleted } from "@/app/actions";

// ToDo 아이템 타입 정의
interface Todo {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  priority: string;
  category: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user?: { email: string } | null;
}

interface TodoListContainerProps {
  initialTodos: Todo[];
}

type FilterType = "ALL" | "ACTIVE" | "COMPLETED";

export default function TodoListContainer({ initialTodos }: TodoListContainerProps) {
  // 클라이언트 내부 상태 관리
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  // 1. 이벤트 핸들러: 신규 할 일 성공 추가 시 로컬 상태 업데이트
  const handleAddSuccess = (newTodo: Todo) => {
    // 최상단에 새 할 일 추가
    setTodos((prev) => [newTodo, ...prev]);
  };

  // 2. 이벤트 핸들러: 개별 ToDo 상태 토글 콜백
  const handleStatusChange = (id: string, isCompleted: boolean) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isCompleted, updatedAt: new Date() } : t))
    );
  };

  // 3. 이벤트 핸들러: 개별 ToDo 내용 수정 저장 콜백
  const handleUpdate = (id: string, updatedTodo: Todo) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? updatedTodo : t)));
  };

  // 4. 이벤트 핸들러: 개별 ToDo 삭제 성공 콜백
  const handleDelete = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // 5. 완료 항목 일괄 삭죄 처리
  const handleClearCompleted = async () => {
    const completedCount = todos.filter((t) => t.isCompleted).length;
    if (completedCount === 0) return;

    if (typeof window !== "undefined" && window.confirm(`정말로 완료된 ${completedCount}개의 항목을 일괄 삭제하시겠습니까?`)) {
      setIsClearing(true);
      const res = await clearCompleted();
      if (res.success) {
        setTodos((prev) => prev.filter((t) => !t.isCompleted));
      } else {
        alert(res.error || "일괄 삭제 처리에 실패했습니다.");
      }
      setIsClearing(false);
    }
  };

  // 할 일 통계 데이터 연산
  const totalCount = todos.length;
  const completedCount = todos.filter((t) => t.isCompleted).length;
  const activeCount = totalCount - completedCount;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 필터 및 검색어 필터링 파이프라인
  const filteredTodos = todos.filter((todo) => {
    // 1. 카테고리 필터링
    const matchesFilter =
      filter === "ALL" ||
      (filter === "ACTIVE" && !todo.isCompleted) ||
      (filter === "COMPLETED" && todo.isCompleted);

    // 2. 검색어 필터링 (제목 및 설명 검색)
    const titleMatch = todo.title.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = todo.description
      ? todo.description.toLowerCase().includes(searchQuery.toLowerCase())
      : false;
    const categoryMatch = todo.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = titleMatch || descMatch || categoryMatch;

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* 1. 상단 진척도 통계 바 (Progress Card) */}
      <div className="bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.2)]">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">오늘의 진척률</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              전체 {totalCount}개 중 {completedCount}개 완료 ({activeCount}개 진행 중)
            </p>
          </div>
          <span className="text-2xl font-black text-blue-400 font-mono">{completionRate}%</span>
        </div>

        {/* 게이지 바 배경 */}
        <div className="h-2.5 w-full bg-white dark:bg-zinc-900 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-850">
          {/* 게이지 실선 (동적 가로폭 및 색상 변화 적용) */}
          <div
            style={{ width: `${completionRate}%` }}
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              completionRate === 100
                ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                : "bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
            }`}
          />
        </div>
      </div>

      {/* 2. 할 일 입력 폼 */}
      <TodoForm onAddSuccess={handleAddSuccess} />

      {/* 3. 리스트 유틸리티 바 (필터 탭 및 실시간 검색 인풋) */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/60 rounded-2xl p-4">
        {/* 필터 탭 */}
        <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl w-full md:w-auto">
          {(["ALL", "ACTIVE", "COMPLETED"] as FilterType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                filter === tab
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {tab === "ALL" ? "전체" : tab === "ACTIVE" ? "해야 할 일" : "완료됨"}
            </button>
          ))}
        </div>

        {/* 검색 및 일괄 삭제 */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 md:justify-end">
          {/* 검색 아이콘 인풋 */}
          <div className="relative flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 dark:text-zinc-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목, 설명, 카테고리 검색..."
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-zinc-700 dark:text-zinc-300 placeholder-zinc-550 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            />
          </div>

          {/* 일괄 삭제 */}
          {completedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              disabled={isClearing}
              className="px-4 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-semibold text-xs transition-colors cursor-pointer shrink-0 disabled:opacity-40"
            >
              완료 청소
            </button>
          )}
        </div>
      </div>

      {/* 4. 칸반 보드 렌더링 영역 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* 대기 중 컬럼 */}
        <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4.5 flex flex-col gap-4 min-h-[500px]">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/60 pb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">📋</span>
              <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">대기 중</h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 font-mono font-bold">
              {filteredTodos.filter((t) => !t.isCompleted && t.priority !== "HIGH").length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {filteredTodos.filter((t) => !t.isCompleted && t.priority !== "HIGH").length > 0 ? (
              filteredTodos
                .filter((t) => !t.isCompleted && t.priority !== "HIGH")
                .map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                ))
            ) : (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl text-xs text-zinc-650">
                대기 중인 일정이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 우선 진행 컬럼 */}
        <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4.5 flex flex-col gap-4 min-h-[500px]">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/60 pb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">🔥</span>
              <h3 className="text-sm font-bold text-red-400">우선 진행</h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-950/15 text-red-400 font-mono font-bold">
              {filteredTodos.filter((t) => !t.isCompleted && t.priority === "HIGH").length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {filteredTodos.filter((t) => !t.isCompleted && t.priority === "HIGH").length > 0 ? (
              filteredTodos
                .filter((t) => !t.isCompleted && t.priority === "HIGH")
                .map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                ))
            ) : (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl text-xs text-zinc-650">
                우선순위가 높은 일정이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 완료 컬럼 */}
        <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-900 rounded-2xl p-4.5 flex flex-col gap-4 min-h-[500px]">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/60 pb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">✅</span>
              <h3 className="text-sm font-bold text-emerald-400">완료됨</h3>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/15 text-emerald-400 font-mono font-bold">
              {filteredTodos.filter((t) => t.isCompleted).length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {filteredTodos.filter((t) => t.isCompleted).length > 0 ? (
              filteredTodos
                .filter((t) => t.isCompleted)
                .map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                ))
            ) : (
              <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-900 rounded-xl text-xs text-zinc-650">
                완료된 일정이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
