-- House of Daraja LEE voucher system. Safe to re-run.
create table if not exists public.lee_voucher_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  description text,
  status text not null default 'draft' check (status in ('draft','active','paused','completed','cancelled')),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lee_voucher_campaign_dates check (expires_at is null or expires_at > starts_at)
);

create table if not exists public.lee_vouchers (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.lee_voucher_campaigns(id) on delete restrict,
  code_hash text not null unique check (length(code_hash)=64),
  code_hint text not null,
  lee_amount integer not null check (lee_amount > 0 and lee_amount <= 1000000),
  status text not null default 'active' check (status in ('active','paused','redeemed','expired','revoked')),
  max_redemptions integer not null default 1 check (max_redemptions > 0 and max_redemptions <= 100000),
  redemption_count integer not null default 0 check (redemption_count >= 0 and redemption_count <= max_redemptions),
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint lee_voucher_dates check (expires_at is null or expires_at > starts_at)
);

create table if not exists public.lee_voucher_redemptions (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null references public.lee_vouchers(id) on delete restrict,
  campaign_id uuid not null references public.lee_voucher_campaigns(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  lee_amount integer not null check (lee_amount > 0),
  redeemed_at timestamptz not null default now(),
  unique(voucher_id, user_id)
);

create index if not exists lee_vouchers_campaign_idx on public.lee_vouchers(campaign_id, created_at desc);
create index if not exists lee_vouchers_status_expiry_idx on public.lee_vouchers(status, expires_at);
create index if not exists lee_voucher_redemptions_user_idx on public.lee_voucher_redemptions(user_id, redeemed_at desc);

alter table public.lee_voucher_campaigns enable row level security;
alter table public.lee_vouchers enable row level security;
alter table public.lee_voucher_redemptions enable row level security;

drop policy if exists lee_voucher_campaigns_admin_all on public.lee_voucher_campaigns;
create policy lee_voucher_campaigns_admin_all on public.lee_voucher_campaigns
for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists lee_vouchers_admin_all on public.lee_vouchers;
create policy lee_vouchers_admin_all on public.lee_vouchers
for all to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists lee_voucher_redemptions_admin_read on public.lee_voucher_redemptions;
create policy lee_voucher_redemptions_admin_read on public.lee_voucher_redemptions
for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

revoke all on public.lee_voucher_campaigns from anon;
revoke all on public.lee_vouchers from anon;
revoke all on public.lee_voucher_redemptions from anon;
grant select, insert, update on public.lee_voucher_campaigns to authenticated;
grant select, insert, update on public.lee_vouchers to authenticated;
grant select on public.lee_voucher_redemptions to authenticated;

create or replace function public.redeem_lee_voucher(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_voucher public.lee_vouchers%rowtype;
  v_campaign public.lee_voucher_campaigns%rowtype;
  v_before integer;
  v_after integer;
  v_hash text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if p_code is null or length(trim(p_code)) < 6 or length(trim(p_code)) > 80 then
    raise exception 'Invalid voucher code';
  end if;
  v_hash := encode(extensions.digest(convert_to(upper(trim(p_code)), 'UTF8'), 'sha256'), 'hex');

  select * into v_voucher from public.lee_vouchers where code_hash = v_hash for update;
  if not found then raise exception 'Voucher not found'; end if;
  select * into v_campaign from public.lee_voucher_campaigns where id = v_voucher.campaign_id;
  if not found or v_campaign.status <> 'active' then raise exception 'Voucher campaign is not active'; end if;
  if v_voucher.status <> 'active' then raise exception 'Voucher is not active'; end if;
  if now() < greatest(v_voucher.starts_at, v_campaign.starts_at) then raise exception 'Voucher is not active yet'; end if;
  if (v_voucher.expires_at is not null and now() >= v_voucher.expires_at)
     or (v_campaign.expires_at is not null and now() >= v_campaign.expires_at) then
    update public.lee_vouchers set status = 'expired' where id = v_voucher.id;
    raise exception 'Voucher has expired';
  end if;
  if v_voucher.redemption_count >= v_voucher.max_redemptions then raise exception 'Voucher redemption limit reached'; end if;
  if exists(select 1 from public.lee_voucher_redemptions where voucher_id=v_voucher.id and user_id=v_user_id) then
    raise exception 'This account has already redeemed this voucher';
  end if;

  select lee_balance into v_before from public.profiles where id = v_user_id for update;
  if not found then raise exception 'Profile not found'; end if;
  v_before := coalesce(v_before, 0);
  v_after := v_before + v_voucher.lee_amount;

  insert into public.lee_voucher_redemptions(voucher_id,campaign_id,user_id,lee_amount)
  values(v_voucher.id,v_campaign.id,v_user_id,v_voucher.lee_amount);

  update public.profiles
    set lee_balance = v_after,
        lee_lifetime_earned = coalesce(lee_lifetime_earned,0) + v_voucher.lee_amount,
        updated_at = now()
    where id = v_user_id;

  insert into public.lee_transactions(user_id,type,amount,balance_before,balance_after,event_type,reference_id,description,metadata)
  values(v_user_id,'credit',v_voucher.lee_amount,v_before,v_after,'voucher_redemption',v_voucher.id,
         'LEE voucher redemption',jsonb_build_object('campaign_id',v_campaign.id,'voucher_id',v_voucher.id));

  update public.lee_vouchers
    set redemption_count = redemption_count + 1,
        status = case when redemption_count + 1 >= max_redemptions then 'redeemed' else status end
    where id = v_voucher.id;

  return jsonb_build_object('success',true,'lee_awarded',v_voucher.lee_amount,'new_balance',v_after);
end;
$$;

revoke all on function public.redeem_lee_voucher(text) from public, anon;
grant execute on function public.redeem_lee_voucher(text) to authenticated;
