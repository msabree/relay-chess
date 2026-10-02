import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Analytics } from '@vercel/analytics/next';
import { AppProvider } from '@/contexts/App';
import { Toaster } from '@/components/ui/toaster';
import type { AppProps } from 'next/app';

const inter = Inter({ subsets: ['latin'] });

export const queryClient = new QueryClient();

function RelayApp({ Component, pageProps }: AppProps) {
  const { session, ...rest } = pageProps;

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <main className={inter.className}>
            <Component {...rest} />
            <Toaster />
            <Analytics />
          </main>
        </AppProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

export default RelayApp;
