import Head from 'next/head';
import NavigationBar from '@/components/NavigationBar';
import Leaderboard from '@/components/Leaderboard';

export default function LeaderboardPage() {
  return (
    <>
      <Head>
        <title>{"Leaderboard - Relay Chess"}</title>
        <meta name="description" content={"View the Relay Chess leaderboard. See top 2v2 chess players, rankings, streaks, and climb to the top."} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NavigationBar />
      <Leaderboard showHeader={true} showPagination={true} />
    </>
  );
}
