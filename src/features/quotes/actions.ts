"use server";
import { createClient } from "@/lib/supabase/server";
import { quoteSchema } from "./schema";
import { redirect } from "next/navigation";
export async function createQuote(form: FormData) {
  const rfqId = String(form.get("rfqId"));
  const p = quoteSchema.safeParse(
    JSON.parse(String(form.get("payload") || "{}")),
  );
  if (!p.success) throw new Error("Cotação inválida.");
  const s = await createClient();
  if (!(await s.auth.getUser()).data.user) redirect("/login");
  const { data, error } = await s.rpc("create_quote_atomic", {
    p_rfq_id: rfqId,
    p_vendor_name: p.data.vendorName,
    p_raw_text: p.data.rawText || "",
    p_currency: p.data.currency,
    p_freight: p.data.freight,
    p_tax: p.data.tax,
    p_discount: p.data.discount,
    p_delivery: p.data.delivery,
    p_payment_terms: p.data.paymentTerms || "",
    p_items: p.data.items,
  });
  if (error || !data) throw new Error("Não foi possível criar a cotação.");
  redirect(`/rfqs/${rfqId}/quotes/${data}`);
}
