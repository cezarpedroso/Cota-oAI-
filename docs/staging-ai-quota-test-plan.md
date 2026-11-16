# Staging AI quota migration and integration plan

This plan is for a staging Supabase project only. It does not call OpenRouter
and does not require production supplier data.

## Apply and inspect

1. Confirm the staging project migration history is aligned with the repository.
2. Apply `20261116090226_ai_extraction_quotas.sql` to staging through the
   approved migration workflow.
3. Run Supabase security advisors.
4. Confirm RLS is enabled for all three quota tables, direct table privileges
   are revoked from `anon` and `authenticated`, and only `authenticated` has
   `EXECUTE` on `public.consume_ai_extraction_quota()`.

## Authenticated RPC checks

Use two ordinary authenticated clients with the publishable key. Do not use a
service-role key to simulate application users.

1. User A calls `consume_ai_extraction_quota()` and receives remaining quota.
2. Call it concurrently more times than the per-minute limit. Exactly the
   configured limit must succeed; all additional calls must return
   `ai_extraction_rate_limit_exceeded`.
3. Temporarily lower the staging daily limit through an administrator-only
   database session, consume it as User A, then verify the next request returns
   `ai_extraction_daily_quota_exceeded`. Restore the normal value afterward.
4. Verify User B has an independent quota window and cannot observe or modify
   User A's usage rows through the Data API.

## Unauthenticated and direct-access checks

1. An anonymous client calling the RPC must receive a permission error because
   `anon` has no execute grant.
2. Anonymous and authenticated clients must both fail to select, insert,
   update, or delete quota configuration and usage rows directly.
3. Confirm a quota rejection occurs before any OpenRouter request. This can be
   verified in an application-level test with a mocked fetch implementation.

## Rollback posture

The migration only adds isolated quota tables and one function. If staging
validation fails, do not run a destructive rollback against production. Create
and review a separate rollback migration after identifying the fault.
