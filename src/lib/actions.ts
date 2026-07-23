"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { QuizQuestion } from "@/lib/types";

export async function markModuleStarted(moduleId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.userModuleProgress.upsert({
    where: { userId_moduleId: { userId: session.user.id, moduleId } },
    update: {},
    create: { userId: session.user.id, moduleId, status: "IN_PROGRESS" },
  });
}

export async function submitQuiz(moduleId: string, answers: number[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const targetModule = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!targetModule) throw new Error("Module not found");

  const quiz = targetModule.quizJson as unknown as QuizQuestion[];
  const correct = quiz.reduce(
    (total, question, index) => (answers[index] === question.correctIndex ? total + 1 : total),
    0
  );
  const score = Math.round((correct / quiz.length) * 100);

  await prisma.userModuleProgress.upsert({
    where: { userId_moduleId: { userId: session.user.id, moduleId } },
    update: { status: "COMPLETE", quizScore: score },
    create: { userId: session.user.id, moduleId, status: "COMPLETE", quizScore: score },
  });

  revalidatePath(`/modules/${targetModule.slug}`);
  revalidatePath("/modules");
  revalidatePath("/dashboard");

  return { score, correct, total: quiz.length };
}

export async function saveSubmission(
  problemId: string,
  diagramJson: unknown,
  estimationInputs: unknown
) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.userSubmission.upsert({
    where: { userId_problemId: { userId: session.user.id, problemId } },
    update: { diagramJson: diagramJson as never, estimationInputs: estimationInputs as never },
    create: {
      userId: session.user.id,
      problemId,
      diagramJson: diagramJson as never,
      estimationInputs: estimationInputs as never,
    },
  });

  revalidatePath("/dashboard");
}
