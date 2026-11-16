# QuoteAI

Supplier comparison is available from each RFQ. See
[comparison rules and manual tests](docs/supplier-comparison.md).

QuoteAI is a procurement workspace for creating RFQs, collecting supplier
quotations, and reviewing AI-assisted extraction before a user saves data.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the required values.
3. Run `npm run dev` and open `http://localhost:3000`.

`OPENROUTER_API_KEY` is server-only. Do not use a `NEXT_PUBLIC_` prefix and do
not commit `.env.local`.

## Quality checks

```bash
npx tsc --noEmit
npm run lint
npm run test --if-present
npm run build
```

The default test command runs offline unit and component tests only.
Use `npm run test:integration` explicitly for live RLS tests with two ordinary
test users against a dedicated test database.
See [Phase 0 verification](docs/phase0-verification.md) for numeric rules,
the pending corrective migration, disposable PostgreSQL tests, and smoke testing.

## Vercel deployment configuration

Add the following environment variables to the Vercel Production environment:

| Variable                               | Visibility           | Purpose                               |
| -------------------------------------- | -------------------- | ------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Public               | Supabase project URL                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public               | Browser-safe Supabase publishable key |
| `OPENROUTER_API_KEY`                   | Secret               | Server-only OpenRouter credential     |
| `OPENROUTER_MODEL_PRIMARY`             | Secret/configuration | Primary OpenRouter model identifier   |

Do not add test-user variables to Vercel Production. Never configure a
Supabase service-role key in this application.

In Supabase Auth, set the **Site URL** to the production Vercel URL and add
`https://your-production-domain/auth/callback` to **Redirect URLs**. Add a
preview callback URL only if Vercel preview deployments must support email
confirmation.

Enable Supabase Auth's leaked-password protection before public signup.

## AI extraction limits

The migration `ai_extraction_quotas` introduces a database-enforced quota of
5 extraction requests per user per minute and 50 per user per day. The values
are stored in the private `ai_extraction_limit_config` table and can only be
changed by a database administrator. There are no direct API grants to quota
or usage tables.

The migration must be reviewed and applied to the intended Supabase project
before enabling OpenRouter extraction in production. The application does not
send supplier text to OpenRouter when quota consumption fails.

## Production smoke test

After deployment, use a non-production test account to:

1. Sign up and complete email confirmation through `/auth/callback`.
2. Confirm an invalid callback URL returns to login with a safe error.
3. Sign in, create an RFQ, and verify another test user cannot read it.
4. Create a manual quotation with nullable commercial fields.
5. Run one approved AI extraction and confirm results remain a review-only
   draft until the user submits the quotation form.
6. Verify the per-minute and daily limits using a dedicated test account.

Do not use production supplier data or paid OpenRouter calls for automated
tests.
