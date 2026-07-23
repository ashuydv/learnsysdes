import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RequirementsChecklist } from "@/components/requirements-checklist";
import { ProblemWorkspace } from "@/components/problem-workspace";
import { ReferenceSolution } from "@/components/reference-solution";
import type { ProblemRequirements } from "@/lib/types";
import type { EstimationInputs } from "@/components/estimation-panel";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const { slug } = await params;

  const problem = await prisma.problem.findUnique({
    where: { slug },
    include: { submissions: { where: { userId: session.user.id } } },
  });

  if (!problem) notFound();

  const submission = problem.submissions[0];
  const requirements = problem.requirements as unknown as ProblemRequirements;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/problems" className="text-sm text-black/50 hover:underline dark:text-white/50">
        ← All problems
      </Link>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{problem.title}</h1>
      <p className="mt-3 whitespace-pre-line leading-relaxed text-black/80 dark:text-white/80">
        {problem.description}
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <RequirementsChecklist requirements={requirements} />

        <ProblemWorkspace
          problemId={problem.id}
          initialDiagram={submission?.diagramJson ?? null}
          initialEstimation={(submission?.estimationInputs as EstimationInputs | null) ?? null}
        />

        <ReferenceSolution
          title={problem.title}
          description={problem.description}
          solutionText={problem.referenceSolution}
          diagramSnapshot={problem.referenceDiagramJson}
        />
      </div>
    </div>
  );
}
