# Vercel deployment notes

The application is TanStack Start (React) with Nitro. Vercel must build it through Nitro's Vercel preset; it must not use the Cloudflare Worker adapter.

## Vercel project settings

- Framework preset: **TanStack Start**
- Root directory: repository root (the directory containing `package.json`)
- Build command: leave blank / framework default
- Output directory: leave blank / framework default
- Install command: `npm ci` (deterministic install from the committed lockfile)
- Node.js: 22
- Do not set a static SPA rewrite; TanStack Start routes and server functions are handled by Nitro.

## Environment variables

Set the following in Vercel for Production, Preview and Development as applicable:

| Name | Scope | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Public browser build | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public browser build | Supabase publishable key |
| `SUPABASE_URL` | Server only | Server-side Supabase URL |
| `SUPABASE_PUBLISHABLE_KEY` | Server only | JWT validation in server middleware |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Privileged server-side operations; never expose to browser |
| `LOVABLE_API_KEY` | Server only | AI workflow server integration |

Never prefix a secret with `VITE_`. Never commit real values to Git.

## Verification after deployment

1. Confirm the Vercel deployment builds with the TanStack Start framework preset.
2. Open `/auth`, sign in, and confirm redirect to `/admin`.
3. Refresh a nested admin route directly; it must not return a Vercel 404.
4. Confirm an authenticated admin can load the dashboard and a non-staff user is denied.
5. Test server functions that require `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
6. Check function logs for missing environment variables and SSR/runtime exceptions.

The CI workflow runs `npm ci`, TypeScript checking, ESLint, and the production build. Deployment still requires checking the actual Vercel project settings and runtime logs.
