# Driped Web

Next.js 16 web app + Cloudflare Worker backend for Driped V2.

## Quick start
```bash
pnpm install
cp .env.example apps/web/.env.local   # fill in Firebase keys
pnpm dev                               # Next.js on :3000
pnpm dev:worker                        # Worker on :8787
```

## Layout
- `apps/web` \u2014 Next.js App Router UI
- `apps/worker` \u2014 Cloudflare Worker (Hono + D1 + KV + Workers AI)
- `packages/driped-neo` \u2014 shared Playful Neo-Brutal + Dark tokens
- `packages/driped-scan` \u2014 shared multi-pass subscription scan engine

## Deploy
- Web \u2192 Vercel (auto via `.github/workflows/web-deploy.yml`)
- Worker \u2192 `pnpm deploy:worker` or GitHub Actions
- Custom API: `api.driped.in` (set via Cloudflare route, see `apps/worker/wrangler.toml`)
