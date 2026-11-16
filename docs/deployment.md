# Deployment checklist

## Before deploying

- Enable leaked-password protection in Supabase Auth.
- Rotate any API credential that has been shared outside the secret manager.
- Configure Vercel environment variables listed in the README.
- Set Supabase Auth Site URL and allow only intentional `/auth/callback` URLs.
- Reconcile migration-version history before adopting an automated migration
  pipeline. Do not rerun or rename migrations that are already applied.

## Database migration workflow

Review migrations in `supabase/migrations` and apply them to a staging project
first. Verify RLS policies, RPC grants, and quota behavior with ordinary
authenticated users. Apply the same reviewed migration to production only in a
separate approved operation.

The quota migration uses a `SECURITY DEFINER` RPC because authenticated users
must not receive direct write access to their own usage counters. It checks
`auth.uid()` internally, limits execution to the authenticated role, revokes
public/anonymous execution, and uses a transaction-scoped advisory lock per
user to prevent concurrent quota bypasses.

## After deploying

Follow the production smoke-test procedure in the README. Review Supabase
security advisors after every database migration.
