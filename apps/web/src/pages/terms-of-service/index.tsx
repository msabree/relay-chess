import dynamic from 'next/dynamic';
import Head from 'next/head';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import LegalDocument from '@/components/LegalDocument';

const Scale = dynamic(() => import('lucide-react').then(mod => mod.Scale), { ssr: false });

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>{"Terms of Service - Relay Chess"}</title>
        <meta name="description" content={"Terms of Service for Relay Chess - Team Chess Reimagined. Read our terms and conditions for using our platform."} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <NavigationBar />

      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
        </div>

        <main className="relative z-10 min-h-screen text-fg py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-effect border border-line mb-6">
                <Scale className="w-8 h-8 text-accent-ink" />
              </div>
            </div>
            <LegalDocument document="terms" />
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}
