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
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-gradient-brand text-lg font-bold tracking-tight">
          LearnSysDes
        </Link>
        <div className="flex items-center gap-6 text-sm">
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
              <span className="text-black/50 dark:text-white/50">
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
      </nav>
    </header>
  );
}
