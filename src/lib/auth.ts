import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// JWT 서명 비밀키 설정 (개발 환경 대응을 위해 fallback 키 제공)
const JWT_SECRET = process.env.JWT_SECRET || "temp_default_jwt_secret_for_cs_todo_app_2026";
const encodedKey = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  expiresAt: Date;
}

/**
 * JWT 암호화 (세션 토큰 생성)
 */
export async function encrypt(payload: Omit<SessionPayload, "expiresAt">) {
  return new SignJWT({ userId: payload.userId, email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(encodedKey);
}

/**
 * JWT 복호화 및 검증
 */
export async function decrypt(session: string | undefined): Promise<SessionPayload | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch (error) {
    console.error("JWT 검증 에러:", error);
    return null;
  }
}

/**
 * 쿠키에 세션 토큰 등록 (로그인 시 사용)
 */
export async function createSession(userId: string, email: string, role: string) {
  const token = await encrypt({ userId, email, role });
  const cookieStore = await cookies();
  
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60, // 1일
  });
}

/**
 * 현재 세션 조회 (사용자 정보 파싱)
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;
  if (!sessionToken) return null;
  return decrypt(sessionToken);
}

/**
 * 쿠키 세션 삭제 (로그아웃 시 사용)
 */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
