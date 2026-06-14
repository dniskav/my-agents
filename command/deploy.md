---
description: Deploy the project, auto-detecting the platform (Vercel, Cloudflare, Docker, Fly.io)
---

# Deploy Command (Multi-Platform)

Auto-detects the deployment platform and runs the appropriate deploy flow asynchronously.

## Platform Detection

Run this first:
```bash
ls vercel.json wrangler.toml wrangler.jsonc Dockerfile docker-compose.yml config/deploy.yml fly.toml 2>/dev/null
```

| File Found | Platform |
|---|---|
| `vercel.json` or Vercel project detected | Vercel |
| `wrangler.toml` / `wrangler.jsonc` | Cloudflare Workers / Pages |
| `Dockerfile` or `docker-compose.yml` | Docker |
| `fly.toml` | Fly.io |

---

## Vercel

```bash
# Pre-check: ensure build passes locally
npm run build

# Deploy (production)
vercel --prod

# or via CLI if configured:
vercel deploy --prod
```

Start async with `createBackgroundProcess`:
- command: `vercel --prod`
- name: `Vercel Deploy`
- tags: `["deploy", "vercel"]`

Reply: "Vercel deploy started in background. You'll be notified when it completes."

**Common issues**:
- Build fails → check `vercel build` locally first
- Env vars missing → verify in Vercel dashboard or `.env.production`
- Route config → check `vercel.json` rewrites

---

## Cloudflare Workers / Pages

```bash
# Workers
wrangler deploy

# Pages
wrangler pages deploy ./dist --project-name=<project>
```

Start async with `createBackgroundProcess`:
- command: `wrangler deploy` (or `wrangler pages deploy ./dist`)
- name: `Cloudflare Deploy`
- tags: `["deploy", "cloudflare"]`

**Pre-checks**:
- `wrangler whoami` → confirm authenticated
- `wrangler dev` → test locally before deploy

---

## Docker

```bash
# Build image
docker build -t <image-name>:<tag> .

# Push to registry
docker push <registry>/<image-name>:<tag>

# or docker compose
docker compose up -d --build
```

Start async with `createBackgroundProcess`:
- command: `docker build -t <name>:<tag> . && docker push <registry>/<name>:<tag>`
- name: `Docker Build & Push`
- tags: `["deploy", "docker"]`

**Pre-checks**:
- `docker login` → confirm authenticated to registry
- Test locally: `docker compose up` before push

---

## Fly.io

```bash
# Deploy
fly deploy
```

Start async with `createBackgroundProcess`:
- command: `fly deploy`
- name: `Fly.io Deploy`
- tags: `["deploy", "fly"]`

---

## Agent Instructions

1. Run platform detection command
2. Identify platform from output
3. Run pre-checks (build test, auth check)
4. If pre-checks pass: start async deploy via `createBackgroundProcess`
5. Notify user with task ID
6. If no known platform detected: report "No recognized deployment configuration found. Check for vercel.json, wrangler.toml, Dockerfile, config/deploy.yml, or fly.toml."

Never run deploys synchronously — they can take several minutes.
