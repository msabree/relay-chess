import { Screen } from '@/components/Screen';
import Button from '@/components/ui/Button';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Text } from '@/components/ui/Text';
import { WEB_URL } from '@/constants/URLs';
import { ensurePlayer } from '@/lib/auth';
import { useSettings } from '@/lib/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, View } from 'react-native';
import { WebView, type WebViewNavigation } from 'react-native-webview';

// The package types default the extra-props generic to `undefined`, which collapses props to never.
const Web = WebView<object>;

/**
 * Game review is the web analysis page in a WebView (Stockfish runs in the page).
 * Before it loads we hand the page this app's player, theme and board colors,
 * so it saves analysis as you and looks like the rest of the app.
 */
export default function Review() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c, isDark } = useTheme();
  const { board } = useSettings();
  const player = useQuery({ queryKey: ['player-session'], queryFn: ensurePlayer, staleTime: Infinity, retry: 1 });
  const web = useRef<WebView<object>>(null);

  const seed: Record<string, string> = { 'relaychess.board': board, theme: isDark ? 'dark' : 'light' };
  if (player.data) seed['relaychess.player'] = JSON.stringify(player.data);
  const inject = `(function(){try{${Object.entries(seed)
    .map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)},${JSON.stringify(v)});`)
    .join('')}}catch(e){}})();true;`;

  // Stay on review pages; links home close the review, anything else opens in Safari.
  const onNavigate = ({ url }: WebViewNavigation) => {
    if (url.startsWith(`${WEB_URL}/analysis/`) || url.startsWith('about:') || url.startsWith('blob:')) return true;
    if (url.startsWith(WEB_URL)) router.dismissTo('/');
    else Linking.openURL(url);
    return false;
  };

  const spinner = (
    <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: c.bg }]}>
      <ActivityIndicator color={c.fgMuted} />
    </View>
  );

  return (
    <Screen scroll={false}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.back}>
        <IconSymbol name="chevron.left" size={16} color={c.fgMuted} />
        <Text variant="small" tone="muted">
          Back to game
        </Text>
      </Pressable>
      {player.isPending ? (
        <View style={[styles.center, { flex: 1 }]}>
          <ActivityIndicator color={c.fgMuted} />
        </View>
      ) : (
        <Web
          ref={web}
          source={{ uri: `${WEB_URL}/analysis/${encodeURIComponent(id)}?embed=1` }}
          injectedJavaScriptBeforeContentLoaded={inject}
          onShouldStartLoadWithRequest={onNavigate}
          style={{ flex: 1, backgroundColor: c.bg }}
          containerStyle={{ backgroundColor: c.bg }}
          startInLoadingState
          renderLoading={() => spinner}
          renderError={() => (
            <View style={[StyleSheet.absoluteFill, styles.center, { backgroundColor: c.bg, gap: 12 }]}>
              <Text tone="muted">Couldn&apos;t load the review.</Text>
              <Button variant="secondary" onPress={() => web.current?.reload()}>
                Try again
              </Button>
            </View>
          )}
          allowsBackForwardNavigationGestures={false}
          decelerationRate="normal"
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, height: 40 },
});
