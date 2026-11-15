# Relay Chess (iOS)

The iOS app for [relaychess.com](https://relaychess.com). Expo SDK 58, Expo Router, [react-native-chessboardjs](https://github.com/msabree/react-native-chessboardjs) 1.x. Game rules and the socket protocol come from `packages/game`, same as web and server.

## Run

From the repo root, after `pnpm install`:

```sh
pnpm --filter @relay-chess/mobile start   # Expo Go
pnpm --filter @relay-chess/mobile ios     # dev build
```

Dev builds talk to staging, release builds to production. Set `EXPO_PUBLIC_SERVER_URL` (and `EXPO_PUBLIC_WEB_URL`) to use a local server.

## Layout

- `app/`: routes (home, game, review, modals)
- `components/`: UI; `ChessGame.tsx` is the board
- `contexts/ChessGame.tsx`, `hooks/`: game state and server connection
- `constants/URLs.ts`: server and web URLs

No accounts: players are anonymous with a nickname.

## Release

Run from `apps/mobile`:

```sh
pnpm build-ios
pnpm submit-ios
```
