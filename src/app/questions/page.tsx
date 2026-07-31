import { prisma } from "@/lib/prisma";
import { QuestionsTabs } from "@/components/questions-tabs";

const DIFFICULTY_ORDER = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;

export default async function QuestionsPage() {
  const questions = await prisma.interviewQuestion.findMany({
    orderBy: [{ difficulty: "asc" }, { order: "asc" }],
  });

  const grouped = DIFFICULTY_ORDER.map((difficulty) => ({
    difficulty,
    items: questions.filter((q) => q.difficulty === difficulty),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-brand">System design interview questions</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        {questions.length} questions from beginner fundamentals to expert-level distributed
        systems design. Tap a question to reveal the answer.
      </p>

      <QuestionsTabs groups={grouped} />
    </div>
  );
}
