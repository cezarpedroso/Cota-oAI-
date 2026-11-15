import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { login } from "@/lib/auth/actions";
export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <section className="w-full rounded-xl bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold">Entrar no CotaçãoAI</h1>
        <p className="my-5 text-slate-600">Acesse seu espaço de compras.</p>
        <AuthForm action={login} />
        <p className="mt-5 text-sm">
          Não tem conta?{" "}
          <Link className="text-emerald-700" href="/signup">
            Criar conta
          </Link>
        </p>
      </section>
    </main>
  );
}
