export class ExtractionQuotaError extends Error {
  constructor(
    message: string,
    public readonly code: "rate_limit" | "daily_quota",
  ) {
    super(message);
    this.name = "ExtractionQuotaError";
  }
}

type QuotaRpcResponse = {
  data: Array<{ window_remaining: number; daily_remaining: number }> | null;
  error: { code?: string; message: string } | null;
};

export type ExtractionQuotaClient = {
  rpc: (
    functionName: "consume_ai_extraction_quota",
  ) => PromiseLike<QuotaRpcResponse>;
};

export async function consumeExtractionQuota(
  client: ExtractionQuotaClient,
): Promise<{ windowRemaining: number; dailyRemaining: number }> {
  const { data, error } = await client.rpc("consume_ai_extraction_quota");

  if (error) {
    if (error.message.includes("ai_extraction_rate_limit_exceeded")) {
      throw new ExtractionQuotaError(
        "You have reached the short-term extraction limit. Please try again in a minute.",
        "rate_limit",
      );
    }

    if (error.message.includes("ai_extraction_daily_quota_exceeded")) {
      throw new ExtractionQuotaError(
        "You have reached today's extraction limit. Please try again tomorrow.",
        "daily_quota",
      );
    }

    throw new Error(
      "Unable to verify the AI extraction limit. Please try again.",
    );
  }

  const quota = data?.[0];
  if (!quota) {
    throw new Error(
      "Unable to verify the AI extraction limit. Please try again.",
    );
  }

  return {
    windowRemaining: quota.window_remaining,
    dailyRemaining: quota.daily_remaining,
  };
}
