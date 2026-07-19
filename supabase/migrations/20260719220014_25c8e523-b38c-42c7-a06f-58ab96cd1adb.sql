
CREATE OR REPLACE FUNCTION public.close_auction(_auction_id uuid)
 RETURNS auctions LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $function$
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
    INSERT INTO public.orders (order_number,customer_id,status,subtotal,grand_total,currency,notes)
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
END $function$;
