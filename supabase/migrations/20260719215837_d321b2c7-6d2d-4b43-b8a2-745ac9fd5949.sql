
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(
  _user_id uuid, _amount numeric, _token_amount numeric DEFAULT 0,
  _description text DEFAULT NULL, _tx_type text DEFAULT 'adjustment'
) RETURNS wallet_transactions
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _w public.wallets; _tx public.wallet_transactions; _new_bal numeric; _new_tokens numeric;
BEGIN
  IF NOT private.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  SELECT * INTO _w FROM public.wallets WHERE user_id=_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.wallets(user_id) VALUES (_user_id) RETURNING * INTO _w;
  END IF;
  _new_bal := COALESCE(_w.balance,0) + COALESCE(_amount,0);
  _new_tokens := COALESCE(_w.lee_tokens,0) + COALESCE(_token_amount,0);
  IF _new_bal < 0 THEN RAISE EXCEPTION 'insufficient balance' USING ERRCODE='22023'; END IF;
  UPDATE public.wallets SET balance=_new_bal, lee_tokens=_new_tokens, updated_at=now() WHERE id=_w.id;
  UPDATE public.profiles SET wallet_balance=_new_bal, lee_tokens=_new_tokens, updated_at=now() WHERE id=_user_id;
  INSERT INTO public.wallet_transactions(wallet_id,user_id,tx_type,amount,token_amount,balance_after,description,reference)
  VALUES (_w.id,_user_id,_tx_type::wallet_tx_type,_amount,_token_amount,_new_bal,_description,'admin:'||auth.uid()::text)
  RETURNING * INTO _tx;
  INSERT INTO public.audit_logs(action,entity_type,entity_id,actor_id,after)
  VALUES ('wallet.adjust','wallet',_w.id,auth.uid(),
    jsonb_build_object('user_id',_user_id,'amount',_amount,'tokens',_token_amount,'new_balance',_new_bal,'note',_description));
  RETURN _tx;
END $$;
REVOKE ALL ON FUNCTION public.admin_adjust_wallet(uuid,numeric,numeric,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid,numeric,numeric,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_account_status(_user_id uuid, _status text, _reason text DEFAULT NULL)
RETURNS profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _p public.profiles; _old text;
BEGIN
  IF NOT private.is_admin(auth.uid()) THEN RAISE EXCEPTION 'forbidden' USING ERRCODE='42501'; END IF;
  SELECT account_status::text INTO _old FROM public.profiles WHERE id=_user_id;
  UPDATE public.profiles SET account_status=_status::account_status, updated_at=now() WHERE id=_user_id RETURNING * INTO _p;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile not found'; END IF;
  INSERT INTO public.audit_logs(action,entity_type,entity_id,actor_id,before,after)
  VALUES ('account.status','profile',_user_id,auth.uid(),
    jsonb_build_object('status',_old), jsonb_build_object('status',_status,'reason',_reason));
  RETURN _p;
END $$;
REVOKE ALL ON FUNCTION public.admin_set_account_status(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_account_status(uuid,text,text) TO authenticated;
