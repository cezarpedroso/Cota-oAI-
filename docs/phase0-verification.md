# Phase 0: reliability and correctness

The application retains Next.js, Supabase, React Hook Form, Zod, Decimal.js,
OpenRouter and Vitest. No production migrations are applied by tests.

## Numeric contract

Form inputs and RPC numeric arguments use decimal strings. Monetary inputs and
quantities accept at most 14 integer digits and four fractional digits, matching
numeric(18,4). Negative values, exponent notation, non-finite values and excess
precision are rejected. Quantity must be positive. Blank optional amounts become
NULL; explicit zero remains zero. Currency may be unknown.

Line totals use quantity * unit price, rounded half up to four decimal places.
Decimal.js uses a private 40-digit calculation context. Totals are recomputed
in the action and, after migration approval, by a database trigger for every
new/updated quotation line. Historical records are not rewritten.

Detail queries cast PostgreSQL numerics to text before JSON serialization.
Displaying a legacy quotation recomputes its total rather than trusting an old
independently supplied line_total. Unknown currency is explicitly labeled.
Four decimal places are displayed without converting through JavaScript Number.

Generated database.types.ts represents the remote schema. database.ts refines
numeric RPC arguments to strings/null, which PostgREST accepts, without changing
generated row types or hiding query errors behind casts.

## Forward migration — approval required

20261116145550_phase0_correctness.sql:

- Protects referenced RFQ items using a deferred NO ACTION composite foreign key.
  A whole-RFQ deletion still cascades its items and quotations in one transaction.
- Validates item arrays, sizes, quantities, precision, currencies, lengths,
  duplicates and associations inside both existing atomic RPCs.
- Derives line totals in PostgreSQL, including direct Data API writes.
- Adds finite-value checks without rewriting existing records. NOT VALID checks
  enforce new writes while allowing historical data to be audited before validation.

The FK replacement takes a table lock and validates existing relationships.
Review timing and obtain a recoverable backup before approved remote application.
Do not replay historical migrations. New helper functions are SECURITY INVOKER,
have fixed search paths, and have no anonymous execute grant.

Before approval: audit historical NaN values and inconsistent totals with read-only
queries. Correct historical values only with a separately reviewed data migration.

## Tests

- npm test: unit and DOM component tests only; no env file required.
- npm run test:integration: existing live Supabase tests. Requires two dedicated
  test accounts and a test database. It writes fixtures; do not target production.
- powershell -File tests/integration/run-phase0.ps1: disposable PostgreSQL 17 in
  Docker, no published ports or external network. Applies the complete local
  migration sequence and tests persistence, constraints, rollback, deletion and
  RLS under authenticated role with two simulated auth.uid identities. This is
  actual PostgreSQL authorization testing, not a live Supabase Auth login test.

The local bootstrap only supplies the Supabase auth schema contract. It must
never be run against an existing Supabase project.

Quotation form DOM tests use mocked Server Actions; action tests verify RPC
payloads and navigation. PostgreSQL tests separately verify persistence. A real
browser + hosted Supabase round trip is still a release smoke-test requirement:
sign in to staging, create an RFQ, save multiple quotation lines with fractional
prices and blank charges, reload details, and verify exact values and language.
Repeat with a second account and check referenced-item deletion is rejected.
No paid extraction is necessary.

## Operational notes

Default tests cannot accidentally run remote fixtures. Generated build caches
and Supabase CLI temporary metadata are ignored. Dashboard query failures show
an error rather than fabricated zero metrics. Mobile navigation includes logout.
AI application remains explicit and unverified; applying suggestions requires
confirmation and item associations are left unselected for human review.
