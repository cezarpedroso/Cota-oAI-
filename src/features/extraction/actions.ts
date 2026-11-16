"use server";
import { createClient } from "@/lib/supabase/server";
import { extractQuotation } from "@/lib/openrouter";
import { ExtractionQuotaError, consumeExtractionQuota } from "./limits";
import { extractionSchema, type Extraction } from "./schema";

export type ExtractionActionResult =
  { data: Extraction; error: null } | { data: null; error: string };

const extractionUnavailable =
  "Unable to extract quotation data. Please try again.";

export async function extractQuotationAction(
  rfqId: string,
  rawText: string,
): Promise<ExtractionActionResult> {
  if (!rawText.trim() || rawText.length > 30_000) {
    return {
      data: null,
      error: "Quotation text must contain at most 30,000 characters.",
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: extractionUnavailable };
  const { data, error } = await supabase
    .from("rfq_sessions")
    .select("id")
    .eq("id", rfqId)
    .maybeSingle();
  if (error || !data) return { data: null, error: extractionUnavailable };

  try {
    await consumeExtractionQuota(supabase);
  } catch (quotaError) {
    if (quotaError instanceof ExtractionQuotaError) {
      return { data: null, error: quotaError.message };
    }
    return { data: null, error: extractionUnavailable };
  }

  try {
    return {
      data: extractionSchema.parse(await extractQuotation(rawText)),
      error: null,
    };
  } catch {
    return { data: null, error: extractionUnavailable };
  }
}
