-- Keep one unique index for each provider idempotency key.
-- The remaining *_key indexes cover provider_event_id and provider_reference.
DROP INDEX IF EXISTS public.payment_transactions_provider_event_uidx;
DROP INDEX IF EXISTS public.payment_transactions_provider_reference_uidx;
DROP INDEX IF EXISTS public.payment_transactions_provider_reference_key;
