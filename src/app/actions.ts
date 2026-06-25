"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 우선순위 타입 정의
export type Priority = "HIGH" | "MEDIUM" | "LOW";

// ToDo 데이터 생성에 필요한 입력 폼 타입 정의
export interface CreateTodoInput {
  title: string;
  description?: string;
  priority?: Priority;
  category?: string;
  dueDate?: string;
}

/**
 * 1. 전체 할 일 목록 조회 (Read)
 * - 시간 역순(createdAt DESC)으로 정렬하여 최근 추가된 내용이 상단에 배치되도록 합니다.
 */
export async function getTodos() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return { success: true, data: todos };
  } catch (error) {
    console.error("데이터베이스 조회 예외 발생:", error);
    return { success: false, error: "할 일 목록을 가져오는 데 실패했습니다." };
  }
}

/**
 * 2. 신규 할 일 생성 (Create)
 * - 방어적 프로그래밍을 통한 유효성 검사 (공백 검사 및 최대 글자 수 체크)
 */
export async function createTodo(input: CreateTodoInput) {
  try {
    const titleClean = input.title.trim();

    // 입력 데이터 검증 (Defensive Programming)
    if (!titleClean) {
      return { success: false, error: "할 일 제목은 필수 항목입니다." };
    }
    if (titleClean.length > 50) {
      return { success: false, error: "제목은 50자 이내로 입력해 주세요." };
    }

    // 마감 기한 파싱 처리
    const parsedDueDate = input.dueDate ? new Date(input.dueDate) : null;

    // SQLite에 신규 Todo 생성 적재
    const newTodo = await prisma.todo.create({
      data: {
        title: titleClean,
        description: input.description || null,
        priority: input.priority || "MEDIUM",
        category: input.category || "일반",
        dueDate: parsedDueDate,
        isCompleted: false,
      },
    });

    // Next.js App Router 캐시 무효화 -> 메인 화면 실시간 동기화 트리거
    revalidatePath("/");
    return { success: true, data: newTodo };
  } catch (error) {
    console.error("할 일 생성 중 데이터베이스 에러:", error);
    return { success: false, error: "할 일을 생성하는 도중 오류가 발생했습니다." };
  }
}

/**
 * 3. 할 일 완료 상태 토글 (Update Status)
 */
export async function toggleTodo(id: string, isCompleted: boolean) {
  try {
    if (!id) {
      return { success: false, error: "올바르지 않은 식별자입니다." };
    }

    const updatedTodo = await prisma.todo.update({
      where: { id },
      data: { isCompleted },
    });

    revalidatePath("/");
    return { success: true, data: updatedTodo };
  } catch (error) {
    console.error(`ID(${id}) 토글 작업 중 예외 발생:`, error);
    return { success: false, error: "상태 변경에 실패했습니다." };
  }
}

/**
 * 4. 할 일 내용 및 설정 변경 (Update Content)
 */
export async function updateTodo(
  id: string,
  input: {
    title: string;
    description?: string;
    priority?: Priority;
    category?: string;
    dueDate?: string;
  }
) {
  try {
    const titleClean = input.title.trim();
    if (!id) {
      return { success: false, error: "올바르지 않은 식별자입니다." };
    }
    if (!titleClean) {
      return { success: false, error: "수정할 할 일 제목은 필수 입력 사항입니다." };
    }
    if (titleClean.length > 50) {
      return { success: false, error: "제목은 50자 이내로 설정해 주세요." };
    }

    const parsedDueDate = input.dueDate ? new Date(input.dueDate) : null;

    const updatedTodo = await prisma.todo.update({
      where: { id },
      data: {
        title: titleClean,
        description: input.description || null,
        priority: input.priority || "MEDIUM",
        category: input.category || "일반",
        dueDate: parsedDueDate,
      },
    });

    revalidatePath("/");
    return { success: true, data: updatedTodo };
  } catch (error) {
    console.error(`ID(${id}) 업데이트 중 예외 발생:`, error);
    return { success: false, error: "할 일 정보 수정에 실패했습니다." };
  }
}

/**
 * 5. 할 일 삭제 (Delete)
 */
export async function deleteTodo(id: string) {
  try {
    if (!id) {
      return { success: false, error: "올바르지 않은 식별자입니다." };
    }

    await prisma.todo.delete({
      where: { id },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error(`ID(${id}) 삭제 중 에러 발생:`, error);
    return { success: false, error: "삭제 처리에 실패했습니다." };
  }
}

/**
 * 6. 완료된 항목 일괄 삭제 (Clear Completed)
 */
export async function clearCompleted() {
  try {
    const deleteResult = await prisma.todo.deleteMany({
      where: {
        isCompleted: true,
      },
    });

    revalidatePath("/");
    return { success: true, deletedCount: deleteResult.count };
  } catch (error) {
    console.error("완료 항목 일괄 제거 중 에러 발생:", error);
    return { success: false, error: "완료된 항목들을 지우지 못했습니다." };
  }
}
