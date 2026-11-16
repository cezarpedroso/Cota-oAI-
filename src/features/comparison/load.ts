import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { comparisonSchema } from "./engine";

export async function loadComparison(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return { kind: "unauthenticated" } as const;
  if (!z.string().uuid().safeParse(id).success)
    return { kind: "missing" } as const;
  const { data, error } = await supabase
    .from("rfq_sessions")
    .select(
      "id,title,currency,rfq_items(id,description,quantity::text,unit),vendor_quotes(id,vendor_name,currency,status,freight_cost::text,tax_amount::text,discount_amount::text,delivery_days,payment_terms,quote_items(rfq_item_id,quantity::text,unit_price::text,unit))",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) return { kind: "error" } as const;
  if (!data) return { kind: "missing" } as const;
  const parsed = comparisonSchema.safeParse({
    currency: data.currency,
    items: data.rfq_items,
    quotes: data.vendor_quotes,
  });
  if (!parsed.success) return { kind: "error" } as const;
  return {
    kind: "success",
    data: parsed.data,
    title: data.title,
    email: user.email ?? "",
  } as const;
}
