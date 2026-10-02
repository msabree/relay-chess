import dynamic from 'next/dynamic';
import Head from 'next/head';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import LegalDocument from '@/components/LegalDocument';

const Shield = dynamic(() => import('lucide-react').then(mod => mod.Shield), { ssr: false });

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>{"Privacy Policy - Relay Chess"}</title>
        <meta name="description" content={"Protecting your private information is our priority. This Privacy Policy governs how Relay Chess collects and uses your data."} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <NavigationBar />

      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <main className="relative z-10 min-h-screen text-white py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-effect border border-white/10 mb-6">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <LegalDocument document="privacy" />
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}
