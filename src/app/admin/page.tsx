import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { 
  getAllUsers, 
  getAdminStats, 
  getAuditLogs, 
  getNotices 
} from "./adminActions";
import AdminDashboardClient from "./AdminDashboardClient";

export const revalidate = 0;

export default async function AdminPage() {
  const session = await getSession();

  // 보안 리다이렉션 (어드민이 아닐 시 메인 페이지로 반사)
  if (!session || session.role !== "ADMIN") {
    redirect("/");
  }

  // 1. 전체 회원 로드
  const usersRes = await getAllUsers();
  const users = usersRes.success && usersRes.data ? usersRes.data : [];

  // 2. 통계 지표 산정
  const statsRes = await getAdminStats();
  const stats = statsRes.success && statsRes.data ? statsRes.data : {
    totalUsers: 0,
    totalTodos: 0,
    completedTodos: 0,
    completionRate: 0,
  };

  // 3. 감사 로그 로드
  const logsRes = await getAuditLogs();
  const auditLogs = logsRes.success && logsRes.data ? logsRes.data as any[] : [];

  // 4. 시스템 공지사항 로드
  const noticesRes = await getNotices();
  const notices = noticesRes.success && noticesRes.data ? noticesRes.data : [];

  return (
    <main className="min-h-screen bg-[#070708] text-zinc-100 flex flex-col font-sans relative overflow-hidden pb-16">
      {/* 백그라운드 그라데이션 구체 */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        {/* 상단 툴바 영역 */}
        <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50">
          <Link
            href="/"
            className="text-xs px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all font-semibold shadow-sm flex items-center gap-1.5"
          >
            🏠 홈으로 가기
          </Link>
        </div>

        {/* 헤더 영역 */}
        <header className="py-12 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 mb-4 tracking-wider uppercase">
            ⚙️ Administrator Mode
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
            System Control Panel
          </h1>
          <p className="text-xs text-zinc-500 mt-2 max-w-md">
            전체 회원 관리, 권한 대행 제어, 시스템 통계 모니터링 및 공지 관리가 가능한 최고 관리자 패널입니다.
          </p>
        </header>

        {/* 회원 관리 어드민 대시보드 컴포넌트 렌더링 */}
        <AdminDashboardClient 
          initialUsers={users} 
          currentUserId={session.userId}
          stats={stats}
          auditLogs={auditLogs}
          notices={notices}
        />
      </div>
    </main>
  );
}
