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
        <div className="p-4 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20">
          <CheckCircle className="w-12 h-12 text-green-400" />
        </div>
        <p className="text-lg font-semibold text-white">{"Message Sent!"}</p>
        <p className="text-gray-300 text-center">{"We'll get back to you soon."}</p>
        <Button
          variant="ghost"
          className="text-cyan-400 hover:text-cyan-300 hover:bg-white/10 mt-4"
          onClick={() => setIsSubmitted(false)}
        >
          {"Send another message"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-300 text-center text-sm mb-6">{"Have a partnership inquiry, business question, or just want to reach out? We'd love to hear from you!"}</p>

      <Input
        id="name"
        placeholder={"Your Name"}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="glass-effect border border-white/10 bg-white/5 text-white placeholder:text-gray-400 focus:border-cyan-400/50 focus:ring-cyan-400/50"
        disabled={isSubmitting}
      />

      <Input
        id="email"
        type="email"
        placeholder={"Your Email"}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="glass-effect border border-white/10 bg-white/5 text-white placeholder:text-gray-400 focus:border-cyan-400/50 focus:ring-cyan-400/50"
        disabled={isSubmitting}
      />

      <Textarea
        id="message"
        placeholder={"Your Message"}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="glass-effect border border-white/10 bg-white/5 text-white placeholder:text-gray-400 focus:border-cyan-400/50 focus:ring-cyan-400/50 min-h-[150px] resize-none"
        disabled={isSubmitting}
      />

      <div className="flex justify-center pt-4">
        <Button
          disabled={!name.trim() || !email.trim() || !message.trim() || isSubmitting}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 glow-effect disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
          onClick={handleSubmit}
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </Button>
      </div>
    </div>
  );
};

export default ContactUsForm;
