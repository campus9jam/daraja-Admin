CREATE OR REPLACE FUNCTION public.enqueue_workflow_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _evt text := TG_TABLE_NAME || '.' || lower(TG_OP); _w record; _n int := 0;
BEGIN
  FOR _w IN SELECT id FROM public.ai_workflows
            WHERE event_enabled AND is_active AND event_trigger = _evt LOOP
    INSERT INTO public.ai_workflow_runs(workflow_id, status, trigger_source, input, idempotency_key, event_payload)
    VALUES (_w.id, 'queued', 'event',
            'Event ' || _evt || E':\n' || left(row_to_json(NEW)::text, 6000),
            'evt:' || _w.id || ':' || TG_TABLE_NAME || ':' || NEW.id::text || ':' || lower(TG_OP),
            jsonb_build_object('event', _evt, 'record_id', NEW.id))
    ON CONFLICT (idempotency_key) DO NOTHING;
    _n := _n + 1;
  END LOOP;
  IF _n > 0 THEN
    BEGIN
      PERFORM net.http_post(
        url := 'https://project--70a69392-50bd-4dbc-a695-874b3eb30aa1.lovable.app/api/public/workflows/tick',
        headers := jsonb_build_object('Content-Type','application/json','x-scheduler-token',(SELECT token FROM public.ai_scheduler_state WHERE id=1)),
        body := '{}'::jsonb);
    EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'workflow wake failed: %', SQLERRM;
    END;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.enqueue_workflow_event() FROM PUBLIC, anon, authenticated;