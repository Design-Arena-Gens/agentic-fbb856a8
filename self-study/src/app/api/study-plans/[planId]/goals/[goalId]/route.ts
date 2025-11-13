import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  completed: z.boolean().optional(),
  reflections: z
    .object({
      notes: z.string().max(500).optional(),
      comprehension: z.number().min(1).max(5).optional(),
    })
    .optional(),
});

type RouteContext = {
  params: Promise<{ planId: string; goalId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { planId, goalId } = await context.params;

  try {
    const body = await request.json();
    const data = updateSchema.parse(body);

    const goal = await prisma.dailyGoal.findFirst({
      where: {
        id: goalId,
        studyPlan: {
          id: planId,
          userId: session.user.id,
        },
      },
    });

    if (!goal) {
      return NextResponse.json({ message: "Goal not found" }, { status: 404 });
    }

    const updated = await prisma.dailyGoal.update({
      where: { id: goalId },
      data: {
        completed: data.completed ?? goal.completed,
        reflections:
          data.reflections !== undefined
            ? data.reflections
            : goal.reflections ?? Prisma.JsonNull,
      },
    });

    return NextResponse.json({ goal: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid payload", issues: error.flatten() },
        { status: 422 },
      );
    }
    console.error("Update goal error", error);
    return NextResponse.json(
      { message: "Unable to update goal" },
      { status: 500 },
    );
  }
}
