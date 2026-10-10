import { z } from 'zod';

/** Contact form payload. Shared so the web form and the server validate the same way. */
export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name.').max(100, 'Keep your name under 100 characters.'),
  email: z.string().trim().min(1, 'Please enter your email.').email('Enter a valid email address.').max(200, 'That email is too long.'),
  message: z.string().trim().min(1, 'Please enter a message.').max(5000, 'Keep your message under 5,000 characters.'),
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
