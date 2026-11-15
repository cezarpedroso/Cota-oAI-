import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { signup } from "@/lib/auth/actions";
export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <section className="w-full rounded-xl bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold">Criar conta</h1>
        <p className="my-5 text-slate-600">Comece a organizar suas cotações.</p>
        <AuthForm action={signup} signup />
        <p className="mt-5 text-sm">
          Já possui conta?{" "}
          <Link className="text-emerald-700" href="/login">
            Entrar
          </Link>
        </p>
      </section>
    </main>
  );
}
