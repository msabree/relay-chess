import GameScreen from '@/components/game/GameScreen';
import { Screen } from '@/components/Screen';
import { ChessGameProvider } from '@/contexts/ChessGame';
import { useUser } from '@/hooks/useUser';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function GameRoom() {
  const userId = useUser().data?._id ?? '';
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen contentStyle={{ padding: 8, paddingBottom: 40 }}>
      {userId !== '' && (
        <ChessGameProvider key={id} roomId={id}>
          <GameScreen />
        </ChessGameProvider>
      )}
    </Screen>
  );
}
