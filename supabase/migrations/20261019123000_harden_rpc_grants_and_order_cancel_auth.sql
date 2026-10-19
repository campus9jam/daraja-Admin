-- Align admin repository history with the production RPC hardening migration.
create or replace function public.cancel_unpaid_marketplace_order(p_order_id uuid, p_reason text default 'Customer cancelled')
returns jsonb language plpgsql security definer
set search_path = pg_catalog, public, extensions
as $function$
declare v_order public.orders%rowtype; v_item record;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if v_order.user_id <> auth.uid() and not exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','moderator')) then raise exception 'Not authorized'; end if;
  if v_order.payment_status <> 'unpaid' or v_order.status <> 'pending' then raise exception 'Only unpaid pending orders can be cancelled'; end if;
  if v_order.inventory_released_at is not null then return jsonb_build_object('order_id',p_order_id,'status','cancelled','already_released',true); end if;
  for v_item in select * from public.order_items where order_id=p_order_id loop
    if v_item.variant_id is not null then update public.product_variants set stock=stock+v_item.quantity,updated_at=now() where id=v_item.variant_id;
    else update public.products set stock=stock+v_item.quantity,status=case when status='sold_out' then 'active' else status end,updated_at=now() where id=v_item.product_id; end if;
    insert into public.inventory_movements(product_id,variant_id,vendor_id,quantity_delta,reason,reference_id,created_by) values(v_item.product_id,v_item.variant_id,v_item.vendor_id,v_item.quantity,'order_cancelled',p_order_id,auth.uid());
  end loop;
  update public.orders set status='cancelled',cancellation_reason=coalesce(nullif(trim(p_reason),''),'Customer cancelled'),inventory_released_at=now(),updated_at=now() where id=p_order_id;
  update public.payment_transactions set status='failed',updated_at=now() where order_id=p_order_id and status='pending';
  return jsonb_build_object('order_id',p_order_id,'status','cancelled','inventory_released',true);
end; $function$;
revoke all on function public.cancel_unpaid_marketplace_order(uuid,text) from public, anon;
grant execute on function public.cancel_unpaid_marketplace_order(uuid,text) to authenticated;
revoke all on function public.request_vendor_payout(uuid,numeric,text,jsonb) from public, anon;
grant execute on function public.request_vendor_payout(uuid,numeric,text,jsonb) to authenticated;
alter function private.vendor_ledger_signed_amount(text,numeric) set search_path = pg_catalog, public, extensions, private;
alter function private.platform_ledger_signed_amount(text,numeric) set search_path = pg_catalog, public, extensions, private;
revoke all on function public.process_vendor_payout(uuid,text,text,text,jsonb) from public, anon;
grant execute on function public.process_vendor_payout(uuid,text,text,text,jsonb) to authenticated;
revoke all on function public.reconcile_payment(text,text,text,uuid,numeric,text,jsonb) from public, anon;
grant execute on function public.reconcile_payment(text,text,text,uuid,numeric,text,jsonb) to authenticated;
revoke all on function public.record_order_refund(uuid,uuid,text,text,numeric,text,text,jsonb) from public, anon;
grant execute on function public.record_order_refund(uuid,uuid,text,text,numeric,text,text,jsonb) to authenticated;
revoke all on function public.set_platform_finance_config(text,numeric,numeric,numeric,numeric,integer,jsonb) from public, anon;
grant execute on function public.set_platform_finance_config(text,numeric,numeric,numeric,numeric,integer,jsonb) to authenticated;
revoke all on function public.place_auction_bid(uuid,numeric) from public, anon;
grant execute on function public.place_auction_bid(uuid,numeric) to authenticated;