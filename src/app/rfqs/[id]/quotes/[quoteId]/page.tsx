import Link from "next/link";
import { ArrowLeft, FileText, ReceiptText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
export const instant = false;
type QuoteItem = {
  id: string;
  rfq_item_id: string;
  description: string | null;
  quantity: number | null;
  unit_price: number | null;
  unit: string | null;
  line_total: number | null;
};
const text = (value: string | number | null) => value ?? "Não informado";
const money = (value: number | null, currency: string | null) =>
  value === null
    ? "Não informado"
    : new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: currency ?? "BRL",
      }).format(value);
export default async function Page({
  params,
}: {
  params: Promise<{ id: string; quoteId: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { id, quoteId } = await params;
  const { data: quote } = await supabase
    .from("vendor_quotes")
    .select(
      "*,quote_items(id,rfq_item_id,description,quantity,unit_price,unit,line_total)",
    )
    .eq("id", quoteId)
    .eq("rfq_id", id)
    .maybeSingle();
  if (!quote) notFound();
  const items: QuoteItem[] = quote.quote_items;
  return (
    <AppShell email={user.email ?? ""}>
      <main className="mx-auto max-w-5xl p-5 sm:p-8">
        <Link
          href={`/rfqs/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Voltar para solicitação
        </Link>

        <header className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              Cotação de fornecedor
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              {quote.vendor_name}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {text(quote.status)} · Revisão {text(quote.revision)}
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            {text(quote.currency)}
          </span>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["Frete", money(quote.freight_cost, quote.currency)],
            ["Impostos", money(quote.tax_amount, quote.currency)],
            ["Desconto", money(quote.discount_amount, quote.currency)],
            [
              "Prazo",
              quote.delivery_days === null
                ? "Não informado"
                : `${quote.delivery_days} dias`,
            ],
            ["Pagamento", text(quote.payment_terms)],
            ["Linhas", `${items.length} item(ns)`],
          ].map(([label, value]) => (
            <div
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              key={label}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                {label}
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {value}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
            <ReceiptText className="text-blue-700" size={18} />
            <h2 className="font-semibold">Itens cotados</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div
                className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                key={item.id}
              >
                <div>
                  <p className="font-medium text-slate-800">
                    {text(item.description)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Item solicitado: {item.rfq_item_id}
                  </p>
                </div>
                <p className="text-sm text-slate-600">
                  {text(item.quantity)} {text(item.unit)} ×{" "}
                  {money(item.unit_price, quote.currency)}
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {money(item.line_total, quote.currency)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
            <FileText className="text-blue-700" size={18} />
            <h2 className="font-semibold">Texto original do fornecedor</h2>
          </div>
          <pre className="whitespace-pre-wrap break-words p-5 font-sans text-sm leading-6 text-slate-600">
            {text(quote.raw_text)}
          </pre>
        </section>
      </main>
    </AppShell>
  );
}
