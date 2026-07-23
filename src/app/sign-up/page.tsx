import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export default async function SignUpPage({
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
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-black/60 dark:text-white/60">
        Start learning system design, free.
      </p>
      <div className="mt-8">
        <SignUpForm callbackUrl={target} />
        <OAuthButtons
          google={Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)}
          github={Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET)}
          callbackUrl={target}
        />
      </div>
      <p className="mt-6 text-sm text-black/60 dark:text-white/60">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
