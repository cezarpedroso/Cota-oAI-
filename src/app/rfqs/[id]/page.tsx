import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus, SquarePen } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { getLocale } from "@/lib/locale/server";

export const instant = false;

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;
  const { data } = await supabase
    .from("rfq_sessions")
    .select("*,rfq_items(id,description,quantity::text,unit),vendor_quotes(*)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const locale = await getLocale();

  return (
    <AppShell email={user.email ?? ""}>
      <div className="mx-auto max-w-6xl p-5 sm:p-8">
        <Link
          href="/rfqs"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Solicitações
        </Link>

        <header className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <div className="flex gap-2">
              <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                {data.status}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                {data.currency}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              {data.title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              {data.description || "Sem descrição."}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href={`/rfqs/${id}/compare`}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700"
            >
              {locale === "en" ? "Compare Suppliers" : "Comparar fornecedores"}
            </Link>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              href={`/rfqs/${id}/edit`}
            >
              <SquarePen size={16} />
              Editar
            </Link>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-950/15 transition hover:bg-blue-800"
              href={`/rfqs/${id}/quotes/new`}
            >
              <Plus size={16} />
              Adicionar cotação
            </Link>
          </div>
        </header>

        <section className="mt-10 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">Itens solicitados</h2>
            <span className="text-sm text-slate-500">
              {data.rfq_items.length} item(ns)
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {data.rfq_items.map(
              (item: {
                id: string;
                description: string;
                quantity: string;
                unit: string;
              }) => (
                <div
                  className="flex justify-between gap-4 px-5 py-4"
                  key={item.id}
                >
                  <span className="font-medium text-slate-800">
                    {item.description}
                  </span>
                  <span className="shrink-0 text-sm text-slate-500">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ),
            )}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold">Cotações de fornecedores</h2>
            <span className="text-sm text-slate-500">
              {data.vendor_quotes.length} registrada(s)
            </span>
          </div>
          {data.vendor_quotes.length ? (
            <div className="divide-y divide-slate-100">
              {data.vendor_quotes.map(
                (quote: {
                  id: string;
                  vendor_name: string;
                  status: string;
                  delivery_days: number | null;
                  currency: string | null;
                }) => (
                  <Link
                    className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-slate-50"
                    href={`/rfqs/${id}/quotes/${quote.id}`}
                    key={quote.id}
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {quote.vendor_name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {quote.status} ·{" "}
                        {quote.currency ?? "Moeda não informada"}
                      </p>
                    </div>
                    <span className="flex items-center gap-2 text-sm text-slate-500">
                      {quote.delivery_days === null
                        ? "Prazo não informado"
                        : `${quote.delivery_days} dias`}
                      <ArrowRight size={16} />
                    </span>
                  </Link>
                ),
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="font-medium">Ainda não há cotações</p>
              <p className="mt-1 text-sm text-slate-500">
                Adicione a primeira proposta de fornecedor para começar a
                comparar.
              </p>
              <Link
                href={`/rfqs/${id}/quotes/new`}
                className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Adicionar cotação
              </Link>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
