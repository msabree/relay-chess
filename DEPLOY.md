# Deploying Relay Chess

Two environments, one branch each:

| Branch | Environment | Web (Vercel) | Server (Render) | Database |
|---|---|---|---|---|
| `main` | staging | staging.relaychess.com | staging-api.relaychess.com | your staging DB |
| `prod` | production | relaychess.com | api.relaychess.com | your production DB |

**Flow:** feature branch → PR into `main` (deploys to staging) → check staging → PR `main` → `prod` (deploys to production).

There are no accounts. Players get a random id and nickname from the server, stored in their browser. There is no Redis: live games are held in the server's memory, so each server runs as **one instance**. Production is always on; staging may sleep.

MongoDB keeps two things, and both clean themselves up:
- `recent_games`: finished games for review links, deleted after 30 days.
- `scores`: today's and this week's leaderboard, deleted a day after each period ends.

## One-time setup

### 1. Branches
```bash
git checkout main && git pull
git branch prod && git push -u origin prod
```

### 2. Render (servers)
1. Dashboard → **New → Blueprint** → pick this repo. It creates both services from `render.yaml`.
2. Fill in each service's secrets, **different per environment**:
   - `AUTH_SECRET`: `openssl rand -base64 48` (signs player tokens; never leaves Render)
   - `MONGODB_URL`: Atlas connection string. Same cluster is fine.
   - `DATABASE_NAME`: any name; use a different one for staging and production. The server creates its collections (`recent_games`, `scores`) on first start and never touches anything else in the database.
3. Custom domains: `staging-api.relaychess.com` on staging, `api.relaychess.com` on production.
4. Check `/health` on both returns `{"ok":true,"store":"mongo"}`.

### 3. Vercel (web)
1. Settings → Git: **Production Branch `prod`**.
2. Settings → Build & Deployment: Framework **Next.js**, Root Directory **`apps/web`**.
3. Domains: `relaychess.com` and `www.relaychess.com` on production; `staging.relaychess.com` on branch `main`.
4. Environment variables, that's all of them:

   | Variable | Production | Staging (branch `main`) |
   |---|---|---|
   | `NEXT_PUBLIC_SERVER_URL` | `https://api.relaychess.com` | `https://staging-api.relaychess.com` |
   | `NEXT_PUBLIC_GA_ID` | optional | leave empty |

   Delete anything else left over from the account era (`NEXTAUTH_*`, `GOOGLE_*`, `APPLE_*`, `AUTH_SECRET`, `NEXT_PUBLIC_ENABLE_SIGN_IN`, `NEXT_PUBLIC_CHESS_SERVER_*`, `CHESS_SERVER_API`, `NEXT_PUBLIC_USE_TEST_USERS`).

### 4. GitHub
Settings → Branches → protect `main` and `prod`: require a PR and the **CI** check. Merging is then the only way to deploy, and Render waits for CI.

## Releasing
1. Merge PRs into `main`. Staging updates.
2. Try it on staging.relaychess.com.
3. Open a PR from `main` into `prod` and merge it. Production updates.

Deploys restart the server, which ends games in progress, so release production when it's quiet.

## First cutover
- [ ] Staging works end to end: private game with a second browser, quick match with 4 tabs, rename yourself, see the leaderboard update.
- [ ] First `main` → `prod` merge, same checks on relaychess.com.
- [ ] Delete the old Render services: chess sockets, api, redis.
- [ ] Old iOS app talks to the old API: pull it from the store.
- [ ] Old account data (`users`, `games`, `leaderboard` collections in the old database) is no longer used. Delete it when you're sure.

## If Render complains
- `autoDeployTrigger` rejected: use `autoDeploy: true` (deploys on every push, without waiting for CI).
- `corepack enable` fails: build with `npm i -g pnpm@9.15.4 && pnpm install --frozen-lockfile --filter @relay-chess/server...`.

Render sets `PORT`; the server reads it.
