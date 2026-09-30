
ALTER TABLE public.ai_workflows
  ADD COLUMN IF NOT EXISTS schedule_interval_minutes integer,
  ADD COLUMN IF NOT EXISTS schedule_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS event_trigger text,
  ADD COLUMN IF NOT EXISTS event_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE public.ai_workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.ai_workflows(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued',
  trigger_source text NOT NULL DEFAULT 'manual',
  input text NOT NULL,
  output text,
  error text,
  error_status integer,
  retry_of uuid REFERENCES public.ai_workflow_runs(id) ON DELETE SET NULL,
  attempt integer NOT NULL DEFAULT 1,
  idempotency_key text NOT NULL UNIQUE,
  triggered_by uuid,
  event_payload jsonb,
  diagnosis text,
  started_at timestamptz,
  finished_at timestamptz,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_workflow_runs_wf_idx ON public.ai_workflow_runs(workflow_id, created_at DESC);
CREATE INDEX ai_workflow_runs_status_idx ON public.ai_workflow_runs(status, created_at);
CREATE UNIQUE INDEX ai_workflow_runs_one_retry ON public.ai_workflow_runs(retry_of)
  WHERE retry_of IS NOT NULL AND status IN ('queued','running','succeeded');

GRANT SELECT ON public.ai_workflow_runs TO authenticated;
GRANT ALL ON public.ai_workflow_runs TO service_role;
ALTER TABLE public.ai_workflow_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read workflow runs" ON public.ai_workflow_runs
  FOR SELECT TO authenticated USING (private.is_staff(auth.uid()));

CREATE TABLE public.ai_scheduler_state (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  locked_until timestamptz,
  paused_reason text,
  last_tick_at timestamptz
);
GRANT ALL ON public.ai_scheduler_state TO service_role;
ALTER TABLE public.ai_scheduler_state ENABLE ROW LEVEL SECURITY;
INSERT INTO public.ai_scheduler_state(id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.enqueue_workflow_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _evt text := TG_TABLE_NAME || '.' || lower(TG_OP); _w record;
BEGIN
  FOR _w IN SELECT id FROM public.ai_workflows
            WHERE event_enabled AND is_active AND event_trigger = _evt LOOP
    INSERT INTO public.ai_workflow_runs(workflow_id, status, trigger_source, input, idempotency_key, event_payload)
    VALUES (_w.id, 'queued', 'event',
            'Event ' || _evt || E':\n' || left(row_to_json(NEW)::text, 6000),
            'evt:' || _w.id || ':' || TG_TABLE_NAME || ':' || NEW.id::text || ':' || lower(TG_OP),
            jsonb_build_object('event', _evt, 'record_id', NEW.id))
    ON CONFLICT (idempotency_key) DO NOTHING;
  END LOOP;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.enqueue_workflow_event() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER wf_evt_orders_ins AFTER INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.enqueue_workflow_event();
CREATE TRIGGER wf_evt_tickets_ins AFTER INSERT ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.enqueue_workflow_event();
CREATE TRIGGER wf_evt_reports_ins AFTER INSERT ON public.moderation_reports FOR EACH ROW EXECUTE FUNCTION public.enqueue_workflow_event();
CREATE TRIGGER wf_evt_products_ins AFTER INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.enqueue_workflow_event();
CREATE TRIGGER wf_evt_tailoring_ins AFTER INSERT ON public.tailoring_orders FOR EACH ROW EXECUTE FUNCTION public.enqueue_workflow_event();

ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_workflow_runs;
