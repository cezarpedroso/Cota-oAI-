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
    <form action={formAction} className="space-y-4">
      {signup && (
        <input
          name="displayName"
          placeholder="Nome"
          className="w-full rounded border p-3"
          required
        />
      )}
      <input
        name="email"
        type="email"
        placeholder="E-mail"
        className="w-full rounded border p-3"
        required
      />
      <input
        name="password"
        type="password"
        placeholder="Senha"
        minLength={8}
        className="w-full rounded border p-3"
        required
      />
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      {state.message && (
        <p className="text-sm text-emerald-700">{state.message}</p>
      )}
      <button
        disabled={pending}
        className="w-full rounded bg-emerald-700 p-3 text-white disabled:opacity-60"
      >
        {pending ? "Aguarde…" : signup ? "Criar conta" : "Entrar"}
      </button>
    </form>
  );
}
