import Head from 'next/head';
import ClientPage from './ClientPage';

export default function ServerSidePage() {
  return (
    <>
      <Head>
        <title>{"Game - Relay Chess"}</title>
        <meta name="description" content={"Play or watch a live 2v2 team chess game on Relay Chess."} />
      </Head>
      <ClientPage />
    </>
  );
}
