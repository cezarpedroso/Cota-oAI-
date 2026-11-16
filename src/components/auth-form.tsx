"use client";
import { useActionState } from "react";
import type { AuthState } from "@/lib/auth/actions";
import { getCopy } from "@/lib/locale/copy";
import type { Locale } from "@/lib/locale/types";

export function AuthForm({
  action,
  signup = false,
  locale,
}: {
  action: (s: AuthState, f: FormData) => Promise<AuthState>;
  signup?: boolean;
  locale: Locale;
}) {
  const t = getCopy(locale).auth;
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-5" noValidate>
      {signup && (
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-800">
            {t.name}
          </span>
          <input
            name="displayName"
            placeholder={t.namePlaceholder}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
            autoComplete="name"
            required
          />
        </label>
      )}
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-800">
          {t.email}
        </span>
        <input
          name="email"
          type="email"
          placeholder={t.emailPlaceholder}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
          autoComplete="email"
          required
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-800">
          {t.password}
        </span>
        <input
          name="password"
          type="password"
          placeholder={t.passwordPlaceholder}
          minLength={8}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
          autoComplete={signup ? "new-password" : "current-password"}
          required
        />
      </label>
      {state.error && (
        <p
          aria-live="polite"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}
      {state.message && (
        <p
          aria-live="polite"
          className="rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"
        >
          {state.message}
        </p>
      )}
      <button
        disabled={pending}
        className="w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-950/15 transition hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? t.wait : signup ? t.signUp : t.signIn}
      </button>
    </form>
  );
}
