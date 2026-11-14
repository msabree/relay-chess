import { useState, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import { isAxiosError } from 'axios';
import { contactErrors, type ContactErrors, type ContactInput } from '@relay-chess/game';
import { contactUs } from '@/apis/auth';
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
    if (errs) return;

    setIsSubmitting(true);
    try {
      await contactUs(values.name.trim(), values.email.trim(), values.message.trim());
      setValues(EMPTY);
      setAttempted(false);
      setIsSubmitted(true);
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      setServerError(status === 429 ? 'Too many messages. Please try again in an hour.' : 'Something went wrong. Please try again.');
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
