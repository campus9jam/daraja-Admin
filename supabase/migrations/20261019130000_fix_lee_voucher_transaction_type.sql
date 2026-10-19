-- The production lee_transactions.type check accepts earn/spend/refund/bonus/adjustment/expiry.
create or replace function public.redeem_lee_voucher(p_code text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public, extensions
as $$
declare v_user_id uuid := auth.uid(); v_voucher public.lee_vouchers%rowtype; v_campaign public.lee_voucher_campaigns%rowtype; v_before integer; v_after integer; v_hash text;
begin
 if v_user_id is null then raise exception 'Authentication required'; end if;
 if p_code is null or length(trim(p_code)) < 6 or length(trim(p_code)) > 80 then raise exception 'Invalid voucher code'; end if;
 v_hash := encode(extensions.digest(convert_to(upper(trim(p_code)), 'UTF8'), 'sha256'), 'hex');
 select * into v_voucher from public.lee_vouchers where code_hash=v_hash for update;
 if not found then raise exception 'Voucher not found'; end if;
 select * into v_campaign from public.lee_voucher_campaigns where id=v_voucher.campaign_id;
 if not found or v_campaign.status <> 'active' then raise exception 'Voucher campaign is not active'; end if;
 if v_voucher.status <> 'active' then raise exception 'Voucher is not active'; end if;
 if now() < greatest(v_voucher.starts_at,v_campaign.starts_at) then raise exception 'Voucher is not active yet'; end if;
 if (v_voucher.expires_at is not null and now() >= v_voucher.expires_at) or (v_campaign.expires_at is not null and now() >= v_campaign.expires_at) then update public.lee_vouchers set status='expired' where id=v_voucher.id; raise exception 'Voucher has expired'; end if;
 if v_voucher.redemption_count >= v_voucher.max_redemptions then raise exception 'Voucher redemption limit reached'; end if;
 if exists(select 1 from public.lee_voucher_redemptions where voucher_id=v_voucher.id and user_id=v_user_id) then raise exception 'This account has already redeemed this voucher'; end if;
 select lee_balance into v_before from public.profiles where id=v_user_id for update;
 if not found then raise exception 'Profile not found'; end if;
 v_before:=coalesce(v_before,0); v_after:=v_before+v_voucher.lee_amount;
 insert into public.lee_voucher_redemptions(voucher_id,campaign_id,user_id,lee_amount) values(v_voucher.id,v_campaign.id,v_user_id,v_voucher.lee_amount);
 update public.profiles set lee_balance=v_after,lee_lifetime_earned=coalesce(lee_lifetime_earned,0)+v_voucher.lee_amount,updated_at=now() where id=v_user_id;
 insert into public.lee_transactions(user_id,type,amount,balance_before,balance_after,event_type,reference_id,description,metadata) values(v_user_id,'bonus',v_voucher.lee_amount,v_before,v_after,'voucher_redemption',v_voucher.id,'LEE voucher redemption',jsonb_build_object('campaign_id',v_campaign.id,'voucher_id',v_voucher.id));
 update public.lee_vouchers set redemption_count=redemption_count+1,status=case when redemption_count+1>=max_redemptions then 'redeemed' else status end where id=v_voucher.id;
 return jsonb_build_object('success',true,'lee_awarded',v_voucher.lee_amount,'new_balance',v_after);
end; $$;
revoke all on function public.redeem_lee_voucher(text) from public, anon;
grant execute on function public.redeem_lee_voucher(text) to authenticated;
