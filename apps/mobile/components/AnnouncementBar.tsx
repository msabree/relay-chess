import { api } from '@/apis/http';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';
import type { Announcement } from '@relay-chess/game';
import { useQuery } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';

const DISMISSED = 'relaychess.dismissed';

/**
 * Site-wide banners from the server (a launch, a planned deploy, anything).
 * Info banners can be dismissed on this device; warnings stay up.
 */
export function AnnouncementBar() {
  const { c } = useTheme();
  const { data } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => api.get<{ announcements: Announcement[] }>('/announcements').then((r) => r.data.announcements),
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
  });
  const [dismissed, setDismissed] = useState<string[]>([]);
  useEffect(() => {
    SecureStore.getItemAsync(DISMISSED)
      .then((v) => v && setDismissed(JSON.parse(v)))
      .catch(() => {});
  }, []);

  const dismiss = (id: string) => {
    const next = [...dismissed, id].slice(-20);
    setDismissed(next);
    SecureStore.setItemAsync(DISMISSED, JSON.stringify(next)).catch(() => {});
  };

  const shown = (data ?? []).filter((a) => a.tone === 'warning' || !dismissed.includes(a.id));
  if (!shown.length) return null;

  return (
    <View>
      {shown.map((a) => {
        const warning = a.tone === 'warning';
        return (
          <View
            key={a.id}
            accessibilityRole={warning ? 'alert' : 'summary'}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: warning ? c.accent : alpha(c.accent, 0.15),
              borderBottomWidth: 0.5,
              borderBottomColor: c.line,
            }}
          >
            <Text variant="small" style={{ flex: 1, textAlign: 'center', color: warning ? c.accentFg : c.fg }}>
              {a.text}
              {a.link && (
                <Text
                  variant="small"
                  accessibilityRole="link"
                  onPress={() => Linking.openURL(a.link!)}
                  style={{ fontWeight: '600', textDecorationLine: 'underline', color: warning ? c.accentFg : c.fg }}
                >
                  {' '}
                  {a.linkText}
                </Text>
              )}
            </Text>
            {!warning && (
              <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={10} onPress={() => dismiss(a.id)}>
                <IconSymbol name="xmark" size={14} color={c.fgMuted} />
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}
