import Head from 'next/head';
import NavigationBar from '@/components/NavigationBar';
import Leaderboard from '@/components/Leaderboard';

export default function LeaderboardPage() {
  return (
    <>
      <Head>
        <title>{"Leaderboard · Relay Chess"}</title>
        <meta name="description" content={"Today's and this week's top Relay Chess players. Just for fun, resets on its own."} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <NavigationBar />
      <Leaderboard showHeader={true} showPagination={true} />
    </>
  );
}
