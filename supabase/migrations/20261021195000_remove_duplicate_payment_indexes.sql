-- The table already has full unique indexes/constraints for these provider keys.
-- These partial indexes enforce the same uniqueness on non-null values and are redundant.
DROP INDEX IF EXISTS public.payment_transactions_provider_event_uidx;
DROP INDEX IF EXISTS public.payment_transactions_provider_reference_uidx;
