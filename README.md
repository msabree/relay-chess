# Relay Chess

2v2 chess on one board. Each team has two players who take turns making their team's moves, in seat order, without talking strategy. You never know exactly what your partner is planning.

Play it at [relaychess.com](https://relaychess.com).

> **Status:** early open source release. Rules engine, server and web app are wired together and playable. The game screen redesign is next. See [Roadmap](#roadmap).

## How it plays

- Two teams, White and Black, 1 to 4 players each (2v2 is the classic).
- Seat order is relay order: White seat 1, Black seat 1, White seat 2, Black seat 2, then repeat.
- If a teammate disconnects, the relay skips them until they're back. If a whole team leaves mid-game, it forfeits after a minute.
- Standard chess rules otherwise: checkmate, resign, draw by agreement (both teams), stalemate, repetition, 50-move rule, flag fall.

## Repo layout

```
apps/web        Next.js web app
apps/server     HTTP API + socket.io on one port (Express, MongoDB or in-memory)
packages/game   Rules engine and wire protocol: seats, relay rotation, move validation, clocks, results
```

`packages/game` is pure TypeScript with no I/O. The server holds the authoritative game state and only ever changes it through these functions, so clients can't fake moves or results. Who you are comes from a signed token, never from what the client says.

## Getting started

Requirements: Node 22 (see `.nvmrc`) and pnpm via `corepack enable`. Docker is optional.

```bash
corepack enable
pnpm install
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env.local   # AUTH_SECRET must match the server's
pnpm dev                                        # server on :4000, web on :3000
```

Open http://localhost:3000 in two browsers (or one normal + one private window) and you'll each play as a guest. No OAuth keys or database needed.

To keep data between restarts, run `docker compose up -d` and set `MONGODB_URL=mongodb://localhost:27017` in `apps/server/.env`. To enable Google/Apple sign-in, fill in the OAuth keys in `apps/web/.env.local`.

Tests: `pnpm test` (rules engine + server integration tests). Typecheck: `pnpm typecheck`.

## Deploying

The server runs on Render (`render.yaml`) and the web app on Vercel. Both deploy on merge to `main`. See [DEPLOY.md](DEPLOY.md).

## Roadmap

1. New game screen and private room screen.
2. Contributor docs and good first issues.
3. Ideas: team chat, ratings, bots to fill empty seats.

## Contributing

Issues and PRs are welcome. Before opening a PR, run `pnpm typecheck && pnpm test`. For anything bigger than a bug fix, open an issue first so we can agree on the approach.

## License

[MIT](LICENSE)
