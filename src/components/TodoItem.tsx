"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import { toggleTodo, deleteTodo, updateTodo, Priority } from "@/app/actions";
import confetti from "canvas-confetti";

// ToDo 데이터 객체의 타입 정의 (Prisma 스키마와 1:1 대응)
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
}

interface TodoItemProps {
  todo: Todo;
  onStatusChange?: (id: string, isCompleted: boolean) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, updatedTodo: any) => void;
}

export default function TodoItem({ todo, onStatusChange, onDelete, onUpdate }: TodoItemProps) {
  // 상태 변수 정의
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(todo.title);
  const [editedDesc, setEditedDesc] = useState(todo.description || "");
  const [editedPriority, setEditedPriority] = useState<Priority>(todo.priority as Priority);
  const [editedCategory, setEditedCategory] = useState(todo.category);
  const [editedDueDate, setEditedDueDate] = useState(
    todo.dueDate ? new Date(todo.dueDate).toISOString().split("T")[0] : ""
  );
  const [isOpenDetails, setIsOpenDetails] = useState(false); // 상세 내용 아코디언 토글
  const [isPending, startTransition] = useTransition(); // React 19 트랜지션을 이용한 펜딩 처리
  const [showConfirm, setShowConfirm] = useState(false); // 커스텀 삭제 확인 모달 상태

  const inputRef = useRef<HTMLInputElement>(null);

  // 수정 상태 진입 시 포커스 강제 이동
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // 상위 컴포넌트 등에서 todo prop이 동적으로 변경될 때 로컬 상태 싱크로나이즈
  useEffect(() => {
    setEditedTitle(todo.title);
    setEditedDesc(todo.description || "");
    setEditedPriority(todo.priority as Priority);
    setEditedCategory(todo.category);
    setEditedDueDate(
      todo.dueDate ? new Date(todo.dueDate).toISOString().split("T")[0] : ""
    );
  }, [todo]);

  // 1. 완료 상태 체크 토글 처리
  const handleToggle = () => {
    const newStatus = !todo.isCompleted;
    
    // 완료 상태로 변경될 때만 폭죽 효과 발생
    if (newStatus) {
      confetti({
        particleCount: 130,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        zIndex: 9999
      });
    }

    startTransition(async () => {
      const res = await toggleTodo(todo.id, newStatus);
      if (res.success) {
        onStatusChange?.(todo.id, newStatus);
      } else {
        alert(res.error || "상태 변경 도중 에러가 발생했습니다.");
      }
    });
  };

  // 2. 삭제 처리 (커스텀 컨펌 모달 활성화)
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // 아코디언 토글 방지
    setShowConfirm(true);
  };

  // 실제 데이터베이스 삭제 트랜지션 실행
  const handleConfirmDelete = () => {
    startTransition(async () => {
      const res = await deleteTodo(todo.id);
      if (res.success) {
        onDelete?.(todo.id);
      } else {
        alert(res.error || "삭제에 실패했습니다.");
      }
      setShowConfirm(false);
    });
  };

  // 3. 수정 저장 처리
  const handleSave = () => {
    const cleanTitle = editedTitle.trim();
    if (!cleanTitle) {
      alert("할 일 제목을 입력해 주세요.");
      return;
    }

    startTransition(async () => {
      const res = await updateTodo(todo.id, {
        title: cleanTitle,
        description: editedDesc || undefined,
        priority: editedPriority,
        category: editedCategory || undefined,
        dueDate: editedDueDate || undefined,
      });

      if (res.success) {
        setIsEditing(false);
        onUpdate?.(todo.id, res.data);
      } else {
        alert(res.error || "수정 사항 저장에 실패했습니다.");
      }
    });
  };

  // Esc 키를 누르면 수정을 취소하는 키 바인딩
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditedTitle(todo.title); // 원래 값으로 복원
    }
  };

  // 우선순위별 스타일 매핑 헬퍼 함수
  const getPriorityStyle = (priorityStr: string) => {
    switch (priorityStr) {
      case "HIGH":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20";
    }
  };

  // 마감 기한 포맷팅 헬퍼 함수
  const formatDueDate = (dateObj: Date | null) => {
    if (!dateObj) return null;
    const date = new Date(dateObj);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

  return (
    <>
      {/* 카드 실제 렌더링 엘리먼트 */}
      <div
        onClick={() => setIsOpenDetails(true)}
        className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer ${
          todo.isCompleted
            ? "bg-zinc-100/40 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800/50 opacity-60"
            : "bg-white dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-700/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-0.5"
        } ${isPending ? "pointer-events-none select-none opacity-50" : ""}`}
      >
        {/* 글래스모피즘 광원 효과 가상 요소 */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-zinc-800/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* 커스텀 삭제 확인 오버레이 */}
        {showConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-between bg-zinc-950/95 backdrop-blur-md px-5 py-4 transition-all duration-200">
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">이 할 일을 정말 삭제할까요?</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate max-w-[180px] sm:max-w-[280px]">"{todo.title}"</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm(false);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmDelete();
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 transition-colors cursor-pointer"
              >
                삭제
              </button>
            </div>
          </div>
        )}

        {/* 핵심 할 일 헤더 행 */}
        <div className="flex items-center justify-between p-5 gap-4">
          <div className="flex items-center gap-4 flex-1">
            {/* 완료 토글용 체크박스 커스텀 디자인 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              type="button"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 cursor-pointer ${
                todo.isCompleted
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "border-zinc-700 hover:border-zinc-500 hover:bg-white dark:bg-zinc-900"
              }`}
            >
              {todo.isCompleted && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  stroke="currentColor"
                  className="h-4.5 w-4.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </button>

            {/* 제목 렌더링 영역 */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2.5">
                <span
                  className={`text-sm font-semibold truncate transition-all duration-300 ${
                    todo.isCompleted
                      ? "line-through text-zinc-500 dark:text-zinc-400 decoration-zinc-600 decoration-2"
                      : "text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {todo.title}
                </span>

                {/* 카테고리 칩 */}
                {todo.category && (
                  <span className="text-[10px] w-fit px-2 py-0.5 rounded-md bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-850 shrink-0">
                    {todo.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 뱃지 및 액션 컨트롤러 영역 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 우선순위 배지 */}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityStyle(todo.priority)}`}>
              {todo.priority === "HIGH" ? "높음" : todo.priority === "MEDIUM" ? "보통" : "낮음"}
            </span>

            {/* 마감 기한 */}
            {todo.dueDate && (
              <span className="hidden md:inline-flex text-[10px] items-center gap-1 text-zinc-500 dark:text-zinc-400 font-mono">
                {formatDueDate(todo.dueDate)}
              </span>
            )}

            {/* 삭제 컨트롤 */}
            <div className="flex items-center gap-1">
              {/* 삭제 버튼 */}
              <button
                onClick={handleDelete}
                type="button"
                className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="삭제하기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 상세 보기 및 수정 모달 팝업 (형제 노드로 완전히 분리하여 이벤트 버블링 차단) */}
      {isOpenDetails && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md p-4 animate-fade-in text-left"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpenDetails(false);
            setIsEditing(false); // 닫을 때 편집 모드 자동 해제
          }}
        >
          {/* 모달 내용 박스 */}
          <div 
            className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl z-10 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()} // 클릭 이벤트 상위 버블링 방지
          >
            {isEditing ? (
              // 1. 모달 내 수정 폼 모드
              <div className="flex flex-col gap-4">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">할 일 정보 수정</h3>
                
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">할 일 제목</label>
                  <input
                    ref={inputRef}
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    maxLength={50}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">상세 설명</label>
                  <textarea
                    value={editedDesc}
                    onChange={(e) => setEditedDesc(e.target.value)}
                    placeholder="추가 부연설명을 입력하세요."
                    rows={3}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl p-3 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-700 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">우선순위</label>
                    <select
                      value={editedPriority}
                      onChange={(e) => setEditedPriority(e.target.value as Priority)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-2.5 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
                    >
                      <option value="HIGH">높음</option>
                      <option value="MEDIUM">보통</option>
                      <option value="LOW">낮음</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">카테고리</label>
                    <input
                      type="text"
                      value={editedCategory}
                      onChange={(e) => setEditedCategory(e.target.value)}
                      placeholder="과제, 개인 등"
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-2.5 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">마감 기한</label>
                    <input
                      type="date"
                      value={editedDueDate}
                      onChange={(e) => setEditedDueDate(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-2.5 py-2 text-sm text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedTitle(todo.title); // 원래 값으로 복원
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-colors cursor-pointer"
                  >
                    저장하기
                  </button>
                </div>
              </div>
            ) : (
              // 2. 모달 내 상세 보기 모드
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  {/* 카테고리 */}
                  {todo.category && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
                      {todo.category}
                    </span>
                  )}
                  {/* 우선순위 */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getPriorityStyle(todo.priority)}`}>
                    우선순위: {todo.priority === "HIGH" ? "높음" : todo.priority === "MEDIUM" ? "보통" : "낮음"}
                  </span>
                  {/* 완료 여부 */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${todo.isCompleted ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>
                    {todo.isCompleted ? "완료됨" : "진행 중"}
                  </span>
                </div>

                <h2 className={`text-lg font-bold leading-snug ${todo.isCompleted ? "line-through text-zinc-500 dark:text-zinc-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                  {todo.title}
                </h2>

                <div className="border-t border-zinc-200 dark:border-zinc-800/60 my-0.5" />

                <div className="flex flex-col gap-1.5">
                  <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">상세 설명</h4>
                  <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-4 min-h-[90px] max-h-[180px] overflow-y-auto">
                    {todo.description ? (
                      <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{todo.description}</p>
                    ) : (
                      <p className="text-xs sm:text-sm text-zinc-600 italic">등록된 상세 설명이 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 메타 인포 */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] text-zinc-500 dark:text-zinc-400 border-t border-zinc-800/40 font-medium">
                  <div>
                    <strong>마감 기한:</strong> {todo.dueDate ? formatDueDate(todo.dueDate) : "없음"}
                  </div>
                  <div>
                    <strong>등록 시간:</strong> {new Date(todo.createdAt).toLocaleString("ko-KR")}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsOpenDetails(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    닫기
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      수정하기
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowConfirm(true);
                      }}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 transition-colors cursor-pointer"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
