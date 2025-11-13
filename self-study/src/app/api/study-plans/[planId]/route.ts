import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ planId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { planId } = await context.params;

  const plan = await prisma.studyPlan.findFirst({
    where: {
      id: planId,
      userId: session.user.id,
    },
    include: {
      document: true,
      dailyGoals: {
        orderBy: { dayNumber: "asc" },
      },
      progressEntries: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!plan) {
    return NextResponse.json({ message: "Plan not found" }, { status: 404 });
  }

  const completedGoals = plan.dailyGoals.filter((goal) => goal.completed).length;
  const completionRate =
    plan.dailyGoals.length > 0
      ? Math.round((completedGoals / plan.dailyGoals.length) * 100)
      : 0;

  return NextResponse.json({
    plan: {
      ...plan,
      completedGoals,
      completionRate,
    },
  });
}
