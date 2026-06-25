"use client";

import React, { useState } from "react";
import { createTodo, Priority } from "@/app/actions";

interface TodoFormProps {
  onAddSuccess?: (newTodo: any) => void;
}

export default function TodoForm({ onAddSuccess }: TodoFormProps) {
  // 상태 변수 정의
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false); // 상세 설정 아코디언 토글

  // 제출 처리 함수
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();

    // 1차 클라이언트 입력값 검증 (Defensive Programming)
    if (!cleanTitle) {
      setErrorMsg("할 일 제목을 입력해 주세요.");
      return;
    }
    if (cleanTitle.length > 50) {
      setErrorMsg("제목은 50자 이내로 입력해야 합니다.");
      return;
    }

    setIsPending(true);
    setErrorMsg(null);

    const res = await createTodo({
      title: cleanTitle,
      description: description.trim() || undefined,
      priority,
      category: category.trim() || undefined,
      dueDate: dueDate || undefined,
    });

    if (res.success) {
      // 폼 데이터 초기화
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setCategory("");
      setDueDate("");
      setShowAdvanceForm(false);
      onAddSuccess?.(res.data);
    } else {
      setErrorMsg(res.error || "할 일을 등록하는 데 실패했습니다.");
    }
    setIsPending(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-300 hover:border-zinc-700/50"
    >
      <div className="flex flex-col gap-4">
        {/* 기본 입력 라인 (제목 및 제출) */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errorMsg) setErrorMsg(null); // 타이핑 시 에러 메시지 감춤
            }}
            placeholder="새로운 할 일을 입력하세요... (예: 전공 과제 제출)"
            maxLength={50}
            disabled={isPending}
            className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
          />
          
          <button
            type="button"
            onClick={() => setShowAdvanceForm(!showAdvanceForm)}
            className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
              showAdvanceForm
                ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-700 text-zinc-800 dark:text-zinc-200"
                : "bg-zinc-900/50 border-zinc-200 dark:border-zinc-850 text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:bg-zinc-850"
            }`}
            title="상세 조건 설정"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
            </svg>
          </button>

          <button
            type="submit"
            disabled={isPending || !title.trim()}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/10 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            {isPending ? "추가 중..." : "추가"}
          </button>
        </div>

        {/* 에러 메시지 */}
        {errorMsg && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {/* 상세 조건 설정 드롭다운 아코디언 */}
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            showAdvanceForm ? "max-h-[350px] opacity-100 pt-2" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-4 border-t border-zinc-200 dark:border-zinc-800/60 pt-4">
            {/* 할 일 상세 메모 */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">상세 설명</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="해야 할 작업에 대한 부연설명을 기재해 주세요."
                rows={2}
                disabled={isPending}
                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-zinc-700 transition-all duration-200"
              />
            </div>

            {/* 메타데이터 세부 설정 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 1. 우선순위 셀렉트 */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">우선순위</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  disabled={isPending}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
                >
                  <option value="HIGH">🔴 높음</option>
                  <option value="MEDIUM">🟡 보통</option>
                  <option value="LOW">⚪ 낮음</option>
                </select>
              </div>

              {/* 2. 카테고리 입력 */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">카테고리</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="예: 과제, 개인, 운동"
                  maxLength={15}
                  disabled={isPending}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-zinc-700"
                />
              </div>

              {/* 3. 마감일 지정 */}
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">마감 기한</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isPending}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
