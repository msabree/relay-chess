import Link from 'next/link';
import { LogoMark } from '@/icons/Logo';

const REPO_URL = 'https://github.com/msabree/relay-chess';

const Footer = (_props: { variant?: 'dark' | 'light' }) => (
  <footer className="border-t border-line">
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-sm text-fg-muted">
        <LogoMark size={20} className="text-fg" />
        <span>Relay Chess is free and open source. Made by chess friends, for chess friends.</span>
      </div>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <a href={REPO_URL} className="text-fg-muted hover:text-fg">GitHub</a>
        <Link href="/contact" className="text-fg-muted hover:text-fg">Contact</Link>
        <Link href="/terms-of-service" className="text-fg-muted hover:text-fg">Terms</Link>
        <Link href="/privacy-policy" className="text-fg-muted hover:text-fg">Privacy</Link>
      </nav>
    </div>
  </footer>
);

export default Footer;
