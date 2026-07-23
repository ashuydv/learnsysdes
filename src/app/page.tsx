import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Learn System Design by doing it
      </h1>
      <p className="mt-4 text-lg text-black/60 dark:text-white/60">
        Work through high-level design fundamentals, then practice on an
        interactive whiteboard with 5 classic HLD problems — URL shortener,
        rate limiter, chat app, notifications, and checkout.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/sign-up"
          className="rounded-md bg-black px-5 py-2.5 text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
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
  );
}
