"use server";
import { createClient } from "@/lib/supabase/server";
import { extractQuotation } from "@/lib/openrouter";
import { extractionSchema } from "./schema";
export async function extractQuotationAction(rfqId: string, rawText: string) {
  if (!rawText.trim() || rawText.length > 30_000)
    throw new Error("Quotation text must contain at most 30,000 characters.");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required.");
  const { data } = await supabase
    .from("rfq_sessions")
    .select("id")
    .eq("id", rfqId)
    .maybeSingle();
  if (!data) throw new Error("RFQ not found or not authorized.");
  return extractionSchema.parse(await extractQuotation(rawText));
}
