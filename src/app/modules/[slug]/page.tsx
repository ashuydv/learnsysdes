import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ConceptDiagram } from "@/components/concept-diagram";
import { conceptDiagrams } from "@/lib/concept-diagrams";
import { MarkdownLite } from "@/components/markdown-lite";
import { QuizForm } from "@/components/quiz-form";
import { ModuleProgressTracker } from "@/components/module-progress-tracker";
import type { QuizQuestion } from "@/lib/types";

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const { slug } = await params;

  const [module, allModules] = await Promise.all([
    prisma.module.findUnique({
      where: { slug },
      include: { progress: { where: { userId: session.user.id } } },
    }),
    prisma.module.findMany({
      orderBy: { order: "asc" },
      select: { slug: true, title: true, order: true },
    }),
  ]);

  if (!module) notFound();

  const progress = module.progress[0];
  const quiz = module.quizJson as unknown as QuizQuestion[];
  const diagram = conceptDiagrams[module.slug];
  const index = allModules.findIndex((m) => m.slug === slug);
  const prevModule = index > 0 ? allModules[index - 1] : null;
  const nextModule = index < allModules.length - 1 ? allModules[index + 1] : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <ModuleProgressTracker moduleId={module.id} status={progress?.status ?? "NOT_STARTED"} />
      <Link href="/modules" className="text-sm text-black/50 hover:text-brand-via dark:text-white/50">
        ← All modules
      </Link>
      <h1 className="text-gradient-brand mt-2 text-3xl font-bold tracking-tight">{module.title}</h1>
      <p className="mt-1 text-black/60 dark:text-white/60">{module.summary}</p>

      {diagram && (
        <div className="mt-8">
          <ConceptDiagram data={diagram} />
        </div>
      )}

      <div className="mt-8">
        <MarkdownLite content={module.content} />
      </div>

      <QuizForm
        moduleId={module.id}
        questions={quiz}
        initialScore={progress?.quizScore ?? null}
      />

      <div className="mt-10 flex items-center justify-between border-t border-black/10 pt-6 text-sm dark:border-white/10">
        {prevModule ? (
          <Link href={`/modules/${prevModule.slug}`} className="hover:text-brand-via">
            ← {prevModule.title}
          </Link>
        ) : (
          <span />
        )}
        {nextModule ? (
          <Link href={`/modules/${nextModule.slug}`} className="hover:text-brand-via">
            {nextModule.title} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
