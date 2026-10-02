# Deploying Relay Chess

Two environments, one branch each:

| Branch | Environment | Web (Vercel) | Server (Render) | Database |
|---|---|---|---|---|
| `main` | staging | stage.relaychess.com | stage-api.relaychess.com | `relaychess_stage` |
| `prod` | production | relaychess.com | api.relaychess.com | existing database |

**Flow:** feature branch → PR into `main` (deploys to staging) → check staging → PR `main` → `prod` (deploys to production).

There is no Redis: live games are held in the server's memory, so each server runs as **one instance**. Production is always on; staging may sleep.

## One-time setup

### 1. Branches
```bash
git checkout main && git pull
git branch prod && git push -u origin prod
```

### 2. Render (servers)
1. Dashboard → **New → Blueprint** → pick this repo. It creates both services from `render.yaml`.
2. Fill in each service's secrets. Use **different values per environment**:
   - `AUTH_SECRET`: `openssl rand -base64 48`
   - `MONGODB_URL`: Atlas connection string (freshly rotated password). Same cluster is fine.
   - `DATABASE_NAME`: staging `relaychess_stage`; production the old API's `DATABASE_NAME` so accounts carry over.
3. Custom domains: `stage-api.relaychess.com` on the stage service, `api.relaychess.com` on production.
4. Check `/health` on both returns `{"ok":true,"store":"mongo"}`.

### 3. Vercel (web), reusing the existing project
1. Settings → Git: connect this repo. **Production Branch: `prod`.**
2. Settings → Build & Deployment: **Root Directory `apps/web`**.
3. Settings → Domains:
   - `relaychess.com` and `www.relaychess.com` → production.
   - Add `stage.relaychess.com` and set its **Git branch to `main`**.
4. Settings → Environment Variables. Delete the old `NEXT_PUBLIC_*_SECRET`, `NEXT_PUBLIC_CHESS_SERVER_*`, `CHESS_SERVER_API` and `NEXT_PUBLIC_USE_TEST_USERS`. Then add:

   | Variable | Production | Preview (branch `main`) |
   |---|---|---|
   | `NEXT_PUBLIC_SERVER_URL` | `https://api.relaychess.com` | `https://stage-api.relaychess.com` |
   | `AUTH_SECRET` | prod Render value | stage Render value |
   | `NEXTAUTH_URL` | `https://relaychess.com` | `https://stage.relaychess.com` |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32` | a different one |
   | `GOOGLE_CLIENT_ID` / `_SECRET` | same in both | same in both |
   | `APPLE_CLIENT_ID` / `_SECRET` | same in both | same in both |
   | `NEXT_PUBLIC_GA_ID` | optional | leave empty |

   Scope the Preview values to the `main` branch.
5. Google Cloud console → OAuth client → add `https://stage.relaychess.com/api/auth/callback/google` as a redirect URI. Apple needs `stage.relaychess.com` added to the Service ID's domains and return URLs if you want Apple sign-in on staging.

### 4. GitHub
Settings → Branches → protect `main` and `prod`: require a PR and the **CI** check. Merging is then the only way to deploy, and Render waits for CI.

## Releasing
1. Merge PRs into `main`. Staging updates.
2. Try it on stage.relaychess.com.
3. Open a PR from `main` into `prod` and merge it. Production updates.

Deploys restart the server, which ends games in progress, so release production when it's quiet.

## First cutover
- [ ] Staging works end to end (sign in, private game, quick match with 4 tabs).
- [ ] First `main` → `prod` merge. On production, sign in and confirm your old username and leaderboard spot (proves `DATABASE_NAME`).
- [ ] Delete the old Render services: chess sockets, api, redis.
- [ ] Old iOS app talks to the old API: pull it from the store (or keep the old API up until you do).

## If Render complains
- `autoDeployTrigger` rejected: use `autoDeploy: true` (deploys on every push, without waiting for CI).
- `corepack enable` fails: build with `npm i -g pnpm@9.15.4 && pnpm install --frozen-lockfile --filter @relay-chess/server...`.

Render sets `PORT`; the server reads it.
