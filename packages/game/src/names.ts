/** Account usernames: letters, numbers, _ and -, 3 to 20 long. Same idea as Lichess and Chess.com. */
export const USERNAME = /^[a-zA-Z0-9_-]{3,20}$/;
export const USERNAME_HINT = '3 to 20 letters, numbers, _ or -. No spaces.';

/** Best-effort username from a guest nickname like "Quiet Seal" (QuietSeal). */
export const toUsername = (raw: string) => {
  const s = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
  return s.length >= 3 ? s : `player${s}`.slice(0, 20);
};
