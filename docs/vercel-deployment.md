# Vercel deployment runbook

This repository is a React 19 + TanStack Start application. The server runtime is built by Nitro for Vercel. Deploy from the repository root; do not configure a static SPA output or Cloudflare adapter.

## Repository checks before deployment

- Use Node.js 22.
- Install with `npm ci` from the committed `package-lock.json`.
- Build with the repository's default `npm run build` command.
- Do not override the framework's output directory or add catch-all rewrites.
- Use the `vercel-deployment-hardening-v2` branch for the current hardening work until its pull request is reviewed and merged.

## Vercel project configuration

| Setting | Value |
| --- | --- |
| Framework preset | TanStack Start |
| Root directory | Repository root (folder containing `package.json`) |
| Node.js version | 22.x |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Leave blank / framework default |
| Development command | Leave blank / framework default |

Do not add a static SPA rewrite. TanStack Start routes and server functions are served by the Nitro Vercel runtime.

## Environment variables

Configure these in Vercel for the environments in which the app will run:

| Variable | Scope | Required for |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Public build-time | Browser Supabase client |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public build-time | Browser Supabase client |
| `SUPABASE_URL` | Server only | Server-side Supabase clients |
| `SUPABASE_PUBLISHABLE_KEY` | Server only | User-token validation in server middleware |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Privileged server operations; bypasses RLS |
| `LOVABLE_API_KEY` | Server only, only while the legacy AI gateway integration is enabled | Existing workflow AI gateway calls |

Never prefix a secret with `VITE_`. Never commit real values to Git. Never place the service-role key in a browser variable or client-side module. The AI gateway variable is retained only because the current workflow engine still calls the Lovable AI Gateway; that integration must be migrated or deliberately disabled before removing the key.

## Supabase Auth configuration

After Vercel creates the new deployment, add its exact hostname to Supabase Authentication URL Configuration:

- Site URL: the chosen canonical production URL.
- Redirect URLs: the canonical URL and the exact preview URL(s) used for testing, each with the required `/admin` callback path if configured as an exact redirect.

Keep Google OAuth enabled only if the provider credentials are configured in Supabase. Do not use wildcard redirect entries broader than required.

## Post-deployment smoke tests

1. Confirm the deployment status is **Ready** in Vercel.
2. Open `/` and confirm it redirects to `/admin` or `/auth` as appropriate.
3. Open `/auth` directly and test email/password sign-in.
4. Test Google sign-in only after its Supabase provider and redirect URLs are configured.
5. Refresh `/admin` and a nested admin route directly; both must be served by the Nitro runtime.
6. Confirm a non-staff authenticated user is denied and a staff account can access the dashboard.
7. Verify Supabase reads and writes under the actual RLS policies.
8. Inspect Vercel function logs for missing environment variables, SSR errors, and server-function failures.
9. Verify the browser bundle contains no service-role or other server-only secret.

## Important status

A successful local/CI build does not prove that the Vercel project is correctly linked or that production auth works. Deployment must be verified against the newly created Vercel project and its assigned domain.
