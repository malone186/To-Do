"use server";

import prisma from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

/**
 * 1. 회원가입 (Sign Up)
 */
export async function signUp(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // 입력 데이터 검증 (Defensive Programming)
  if (!email || !password || !confirmPassword) {
    return { success: false, error: "모든 필드를 입력해 주세요." };
  }

  const usernameClean = email.trim();
  if (usernameClean.length < 2) {
    return { success: false, error: "아이디는 최소 2자 이상이어야 합니다." };
  }
  if (usernameClean.includes(" ")) {
    return { success: false, error: "아이디에는 공백을 포함할 수 없습니다." };
  }

  if (password.length < 4) {
    return { success: false, error: "비밀번호는 최소 4자 이상이어야 합니다." };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "비밀번호가 일치하지 않습니다." };
  }

  try {
    // 이메일 중복 체크
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { success: false, error: "이미 등록된 이메일 주소입니다." };
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 일반 회원가입 시에는 보안상 무조건 USER 권한으로 고정 가입 처리
    const role = "USER";

    // 사용자 생성 (기본 상태는 PENDING)
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        status: "PENDING",
      },
    });

    return { 
      success: true, 
      message: "회원가입 신청이 완료되었습니다. 관리자의 승인 완료 후 로그인이 가능합니다." 
    };
  } catch (error) {
    console.error("회원가입 오류:", error);
    return { success: false, error: "회원가입 처리 중 데이터베이스 오류가 발생했습니다." };
  }
}

/**
 * 2. 로그인 (Login)
 */
export async function login(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "이메일과 비밀번호를 모두 입력해 주세요." };
  }

  try {
    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }

    // 비밀번호 대조
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, error: "이메일 또는 비밀번호가 올바르지 않습니다." };
    }

    // 가입 승인 및 거절 상태 검증
    if (user.status === "PENDING") {
      return { success: false, error: "아직 관리자의 가입 승인을 대기 중입니다." };
    }
    if (user.status === "REJECTED") {
      return { success: false, error: "가입 승인이 거절된 계정입니다. 관리자에게 문의하세요." };
    }

    // 세션 생성 (권한 포함)
    await createSession(user.id, user.email, user.role);
  } catch (error) {
    console.error("로그인 오류:", error);
    return { success: false, error: "로그인 처리 중 오류가 발생했습니다." };
  }

  // 성공 시 홈 화면으로 리다이렉트
  redirect("/");
}

/**
 * 3. 로그아웃 (Logout)
 */
export async function logout() {
  await deleteSession();
  redirect("/login");
}
