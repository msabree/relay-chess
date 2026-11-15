import { SplashAnimation } from '@/components/SplashAnimation';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const queryClient = new QueryClient();

// Keep the native splash up until the launch animation takes over on the same frame.
SplashScreen.preventAutoHideAsync().catch(() => {});

const modal = {
  presentation: 'transparentModal',
  animation: 'fade',
  headerShown: false,
} as const;

export default function RootLayout() {
  const [splash, setSplash] = useState(true);
  const done = useCallback(() => setSplash(false), []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="live" />
              <Stack.Screen name="leaderboard" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="games/[id]" />
              <Stack.Screen name="review/[id]" />
              <Stack.Screen name="+not-found" />
              <Stack.Screen name="modals/menu" options={modal} />
              <Stack.Screen name="modals/matchmaking" options={modal} />
              <Stack.Screen name="modals/invite-teammates" options={modal} />
            </Stack>
            {splash && <SplashAnimation onDone={done} />}
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
