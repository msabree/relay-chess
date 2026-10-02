import React, { ErrorInfo, useContext, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import ChessGame from '@/components/ChessGame';
import {
  GameConsole,
  GameConsoleTeamView,
  GameConsoleCenter
} from '@/components/GameConsole';
import ChatRoom from '@/components/ChatRoom';
import { useUser } from '@/hooks/useUser';
import { AppContext } from '@/contexts/App';
import { ChessGameProvider } from '@/contexts/ChessGame';
import MoveHistory from '@/components/MoveHistory';
import NavigationBar from '@/components/NavigationBar';
import { decodeTimer } from '@/utils/timer';
import Notifications from '@/components/Notifications';
import RightDrawer from '@/components/RightDrawer';
import { BOARD_COLOR_SCHEMES } from '@/constants';
import SignInModal from '@/modals/SignIn';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useIsTablet } from '@/hooks/useIsTablet';
import { logCrashError } from '@/apis/auth';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import GameFeedback from '@/modals/GameFeedback';
import Chat from '@/modals/Chat';

function GamesErrorFallback() {
  return (
    <div className='flex flex-col items-center text-white mt-20'>
      <div className='mb-5'>{"Something went wrong. Our dev team has been notified. Try reloading this page or go to the home page."}</div>
      <Button className='mb-5' onClick={() => window.location.href = 'https://relaychess.com'}>{"Home"}</Button>
      <Button onClick={() => window.location.reload()}>{"Reload Page"}</Button>
    </div>
  );
}

const Room = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const { modal, setModal } = useContext(AppContext);
  const { data: session } = useSession();
  const userQuery = useUser();
  const roomId = usePathname()?.split('games/')[1];

  // MAGIC HERE!!!
  // I added the timer selection to the roomId string. its encodes as a single character
  // ex: X === 0,0
  const timer = decodeTimer(roomId?.charAt(roomId.length - 1));
  // MAGIC HERE!!!

  const isLoggedIn = session?.user ? true : false;
  const userId = userQuery.data?._id;
  const username = userQuery.data?.username;
  const boardColor = userQuery.data?.boardColor ?? '';
  const colorSchemeObject = BOARD_COLOR_SCHEMES.find((item) => item.value === boardColor);

  useEffect(() => {

    // extra reload to purge cached context
    const contextDirty = sessionStorage.getItem('contextDirty');
    if (contextDirty === 'true') {
      sessionStorage.removeItem('contextDirty');
      window.location.reload();
    }
  }, []);

  if(userId === ''){
    return null;
  }

  // show on desktop only
  const getLeftViewInDesktop = () => {
    return (
      <ChatRoom />
    );
  };

  const getRightViewInDesktop = () => {
    return (
      <div className='mt-5'>
        <GameConsole />
      </div>
    );
  };

  // show on mobile only
  const getTopViewInMobile = () => {
    return (
      <GameConsoleTeamView
        positionTop={true}
        justifyContent={'flex-start'}
        isMyTimer={false} />
    );
  };

  // show on tablet only
  const getRightViewInTablet = () => {
    return (
      <div className='flex flex-col relative'>
        <GameConsole />
      </div>
    );
  };

  const getBottomViewInMobile = () => {
    return (
      <div className="relative">
        <GameConsoleTeamView
          positionTop={false}
          justifyContent={'flex-end'}
          isMyTimer={true}
        />
        <GameConsoleCenter />
      </div>
    );
  };

  return (
    <ErrorBoundary fallback={<GamesErrorFallback />} onError={(error: unknown, info: ErrorInfo) => {
      logCrashError('games', error as Error, info, userQuery.data?._id ?? '').catch(() => {});
    }}>
      <ChessGameProvider
        isLoggedIn={isLoggedIn}
        roomId={roomId}
        userId={userId ?? ''}
        username={username ?? ''}
        selectedTimer={timer}
      >
        <NavigationBar hideSignIn={true} />
        <div className="w-full">
          <div className="flex flex-col justify-center h-screen sm:flex-row sm:h-screen">
            {!isMobile && !isTablet && getLeftViewInDesktop()}
            {isMobile && getTopViewInMobile()}
            <div className="w-full h-full sm:w-1/2 sm:h-full md:w-1/2 md:h-full lg:w-2/5 lg:h-full">
              <MoveHistory roomId={roomId} />
              <ChessGame lightColor={colorSchemeObject?.light} darkColor={colorSchemeObject?.dark} />
            </div>
            {!isMobile && !isTablet && getRightViewInDesktop()}
            {isTablet && getRightViewInTablet()}
            {isMobile && getBottomViewInMobile()}
          </div>
        </div>
        <GameFeedback open={modal.name === 'GAME_FEEDBACK'} onClose={() => setModal({name: ''})} />
        {userQuery.data?._id && <Notifications />}
        {userQuery.data?._id && <RightDrawer />}
        {userQuery.data?._id === undefined && <SignInModal />}
        <Chat />
      </ChessGameProvider>
    </ErrorBoundary>
  );
};

export default Room;
