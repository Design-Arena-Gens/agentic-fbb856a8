import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const serializeDocument = (document: Awaited<ReturnType<typeof prisma.studyDocument.findFirst>>) => {
  if (!document) return null;
  return {
    id: document.id,
    title: document.title,
    originalName: document.originalName,
    summary: document.summary,
    highlights: (document.highlights as { snippet: string; score: number }[]) ?? [],
    pages: document.pages,
    createdAt: document.createdAt.toISOString(),
  };
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const [documents, plans] = await Promise.all([
    prisma.studyDocument.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.studyPlan.findMany({
      where: { userId: session.user.id },
      include: {
        document: true,
        dailyGoals: {
          orderBy: { dayNumber: "asc" },
        },
        progressEntries: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const serializedDocuments = documents.map((document) => serializeDocument(document)!);

  const serializedPlans = plans.map((plan) => ({
    id: plan.id,
    name: plan.name,
    documentId: plan.documentId,
    totalDays: plan.totalDays,
    startDate: plan.startDate.toISOString(),
    deadline: plan.deadline.toISOString(),
    dailyWordCount: plan.dailyWordCount,
    summary: plan.summary,
    keyConcepts: Array.isArray(plan.keyConcepts)
      ? (plan.keyConcepts as string[])
      : [],
    completedGoals: plan.dailyGoals.filter((goal) => goal.completed).length,
    completionRate:
      plan.dailyGoals.length > 0
        ? Math.round(
            (plan.dailyGoals.filter((goal) => goal.completed).length /
              plan.dailyGoals.length) *
              100,
          )
        : 0,
    dailyGoals: plan.dailyGoals.map((goal) => ({
      id: goal.id,
      dayNumber: goal.dayNumber,
      date: goal.date.toISOString(),
      startIndex: goal.startIndex,
      endIndex: goal.endIndex,
      contentPreview: goal.contentPreview,
      wordCount: goal.wordCount,
      completed: goal.completed,
      reflections: goal.reflections as Record<string, unknown> | null,
    })),
    progressEntries: plan.progressEntries.map((entry) => ({
      id: entry.id,
      createdAt: entry.createdAt.toISOString(),
      notes: entry.notes,
      mood: entry.mood,
      mastery: entry.mastery,
      goalId: entry.goalId,
    })),
    document: {
      id: plan.document.id,
      title: plan.document.title,
      summary: plan.document.summary,
      highlights:
        (plan.document.highlights as { snippet: string; score: number }[]) ?? [],
      pages: plan.document.pages,
    },
  }));

  return (
    <DashboardClient
      userName={session.user?.name ?? session.user.email}
      documents={serializedDocuments}
      plans={serializedPlans}
    />
  );
}
