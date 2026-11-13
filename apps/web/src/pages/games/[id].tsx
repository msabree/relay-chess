import Head from 'next/head';
import ClientPage from './ClientPage';
import { OG_IMAGE } from '@/constants';

const TITLE = 'Join my 2v2 chess game · Relay Chess';
const DESCRIPTION = 'Two teams, one board. Tap to grab a seat. No account needed.';

export default function ServerSidePage() {
  return (
    <>
      <Head>
        <title>{"Game - Relay Chess"}</title>
        <meta name="description" content={"Play or watch a live 2v2 team chess game on Relay Chess."} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Relay Chess" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content={OG_IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={OG_IMAGE} />
      </Head>
      <ClientPage />
    </>
  );
}
