import { useState } from 'react';
import { contactUs } from '@/apis/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import dynamic from 'next/dynamic';

const CheckCircle = dynamic(() => import('lucide-react').then(mod => mod.CheckCircle), { ssr: false });

const ContactUsForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await contactUs(name, email, message);
      setName('');
      setEmail('');
      setMessage('');
      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting contact form:', error);
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

  return (
    <div className="space-y-4">
      <p className="text-fg-muted text-center text-sm mb-6">{"Have a partnership inquiry, business question, or just want to reach out? We'd love to hear from you!"}</p>

      <Input
        id="name"
        placeholder={"Your Name"}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="glass-effect border border-line bg-fg/5 text-fg placeholder:text-fg-muted focus:border-accent/50 focus:ring-accent/50"
        disabled={isSubmitting}
      />

      <Input
        id="email"
        type="email"
        placeholder={"Your Email"}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="glass-effect border border-line bg-fg/5 text-fg placeholder:text-fg-muted focus:border-accent/50 focus:ring-accent/50"
        disabled={isSubmitting}
      />

      <Textarea
        id="message"
        placeholder={"Your Message"}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="glass-effect border border-line bg-fg/5 text-fg placeholder:text-fg-muted focus:border-accent/50 focus:ring-accent/50 min-h-[150px] resize-none"
        disabled={isSubmitting}
      />

      <div className="flex justify-center pt-4">
        <Button
          disabled={!name.trim() || !email.trim() || !message.trim() || isSubmitting}
          className="bg-accent hover:bg-accent/90 text-accent-fg font-semibold px-8 py-3 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
          onClick={handleSubmit}
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </Button>
      </div>
    </div>
  );
};

export default ContactUsForm;
