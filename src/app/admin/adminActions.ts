"use server";

import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

/**
 * 관리자 권한 검증 내부 유틸
 */
async function verifyAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { isAuthorized: false, error: "관리자 권한이 없거나 세션이 만료되었습니다.", session };
  }
  return { isAuthorized: true, session };
}

/**
 * 1. 전체 회원 목록 조회
 */
export async function getAllUsers() {
  const auth = await verifyAdmin();
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error };
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: { todos: true },
        },
      },
    });

    return {
      success: true,
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        todoCount: user._count.todos,
      })),
    };
  } catch (error) {
    console.error("회원 목록 조회 중 예외 발생:", error);
    return { success: false, error: "회원 목록을 가져오지 못했습니다." };
  }
}

/**
 * 2. 신규 회원 직접 등록
 */
export async function adminAddUser(formData: FormData) {
  const auth = await verifyAdmin();
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error };
  }

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!email || !password || !role) {
    return { success: false, error: "모든 필드를 채워주세요." };
  }

  const usernameClean = email.trim();
  if (usernameClean.length < 2) {
    return { success: false, error: "아이디는 최소 2자 이상이어야 합니다." };
  }
  if (usernameClean.includes(" ")) {
    return { success: false, error: "아이디에는 공백을 포함할 수 없습니다." };
  }

  if (password.length < 4) {
    return { success: false, error: "비밀번호는 최소 4자 이상으로 설정해 주세요." };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "이미 등록된 이메일 주소입니다." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("어드민 회원 추가 중 에러:", error);
    return { success: false, error: "회원 추가 등록에 실패했습니다." };
  }
}

/**
 * 3. 회원 정보 편집 (이메일, 역할, 선택적 비밀번호 재설정)
 */
export async function adminUpdateUser(
  userId: string,
  data: { email: string; role: string; password?: string }
) {
  const auth = await verifyAdmin();
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error };
  }

  if (!userId || !data.email || !data.role) {
    return { success: false, error: "필수 정보가 누락되었습니다." };
  }

  try {
    const usernameClean = data.email.trim();
    if (usernameClean.length < 2) {
      return { success: false, error: "수정할 아이디는 최소 2자 이상이어야 합니다." };
    }
    if (usernameClean.includes(" ")) {
      return { success: false, error: "아이디에는 공백을 포함할 수 없습니다." };
    }

    // 본인의 역할(Role)을 어드민이 아닌 일반 사용자로 셀프 강등하는 것을 방어
    if (auth.session?.userId === userId && data.role !== "ADMIN") {
      return { success: false, error: "본인의 어드민 권한은 강등할 수 없습니다." };
    }

    // 이메일 중복 체크 (본인 이메일이 아닌 경우만)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: { id: userId },
      },
    });

    if (existingUser) {
      return { success: false, error: "이미 사용 중인 이메일 주소입니다." };
    }

    const updateData: any = {
      email: data.email,
      role: data.role,
    };

    // 비밀번호 필드가 존재하고 공백이 아니면 해싱하여 업데이트 적용
    if (data.password && data.password.trim() !== "") {
      if (data.password.length < 4) {
        return { success: false, error: "변경할 비밀번호는 최소 4자 이상이어야 합니다." };
      }
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("어드민 회원 편집 중 에러:", error);
    return { success: false, error: "회원 정보 수정 처리에 실패했습니다." };
  }
}

/**
 * 4. 회원 제거
 */
export async function adminDeleteUser(userId: string) {
  const auth = await verifyAdmin();
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error };
  }

  if (!userId) {
    return { success: false, error: "올바르지 않은 사용자 ID입니다." };
  }

  // 본인 계정 삭제 차단 방어막
  if (auth.session?.userId === userId) {
    return { success: false, error: "로그인된 관리자 본인의 계정은 삭제할 수 없습니다." };
  }

  try {
    // Prisma Schema에 Cascade 설정이 들어가 있어 User 제거 시 연관된 Todo도 함께 삭제됩니다.
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("어드민 회원 삭제 중 에러:", error);
    return { success: false, error: "회원 삭제 처리에 실패했습니다." };
  }
}
