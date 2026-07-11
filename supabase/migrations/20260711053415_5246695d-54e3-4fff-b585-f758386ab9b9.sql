
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.orders; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.moderation_reports; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.support_messages REPLICA IDENTITY FULL;
ALTER TABLE public.moderation_reports REPLICA IDENTITY FULL;
ALTER TABLE public.audit_logs REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION public.dispatch_edge(_fn text, _payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _url text := 'https://ywsifybmeenwvrnqfbmq.supabase.co/functions/v1/' || _fn;
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := _url,
      headers := jsonb_build_object('Content-Type','application/json'),
      body := _payload
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'edge dispatch % failed: %', _fn, SQLERRM;
  END;
END $$;

CREATE OR REPLACE FUNCTION public.trg_payment_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.dispatch_edge('payments-verify', jsonb_build_object('type','INSERT','table','payments','record',row_to_json(NEW)));
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.trg_order_status_changed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.dispatch_edge('notifications-dispatch',
      jsonb_build_object('type','order.status_changed','table','orders',
        'old_status', OLD.status, 'new_status', NEW.status,
        'record', row_to_json(NEW)));
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.trg_delivery_task_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.dispatch_edge('delivery-dispatch', jsonb_build_object('type','INSERT','table','delivery_tasks','record',row_to_json(NEW)));
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.trg_moderation_report_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.dispatch_edge('moderation-automation', jsonb_build_object('type','INSERT','table','moderation_reports','record',row_to_json(NEW)));
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_payment_created ON public.payments;
CREATE TRIGGER on_payment_created AFTER INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.trg_payment_created();

DROP TRIGGER IF EXISTS on_order_status_changed ON public.orders;
CREATE TRIGGER on_order_status_changed AFTER UPDATE OF status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.trg_order_status_changed();

DROP TRIGGER IF EXISTS on_delivery_task_created ON public.delivery_tasks;
CREATE TRIGGER on_delivery_task_created AFTER INSERT ON public.delivery_tasks
FOR EACH ROW EXECUTE FUNCTION public.trg_delivery_task_created();

DROP TRIGGER IF EXISTS on_moderation_report_created ON public.moderation_reports;
CREATE TRIGGER on_moderation_report_created AFTER INSERT ON public.moderation_reports
FOR EACH ROW EXECUTE FUNCTION public.trg_moderation_report_created();
