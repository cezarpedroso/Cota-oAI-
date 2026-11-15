import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
export const instant = false;
type QuoteItem = { id: string; rfq_item_id: string; description: string | null; quantity: number | null; unit_price: number | null; unit: string | null; line_total: number | null };
const text = (value: string | number | null) => value ?? "Not provided";
const money = (value: number | null, currency: string | null) => value === null ? "Not provided" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency ?? "BRL" }).format(value);
export default async function Page({ params }: { params: Promise<{ id: string; quoteId: string }> }) {
 const supabase = await createClient(); if (!(await supabase.auth.getUser()).data.user) redirect("/login"); const { id, quoteId } = await params;
 const { data: quote } = await supabase.from("vendor_quotes").select("*,quote_items(id,rfq_item_id,description,quantity,unit_price,unit,line_total)").eq("id",quoteId).eq("rfq_id",id).maybeSingle(); if (!quote) notFound();
 const items: QuoteItem[] = quote.quote_items;
 return <main className="mx-auto max-w-4xl p-6"><h1 className="text-2xl font-semibold">{quote.vendor_name}</h1><p>{text(quote.status)} · Revision {text(quote.revision)}</p><dl><div>Currency: {text(quote.currency)}</div><div>Freight: {money(quote.freight_cost,quote.currency)}</div><div>Taxes: {money(quote.tax_amount,quote.currency)}</div><div>Discount: {money(quote.discount_amount,quote.currency)}</div><div>Delivery days: {text(quote.delivery_days)}</div><div>Payment terms: {text(quote.payment_terms)}</div></dl><pre>{text(quote.raw_text)}</pre><ul>{items.map((item) => <li key={item.id}>{text(item.description)} — RFQ item: {item.rfq_item_id} · {text(item.quantity)} {text(item.unit)} × {money(item.unit_price,quote.currency)} · Total: {money(item.line_total,quote.currency)}</li>)}</ul></main>;
}
