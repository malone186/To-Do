"use server";

import prisma from "@/lib/prisma";
import { getSession, createSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * 관리자 권한 검증 내부 유틸
 */
async function verifyAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return { isAuthorized: false, error: "관리자 권한이 없거나 세션이 만료되었습니다.", session: null };
  }
  return { isAuthorized: true, session };
}

/**
 * 감사 로그 기록 내부 유틸
 */
async function logAction(
  adminId: string,
  adminEmail: string,
  action: string,
  targetUserId: string | null,
  details: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        adminEmail,
        action,
        targetUserId,
        details,
      },
    });
  } catch (error) {
    console.error("감사 로그 저장 실패:", error);
  }
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
  if (!auth.isAuthorized || !auth.session) {
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

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });

    // 감사 로그 기록
    await logAction(
      auth.session.userId,
      auth.session.email,
      "USER_CREATE",
      newUser.id,
      `신규 가입 유저: ${newUser.email} (권한: ${newUser.role})`
    );

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
  if (!auth.isAuthorized || !auth.session) {
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
    if (auth.session.userId === userId && data.role !== "ADMIN") {
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

    let passResetLog = "";
    // 비밀번호 필드가 존재하고 공백이 아니면 해싱하여 업데이트 적용
    if (data.password && data.password.trim() !== "") {
      if (data.password.length < 4) {
        return { success: false, error: "변경할 비밀번호는 최소 4자 이상이어야 합니다." };
      }
      updateData.password = await bcrypt.hash(data.password, 10);
      passResetLog = " 및 비밀번호 강제 초기화";
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // 감사 로그 기록
    await logAction(
      auth.session.userId,
      auth.session.email,
      "USER_UPDATE",
      updatedUser.id,
      `회원 정보 수정: ${updatedUser.email} (권한: ${updatedUser.role})${passResetLog}`
    );

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
  if (!auth.isAuthorized || !auth.session) {
    return { success: false, error: auth.error };
  }

  if (!userId) {
    return { success: false, error: "올바르지 않은 사용자 ID입니다." };
  }

  // 본인 계정 삭제 차단 방어막
  if (auth.session.userId === userId) {
    return { success: false, error: "로그인된 관리자 본인의 계정은 삭제할 수 없습니다." };
  }

  try {
    // Prisma Schema에 Cascade 설정이 들어가 있어 User 제거 시 연관된 Todo도 함께 삭제됩니다.
    const deletedUser = await prisma.user.delete({
      where: { id: userId },
    });

    // 감사 로그 기록
    await logAction(
      auth.session.userId,
      auth.session.email,
      "USER_DELETE",
      userId,
      `회원 정보 영구 삭제 및 Todo 데이터 연쇄 제거: ${deletedUser.email}`
    );

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("어드민 회원 삭제 중 에러:", error);
    return { success: false, error: "회원 삭제 처리에 실패했습니다." };
  }
}

/**
 * 5. 통계 정보 연산 (Analytics)
 */
export async function getAdminStats() {
  const auth = await verifyAdmin();
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error, data: null };
  }

  try {
    const totalUsers = await prisma.user.count();
    const totalTodos = await prisma.todo.count();
    const completedTodos = await prisma.todo.count({
      where: { isCompleted: true },
    });

    const completionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

    return {
      success: true,
      data: {
        totalUsers,
        totalTodos,
        completedTodos,
        completionRate,
      },
    };
  } catch (error) {
    console.error("통계 집계 중 오류:", error);
    return { success: false, error: "통계 처리에 실패했습니다.", data: null };
  }
}

/**
 * 6. 최근 감사 로그 50개 조회 (Audit Logs)
 */
export async function getAuditLogs() {
  const auth = await verifyAdmin();
  if (!auth.isAuthorized) {
    return { success: false, error: auth.error, data: [] };
  }

  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return { success: true, data: logs };
  } catch (error) {
    console.error("감사 로그 조회 실패:", error);
    return { success: false, error: "감사 로그를 가져오지 못했습니다.", data: [] };
  }
}

/**
 * 7. 공지사항 조회
 */
export async function getNotices() {
  try {
    const notices = await prisma.systemNotice.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: notices };
  } catch (error) {
    console.error("공지사항 조회 실패:", error);
    return { success: false, error: "공지사항 로딩 실패", data: [] };
  }
}

/**
 * 8. 공지사항 등록
 */
export async function addNotice(formData: FormData) {
  const auth = await verifyAdmin();
  if (!auth.isAuthorized || !auth.session) {
    return { success: false, error: auth.error };
  }

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();

  if (!title || !content) {
    return { success: false, error: "공지사항 제목과 내용을 모두 입력해 주세요." };
  }

  try {
    const newNotice = await prisma.systemNotice.create({
      data: { title, content },
    });

    // 감사 로그 기록
    await logAction(
      auth.session.userId,
      auth.session.email,
      "NOTICE_CREATE",
      newNotice.id,
      `시스템 공지사항 추가: [${newNotice.title}]`
    );

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("공지사항 생성 오류:", error);
    return { success: false, error: "공지사항 등록에 실패했습니다." };
  }
}

/**
 * 9. 공지사항 삭제
 */
export async function deleteNotice(id: string) {
  const auth = await verifyAdmin();
  if (!auth.isAuthorized || !auth.session) {
    return { success: false, error: auth.error };
  }

  try {
    const deletedNotice = await prisma.systemNotice.delete({
      where: { id },
    });

    // 감사 로그 기록
    await logAction(
      auth.session.userId,
      auth.session.email,
      "NOTICE_DELETE",
      id,
      `시스템 공지사항 제거: [${deletedNotice.title}]`
    );

    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("공지사항 삭제 오류:", error);
    return { success: false, error: "공지사항 제거에 실패했습니다." };
  }
}

/**
 * 10. 권한 대행 로그인 시작 (Impersonation Start)
 */
export async function startImpersonate(targetUserId: string) {
  const auth = await verifyAdmin();
  if (!auth.isAuthorized || !auth.session) {
    return { success: false, error: auth.error };
  }

  if (auth.session.userId === targetUserId) {
    return { success: false, error: "본인 계정은 대행 로그인할 수 없습니다." };
  }

  try {
    // 가장하려는 사용자 정보 획득
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return { success: false, error: "해당 사용자가 존재하지 않습니다." };
    }

    // 보안을 위해 targetUser가 ADMIN일 경우 대행 차단 (권한 탈취 보호)
    if (targetUser.role === "ADMIN") {
      return { success: false, error: "다른 관리자의 권한은 대행할 수 없습니다." };
    }

    // 쿠키를 타겟 사용자의 USER 세션으로 갱신하되, impersonatorId에 원래 관리자 식별자(adminId)를 기입
    await createSession(targetUser.id, targetUser.email, "USER", auth.session.userId);

    // 감사 로그 기록
    await logAction(
      auth.session.userId,
      auth.session.email,
      "USER_IMPERSONATE_START",
      targetUser.id,
      `회원 권한 대행 로그인 개시 -> 대상: ${targetUser.email}`
    );

  } catch (error) {
    console.error("대행 로그인 시작 중 예외:", error);
    return { success: false, error: "대행 로그인을 시작하지 못했습니다." };
  }

  // 성공적으로 세션 변경 후 홈화면으로 리다이렉트 (try-catch 외부 수행)
  revalidatePath("/");
  redirect("/");
}

/**
 * 11. 권한 대행 로그인 종료 및 관리자 복귀 (Impersonation Stop)
 */
export async function stopImpersonate() {
  const session = await getSession();
  if (!session || !session.impersonatorId) {
    return { success: false, error: "대행 로그인 상태가 아닙니다." };
  }

  const originalAdminId = session.impersonatorId;

  try {
    // 원래의 관리자 정보 조회
    const adminUser = await prisma.user.findUnique({
      where: { id: originalAdminId },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return { success: false, error: "원래의 관리자 정보를 복원할 수 없습니다." };
    }

    // 쿠키 세션을 다시 원래 관리자(ADMIN) 정보로 교환 환원 (대행 필드 파기)
    await createSession(adminUser.id, adminUser.email, "ADMIN", null);

    // 감사 로그 기록
    await logAction(
      adminUser.id,
      adminUser.email,
      "USER_IMPERSONATE_STOP",
      session.userId,
      `회원 권한 대행 로그인 정상 종료 및 어드민 복귀`
    );

  } catch (error) {
    console.error("대행 로그인 해제 중 예외:", error);
    return { success: false, error: "어드민 권한 복귀에 실패했습니다." };
  }

  // 홈화면 리다이렉트 및 리벨리데이트
  revalidatePath("/");
  redirect("/");
}

