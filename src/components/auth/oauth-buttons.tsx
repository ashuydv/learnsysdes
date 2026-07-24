"use client";

import { signIn } from "next-auth/react";

export function OAuthButtons({
  google,
  github,
  callbackUrl,
}: {
  google: boolean;
  github: boolean;
  callbackUrl: string;
}) {
  if (!google && !github) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex items-center gap-3 text-xs text-black/40 dark:text-white/40">
        <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
        or continue with
        <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
      </div>
      {google && (
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="rounded-md border border-black/10 px-4 py-2 text-sm transition-colors hover:border-brand-via/40 hover:bg-brand-via/5 dark:border-white/15"
        >
          Continue with Google
        </button>
      )}
      {github && (
        <button
          type="button"
          onClick={() => signIn("github", { callbackUrl })}
          className="rounded-md border border-black/10 px-4 py-2 text-sm transition-colors hover:border-brand-via/40 hover:bg-brand-via/5 dark:border-white/15"
        >
          Continue with GitHub
        </button>
      )}
    </div>
  );
}
