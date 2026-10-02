import React from 'react';
import Head from 'next/head';
import NavigationBar from '@/components/NavigationBar';
import LiveGamesList from '@/components/LiveGamesList';
import Footer from '@/components/Footer';

export default function LiveGamesPage() {
  return (
    <>
      <Head>
        <title>{"Live Games - Relay Chess"}</title>
        <meta name="description" content={"Watch live 2v2 chess games in progress. Learn from top players and follow exciting team chess matches."} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NavigationBar />
      <main className="min-h-screen pb-20">
        <LiveGamesList />
      </main>
      <Footer />
    </>
  );
}

