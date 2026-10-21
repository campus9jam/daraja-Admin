# Backend hardening register — 21 October 2026

This is a reviewed implementation branch, not a declaration that production deployment has happened. Never put secret values in this repository.

## Confirmed defects / risks

1. **OPay webhook RPC argument mismatch (critical):** deployed `opay-webhook` passes `p_provider_event_id`, but `public.confirm_order_payment` accepts `p_provider`, `p_provider_reference`, `p_status`, and `p_metadata`. Successful callbacks therefore fail instead of confirming payment. The source in `supabase/functions/opay-webhook/index.ts` fixes the named arguments and puts the event identifier in metadata.
2. **OPay webhook error disclosure:** deployed handler returns raw database error text. New source logs only safe correlation details and returns a generic error.
3. **OPay payment initialization:** deployed function ignores errors when writing provider reference and cashier metadata, does not verify transaction status/amount/currency before starting checkout, and can make concurrent duplicate cashier requests. Requires an idempotency policy and a staging-provider test before deployment.
4. **Checkout delivery fee:** `create_checkout_order` recalculates item prices and reserves stock atomically, but trusts client-supplied `p_delivery_fee`. A production delivery tariff/quote source must be selected before changing this calculation; do not invent a fee formula.
5. **LEE awards:** `award-lee` accepts client-supplied amount and event type, then uses the service key to award the caller. This is a self-award vulnerability unless every event is independently validated. Do not expose a generic client-controlled award endpoint. Replace with narrowly-scoped server-side event handlers and/or an admin-only manual-award workflow; preserve legitimate earning events only after enumerating them.
6. **Payment settlement validation:** `confirm_order_payment` currently marks a transaction paid based on a successful callback and provider reference; its body does not compare provider-reported amount/currency with the expected transaction amount/currency. Add provider-specific amount parsing only after verifying OPay's exact callback schema and units. Do not mark a transaction paid if required amount/currency fields are missing or mismatched.
7. **Leema AI:** deployed function has `verify_jwt=false`, accepts a caller-controlled `systemPrompt`, and returns raw provider error text. Recommended: require JWT for authenticated app calls, ignore client-supplied system prompts, cap message/history lengths, sanitize errors, and rate-limit. If guest use is intentional, separate it into a rate-limited guest endpoint.
8. **Leema internal gateway:** deployed key selection uses the first value in `SUPABASE_SECRET_KEYS`, which is nondeterministic. Read a documented explicit key name; do not select arbitrary secret values. Its idempotency read/insert is not atomic; use a unique constraint plus atomic insert/upsert/claim and reject key reuse with a different request hash.
9. **Database:** duplicate unique indexes exist on `payment_transactions(provider, provider_event_id)` and `payment_transactions(provider, provider_reference)`; remove duplicates only after confirming dependencies. Keep the unique constraints and retain one suitable index per uniqueness rule.
10. **Profile privilege hardening:** production migration `harden_profiles_privileges` is already applied and verified. Regression-test signup/profile provisioning and edits.

## Required release gates

- Run staging checkout with OPay sandbox and a real signed success callback; confirm exactly one payment transaction settlement and one ledger settlement.
- Test bad signature, malformed JSON, duplicate callback, same event ID with a different reference, missing/mismatched amount, wrong currency, unknown reference, and callback replay.
- Verify OPay's signature timestamp units and callback schema from current merchant documentation before adding freshness or amount checks.
- Make delivery fee server-derived from an approved tariff table or trusted quote service.
- Replace generic LEE award path with event-specific server-authorized rules.
- Review admin/moderation roles and every exposed SECURITY DEFINER RPC; verify execute grants and internal authorization.
- Run Supabase security/performance advisors; fix FK indexes and auth-function RLS warnings after reviewing query plans.
- Enable leaked-password protection in Supabase Auth settings.
- Run app build/lint and onboarding/profile regression tests.

## Deployment status

No Edge Function deployment is implied by these source files. Deploy only through the supported authorized workflow, then verify the active function version and run the release gates above.
