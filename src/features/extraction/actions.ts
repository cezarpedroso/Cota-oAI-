"use server";
import { createClient } from "@/lib/supabase/server";
import {
  extractQuotation,
  OpenRouterRequestError,
} from "@/lib/openrouter";
import { ExtractionQuotaError, consumeExtractionQuota } from "./limits";
import { extractionSchema, type Extraction } from "./schema";

export type ExtractionActionResult =
  { data: Extraction; error: null } | { data: null; error: string };

const extractionDiagnostics: Record<string, string> = {
  unauthenticated: "Extraction request rejected: unauthenticated session.",
  rfq_access: "Extraction request rejected: RFQ access could not be verified.",
  quota_rpc: "Extraction quota service is temporarily unavailable. Please try again.",
  configuration: "AI extraction is not configured on this server.",
  provider: "The AI provider is temporarily unavailable. Please try again.",
  response: "The AI provider returned data that could not be verified.",
};

function reportExtractionFailure(code: keyof typeof extractionDiagnostics) {
  // Deliberately log only a stable code. Never log quotation text, credentials,
  // access tokens, or the provider response.
  console.error(`[extraction:${code}]`);
  return extractionDiagnostics[code];
}

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
  if (!user) {
    return { data: null, error: reportExtractionFailure("unauthenticated") };
  }
  const { data, error } = await supabase
    .from("rfq_sessions")
    .select("id")
    .eq("id", rfqId)
    .maybeSingle();
  if (error || !data) {
    return { data: null, error: reportExtractionFailure("rfq_access") };
  }

  try {
    await consumeExtractionQuota(supabase);
  } catch (quotaError) {
    if (quotaError instanceof ExtractionQuotaError) {
      return { data: null, error: quotaError.message };
    }
    console.error("[extraction:quota_rpc]");
    return {
      data: null,
      error: "Extraction quota service is temporarily unavailable. Please try again.",
    };
  }

  try {
    return {
      data: extractionSchema.parse(await extractQuotation(rawText)),
      error: null,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "AI extraction is not configured.") {
      return { data: null, error: reportExtractionFailure("configuration") };
    }
    if (error instanceof OpenRouterRequestError) {
      if (error.kind === "response") {
        return { data: null, error: reportExtractionFailure("response") };
      }
      if (error.kind === "timeout") {
        return { data: null, error: reportExtractionFailure("provider") };
      }
      console.error(
        `[extraction:provider_${error.kind}${error.status ? `_${error.status}` : ""}]`,
      );
      return { data: null, error: reportExtractionFailure("provider") };
    }
    return { data: null, error: reportExtractionFailure("provider") };
  }
}
