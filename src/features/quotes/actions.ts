"use server";
import { createClient } from "@/lib/supabase/server";
import { quoteSchema } from "./schema";
import { z } from "zod";
import { revalidatePath } from "next/cache";
export async function createQuote(
  rfqId: string,
  payload: unknown,
): Promise<
  | { href: string; error: null }
  | { href: null; error: "invalid" | "unauthorized" | "save" }
> {
  const parsedId = z.string().uuid().safeParse(rfqId);
  const p = quoteSchema.safeParse(payload);
  if (!parsedId.success || !p.success) return { href: null, error: "invalid" };
  const s = await createClient();
  const {
    data: { user },
    error: authError,
  } = await s.auth.getUser();
  if (authError || !user) return { href: null, error: "unauthorized" };
  const owner = await s
    .from("rfq_sessions")
    .select("id")
    .eq("id", rfqId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (owner.error || !owner.data) return { href: null, error: "unauthorized" };
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
  if (error || !data) return { href: null, error: "save" };
  revalidatePath("/dashboard");
  revalidatePath("/rfqs");
  revalidatePath(`/rfqs/${rfqId}`);
  return { href: `/rfqs/${rfqId}/quotes/${data}`, error: null };
}
