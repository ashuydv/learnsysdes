import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInForm } from "@/components/auth/sign-in-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  const target = callbackUrl ?? "/dashboard";

  if (session?.user) {
    redirect(target);
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-brand text-2xl font-bold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        Welcome back. Pick up where you left off.
      </p>
      <div className="mt-8">
        <SignInForm callbackUrl={target} />
        <OAuthButtons
          google={Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)}
          github={Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET)}
          callbackUrl={target}
        />
      </div>
      <p className="mt-6 text-sm text-black/60 dark:text-white/60">
        No account yet?{" "}
        <Link href="/sign-up" className="font-medium underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
