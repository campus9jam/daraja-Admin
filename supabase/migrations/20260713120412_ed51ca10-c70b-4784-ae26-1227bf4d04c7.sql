-- 1) Private schema for internal role-check helpers
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, authenticated, service_role;

ALTER FUNCTION public.is_admin(uuid) SET SCHEMA private;
ALTER FUNCTION public.is_staff(uuid) SET SCHEMA private;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;

REVOKE EXECUTE ON FUNCTION private.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.is_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2) Lock down handle_new_user (only auth trigger calls it)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 3) Convert support ticket RPCs to SECURITY INVOKER (they self-check staff)
ALTER FUNCTION public.support_ticket_transition(uuid, text, text) SECURITY INVOKER;
ALTER FUNCTION public.support_ticket_assign(uuid, uuid) SECURITY INVOKER;

-- The functions still reference is_staff without schema qualification;
-- redefine them with private.is_staff so the invoker path resolves it.
CREATE OR REPLACE FUNCTION public.support_ticket_transition(_id uuid, _new_status text, _reason text DEFAULT NULL)
RETURNS public.support_tickets
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  _t public.support_tickets;
  _old text;
  _allowed text[];
BEGIN
  IF NOT private.is_staff(auth.uid()) THEN
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

CREATE OR REPLACE FUNCTION public.support_ticket_assign(_id uuid, _assignee uuid)
RETURNS public.support_tickets
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE _t public.support_tickets; _old uuid;
BEGIN
  IF NOT private.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  IF _assignee IS NOT NULL AND NOT private.is_staff(_assignee) THEN
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

REVOKE EXECUTE ON FUNCTION public.support_ticket_transition(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.support_ticket_assign(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.support_ticket_transition(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.support_ticket_assign(uuid, uuid) TO authenticated, service_role;

-- 4) Tighten always-true INSERT policies
DROP POLICY IF EXISTS aud_insert ON public.audit_logs;
CREATE POLICY aud_insert ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id IS NULL OR actor_id = auth.uid());

DROP POLICY IF EXISTS ae_insert_any ON public.analytics_events;
CREATE POLICY ae_insert_any ON public.analytics_events FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS ct_insert ON public.conversion_tracking;
CREATE POLICY ct_insert ON public.conversion_tracking FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 5) Profiles: drop public exposure, add own-read, expose safe view
DROP POLICY IF EXISTS profiles_select_public_basic ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, username, display_name, avatar_url, bio, country, city, created_at
FROM public.profiles
WHERE deleted_at IS NULL;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 6) Bids: drop public exposure, add participant/staff read, expose safe view
DROP POLICY IF EXISTS bid_public_read ON public.bids;
CREATE POLICY bid_read_participant ON public.bids FOR SELECT TO authenticated
  USING (bidder_id = auth.uid() OR private.is_staff(auth.uid()));

CREATE OR REPLACE VIEW public.public_bids AS
SELECT id, auction_id, amount, is_winning, created_at
FROM public.bids;
GRANT SELECT ON public.public_bids TO anon, authenticated;