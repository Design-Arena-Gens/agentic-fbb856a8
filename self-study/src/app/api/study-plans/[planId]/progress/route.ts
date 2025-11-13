import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const progressSchema = z.object({
  goalId: z.string().optional(),
  notes: z.string().max(1000).optional(),
  mood: z.string().max(40).optional(),
  mastery: z.number().min(0).max(100).optional(),
});

type RouteContext = {
  params: Promise<{ planId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = progressSchema.parse(body);

    const { planId } = await context.params;

    const plan = await prisma.studyPlan.findFirst({
      where: {
        id: planId,
        userId: session.user.id,
      },
    });

    if (!plan) {
      return NextResponse.json({ message: "Plan not found" }, { status: 404 });
    }

    if (data.goalId) {
      const goalExists = await prisma.dailyGoal.findFirst({
        where: {
          id: data.goalId,
          studyPlanId: planId,
        },
      });

      if (!goalExists) {
        return NextResponse.json(
          { message: "Goal specified was not found for this plan." },
          { status: 404 },
        );
      }
    }

    const entry = await prisma.progressEntry.create({
      data: {
        studyPlanId: planId,
        goalId: data.goalId,
        notes: data.notes,
        mood: data.mood,
        mastery: data.mastery,
      },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid payload", issues: error.flatten() },
        { status: 422 },
      );
    }

    console.error("Create progress entry error", error);
    return NextResponse.json(
      { message: "Unable to save progress entry." },
      { status: 500 },
    );
  }
}
