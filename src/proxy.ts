import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/auth";

// 보호할 라우트와 비인증 라우트 목록 정의
const PROTECTED_ROUTES = ["/"];
const AUTH_ROUTES = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. 현재 요청에 담긴 세션 토큰 획득
  const token = request.cookies.get("session")?.value;
  
  // 2. JWT 토큰 검증
  const session = await decrypt(token);

  // 3. 보호된 경로에 비로그인 상태로 진입 시 -> 로그인 페이지로 이동
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname === route) || pathname.startsWith("/admin");
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL("/login", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // 3.5. 어드민 페이지 접근 차단 (ADMIN 권한 없을 시 메인으로 리다이렉트)
  if (pathname.startsWith("/admin") && session?.role !== "ADMIN") {
    const redirectUrl = new URL("/", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // 4. 로그인된 유저가 로그인 화면 진입 시 -> 메인 페이지로 이동
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));
  if (isAuthRoute && session) {
    const redirectUrl = new URL("/", request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// 미들웨어(프록시)가 매칭될 파일 경로 및 예외 설정
export const config = {
  matcher: [
    /*
     * 아래 경로를 제외한 모든 요청에 대해 실행:
     * - api (API routes, 필요한 경우 개별 인증 처리)
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화 파일)
     * - favicon.ico, public 폴더 내 정적 파일 등
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg).*)",
  ],
};
