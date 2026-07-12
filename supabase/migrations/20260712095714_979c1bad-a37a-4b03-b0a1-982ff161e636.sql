
CREATE OR REPLACE FUNCTION public.support_ticket_transition(_id uuid, _new_status text, _reason text DEFAULT NULL)
RETURNS public.support_tickets
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _t public.support_tickets;
  _old text;
  _allowed text[];
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO _t FROM public.support_tickets WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ticket not found'; END IF;
  _old := _t.status;
  IF _old = _new_status THEN RETURN _t; END IF;

  _allowed := CASE _old
    WHEN 'open'      THEN ARRAY['pending','escalated','resolved','closed']
    WHEN 'pending'   THEN ARRAY['open','escalated','resolved','closed']
    WHEN 'escalated' THEN ARRAY['pending','resolved','closed']
    WHEN 'resolved'  THEN ARRAY['open','closed']
    WHEN 'closed'    THEN ARRAY['open']
    ELSE ARRAY[]::text[]
  END;

  IF NOT (_new_status = ANY(_allowed)) THEN
    RAISE EXCEPTION 'invalid transition % -> %', _old, _new_status USING ERRCODE = '22023';
  END IF;

  UPDATE public.support_tickets
    SET status = _new_status,
        resolved_at = CASE WHEN _new_status IN ('resolved','closed') THEN COALESCE(resolved_at, now()) ELSE NULL END,
        updated_at = now()
    WHERE id = _id
    RETURNING * INTO _t;

  INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, before, after)
  VALUES ('ticket.status', 'support_ticket', _id, auth.uid(),
          jsonb_build_object('status', _old),
          jsonb_build_object('status', _new_status, 'reason', _reason));
  RETURN _t;
END $$;

REVOKE ALL ON FUNCTION public.support_ticket_transition(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.support_ticket_transition(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.support_ticket_assign(_id uuid, _assignee uuid)
RETURNS public.support_tickets
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _t public.support_tickets; _old uuid;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF _assignee IS NOT NULL AND NOT public.is_staff(_assignee) THEN
    RAISE EXCEPTION 'assignee must be staff' USING ERRCODE = '22023';
  END IF;
  SELECT assigned_to INTO _old FROM public.support_tickets WHERE id = _id;
  UPDATE public.support_tickets SET assigned_to = _assignee, updated_at = now()
    WHERE id = _id RETURNING * INTO _t;
  INSERT INTO public.audit_logs (action, entity_type, entity_id, actor_id, before, after)
  VALUES ('ticket.assign', 'support_ticket', _id, auth.uid(),
          jsonb_build_object('assigned_to', _old),
          jsonb_build_object('assigned_to', _assignee));
  RETURN _t;
END $$;

REVOKE ALL ON FUNCTION public.support_ticket_assign(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.support_ticket_assign(uuid, uuid) TO authenticated;
