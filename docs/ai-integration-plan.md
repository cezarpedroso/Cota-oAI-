# OpenRouter extraction plan

Stage E will call OpenRouter only from server-side route handlers or server actions. `OPENROUTER_API_KEY` remains server-only; model identifiers will be configurable with `OPENROUTER_PRIMARY_MODEL` and `OPENROUTER_SECONDARY_MODEL`.

Raw supplier text will be sent with a versioned prompt requesting a strict JSON object. Zod will validate supplier terms and line items before they are presented to the user. Unknown freight, tax, discount, delivery, payment terms, quantities, and prices remain `null` rather than being inferred as zero.

Extraction is a review workflow: the model output is never committed directly to `vendor_quotes` or `quote_items`. A user reviews and edits it before an authenticated server-side write. Future `extraction_runs`, `prompt_versions`, and `audit_events` will record model ID, prompt version, input/output hashes, validation failures, latency, token usage, and user approval.

Requests will have bounded input sizes, timeouts, retry limits, per-user rate limits, usage ceilings, and safe error messages. Failed or malformed responses are retained only as audit metadata and never overwrite manually entered data.
