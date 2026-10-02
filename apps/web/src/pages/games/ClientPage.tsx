import { ErrorInfo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ErrorBoundary } from 'react-error-boundary';
import { ChessGameProvider } from '@/contexts/ChessGame';
import NavigationBar from '@/components/NavigationBar';
import GameScreen from '@/components/game/GameScreen';
import { useUser } from '@/hooks/useUser';
import { BOARD_COLOR_SCHEMES } from '@/constants';

function GamesErrorFallback() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-fg-muted">Reloading usually fixes it. Your game keeps going on the server.</p>
      <div className="mt-6 flex justify-center gap-2">
        <button type="button" onClick={() => window.location.reload()} className="h-11 rounded-lg bg-accent px-5 font-semibold text-accent-fg">
          Reload
        </button>
        <Link href="/" className="inline-flex h-11 items-center rounded-lg border border-line px-5 font-medium">
          Lobby
        </Link>
      </div>
    </div>
  );
}

const Room = () => {
  const { status } = useSession();
  const user = useUser();
  const roomId = usePathname()?.split('games/')[1] ?? '';
  const scheme = BOARD_COLOR_SCHEMES.find((s) => s.value === user.data?.boardColor);

  return (
    <ErrorBoundary
      fallback={<GamesErrorFallback />}
      onError={(error: unknown, info: ErrorInfo) => console.error('game page crashed', error, info)}
    >
      <Head>
        <title>Relay Chess</title>
        <meta name="robots" content="noindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ChessGameProvider isLoggedIn={status === 'authenticated'} roomId={roomId}>
        <NavigationBar compact />
        <GameScreen lightColor={scheme?.light} darkColor={scheme?.dark} />
      </ChessGameProvider>
    </ErrorBoundary>
  );
};

export default Room;
