"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  adminAddUser, 
  adminUpdateUser, 
  adminDeleteUser, 
  startImpersonate,
  addNotice,
  deleteNotice
} from "./adminActions";

interface UserItem {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  todoCount: number;
}

interface AuditLogItem {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  createdAt: Date;
}

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface StatsData {
  totalUsers: number;
  totalTodos: number;
  completedTodos: number;
  completionRate: number;
}

interface Props {
  initialUsers: UserItem[];
  currentUserId: string;
  stats: StatsData;
  auditLogs: AuditLogItem[];
  notices: NoticeItem[];
}

export default function AdminDashboardClient({ 
  initialUsers, 
  currentUserId,
  stats,
  auditLogs,
  notices
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 대시보드 메인 탭 제어 ("users" | "analytics" | "notices")
  const [dashboardTab, setDashboardTab] = useState<"users" | "analytics" | "notices">("users");

  // 회원 추가 폼 상태
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState("USER");
  const [addError, setAddError] = useState("");

  // 회원 편집 폼 상태
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState("");

  // 공지사항 등록 폼 상태
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticeError, setNoticeError] = useState("");

  // 회원 추가 실행
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");

    const formData = new FormData();
    formData.append("email", addEmail);
    formData.append("password", addPassword);
    formData.append("role", addRole);

    startTransition(async () => {
      const res = await adminAddUser(formData);
      if (res.success) {
        setAddEmail("");
        setAddPassword("");
        setAddRole("USER");
        router.refresh();
      } else {
        setAddError(res.error || "회원 등록에 실패했습니다.");
      }
    });
  };

  // 회원 편집 시작 세팅
  const startEdit = (user: UserItem) => {
    setEditingUser(user);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditPassword("");
    setEditError("");
  };

  // 회원 편집 실행
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError("");

    startTransition(async () => {
      const res = await adminUpdateUser(editingUser.id, {
        email: editEmail,
        role: editRole,
        password: editPassword || undefined,
      });

      if (res.success) {
        setEditingUser(null);
        router.refresh();
      } else {
        setEditError(res.error || "수정에 실패했습니다.");
      }
    });
  };

  // 회원 삭제 실행
  const handleDeleteUser = async (userId: string, email: string) => {
    if (userId === currentUserId) {
      alert("본인 계정은 삭제할 수 없습니다.");
      return;
    }

    if (!confirm(`정말로 회원 (${email})을 삭제하시겠습니까?\n이 회원이 등록한 모든 할 일 목록이 함께 완전히 삭제됩니다.`)) {
      return;
    }

    startTransition(async () => {
      const res = await adminDeleteUser(userId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "삭제에 실패했습니다.");
      }
    });
  };

  // 대행 로그인 개시 실행
  const handleStartImpersonate = async (userId: string, email: string) => {
    if (userId === currentUserId) return;

    if (!confirm(`관리자 권한을 임시 분리하고, 일반 사용자 (${email})의 권한으로 대행 로그인하시겠습니까?`)) {
      return;
    }

    startTransition(async () => {
      const res = await startImpersonate(userId);
      if (res && !res.success) {
        alert(res.error || "대행 로그인 개시에 실패했습니다.");
      }
    });
  };

  // 공지사항 등록 실행
  const handleAddNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoticeError("");

    const formData = new FormData();
    formData.append("title", noticeTitle);
    formData.append("content", noticeContent);

    startTransition(async () => {
      const res = await addNotice(formData);
      if (res.success) {
        setNoticeTitle("");
        setNoticeContent("");
        router.refresh();
      } else {
        setNoticeError(res.error || "공지사항 등록 실패");
      }
    });
  };

  // 공지사항 삭제 실행
  const handleDeleteNotice = async (noticeId: string, title: string) => {
    if (!confirm(`정말로 공지사항 [${title}]을 삭제하시겠습니까?`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteNotice(noticeId);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.error || "공지 제거 실패");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* 어드민 서브 네비게이션 탭 */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setDashboardTab("users")}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all ${
            dashboardTab === "users"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          👤 회원 관리 & 대행
        </button>
        <button
          onClick={() => setDashboardTab("analytics")}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all ${
            dashboardTab === "analytics"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          📊 통계 및 감사 로그
        </button>
        <button
          onClick={() => setDashboardTab("notices")}
          className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all ${
            dashboardTab === "notices"
              ? "border-purple-500 text-purple-400"
              : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          📢 시스템 공지 관리
        </button>
      </div>

      {/* 탭 1: 회원 관리 및 대행 */}
      {dashboardTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 회원 등록 폼 */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-md bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-lg font-bold mb-4 text-zinc-100 flex items-center gap-2">
                ➕ 신규 회원 등록
              </h2>
              {addError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400">
                  {addError}
                </div>
              )}
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">사용자 ID</label>
                  <input
                    type="text"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    required
                    placeholder="아이디 입력"
                    className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">비밀번호 (4자 이상)</label>
                  <input
                    type="password"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">회원 권한</label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="USER" className="bg-zinc-900">USER (일반 사용자)</option>
                    <option value="ADMIN" className="bg-zinc-900">ADMIN (관리자)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-blue-900/10 cursor-pointer"
                >
                  {isPending ? "등록 중..." : "회원 등록"}
                </button>
              </form>
            </div>
          </div>

          {/* 회원 목록 테이블 */}
          <div className="lg:col-span-2">
            <div className="backdrop-blur-md bg-zinc-900/40 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800/80">
                <h2 className="text-lg font-bold text-zinc-100">👥 가입 회원 목록 ({initialUsers.length}명)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 bg-zinc-950/20">
                      <th className="px-6 py-4">사용자</th>
                      <th className="px-6 py-4">권한</th>
                      <th className="px-6 py-4">할 일 개수</th>
                      <th className="px-6 py-4 text-right">대행 및 제어</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-sm text-zinc-300">
                    {initialUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-800/10 transition-all">
                        <td className="px-6 py-4 font-medium text-white">
                          <div className="flex flex-col">
                            <span>{user.email}</span>
                            <span className="text-[10px] text-zinc-500">
                              가입: {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            user.role === "ADMIN" 
                              ? "bg-purple-500/10 border border-purple-500/20 text-purple-400"
                              : "bg-zinc-800 border border-zinc-700 text-zinc-400"
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-zinc-400">📝 {user.todoCount}개</td>
                        <td className="px-6 py-4 text-right space-x-1.5">
                          {user.id !== currentUserId && user.role !== "ADMIN" && (
                            <button
                              onClick={() => handleStartImpersonate(user.id, user.email)}
                              className="text-xs px-2.5 py-1.5 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/20 text-purple-400 font-semibold cursor-pointer"
                            >
                              대행 로그인
                            </button>
                          )}
                          <button
                            onClick={() => startEdit(user)}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            disabled={user.id === currentUserId}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-red-900/30 text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 탭 2: 통계 및 감사 로그 */}
      {dashboardTab === "analytics" && (
        <div className="space-y-8">
          {/* 통계 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 backdrop-blur-md bg-zinc-900/40 border border-zinc-800 rounded-2xl shadow-lg">
              <p className="text-xs font-semibold text-zinc-500 uppercase">가입 회원 수</p>
              <h3 className="text-3xl font-extrabold text-white mt-2">{stats.totalUsers}명</h3>
            </div>
            <div className="p-6 backdrop-blur-md bg-zinc-900/40 border border-zinc-800 rounded-2xl shadow-lg">
              <p className="text-xs font-semibold text-zinc-500 uppercase">등록된 할 일</p>
              <h3 className="text-3xl font-extrabold text-white mt-2">{stats.totalTodos}개</h3>
            </div>
            <div className="p-6 backdrop-blur-md bg-zinc-900/40 border border-zinc-800 rounded-2xl shadow-lg">
              <p className="text-xs font-semibold text-zinc-500 uppercase">완료된 할 일</p>
              <h3 className="text-3xl font-extrabold text-green-400 mt-2">{stats.completedTodos}개</h3>
            </div>
            <div className="p-6 backdrop-blur-md bg-zinc-900/40 border border-zinc-800 rounded-2xl shadow-lg">
              <p className="text-xs font-semibold text-zinc-500 uppercase">전체 진행도(완료율)</p>
              <div className="flex items-center gap-3 mt-2">
                <h3 className="text-3xl font-extrabold text-blue-400">{stats.completionRate}%</h3>
                <div className="flex-1 bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                  <div className="bg-blue-500 h-full transition-all" style={{ width: `${stats.completionRate}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* 감사 로그 리스트 */}
          <div className="backdrop-blur-md bg-zinc-900/40 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800/80">
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                📜 시스템 보안 감사 로그 (최근 50개)
              </h2>
            </div>
            <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 bg-zinc-950/20 sticky top-0 backdrop-blur-md">
                    <th className="px-6 py-4">로그 시간</th>
                    <th className="px-6 py-4">동작 유저</th>
                    <th className="px-6 py-4">액션</th>
                    <th className="px-6 py-4">로그 상세 내용</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-sm text-zinc-300">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-xs">적재된 감사 로그가 존재하지 않습니다.</td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-800/10 transition-all">
                        <td className="px-6 py-3.5 text-xs text-zinc-500 font-mono">
                          {new Date(log.createdAt).toLocaleString("ko-KR")}
                        </td>
                        <td className="px-6 py-3.5 text-xs font-semibold text-zinc-400">
                          {log.adminEmail}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.action === "USER_DELETE" 
                              ? "bg-red-500/10 border border-red-500/20 text-red-400"
                              : log.action === "USER_CREATE"
                              ? "bg-green-500/10 border border-green-500/20 text-green-400"
                              : log.action.startsWith("USER_IMPERSONATE")
                              ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                              : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-zinc-300 font-mono text-xs">{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 탭 3: 공지사항 관리 */}
      {dashboardTab === "notices" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 공지사항 등록 폼 */}
          <div className="lg:col-span-1">
            <div className="backdrop-blur-md bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-lg font-bold mb-4 text-zinc-100 flex items-center gap-2">
                📢 공지사항 신규 등록
              </h2>
              {noticeError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400">
                  {noticeError}
                </div>
              )}
              <form onSubmit={handleAddNotice} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">공지 제목</label>
                  <input
                    type="text"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    required
                    placeholder="공지사항 제목을 입력하세요."
                    className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">공지 내용</label>
                  <textarea
                    rows={4}
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                    required
                    placeholder="공지 내용을 자세히 기록하세요."
                    className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
                >
                  {isPending ? "등록 중..." : "공지 등록 및 배포"}
                </button>
              </form>
            </div>
          </div>

          {/* 공지사항 목록 테이블 */}
          <div className="lg:col-span-2">
            <div className="backdrop-blur-md bg-zinc-900/40 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800/80">
                <h2 className="text-lg font-bold text-zinc-100">📌 활성화된 공지사항 목록 ({notices.length}개)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 bg-zinc-950/20">
                      <th className="px-6 py-4">공지 제목</th>
                      <th className="px-6 py-4">공지 내용</th>
                      <th className="px-6 py-4">등록일</th>
                      <th className="px-6 py-4 text-right">제거</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-sm text-zinc-300">
                    {notices.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-xs">현재 등록된 시스템 공지사항이 없습니다.</td>
                      </tr>
                    ) : (
                      notices.map((notice) => (
                        <tr key={notice.id} className="hover:bg-zinc-800/10 transition-all">
                          <td className="px-6 py-4 font-bold text-white max-w-[150px] truncate">{notice.title}</td>
                          <td className="px-6 py-4 text-zinc-400 max-w-[200px] truncate">{notice.content}</td>
                          <td className="px-6 py-4 text-xs text-zinc-500">
                            {new Date(notice.createdAt).toLocaleString("ko-KR", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteNotice(notice.id, notice.title)}
                              className="text-xs px-2.5 py-1.5 rounded-lg border border-red-900/30 text-red-400 hover:bg-red-500/10 cursor-pointer"
                            >
                              삭제
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 회원 편집 플로팅 모달 */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md backdrop-blur-md bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
              <h3 className="text-base font-bold text-zinc-100">✏️ 회원 정보 수정</h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-zinc-500 hover:text-zinc-300 transition-all text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400">
                {editError}
              </div>
            )}
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">사용자 ID</label>
                <input
                  type="text"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  placeholder="아이디 입력"
                  className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">비밀번호 변경 (미입력 시 유지)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">회원 권한</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  disabled={editingUser.id === currentUserId}
                  className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="USER" className="bg-zinc-900">USER (일반 사용자)</option>
                  <option value="ADMIN" className="bg-zinc-900">ADMIN (관리자)</option>
                </select>
                {editingUser.id === currentUserId && (
                  <p className="text-[10px] text-zinc-500 mt-1">본인 계정의 관리자 권한은 해제할 수 없습니다.</p>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold rounded-xl transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl transition-all"
                >
                  {isPending ? "저장 중..." : "저장 완료"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
