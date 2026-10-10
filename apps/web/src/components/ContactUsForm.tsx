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
const field = 'glass-effect border border-line bg-fg/5 text-fg placeholder:text-fg-muted focus:border-accent/50 focus:ring-accent/50';

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
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="p-4 rounded-full bg-accent/20">
          <CheckCircle className="w-12 h-12 text-success" />
        </div>
        <p className="text-lg font-semibold text-fg">{"Message Sent!"}</p>
        <p className="text-fg-muted text-center">{"We'll get back to you soon."}</p>
        <Button
          variant="ghost"
          className="text-accent-ink hover:text-accent-ink hover:bg-fg/10 mt-4"
          onClick={() => setIsSubmitted(false)}
        >
          {"Send another message"}
        </Button>
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
      <p className="text-fg-muted text-center text-sm mb-6">
        {"Have a partnership inquiry, business question, or just want to reach out? We'd love to hear from you! "}
        {"Found a bug or have an idea? "}
        <a href={issueUrl('bug_report')} target="_blank" rel="noopener noreferrer" className="text-accent-ink underline underline-offset-4">
          Report an issue
        </a>
        {" or "}
        <a href={issueUrl('feature_request')} target="_blank" rel="noopener noreferrer" className="text-accent-ink underline underline-offset-4">
          request a feature
        </a>
        {" on GitHub."}
      </p>

      <div>
        <Input
          id="name"
          aria-label="Your Name"
          placeholder="Your Name"
          value={values.name}
          onChange={set('name')}
          className={field}
          disabled={isSubmitting}
          {...a11y('name')}
        />
        {err('name')}
      </div>

      <div>
        <Input
          id="email"
          type="email"
          aria-label="Your Email"
          placeholder="Your Email"
          value={values.email}
          onChange={set('email')}
          className={field}
          disabled={isSubmitting}
          {...a11y('email')}
        />
        {err('email')}
      </div>

      <div>
        <Textarea
          id="message"
          aria-label="Your Message"
          placeholder="Your Message"
          value={values.message}
          onChange={set('message')}
          className={`${field} min-h-[150px] resize-none`}
          disabled={isSubmitting}
          {...a11y('message')}
        />
        {err('message')}
      </div>

      {serverError && (
        <p role="alert" className="text-center text-sm text-danger">
          {serverError}
        </p>
      )}

      <div className="flex justify-center pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-accent hover:bg-accent/90 text-accent-fg font-semibold px-8 py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </Button>
      </div>
    </form>
  );
};

export default ContactUsForm;
