import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { techStack } from "@/lib/tech-stack";

export const dynamic = "force-dynamic";

const steps = [
  {
    title: "Learn the fundamentals",
    description:
      "Work through short modules on scalability, caching, sharding, CAP, and more. Each one ends in a quiz.",
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
    <div className="overflow-x-hidden">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Learn System Design <span className="text-brand">by doing it</span>
        </h1>
        <p className="mt-4 text-lg text-black/60 dark:text-white/60">
          Work through high-level design fundamentals, then practice on an
          interactive whiteboard with classic HLD problems: URL shortener,
          rate limiter, chat app, notifications, checkout, and more.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/sign-up"
            className="rounded-md bg-brand px-5 py-2.5 font-medium text-white hover:brightness-110"
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
        <div className="grid grid-cols-1 items-center gap-10 rounded-lg border border-black/10 p-8 dark:border-white/10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Design on a real whiteboard, not a text box
            </h2>
            <p className="mt-3 text-black/60 dark:text-white/60">
              Every practice problem opens on an interactive drawing canvas.
              Drop in boxes for clients, load balancers, services, caches,
              queues, and databases, then connect them into the architecture
              you have in mind, the same way you would on a whiteboard in an
              actual interview.
            </p>
            <p className="mt-3 text-black/60 dark:text-white/60">
              The canvas is built on Excalidraw, a free and open-source
              drawing tool with no license or account required to use.
              Nothing about your diagram is locked behind a paywall.
            </p>
            <Link
              href="/problems"
              className="mt-5 inline-block text-sm font-medium text-brand hover:underline"
            >
              Try a practice problem
            </Link>
          </div>
          <div className="rounded-lg border border-black/10 bg-black/[0.02] p-6 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {["Client", "Load balancer", "Service", "Cache", "Queue", "Database"].map(
                (label) => (
                  <div
                    key={label}
                    className="rounded-md border border-black/10 bg-[var(--background)] px-3 py-4 text-center font-medium dark:border-white/15"
                  >
                    {label}
                  </div>
                ),
              )}
            </div>
            <p className="mt-4 text-center text-xs text-black/40 dark:text-white/40">
              Drag, connect, and label, then compare against a reference
              solution.
            </p>
          </div>
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
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
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
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            What you&apos;ll learn
          </h2>
          <Link href="/modules" className="text-sm text-brand hover:underline">
            View all modules →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {modules.map((module) => (
            <div
              key={module.slug}
              className="flex items-center gap-3 rounded-lg border border-black/10 px-4 py-3 dark:border-white/10"
            >
              <span className="text-sm font-semibold text-brand">
                {String(module.order).padStart(2, "0")}
              </span>
              <span className="text-sm font-medium">{module.title}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Practice problems
          </h2>
          <Link href="/problems" className="text-sm text-brand hover:underline">
            View all problems →
          </Link>
        </div>
        <p className="mt-1 text-sm text-black/60 dark:text-white/60">
          Classic HLD problems to design end to end, on an interactive whiteboard.
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
              className="group flex flex-col items-center gap-2 rounded-lg border border-black/10 px-4 py-5 text-center transition-colors hover:border-brand/40 hover:bg-brand-soft dark:border-white/10"
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
        <div className="rounded-2xl bg-brand px-8 py-12 text-center text-white">
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
