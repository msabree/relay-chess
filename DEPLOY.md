# Deploying Relay Chess

Two pieces, both deploy automatically when a PR is merged to `main`:

| Piece | Host | Deploys when |
|---|---|---|
| `apps/server` (API + sockets) | Render web service, from `render.yaml` | `main` changes in `apps/server`, `packages/game` or the lockfile, and CI passes |
| `apps/web` | Vercel | `main` changes in `apps/web`, `packages/game` or the lockfile |

Data lives in MongoDB (Atlas). There is no Redis: live games are held in the server's memory, so the server runs as **one always-on instance**.

## One-time setup

### 1. Render (server)
1. Render dashboard → **New → Blueprint** → pick this repo. It reads `render.yaml`.
2. Fill in the secret env vars it asks for:
   - `AUTH_SECRET`: `openssl rand -base64 48`. Keep it, Vercel needs the same value.
   - `MONGODB_URL`: Atlas connection string (with a freshly rotated password).
   - `DATABASE_NAME`: the existing database name (the old API's `DATABASE_NAME`), so users and the leaderboard carry over.
3. Add a custom domain, e.g. `api.relaychess.com`.
4. Check `https://api.relaychess.com/health` returns `{"ok":true,"store":"mongo"}`.

If Render rejects `autoDeployTrigger`, swap it for `autoDeploy: true` (deploys on every push to `main`, without waiting for CI).

If the build can't run `corepack enable`, change the build command to
`npm i -g pnpm@9.15.4 && pnpm install --frozen-lockfile --filter @relay-chess/server...`.

### 2. Vercel (web)
1. New project → import this repo → **Root Directory: `apps/web`**. Framework: Next.js. Vercel detects pnpm.
2. Production branch: `main`.
3. Env vars (Production and Preview):
   - `NEXT_PUBLIC_SERVER_URL=https://api.relaychess.com`
   - `AUTH_SECRET` = same as Render
   - `NEXTAUTH_URL=https://relaychess.com`
   - `NEXTAUTH_SECRET` = `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET` (server-only, no `NEXT_PUBLIC_`)
   - optional `NEXT_PUBLIC_GA_ID`
4. Add `relaychess.com` and `www.relaychess.com` as domains once the preview checks out.

### 3. GitHub
Settings → Branches → protect `main`: require the **CI** check and a PR. That makes "merge to main" the only way to deploy, and Render waits for CI before deploying.

## Cutover checklist
- [ ] Preview deploy works: sign in with Google, your old username and leaderboard spot show up (proves `DATABASE_NAME` is right).
- [ ] Private game with a second browser as a guest; quick match with 4 tabs.
- [ ] Move `relaychess.com` to the new Vercel project.
- [ ] Delete the old Render services: chess sockets, api, redis.
- [ ] Old iOS app: it talks to the old API, so pull it from the store (or keep the old API up until you do).

## Notes
- Deploys restart the server, which ends games in progress. Merge when it's quiet.
- Render sets `PORT`; the server reads it.
