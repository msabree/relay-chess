/**
 * HTTP API and socket.io share one origin (apps/server on Render).
 * Dev builds talk to staging, release builds to production.
 * Override with EXPO_PUBLIC_SERVER_URL (e.g. http://192.168.1.10:4000 for a local server).
 */
export const SERVER_URL =
  process.env.EXPO_PUBLIC_SERVER_URL ??
  (__DEV__ ? 'https://relay-chess-server-stage.onrender.com' : 'https://relay-chess-server.onrender.com');

/** The web app. Invite and share links point here so anyone can open them. */
export const SITE_URL = 'https://relaychess.com';

/** The web app that pairs with SERVER_URL. Embedded pages (game review) load from here. */
export const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL ?? (__DEV__ ? 'https://staging.relaychess.com' : 'https://relaychess.com');
