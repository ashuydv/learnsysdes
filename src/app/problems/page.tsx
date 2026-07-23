import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProblemsPage() {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const problems = await prisma.problem.findMany({
    orderBy: { order: "asc" },
    include: { submissions: { where: { userId: session.user.id } } },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">HLD practice problems</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        Sketch your design on the canvas, size it with a back-of-envelope estimate, then compare
        against a reference solution.
      </p>
      <ul className="mt-8 flex flex-col gap-3">
        {problems.map((problem) => {
          const attempted = problem.submissions.length > 0;
          return (
            <li key={problem.id}>
              <Link
                href={`/problems/${problem.slug}`}
                className="flex items-center justify-between rounded-lg border border-black/10 px-5 py-4 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
              >
                <div>
                  <p className="font-medium">{problem.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-black/60 dark:text-white/60">
                    {problem.description}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    attempted
                      ? "bg-green-500/10 text-green-700 dark:text-green-400"
                      : "bg-black/5 text-black/50 dark:bg-white/10 dark:text-white/50"
                  }`}
                >
                  {attempted ? "Attempted" : "Not started"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
