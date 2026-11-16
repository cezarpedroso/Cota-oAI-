import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";
import { signup } from "@/lib/auth/actions";

export default function Page() {
  return (
    <AuthLayout
      title="Centralize suas compras"
      description="Crie seu espaço de trabalho e organize cada etapa da cotação com mais segurança."
    >
      <AuthForm action={signup} signup />
      <p className="mt-6 text-sm text-slate-600">
        Já possui uma conta?{" "}
        <Link
          className="font-semibold text-blue-700 hover:text-blue-800"
          href="/login"
        >
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
