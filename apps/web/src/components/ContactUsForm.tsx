import { useEffect, useState, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import { isAxiosError } from 'axios';
import { contactErrors, type ContactErrors, type ContactInput } from '@relay-chess/game';
import { contactUs, getContactChallenge, type ContactChallenge } from '@/apis/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { issueUrl } from '@/lib/github';

const CheckCircle = dynamic(() => import('lucide-react').then(mod => mod.CheckCircle), { ssr: false });

const EMPTY: ContactInput = { name: '', email: '', message: '' };
const field = 'border border-line bg-bg text-fg placeholder:text-fg-subtle focus-visible:ring-2 focus-visible:ring-accent/60';
const label = 'mb-1.5 block text-sm font-medium';

const ContactUsForm = () => {
  const [values, setValues] = useState<ContactInput>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [attempted, setAttempted] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  // Quick human check: a signed "What is 7 + 5?" from the server, one try each.
  const [challenge, setChallenge] = useState<ContactChallenge | null>(null);
  const [answer, setAnswer] = useState('');
  const [answerError, setAnswerError] = useState('');
  const [website, setWebsite] = useState(''); // hidden from people; bots fill it in

  const newChallenge = () => {
    setAnswer('');
    getContactChallenge().then(setChallenge, () => setChallenge(null));
  };
  useEffect(newChallenge, []);

  // After the first submit, re-validate as the user types so errors clear as they're fixed.
  const set = (key: keyof ContactInput) => (e: { target: { value: string } }) => {
    const next = { ...values, [key]: e.target.value };
    setValues(next);
    if (attempted) setErrors(contactErrors(next) ?? {});
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    setServerError('');
    const errs = contactErrors(values);
    setErrors(errs ?? {});
    const missingAnswer = !answer.trim();
    setAnswerError(missingAnswer ? 'Please answer the question.' : '');
    if (errs || missingAnswer || !challenge) return;

    setIsSubmitting(true);
    try {
      await contactUs(
        { name: values.name.trim(), email: values.email.trim(), message: values.message.trim() },
        { token: challenge.token, answer: answer.trim() },
        website,
      );
      setValues(EMPTY);
      setAttempted(false);
      setIsSubmitted(true);
      newChallenge();
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      const code = isAxiosError(err) ? (err.response?.data as { error?: string } | undefined)?.error : undefined;
      if (code === 'captcha') setAnswerError("That's not quite right. Here's a new one.");
      else setServerError(status === 429 ? 'Too many messages. Please try again in an hour.' : 'Something went wrong. Please try again.');
      newChallenge(); // every question works once
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div role="status" className="flex flex-col items-start gap-3 py-6">
        <CheckCircle className="h-8 w-8 text-success" />
        <p className="text-lg font-semibold text-fg">Message sent</p>
        <p className="text-fg-muted">Thanks for reaching out. We&apos;ll get back to you soon.</p>
        <button type="button" className="text-sm font-medium underline underline-offset-4 hover:text-fg-muted" onClick={() => setIsSubmitted(false)}>
          Send another message
        </button>
      </div>
    );
  }

  const err = (key: keyof ContactInput) =>
    errors[key] ? (
      <p id={`${key}-error`} role="alert" className="mt-1 text-sm text-danger">
        {errors[key]}
      </p>
    ) : null;
  const a11y = (key: keyof ContactInput) => ({
    'aria-invalid': !!errors[key],
    'aria-describedby': errors[key] ? `${key}-error` : undefined,
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>

      <div>
        <label htmlFor="name" className={label}>Name</label>
        <Input
          id="name"
          placeholder="Your name"
          value={values.name}
          onChange={set('name')}
          className={field}
          disabled={isSubmitting}
          {...a11y('name')}
        />
        {err('name')}
      </div>

      <div>
        <label htmlFor="email" className={label}>Email</label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={set('email')}
          className={field}
          disabled={isSubmitting}
          {...a11y('email')}
        />
        {err('email')}
      </div>

      <div>
        <label htmlFor="message" className={label}>Message</label>
        <Textarea
          id="message"
          placeholder="What is on your mind?"
          value={values.message}
          onChange={set('message')}
          className={`${field} min-h-[160px] resize-y`}
          disabled={isSubmitting}
          {...a11y('message')}
        />
        {err('message')}
      </div>

      <div>
        <label htmlFor="captcha" className={label}>
          Quick check: {challenge ? challenge.question : 'loading…'}
        </label>
        <Input
          id="captcha"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Your answer"
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            if (answerError) setAnswerError('');
          }}
          className={`${field} max-w-[160px]`}
          disabled={isSubmitting || !challenge}
          aria-invalid={!!answerError}
          aria-describedby={answerError ? 'captcha-error' : undefined}
        />
        {answerError && (
          <p id="captcha-error" role="alert" className="mt-1 text-sm text-danger">
            {answerError}
          </p>
        )}
      </div>

      {/* Bots fill in every field; people never see this one. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-danger">
          {serverError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-xl bg-accent text-base font-semibold text-accent-fg hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Sending...' : 'Send message'}
      </Button>
      <p className="text-sm text-fg-subtle">
        Found a bug or have an idea?{' '}
        <a href={issueUrl('bug_report')} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-fg">
          Report an issue
        </a>{' '}
        or{' '}
        <a href={issueUrl('feature_request')} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-fg">
          request a feature
        </a>{' '}
        on GitHub.
      </p>
    </form>
  );
};

export default ContactUsForm;
