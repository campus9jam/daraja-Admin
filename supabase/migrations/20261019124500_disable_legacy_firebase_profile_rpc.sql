-- Production auth uses Supabase Auth directly; disable the legacy Firebase bridge RPC.
revoke all on function public.ensure_firebase_profile() from public, anon, authenticated;
