# House of Daraja Command Center — Production Integration

## Production backend

- Supabase project: `nuxdlbqhobbbmmgspfpg`
- Browser configuration: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`
- Never configure a service-role key in Vite/browser variables.
- The committed `.env` was removed from this branch; use the safe `.env.example` as a template.

## Authorization

The production application role is `public.profiles.role`. This app must not use the prototype's separate `user_roles` table or its `super_admin` role. The production admin role is `admin`; moderation permissions are enforced again by protected Supabase functions and RLS. Client-side route guards are usability controls, not the security boundary.

## Connected modules in this integration branch

- Executive overview: live `profiles`, `products`, `orders`, `atelier_orders`, `auctions`, `vendor_applications`, and `lee_transactions` data.
- Vendor approvals: live `vendor_applications` and the protected `moderate_vendor_application` RPC.
- Auctions: live `auctions` columns and create/status workflows.
- Orders: production `orders` columns. The UI intentionally does not create a fake refund by inserting a row; actual refunds must go through the trusted payment provider workflow.
- LEE rewards: production `profiles` balances and `lee_transactions`.
- LEE vouchers: new campaign, voucher, and redemption tables plus atomic `redeem_lee_voucher(text)` RPC.

## Voucher behavior

Full voucher codes are generated in the browser with cryptographically secure randomness and shown once after creation. The database stores only SHA-256 hashes and a four-character hint. Redemption is authenticated, locks the voucher row, checks campaign dates/status and usage limits, prevents duplicate redemption per account, updates the user's LEE balance, and writes a transaction record in one database transaction. The campaign must be active. Admin-only RLS governs voucher creation and management.

## Deployment variables

Configure these in the hosting provider's project settings, not in Git:
- `VITE_SUPABASE_URL=https://nuxdlbqhobbbmmgspfpg.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<the production project's publishable key>`

Do not copy the original admin prototype's migrations into production wholesale. They target a separate schema and contain assumptions about `user_roles`, wallet tables, and profile fields that do not match the live House of Daraja backend.

## Validation still required before production deployment

- Run the repository's Vite production build and ESLint against this branch.
- Verify staff sign-in using the existing production admin account.
- Test a pending vendor approval and rejection in a non-critical test application.
- Test voucher issue, pause, resume, successful redemption, duplicate redemption rejection, expiry, and max-redemption behavior using a dedicated test user and low-value voucher.
- Review all remaining screens against the production schema before enabling their write actions.
- Review the current Supabase security advisor results and harden any remaining overly broad function grants/RLS policies separately; do not bulk-revoke permissions without checking the frontend's required calls.
