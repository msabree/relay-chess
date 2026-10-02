# Relay Chess

2v2 chess on one board. Each team has two players who take turns making their team's moves, in seat order, without talking strategy. You never know exactly what your partner is planning.

Play it at [relaychess.com](https://relaychess.com).

> **Status:** early open source release. The rules engine (`packages/game`) is done and tested. The server is being ported into `apps/server` and the game screen is being redesigned. See [Roadmap](#roadmap).

## How it plays

- Two teams, White and Black, two seats each.
- Seat order is relay order: White seat 1, Black seat 1, White seat 2, Black seat 2, then repeat.
- If a teammate disconnects, the relay skips them until they're back.
- Standard chess rules otherwise: checkmate, resign, draw by agreement (both teams), stalemate, repetition, 50-move rule, flag fall.

## Repo layout

```
apps/web        Next.js web app
apps/server     API + realtime server (being ported)
packages/game   Rules engine: seats, relay rotation, move validation, clocks, results
```

`packages/game` is pure TypeScript with no I/O. The server holds the authoritative game state and only ever changes it through these functions, so clients can't fake moves or results.

## Getting started

Requirements: Node 22 (see `.nvmrc`), pnpm via `corepack enable`, Docker.

```bash
corepack enable
pnpm install
docker compose up -d          # MongoDB + Valkey (Redis)
pnpm test                     # rules engine tests
cp apps/web/.env.example apps/web/.env.local
pnpm --filter @relay-chess/web dev
```

## Roadmap

1. Port the server into `apps/server`: one process for HTTP + socket.io, built on `packages/game`.
2. Real auth on every request and socket connection, plus a guest login for local dev so OAuth keys are optional.
3. New game screen and private room screen.
4. Contributor docs and good first issues.

## Contributing

Issues and PRs are welcome. Before opening a PR, run `pnpm typecheck && pnpm test`. For anything bigger than a bug fix, open an issue first so we can agree on the approach.

## License

[MIT](LICENSE)
