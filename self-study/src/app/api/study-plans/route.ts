import { analyzeDocument, buildDailyGoalPlan } from "@/lib/analysis";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const createPlanSchema = z.object({
  documentId: z.string(),
  planName: z.string().min(3).max(80),
  deadline: z.string().refine((date) => !Number.isNaN(Date.parse(date)), {
    message: "Invalid deadline",
  }),
  startDate: z
    .string()
    .optional()
    .refine((date) => !date || !Number.isNaN(Date.parse(date)), {
      message: "Invalid start date",
    }),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const plans = await prisma.studyPlan.findMany({
    where: { userId: session.user.id },
    include: {
      document: true,
      dailyGoals: {
        orderBy: { dayNumber: "asc" },
      },
      progressEntries: { orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const augmented = plans.map((plan) => {
    const completedGoals = plan.dailyGoals.filter((goal) => goal.completed).length;
    const completionRate =
      plan.dailyGoals.length > 0
        ? Math.round((completedGoals / plan.dailyGoals.length) * 100)
        : 0;
    return {
      ...plan,
      completedGoals,
      completionRate,
    };
  });

  return NextResponse.json({ plans: augmented });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { documentId, planName, deadline, startDate } =
      createPlanSchema.parse(body);

    const document = await prisma.studyDocument.findFirst({
      where: {
        id: documentId,
        userId: session.user.id,
      },
    });

    if (!document) {
      return NextResponse.json(
        { message: "Document not found." },
        { status: 404 },
      );
    }

    const start = startOfDay(startDate ? parseISO(startDate) : new Date());
    const due = startOfDay(parseISO(deadline));

    const totalDays = Math.max(differenceInCalendarDays(due, start) + 1, 1);

    const analysis = analyzeDocument(document.textContent);
    const dailyPlan = buildDailyGoalPlan(analysis.words, totalDays);

    const createdPlan = await prisma.$transaction(async (tx) => {
      const plan = await tx.studyPlan.create({
        data: {
          name: planName,
          documentId: document.id,
          userId: session.user.id,
          totalDays,
          startDate: start,
          deadline: due,
          dailyWordCount: Math.ceil(analysis.words.length / totalDays),
          summary: analysis.summary,
          keyConcepts: analysis.keyConcepts,
        },
      });

      await tx.dailyGoal.createMany({
        data: dailyPlan.map((goal) => ({
          studyPlanId: plan.id,
          dayNumber: goal.dayNumber,
          date: new Date(start.getTime() + (goal.dayNumber - 1) * 24 * 60 * 60 * 1000),
          startIndex: goal.startIndex,
          endIndex: goal.endIndex,
          contentPreview: goal.excerpt,
          wordCount: goal.wordCount,
        })),
      });

      return plan;
    });

    return NextResponse.json({ planId: createdPlan.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request", issues: error.flatten() },
        { status: 422 },
      );
    }
    console.error("Create plan error", error);
    return NextResponse.json(
      { message: "Unable to create study plan." },
      { status: 500 },
    );
  }
}
