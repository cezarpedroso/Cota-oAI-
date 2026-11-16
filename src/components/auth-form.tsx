"use client";
import { useActionState } from "react";
import type { AuthState } from "@/lib/auth/actions";

export function AuthForm({
  action,
  signup = false,
}: {
  action: (s: AuthState, f: FormData) => Promise<AuthState>;
  signup?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-5" noValidate>
      {signup && (
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-800">
            Nome
          </span>
          <input
            name="displayName"
            placeholder="Como devemos chamar você?"
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
            autoComplete="name"
            required
          />
        </label>
      )}
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-800">
          E-mail
        </span>
        <input
          name="email"
          type="email"
          placeholder="voce@empresa.com"
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
          autoComplete="email"
          required
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-800">
          Senha
        </span>
        <input
          name="password"
          type="password"
          placeholder="Mínimo de 8 caracteres"
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
        {pending ? "Aguarde…" : signup ? "Criar conta" : "Entrar"}
      </button>
    </form>
  );
}
