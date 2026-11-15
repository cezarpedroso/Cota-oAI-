import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <section className="max-w-xl text-center">
        <p className="mb-4 font-semibold tracking-wide text-emerald-700">
          COTAÇÃOAI
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Compras mais claras. Decisões melhores.
        </h1>
        <p className="mt-5 text-lg text-slate-600">
          Organize RFQs, centralize cotações e compare fornecedores com
          segurança.
        </p>
        <Link
          className="mt-8 inline-flex rounded-lg bg-emerald-700 px-5 py-3 font-medium text-white hover:bg-emerald-800"
          href="/login"
        >
          Acessar plataforma
        </Link>
      </section>
    </main>
  );
}
