import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";

export default async function ModulesPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const modules = await prisma.module.findMany({
    orderBy: { order: "asc" },
    include: { progress: { where: { userId: session.user.id } } },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-brand text-2xl font-bold tracking-tight">Learning modules</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        Work through these in order, or jump to whatever you need to brush up on.
      </p>
      <ul className="mt-8 flex flex-col gap-3">
        {modules.map((module) => {
          const progress = module.progress[0];
          return (
            <li key={module.id}>
              <Link
                href={`/modules/${module.slug}`}
                className="group flex items-center justify-between gap-4 rounded-lg border border-black/10 px-5 py-4 transition-colors hover:border-brand/40 hover:bg-brand-soft dark:border-white/10"
              >
                <div className="min-w-0">
                  <p className="font-medium group-hover:text-brand">
                    <span className="text-brand font-semibold">{module.order}.</span>{" "}
                    {module.title}
                  </p>
                  <p className="mt-0.5 text-sm text-black/60 dark:text-white/60">
                    {module.summary}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {progress?.quizScore != null && (
                    <span className="text-sm text-black/50 dark:text-white/50">
                      {progress.quizScore}%
                    </span>
                  )}
                  <StatusBadge status={progress?.status ?? "NOT_STARTED"} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
