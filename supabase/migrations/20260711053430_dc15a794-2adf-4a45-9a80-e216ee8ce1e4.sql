
REVOKE EXECUTE ON FUNCTION public.dispatch_edge(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_payment_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_order_status_changed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_delivery_task_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_moderation_report_created() FROM PUBLIC, anon, authenticated;
