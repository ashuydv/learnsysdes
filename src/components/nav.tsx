import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export async function Nav() {
  const session = await auth();

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-gradient-brand text-lg font-bold tracking-tight">
          LearnSysDes
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 text-sm sm:flex">
          {session?.user ? (
            <>
              <Link href="/dashboard" className="hover:text-brand-via">
                Dashboard
              </Link>
              <Link href="/modules" className="hover:text-brand-via">
                Modules
              </Link>
              <Link href="/problems" className="hover:text-brand-via">
                Problems
              </Link>
              <span className="max-w-[12rem] truncate text-black/50 dark:text-white/50">
                {session.user.email}
              </span>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="rounded-md border border-black/10 px-3 py-1.5 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="hover:text-brand-via">
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="btn-gradient rounded-md px-3 py-1.5 font-medium shadow-sm shadow-brand-via/20"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile nav */}
        <details className="group relative sm:hidden">
          <summary
            className="flex h-9 w-9 list-none items-center justify-center rounded-md border border-black/10 [&::-webkit-details-marker]:hidden dark:border-white/15"
            aria-label="Toggle menu"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </summary>
          <div className="absolute right-0 top-full z-10 mt-2 flex w-56 flex-col gap-1 rounded-lg border border-black/10 bg-[var(--background)] p-3 text-sm shadow-lg dark:border-white/15">
            {session?.user ? (
              <>
                <span className="truncate px-2 pb-2 text-black/50 dark:text-white/50">
                  {session.user.email}
                </span>
                <Link href="/dashboard" className="rounded-md px-2 py-1.5 hover:bg-brand-via/5">
                  Dashboard
                </Link>
                <Link href="/modules" className="rounded-md px-2 py-1.5 hover:bg-brand-via/5">
                  Modules
                </Link>
                <Link href="/problems" className="rounded-md px-2 py-1.5 hover:bg-brand-via/5">
                  Problems
                </Link>
                <form action={handleSignOut} className="mt-1">
                  <button
                    type="submit"
                    className="w-full rounded-md border border-black/10 px-3 py-1.5 text-left hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/sign-in" className="rounded-md px-2 py-1.5 hover:bg-brand-via/5">
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="btn-gradient rounded-md px-3 py-1.5 text-center font-medium"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </details>
      </nav>
    </header>
  );
}
