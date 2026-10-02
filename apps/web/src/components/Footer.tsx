import Link from 'next/link';

type FooterProps = {
  variant?: 'dark' | 'light';
};

const Footer = ({ variant = 'dark' }: FooterProps) => {
  const isLight = variant === 'light';
  const linkClass = isLight
    ? 'text-sm text-stone-600 hover:text-stone-900 transition-colors'
    : 'text-sm text-gray-400 hover:text-cyan-400 transition-colors';
  const dotClass = isLight ? 'text-sm text-stone-300' : 'text-sm text-gray-500';
  const copyClass = isLight ? 'text-sm text-stone-500' : 'text-sm text-gray-500';

  return (
    <footer
      className={
        isLight
          ? 'flex flex-col justify-center items-center w-full border-t border-stone-200 bg-stone-50 py-10'
          : 'flex flex-col justify-center items-center w-full glass-effect border-t border-white/10 py-12'
      }
    >
      <div className="flex flex-col justify-between items-center w-4/5 max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
          <Link className={linkClass} href="/contact">
            Contact Us
          </Link>
          <div className={`hidden sm:block ${dotClass}`}>•</div>
          <Link className={linkClass} href="/terms-of-service">
            Terms of Service
          </Link>
          <div className={`hidden sm:block ${dotClass}`}>•</div>
          <Link className={linkClass} href="/privacy-policy">
            Privacy Policy
          </Link>
          <div className={`hidden sm:block ${dotClass}`}>•</div>
          <div className={copyClass}>© {new Date().getFullYear()} RelayChess. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
