import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { AuthLayout } from "@/components/auth-layout";
import { login } from "@/lib/auth/actions";

export default function Page() {
  return (
    <AuthLayout
      title="Bem-vindo de volta"
      description="Entre para acompanhar suas solicitações, cotações e decisões de compra."
    >
      <AuthForm action={login} />
      <p className="mt-6 text-sm text-slate-600">
        Ainda não usa o CotaçãoAI?{" "}
        <Link
          className="font-semibold text-blue-700 hover:text-blue-800"
          href="/signup"
        >
          Criar conta
        </Link>
      </p>
    </AuthLayout>
  );
}
