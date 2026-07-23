import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 p-6 dark:border-white/10">
      <p className="text-sm text-black/60 dark:text-white/60">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");
  const userId = session.user.id;

  const [modulesTotal, problemsTotal, moduleProgress, submissions] = await Promise.all([
    prisma.module.count(),
    prisma.problem.count(),
    prisma.userModuleProgress.findMany({
      where: { userId },
      include: { module: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.userSubmission.findMany({
      where: { userId },
      include: { problem: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const modulesCompleted = moduleProgress.filter((p) => p.status === "COMPLETE").length;
  const problemsAttempted = submissions.length;

  const continueCandidates = [
    ...moduleProgress
      .filter((p) => p.status !== "COMPLETE")
      .map((p) => ({
        title: p.module.title,
        subtitle: "Module",
        href: `/modules/${p.module.slug}`,
        updatedAt: p.updatedAt,
      })),
    ...submissions.map((s) => ({
      title: s.problem.title,
      subtitle: "Practice problem",
      href: `/problems/${s.problem.slug}`,
      updatedAt: s.updatedAt,
    })),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  const continueItem = continueCandidates[0] ?? null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome back{session.user.name ? `, ${session.user.name}` : ""}
      </h1>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <StatCard label="Modules completed" value={`${modulesCompleted} / ${modulesTotal}`} />
        <StatCard label="Problems attempted" value={`${problemsAttempted} / ${problemsTotal}`} />
      </div>

      <div className="mt-8 rounded-lg border border-black/10 p-6 dark:border-white/10">
        <h2 className="text-lg font-semibold tracking-tight">Continue where you left off</h2>
        {continueItem ? (
          <Link
            href={continueItem.href}
            className="mt-3 flex items-center justify-between rounded-md bg-black/5 px-4 py-3 text-sm hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <span>
              <span className="text-black/50 dark:text-white/50">{continueItem.subtitle}: </span>
              {continueItem.title}
            </span>
            <span>→</span>
          </Link>
        ) : (
          <div className="mt-3 flex items-center justify-between rounded-md bg-black/5 px-4 py-3 text-sm dark:bg-white/10">
            <span>You haven&apos;t started anything yet — jump into the first module.</span>
            <Link href="/modules" className="font-medium hover:underline">
              Start learning →
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/modules"
          className="rounded-lg border border-black/10 px-5 py-4 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
        >
          <p className="font-medium">Browse modules</p>
          <p className="mt-0.5 text-sm text-black/60 dark:text-white/60">
            Scalability, caching, sharding, CAP, and more.
          </p>
        </Link>
        <Link
          href="/problems"
          className="rounded-lg border border-black/10 px-5 py-4 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
        >
          <p className="font-medium">Practice problems</p>
          <p className="mt-0.5 text-sm text-black/60 dark:text-white/60">
            Design 5 classic systems on an interactive canvas.
          </p>
        </Link>
      </div>
    </div>
  );
}
