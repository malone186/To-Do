"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminAddUser, adminUpdateUser, adminDeleteUser } from "./adminActions";

interface UserItem {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  todoCount: number;
}

interface Props {
  initialUsers: UserItem[];
  currentUserId: string; // 현재 로그인 중인 관리자의 ID
}

export default function AdminDashboardClient({ initialUsers, currentUserId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 왼쪽 사이드바: 신규 회원 추가 */}
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
                className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">회원 권한</label>
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="USER" className="bg-zinc-900">USER (일반 사용자)</option>
                <option value="ADMIN" className="bg-zinc-900">ADMIN (관리자)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all"
            >
              {isPending ? "등록 중..." : "회원 등록"}
            </button>
          </form>
        </div>
      </div>

      {/* 오른쪽 영역: 회원 목록 및 회원 편집 모달 */}
      <div className="lg:col-span-2 space-y-6">
        <div className="backdrop-blur-md bg-zinc-900/40 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-zinc-800/80 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              👥 가입 회원 목록 ({initialUsers.length}명)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-xs font-bold text-zinc-400 uppercase bg-zinc-950/20">
                  <th className="px-6 py-4">사용자</th>
                  <th className="px-6 py-4">권한</th>
                  <th className="px-6 py-4">할 일 개수</th>
                  <th className="px-6 py-4">가입일</th>
                  <th className="px-6 py-4 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-sm text-zinc-300">
                {initialUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-800/20 transition-all">
                    <td className="px-6 py-4 font-medium text-white flex flex-col">
                      <span>{user.email}</span>
                      {user.id === currentUserId && (
                        <span className="text-[10px] text-blue-400 font-bold mt-0.5">본인 계정</span>
                      )}
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
                    <td className="px-6 py-4 font-semibold text-zinc-400">
                      📝 {user.todoCount}개
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500">
                      {new Date(user.createdAt).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        disabled={user.id === currentUserId}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-red-900/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
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
                  className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">비밀번호 변경 (미입력 시 유지)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-2">회원 권한</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  disabled={editingUser.id === currentUserId}
                  className="w-full px-4 py-2.5 bg-zinc-950/50 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
