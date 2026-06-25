import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import AppLayout from "@/components/AppLayout";
import CalendarView from "@/components/CalendarView";

export const revalidate = 0;

export default async function CalendarPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  // 사용자의 To-Do 목록 조회
  const todos = await prisma.todo.findMany({
    where: { userId: session.userId },
    orderBy: { dueDate: "asc" }
  });

  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.isCompleted).length;

  // 유니크 카테고리 추출
  const uniqueCategoriesData = await prisma.todo.findMany({
    where: { userId: session.userId },
    select: { category: true },
    distinct: ["category"],
  });
  const userCategories = uniqueCategoriesData.map((c) => c.category || "일반");

  return (
    <AppLayout
      userEmail={session.email}
      userRole={session.role}
      isImpersonating={!!session.impersonatorId}
      totalTodosCount={totalCount}
      completedTodosCount={completedCount}
      userCategories={userCategories}
    >
      <main className="min-h-screen bg-zinc-50 dark:bg-[#070708] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans relative overflow-hidden pb-16">
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-4xl relative z-10 py-12">
          <header className="mb-8 text-center sm:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 dark:from-zinc-50 dark:via-zinc-200 dark:to-zinc-400 bg-clip-text text-transparent">
              📅 마감 캘린더
            </h1>
            <p className="text-sm text-zinc-500 mt-1">To-Do 마감 일정 현황을 월 단위 달력으로 시각화합니다.</p>
          </header>

          <CalendarView initialTodos={todos as any} />
        </div>
      </main>
    </AppLayout>
  );
}
