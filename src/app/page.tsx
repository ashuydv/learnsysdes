import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { techStack } from "@/lib/tech-stack";

const steps = [
  {
    title: "Learn the fundamentals",
    description:
      "Work through short modules on scalability, caching, sharding, CAP, and more — each one ends in a quiz.",
  },
  {
    title: "Practice on a canvas",
    description:
      "Sketch your design for a classic HLD problem, then size it with a back-of-envelope estimate.",
  },
  {
    title: "Compare & improve",
    description:
      "Reveal a reference solution and diagram to see how your design holds up.",
  },
];

export default async function Home() {
  const [modules, problems] = await Promise.all([
    prisma.module.findMany({
      orderBy: { order: "asc" },
      select: { slug: true, title: true, order: true },
    }),
    prisma.problem.findMany({
      orderBy: { order: "asc" },
      select: { slug: true, title: true, description: true },
    }),
  ]);

  return (
    <div>
      <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-brand opacity-20 blur-3xl"
        />
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Learn System Design{" "}
          <span className="text-gradient-brand">by doing it</span>
        </h1>
        <p className="mt-4 text-lg text-black/60 dark:text-white/60">
          Work through high-level design fundamentals, then practice on an
          interactive whiteboard with 5 classic HLD problems, 1 URL shortener,
          rate limiter, chat app, notifications, and checkout.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/sign-up"
            className="btn-gradient rounded-md px-5 py-2.5 font-medium shadow-lg shadow-brand-via/25"
          >
            Get started
          </Link>
          <Link
            href="/modules"
            className="rounded-md border border-black/10 px-5 py-2.5 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
          >
            Browse modules
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          How it works
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="rounded-lg border border-black/10 p-6 dark:border-white/10"
            >
              <div className="btn-gradient flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold">
                {i + 1}
              </div>
              <p className="mt-4 font-medium">{step.title}</p>
              <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            What you&apos;ll learn
          </h2>
          <Link href="/modules" className="text-sm text-brand-via hover:underline">
            View all modules →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {modules.map((module) => (
            <div
              key={module.slug}
              className="flex items-center gap-3 rounded-lg border border-black/10 px-4 py-3 dark:border-white/10"
            >
              <span className="text-gradient-brand text-sm font-semibold">
                {String(module.order).padStart(2, "0")}
              </span>
              <span className="text-sm font-medium">{module.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">
            Practice problems
          </h2>
          <Link href="/problems" className="text-sm text-brand-via hover:underline">
            View all problems →
          </Link>
        </div>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          5 classic HLD problems to design end to end, on an interactive whiteboard.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {problems.map((problem) => (
            <div
              key={problem.slug}
              className="rounded-lg border border-black/10 p-5 dark:border-white/10"
            >
              <p className="font-medium">{problem.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-black/60 dark:text-white/60">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold tracking-tight">
          Built with
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {techStack.map((tech) => (
            <div
              key={tech.name}
              className="group flex flex-col items-center gap-2 rounded-lg border border-black/10 px-4 py-5 text-center transition-colors hover:border-brand-via/40 hover:bg-brand-via/5 dark:border-white/10"
            >
              {tech.path ? (
                <svg
                  viewBox="0 0 24 24"
                  className={`h-7 w-7 fill-black/60 transition-colors dark:fill-white/60 ${tech.hoverClass}`}
                >
                  <path d={tech.path} />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-7 w-7 text-black/60 transition-colors dark:text-white/60 ${tech.hoverClass}`}
                >
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              )}
              <span className="text-sm font-medium">{tech.name}</span>
              <span className="text-xs text-black/40 dark:text-white/40">
                {tech.detail}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-24">
        <div className="bg-gradient-brand rounded-2xl px-8 py-12 text-center text-white">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to get started?
          </h2>
          <p className="mt-2 text-white/90">
            Create a free account and start learning system design today.
          </p>
          <Link
            href="/sign-up"
            className="mt-6 inline-block rounded-md bg-white px-5 py-2.5 font-medium text-black hover:bg-white/90"
          >
            Get started
          </Link>
        </div>
      </div>
    </div>
  );
}
