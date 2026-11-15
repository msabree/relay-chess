import { z } from 'zod';

/**
 * Catches keyboard mashing ("asdkjfhaskdjfh", "aaaaaaaa") without blocking real
 * messages: short ones, other languages and scripts, links, pasted errors.
 * Only Latin-letter text gets the vowel and long-word checks.
 */
export function looksLikeGibberish(text: string): boolean {
  const t = text.normalize('NFD').replace(/\p{M}/gu, '');
  if (/(\p{L})\1{5,}/u.test(t)) return true; // same letter 6+ times
  const letters = t.match(/\p{L}/gu) ?? [];
  const latin = t.match(/[a-z]/gi) ?? [];
  if (letters.length === 0) return true; // only symbols or digits
  if (latin.length / letters.length < 0.8) return false; // mostly another script: don't judge
  const words = t
    .replace(/\S+:\/\/\S+|\S+@\S+|\S+\.(com|net|org|io|dev|app)\S*/gi, ' ') // links and emails
    .split(/[^a-z']+/i)
    .filter(Boolean);
  if (words.some((w) => w.length > 24)) return true; // no real word is that long
  const vowels = latin.filter((c) => /[aeiouy]/i.test(c)).length;
  if (latin.length >= 12 && vowels / latin.length < 0.2) return true; // real languages are ~35 to 45% vowels
  return false;
}

/** Contact form payload. Shared so the web form and the server validate the same way. */
export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(100, 'Keep your name under 100 characters.'),
  email: z.string().trim().min(1, 'Please enter your email.').email('Enter a valid email address.').max(200, 'That email is too long.'),
  message: z
    .string()
    .trim()
    .min(1, 'Please enter a message.')
    .min(10, 'Tell us a little more (at least 10 characters).')
    .max(5000, 'Keep your message under 5,000 characters.')
    .refine((m) => !looksLikeGibberish(m), "That doesn't look like a real message. A sentence or two helps us help you."),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

/** First error per field, or null when valid. */
export function contactErrors(input: unknown): ContactErrors | null {
  const res = contactSchema.safeParse(input);
  if (res.success) return null;
  const out: ContactErrors = {};
  for (const issue of res.error.issues) {
    const key = issue.path[0] as keyof ContactInput;
    out[key] ??= issue.message;
  }
  return out;
}
