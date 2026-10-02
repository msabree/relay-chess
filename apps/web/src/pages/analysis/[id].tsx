import Head from 'next/head';
import ClientPage from './ClientPage';

interface ServerSidePageProps {
  gameType: string;
  whiteTeamName: string;
  blackTeamName: string;
  roomId: string;
}

export default function ServerSidePage({ roomId: _roomId }: ServerSidePageProps) {
  return (
    <>
      <Head>
        <title>{"Game Analysis - Relay Chess"}</title>
        <meta name="description" content={"Review your 2v2 chess game with computer analysis, move feedback, and team synergy metrics."} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ClientPage />
    </>
  );
}

export async function getServerSideProps({ params: _params }: any) {
  // The "useGame" server-side equivalent...
  // We are running on a server so we can't use the hook...
  // const gameRes = await fetch(`${process.env.CHESS_SERVER_API}/games/${params.id}`);
  // const gameData = await gameRes.json();

  return {
    props: {
      gameType: '',
      whiteTeamName: '',
      blackTeamName: '',
      roomId: '',
    },
  }; 
}