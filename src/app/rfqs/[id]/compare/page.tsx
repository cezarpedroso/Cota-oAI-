import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SupplierComparison } from "@/components/supplier-comparison";
import { loadComparison } from "@/features/comparison/load";
import { getLocale } from "@/lib/locale/server";
export const instant = false;
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const result = await loadComparison(id);
  if (result.kind === "unauthenticated") redirect("/login");
  if (result.kind === "missing") notFound();
  if (result.kind === "error")
    return (
      <div role="alert" className="p-8">
        <p>
          {locale === "en"
            ? "Comparison unavailable. Some data could not be loaded or validated."
            : "Comparação indisponível. Não foi possível carregar ou validar alguns dados."}
        </p>
        <Link href={`/rfqs/${id}/compare`} className="underline">
          {locale === "en" ? "Try again" : "Tentar novamente"}
        </Link>
      </div>
    );
  return (
    <AppShell email={result.email}>
      <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
        <Link href={`/rfqs/${id}`} className="text-sm text-blue-700 underline">
          {locale === "en" ? "Back to request" : "Voltar para solicitação"}
        </Link>
        <h1 className="text-2xl font-semibold">
          {locale === "en" ? "Compare suppliers" : "Comparar fornecedores"} —{" "}
          {result.title}
        </h1>
        <SupplierComparison rfqId={id} data={result.data} locale={locale} />
      </main>
    </AppShell>
  );
}
