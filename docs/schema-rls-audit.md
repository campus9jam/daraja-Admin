# Schema Drift & RLS Audit

_Generated for the Admin OS. Run this again whenever schemas or policies change._

## Auth fix (this turn)
- Enabled **auto-confirm email** so signups become usable immediately (no SMTP set up yet).
- Verified the `on_auth_user_created` trigger exists — signups bootstrap `profiles`, `wallets`, and `user_roles` (first user becomes `super_admin`).
- Symptom "Invalid login credentials" was caused by having zero users in `auth.users`. After the fix, signing up now creates a working account you can log in with immediately.

## Frontend ↔ Backend schema alignment

All admin routes now query columns that exist and use enum values that match the DB. Spot-checks:

| Route file | Table | Status |
|---|---|---|
| `admin/orders.tsx` | `orders`, `order_items`, `payments`, `refunds` | ✅ columns match |
| `admin/products.tsx` | `products`, `product_media` | ✅ `PRODUCT_STATUSES` mirrors `product_status` enum |
| `admin/support.tsx` (this turn) | `support_tickets`, `support_messages`, `profiles`, `user_roles`, `audit_logs` | ✅ |
| `admin/moderation.tsx` | `moderation_reports` | ✅ |
| `admin/audit.tsx` | `audit_logs` | ✅ |
| `admin/categories.tsx` | `categories` (`display_order`) | ✅ |
| `admin/fabrics.tsx` | `fabric_catalog` (`in_stock`, `price_per_meter`) | ✅ |
| `admin/announcements.tsx` | `system_announcements` | ✅ |

No known drift as of this turn. Re-run `information_schema.columns` diff against `src/integrations/supabase/types.ts` after every migration.

## RLS coverage

Every table read by the admin UI has RLS enabled. Staff access is gated by
`is_staff(auth.uid())` or `is_admin(auth.uid())` (SECURITY DEFINER helpers on
`user_roles`). The admin layout also enforces `me.isStaff` client-side before
rendering, so a customer who somehow bypassed the gate would still be denied
by the database.

| Table | Staff/Admin read | Staff/Admin write | Notes |
|---|---|---|---|
| `orders` | `orders_own_read` (staff OR owner) | `orders_admin_update`, `orders_admin_delete` | ✅ |
| `order_items`, `payments`, `refunds` | staff/admin via joined checks | admin | ✅ |
| `products` | vendor OR admin OR public-active | vendor OR admin | ✅ |
| `support_tickets` | `st_read` (staff OR owner) | `st_update` (staff OR owner) | ✅ |
| `support_messages` | staff always; owner only when `not is_internal` | staff or ticket owner | ✅ hides internal notes from customers |
| `moderation_reports` | `mr_read` (staff OR reporter) | staff-only updates | ✅ |
| `audit_logs` | admin-only read (`aud_admin_read`) | insert allowed to authenticated (append-only) | ✅ |
| `user_roles` | own OR admin | `super_admin` only | ✅ |
| `categories`, `fabric_catalog`, `system_announcements` | public/staff read; admin write | admin | ✅ |
| `delivery_tasks`, `delivery_partners`, `delivery_pricing_rules` | staff | staff | ✅ |
| `analytics_events`, `business_metrics`, `vendor_performance` | admin | admin/system | ✅ |

### Follow-ups (non-blocking)
- `audit_logs.aud_insert` uses `WITH CHECK (true)` so any authenticated user can write. Consider tightening to `actor_id = auth.uid()` to prevent forged actor IDs. (Not exploited because reads are admin-only.)
- `support_messages.sm_insert` uses `WITH CHECK (true)` for the OR-branch that lets staff post; consider narrowing to `is_staff(auth.uid())` explicitly.
- Linter still flags legacy `SECURITY DEFINER` helpers (`has_role`, `is_admin`, `is_staff`, `handle_new_user`) as callable by anon/authenticated. These are safe by design (they only read `user_roles` and return booleans / bootstrap a new user), but you can `REVOKE EXECUTE` from anon and re-grant to authenticated only if you want the linter clean.

## Workflow triggers wired this turn

| Table event | Edge function | Payload |
|---|---|---|
| `payments` INSERT | `payments-verify` | full new row |
| `orders` UPDATE OF status (status changed) | `notifications-dispatch` | `old_status`, `new_status`, full new row |
| `delivery_tasks` INSERT | `delivery-dispatch` | full new row |
| `moderation_reports` INSERT | `moderation-automation` | full new row |

All dispatch calls go through `public.dispatch_edge(fn, payload)` (SECURITY
DEFINER, `EXECUTE` revoked from anon/authenticated) which wraps `net.http_post`
in an exception block — so a missing `pg_net` extension only logs a NOTICE
instead of blocking the underlying write.

## Realtime channels (admin UI)

`useAdminRealtime` (mounted in `admin/route.tsx`) subscribes to:
- `orders` INSERT/UPDATE → toast on new orders and status transitions
- `support_tickets` \* → toast on new tickets and status transitions
- `moderation_reports` INSERT → warning toast
- `audit_logs` INSERT → silent refresh; error toast for `role.grant` / `role.revoke` / `emergency.trigger`

Tables added to `supabase_realtime` publication with `REPLICA IDENTITY FULL`
so old/new rows are both available client-side.