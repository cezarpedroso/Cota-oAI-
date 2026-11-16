import Link from "next/link";
import { ArrowLeft, FileText, ReceiptText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { formatMoney, lineTotal } from "@/lib/money";
import { getLocale } from "@/lib/locale/server";
export const instant = false;
export default async function Page({
  params,
}: {
  params: Promise<{ id: string; quoteId: string }>;
}) {
  const locale = await getLocale();
  const t = (en: string, pt: string) => (locale === "en" ? en : pt);
  const text = (value: string | number | null) =>
    value === null || value === "" ? t("Not provided", "Não informado") : value;
  const money = (value: string | null, currency: string | null) =>
    formatMoney(value, currency, locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { id, quoteId } = await params;
  const { data: quote, error } = await supabase
    .from("vendor_quotes")
    .select(
      "id,vendor_name,raw_text,currency,freight_cost::text,tax_amount::text,discount_amount::text,delivery_days,payment_terms,status,revision,quote_items(id,rfq_item_id,description,quantity::text,unit_price::text,unit,line_total::text,rfq_items(description))",
    )
    .eq("id", quoteId)
    .eq("rfq_id", id)
    .maybeSingle();
  if (error)
    throw new Error(
      t("Unable to load quotation.", "Não foi possível carregar a cotação."),
    );
  if (!quote) notFound();
  const items = quote.quote_items;
  return (
    <AppShell email={user.email ?? ""}>
      <main className="mx-auto max-w-5xl p-5 sm:p-8">
        <Link
          href={`/rfqs/${id}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          {t("Back to request", "Voltar para solicitação")}
        </Link>

        <header className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
              {t("Supplier quotation", "Cotação de fornecedor")}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
              {quote.vendor_name}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {text(quote.status)} · {t("Revision", "Revisão")}{" "}
              {text(quote.revision)}
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            {text(quote.currency)}
          </span>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            [t("Freight", "Frete"), money(quote.freight_cost, quote.currency)],
            [t("Taxes", "Impostos"), money(quote.tax_amount, quote.currency)],
            [
              t("Discount", "Desconto"),
              money(quote.discount_amount, quote.currency),
            ],
            [
              t("Delivery", "Prazo"),
              quote.delivery_days === null
                ? "Não informado"
                : `${quote.delivery_days} ${t("days", "dias")}`,
            ],
            [t("Payment terms", "Pagamento"), text(quote.payment_terms)],
            [t("Lines", "Linhas"), `${items.length} item(ns)`],
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
            <h2 className="font-semibold">
              {t("Quotation lines", "Itens cotados")}
            </h2>
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
                    {t("Requested item:", "Item solicitado:")}{" "}
                    {item.rfq_items.description}
                  </p>
                </div>
                <p className="text-sm text-slate-600">
                  {text(item.quantity)} {text(item.unit)} ×{" "}
                  {money(item.unit_price, quote.currency)}
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {money(
                    lineTotal(item.quantity, item.unit_price),
                    quote.currency,
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-4">
            <FileText className="text-blue-700" size={18} />
            <h2 className="font-semibold">
              {t("Original supplier text", "Texto original do fornecedor")}
            </h2>
          </div>
          <pre className="whitespace-pre-wrap break-words p-5 font-sans text-sm leading-6 text-slate-600">
            {text(quote.raw_text)}
          </pre>
        </section>
      </main>
    </AppShell>
  );
}
