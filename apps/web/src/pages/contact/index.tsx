import dynamic from 'next/dynamic';
import Head from 'next/head';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import ContactUsForm from '@/components/ContactUsForm';

const Mail = dynamic(() => import('lucide-react').then(mod => mod.Mail), { ssr: false });

export default function ContactPage() {
  return (
    <>
      <Head>
        <title>{"Contact Us - Relay Chess"}</title>
        <meta name="description" content={"Get in touch with Relay Chess for partnerships, support, and general inquiries."} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <NavigationBar />

      <div className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
        </div>

        <main className="relative z-10 min-h-screen text-fg py-12">
          <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full glass-effect border border-line mb-6">
                <Mail className="w-8 h-8 text-accent-ink" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-gradient">{"Contact Us"}</span>
              </h1>
            </div>

            <div className="glass-effect border border-line rounded-2xl p-6 md:p-8 backdrop-blur-xl">
              <ContactUsForm />
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}
