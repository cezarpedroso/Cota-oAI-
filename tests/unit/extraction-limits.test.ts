import { describe, expect, it, vi } from "vitest";
import {
  consumeExtractionQuota,
  ExtractionQuotaError,
  type ExtractionQuotaClient,
} from "../../src/features/extraction/limits";

const allowed: ExtractionQuotaClient = {
  rpc: vi.fn().mockResolvedValue({
    data: [{ window_remaining: 4, daily_remaining: 49 }],
    error: null,
  }),
};

describe("AI extraction quotas", () => {
  it("returns remaining quota after a successful atomic consumption", async () => {
    await expect(consumeExtractionQuota(allowed)).resolves.toEqual({
      windowRemaining: 4,
      dailyRemaining: 49,
    });
  });

  it("returns a safe error when the per-minute quota is exhausted", async () => {
    const client: ExtractionQuotaClient = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "ai_extraction_rate_limit_exceeded" },
      }),
    };

    await expect(consumeExtractionQuota(client)).rejects.toMatchObject({
      name: "ExtractionQuotaError",
      code: "rate_limit",
    } satisfies Partial<ExtractionQuotaError>);
  });

  it("returns a safe error when the daily quota is exhausted", async () => {
    const client: ExtractionQuotaClient = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "ai_extraction_daily_quota_exceeded" },
      }),
    };

    await expect(consumeExtractionQuota(client)).rejects.toMatchObject({
      name: "ExtractionQuotaError",
      code: "daily_quota",
    } satisfies Partial<ExtractionQuotaError>);
  });

  it("does not treat concurrent quota responses as duplicate successes", async () => {
    const responses = [
      { data: [{ window_remaining: 0, daily_remaining: 49 }], error: null },
      {
        data: null,
        error: { message: "ai_extraction_rate_limit_exceeded" },
      },
    ];
    const client: ExtractionQuotaClient = {
      rpc: vi.fn().mockImplementation(async () => responses.shift()),
    };

    const results = await Promise.allSettled([
      consumeExtractionQuota(client),
      consumeExtractionQuota(client),
    ]);

    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected"),
    ).toHaveLength(1);
  });
});
