import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const Mail = dynamic(() => import('lucide-react').then(mod => mod.Mail), { ssr: false });

type SocialLinksProps = {
  variant?: 'dark' | 'light';
};

const SocialLinks = ({ variant = 'dark' }: SocialLinksProps) => {
  const isLight = variant === 'light';

  return (
    <div className="flex flex-col justify-center items-center mb-7 w-full max-w-2xl mx-auto px-4">
      <div
        className={
          isLight
            ? 'rounded-xl border border-stone-200 bg-white p-8 md:p-10 w-full text-center shadow-sm'
            : 'glass-effect rounded-2xl p-8 md:p-12 w-full text-center'
        }
      >
        <div className="flex justify-center mb-5">
          <div className={isLight ? 'p-3 rounded-lg bg-stone-100' : 'p-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20'}>
            <Mail className={`w-6 h-6 ${isLight ? 'text-stone-700' : 'text-cyan-400'}`} />
          </div>
        </div>
        <h3 className={`text-xl font-semibold mb-3 ${isLight ? 'text-stone-900' : 'text-white'}`}>
          Partnerships & inquiries
        </h3>
        <p className={`text-base mb-6 leading-relaxed ${isLight ? 'text-stone-600' : 'text-gray-300'}`}>
          Interested in partnering with Relay Chess? We would like to hear from you.
        </p>
        <Button
          asChild
          className={
            isLight
              ? 'inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-medium px-6 py-3 rounded-lg'
              : 'inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold text-lg transition-all duration-300 hover:scale-105 glow-effect'
          }
        >
          <Link href="/contact">
            <Mail className="w-4 h-4" />
            <span>Contact us</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default SocialLinks;
