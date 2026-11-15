"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
const credentials = z.object({
  email: z.email(),
  password: z.string().min(8),
  displayName: z.string().trim().min(2).max(80).optional(),
});
export type AuthState = { error?: string; message?: string };
export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const p = credentials
    .pick({ email: true, password: true })
    .safeParse(Object.fromEntries(form));
  if (!p.success) return { error: "Informe e-mail e senha válidos." };
  const s = await createClient();
  const { error } = await s.auth.signInWithPassword(p.data);
  if (error)
    return { error: "Não foi possível entrar. Verifique suas credenciais." };
  redirect("/dashboard");
}
export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const p = credentials.safeParse(Object.fromEntries(form));
  if (!p.success)
    return { error: "Use um e-mail válido e senha com ao menos 8 caracteres." };
  const s = await createClient();
  const origin = (await import("next/headers")).headers;
  const h = await origin();
  const { error } = await s.auth.signUp({
    email: p.data.email,
    password: p.data.password,
    options: {
      data: { display_name: p.data.displayName },
      emailRedirectTo: `${h.get("origin")}/auth/callback`,
    },
  });
  if (error) return { error: "Não foi possível criar a conta." };
  return { message: "Conta criada. Confirme seu e-mail para continuar." };
}
export async function logout() {
  const s = await createClient();
  await s.auth.signOut();
  redirect("/login");
}
