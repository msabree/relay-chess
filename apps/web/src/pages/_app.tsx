import '@/styles/globals.css';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { QueryClientProvider } from 'react-query';
import { Analytics } from '@vercel/analytics/next';
import { AppProvider } from '@/contexts/App';
import { Toaster } from '@/components/ui/toaster';
import { queryClient } from '@/lib/queryClient';
import type { AppProps } from 'next/app';

const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['500', '600'], variable: '--font-mono' });

function RelayApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <div className={`${sans.variable} ${mono.variable} font-sans min-h-screen bg-bg text-fg`}>
            <Component {...pageProps} />
            <Toaster />
            <Analytics />
          </div>
        </AppProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default RelayApp;
