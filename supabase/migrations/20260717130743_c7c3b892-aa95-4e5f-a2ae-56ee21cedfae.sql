
CREATE TABLE IF NOT EXISTS public.staff_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role TEXT NOT NULL CHECK (requested_role IN ('tailor','logistics','vendor','designer','moderator','support')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','withdrawn')),
  business_name TEXT,
  bio TEXT,
  portfolio_urls TEXT[],
  coverage_areas TEXT[],
  id_document_url TEXT,
  extra JSONB DEFAULT '{}'::jsonb,
  reviewer_id UUID REFERENCES auth.users(id),
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, requested_role)
);

GRANT SELECT, INSERT, UPDATE ON public.staff_applications TO authenticated;
GRANT ALL ON public.staff_applications TO service_role;

ALTER TABLE public.staff_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY sa_read_own ON public.staff_applications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.is_staff(auth.uid()));
CREATE POLICY sa_insert_own ON public.staff_applications FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY sa_update_admin ON public.staff_applications FOR UPDATE TO authenticated
  USING (private.is_admin(auth.uid())) WITH CHECK (private.is_admin(auth.uid()));
CREATE POLICY sa_update_own_pending ON public.staff_applications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER trg_sa_updated BEFORE UPDATE ON public.staff_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AUCTION ENGINE
CREATE OR REPLACE FUNCTION public.place_bid(_auction_id UUID, _amount NUMERIC)
RETURNS public.bids
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _a public.auctions; _min_next NUMERIC; _increment NUMERIC := 100;
  _bid public.bids; _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'must be signed in' USING ERRCODE='42501'; END IF;
  SELECT * INTO _a FROM public.auctions WHERE id=_auction_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'auction not found'; END IF;
  IF _a.status <> 'live' THEN RAISE EXCEPTION 'auction is not live (status=%)', _a.status USING ERRCODE='22023'; END IF;
  IF _a.ends_at <= now() THEN RAISE EXCEPTION 'auction has ended' USING ERRCODE='22023'; END IF;
  _min_next := GREATEST(COALESCE(_a.current_bid,0) + _increment, COALESCE(_a.starting_price,0));
  IF _amount < _min_next THEN RAISE EXCEPTION 'bid % below minimum %', _amount, _min_next USING ERRCODE='22023'; END IF;
  INSERT INTO public.bids (auction_id, bidder_id, amount) VALUES (_auction_id, _uid, _amount) RETURNING * INTO _bid;
  UPDATE public.auctions
    SET current_bid=_amount, total_bids=COALESCE(total_bids,0)+1,
        ends_at = CASE WHEN ends_at - now() < interval '60 seconds' THEN now() + interval '60 seconds' ELSE ends_at END,
        updated_at = now()
    WHERE id=_auction_id;
  RETURN _bid;
END $$;
REVOKE EXECUTE ON FUNCTION public.place_bid(UUID,NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_bid(UUID,NUMERIC) TO authenticated;

CREATE OR REPLACE FUNCTION public.close_auction(_auction_id UUID)
RETURNS public.auctions
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _a public.auctions; _top public.bids; _order_id UUID; _order_no TEXT;
BEGIN
  IF NOT private.is_staff(auth.uid()) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  SELECT * INTO _a FROM public.auctions WHERE id=_auction_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'auction not found'; END IF;
  IF _a.status IN ('sold','unsold','cancelled','ended') THEN RETURN _a; END IF;
  SELECT * INTO _top FROM public.bids WHERE auction_id=_auction_id ORDER BY amount DESC, created_at ASC LIMIT 1;
  IF _top.id IS NOT NULL AND (_a.reserve_price IS NULL OR _top.amount >= _a.reserve_price) THEN
    UPDATE public.auctions SET status='sold', winner_id=_top.bidder_id, ended_at=now(), current_bid=_top.amount, updated_at=now()
      WHERE id=_auction_id RETURNING * INTO _a;
    INSERT INTO public.auction_winners (auction_id, user_id, winning_bid, notified_at)
    VALUES (_auction_id, _top.bidder_id, _top.amount, now()) ON CONFLICT DO NOTHING;
    _order_no := 'AUC-'||to_char(now(),'YYMMDD')||'-'||substr(_auction_id::text,1,6);
    INSERT INTO public.orders (order_number,user_id,status,subtotal,grand_total,currency,notes)
    VALUES (_order_no,_top.bidder_id,'pending',_top.amount,_top.amount,'KES','Auction win: '||_auction_id::text)
    RETURNING id INTO _order_id;
    INSERT INTO public.order_items (order_id,product_id,title,quantity,unit_price,line_total)
    VALUES (_order_id,_a.product_id, COALESCE(_a.title,'Auction lot'),1,_top.amount,_top.amount);
  ELSE
    UPDATE public.auctions SET status='unsold', ended_at=now(), updated_at=now() WHERE id=_auction_id RETURNING * INTO _a;
  END IF;
  INSERT INTO public.audit_logs (action,entity_type,entity_id,actor_id,after)
  VALUES ('auction.close','auction',_auction_id,auth.uid(),jsonb_build_object('status',_a.status,'winner_id',_a.winner_id,'final_price',_a.current_bid));
  RETURN _a;
END $$;
REVOKE EXECUTE ON FUNCTION public.close_auction(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.close_auction(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.auto_close_expired_auctions()
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _r RECORD; _n INT := 0;
BEGIN
  FOR _r IN SELECT id FROM public.auctions WHERE status='live' AND ends_at <= now() LOOP
    PERFORM public.close_auction(_r.id); _n := _n+1;
  END LOOP;
  RETURN _n;
END $$;
REVOKE EXECUTE ON FUNCTION public.auto_close_expired_auctions() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.auto_close_expired_auctions() TO authenticated, service_role;

-- STAFF ONBOARDING RPCs
CREATE OR REPLACE FUNCTION public.submit_staff_application(
  _role TEXT,_business_name TEXT,_bio TEXT,_portfolio_urls TEXT[],_coverage_areas TEXT[],_id_document_url TEXT
) RETURNS public.staff_applications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _row public.staff_applications; _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'must be signed in' USING ERRCODE='42501'; END IF;
  INSERT INTO public.staff_applications (user_id,requested_role,business_name,bio,portfolio_urls,coverage_areas,id_document_url)
  VALUES (_uid,_role,_business_name,_bio,_portfolio_urls,_coverage_areas,_id_document_url)
  ON CONFLICT (user_id,requested_role) DO UPDATE SET
    status='pending', business_name=EXCLUDED.business_name, bio=EXCLUDED.bio,
    portfolio_urls=EXCLUDED.portfolio_urls, coverage_areas=EXCLUDED.coverage_areas,
    id_document_url=EXCLUDED.id_document_url,
    reviewer_id=NULL, reviewer_notes=NULL, reviewed_at=NULL, updated_at=now()
  RETURNING * INTO _row;
  RETURN _row;
END $$;
REVOKE EXECUTE ON FUNCTION public.submit_staff_application(TEXT,TEXT,TEXT,TEXT[],TEXT[],TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_staff_application(TEXT,TEXT,TEXT,TEXT[],TEXT[],TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.approve_staff_application(_id UUID, _notes TEXT DEFAULT NULL)
RETURNS public.staff_applications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _app public.staff_applications; _profile public.profiles;
BEGIN
  IF NOT private.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  SELECT * INTO _app FROM public.staff_applications WHERE id=_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'application not found'; END IF;
  IF _app.status='approved' THEN RETURN _app; END IF;
  UPDATE public.staff_applications
    SET status='approved', reviewer_id=auth.uid(), reviewer_notes=_notes, reviewed_at=now(), updated_at=now()
    WHERE id=_id RETURNING * INTO _app;
  INSERT INTO public.user_roles (user_id,role) VALUES (_app.user_id, _app.requested_role::public.app_role) ON CONFLICT DO NOTHING;
  IF _app.requested_role='logistics' THEN
    SELECT * INTO _profile FROM public.profiles WHERE id=_app.user_id;
    INSERT INTO public.delivery_agents (user_id, full_name, phone, status, coverage_areas)
    VALUES (_app.user_id, COALESCE(_profile.display_name,_profile.username,'Agent'), _profile.phone, 'active', _app.coverage_areas)
    ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.audit_logs (action,entity_type,entity_id,actor_id,after)
  VALUES ('staff.approve','staff_application',_id,auth.uid(),
    jsonb_build_object('user_id',_app.user_id,'role',_app.requested_role,'notes',_notes));
  RETURN _app;
END $$;
REVOKE EXECUTE ON FUNCTION public.approve_staff_application(UUID,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_staff_application(UUID,TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_staff_application(_id UUID, _notes TEXT DEFAULT NULL)
RETURNS public.staff_applications
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE _app public.staff_applications;
BEGIN
  IF NOT private.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  UPDATE public.staff_applications
    SET status='rejected', reviewer_id=auth.uid(), reviewer_notes=_notes, reviewed_at=now(), updated_at=now()
    WHERE id=_id RETURNING * INTO _app;
  IF NOT FOUND THEN RAISE EXCEPTION 'application not found'; END IF;
  INSERT INTO public.audit_logs (action,entity_type,entity_id,actor_id,after)
  VALUES ('staff.reject','staff_application',_id,auth.uid(),
    jsonb_build_object('user_id',_app.user_id,'role',_app.requested_role,'notes',_notes));
  RETURN _app;
END $$;
REVOKE EXECUTE ON FUNCTION public.reject_staff_application(UUID,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_staff_application(UUID,TEXT) TO authenticated;

ALTER TABLE public.auctions REPLICA IDENTITY FULL;
ALTER TABLE public.bids REPLICA IDENTITY FULL;
ALTER TABLE public.staff_applications REPLICA IDENTITY FULL;

DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.auctions; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.bids; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_applications; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
