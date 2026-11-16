# Supplier comparison

Open an RFQ and select Compare Suppliers / Comparar fornecedores.
The read-only route is /rfqs/[id]/compare. It checks the authenticated user,
validates the UUID, filters by both RFQ ID and owner, and retains existing RLS.
No new database objects, mutations, provider calls or credentials are needed.

Numeric columns are selected as PostgreSQL text and validated with Zod.
Line extensions reuse Phase 0 rounding (half up, four decimals). Subtotal is the
sum of extensions; final total = subtotal + freight + taxes - discount.
Unknown components keep totals unknown. Known subtotal is separately labeled.
Negative final totals, overflow, duplicate/unknown item associations and archived
quotes are ineligible. Quantities must exactly match requested quantities and
units must match after trimming and case normalization. No unit or FX conversion.

At least two financially complete offers in the RFQ currency are required for
min/max/spread or price scores. Spread is not realized savings. Delivery and
payment terms must additionally be present for an overall score.
Every quotation submission is shown separately; there is no stable supplier
entity or quote-revision grouping in the current schema.

Price and delivery use 100 * (max - value) / (max - min); identical values get 100.
Delivery is normalized across known lead times of financially comparable offers.
Missing delivery receives 0. Completeness = 100 * (fulfilled requested items +
known currency/freight/tax/discount/delivery/payment fields) / (requested items + 6).
Overall score is the weighted sum / 100, rounded to two decimals. Integer weights
must total 100 (defaults 60/25/15). Equal displayed scores remain ties, ordered by
quotation ID. Scores are relative decision support, never purchasing instructions.
Weights are local to the page and are not persisted. Payment text is displayed,
not interpreted as credit quality or scored for favorability.

## Manual verification

1. Sign in, open an owned RFQ with two matching requested-item quotations, and
   select Compare Suppliers. Check the detail links.
2. With explicit zero charges, verify decimal totals, min/max and price spread.
3. Leave one charge blank: its total must be unknown and excluded from ranking.
4. Change quantities/units or omit a requested item: verify warnings and exclusion.
5. Use a different currency: confirm no cross-currency ranking.
6. Omit delivery/payment: verify no overall score; missing delivery scores zero.
7. Change weights to 100/0/0 and 0/100/0. Invalid sums must leave prior weights active.
8. Check both language settings, desktop table and mobile cards.
9. Sign out: comparison redirects to login. Sign in as a second user and open
   the first user's RFQ comparison URL: expect not-found and no quotation data.
10. With zero/one quotation, verify useful guidance without a fabricated winner.

Automated tests cover the calculation engine, loader boundaries and component
weight/locale behavior. Hosted multi-user browser testing remains a manual check.
