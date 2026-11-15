const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** Random alphanumeric id. Not for secrets. */
export const randomId = (length: number) =>
  Array.from({ length }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
