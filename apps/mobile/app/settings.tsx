import { renamePlayer } from '@/apis/players';
import { Screen } from '@/components/Screen';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Segmented } from '@/components/ui/Segmented';
import { Text } from '@/components/ui/Text';
import { BOARD_COLOR_SCHEMES } from '@/constants/Games';
import { useUser } from '@/hooks/useUser';
import { updateSettings, useSettings, type ThemeMode } from '@/lib/settings';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const NICKNAME = /^[\p{L}\p{N}_ -]{2,20}$/u;

/** Your nickname, board colors and theme. Everything lives on this device. */
export default function SettingsScreen() {
  const { c } = useTheme();
  const user = useUser();
  const settings = useSettings();
  // null until edited: shows your current name
  const [draft, setDraft] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const name = draft ?? user.data?.username ?? '';
  const clean = name.trim().replace(/\s+/g, ' ');
  const valid = NICKNAME.test(clean);
  const unchanged = clean === user.data?.username;

  const save = async () => {
    if (!valid || unchanged) return;
    setState('saving');
    try {
      await renamePlayer(clean);
      setDraft(null);
      setState('saved');
    } catch {
      setState('error');
    }
  };

  const help =
    state === 'saved'
      ? 'Saved. New games will use this name.'
      : state === 'error'
        ? "Couldn't save that. Try again."
        : !valid && name
          ? '2 to 20 letters, numbers, spaces, _ or -.'
          : '2 to 20 characters.';

  return (
    <Screen>
      <Text variant="title">Settings</Text>

      <Card style={{ gap: 4 }}>
        <Text variant="heading">Your name</Text>
        <Text variant="small" tone="muted">
          No account needed.
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <Input
            value={name}
            maxLength={20}
            autoCorrect={false}
            returnKeyType="done"
            accessibilityLabel="Your name"
            onChangeText={(t) => {
              setDraft(t);
              setState('idle');
            }}
            onSubmitEditing={save}
            style={{ flex: 1 }}
          />
          <Button disabled={!valid || unchanged} loading={state === 'saving'} onPress={save}>
            Save
          </Button>
        </View>
        <Text
          variant="caption"
          tone={state === 'error' || (!valid && name) ? 'danger' : 'subtle'}
          accessibilityLiveRegion="polite"
          style={{ marginTop: 6 }}
        >
          {help}
        </Text>
      </Card>

      <Card style={{ gap: 12 }}>
        <Text variant="heading">Theme</Text>
        <Segmented<ThemeMode>
          accessibilityLabel="Theme"
          value={settings.theme}
          onChange={(theme) => updateSettings({ theme })}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
        />
      </Card>

      <Card style={{ gap: 12 }}>
        <Text variant="heading">Board</Text>
        <View accessibilityRole="radiogroup" style={styles.boards}>
          {BOARD_COLOR_SCHEMES.map((s) => {
            const on = settings.board === s.value;
            return (
              <Pressable
                key={s.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${s.label} board`}
                onPress={() => updateSettings({ board: s.value })}
                style={[styles.board, { borderColor: on ? c.accent : c.line, borderWidth: on ? 2 : 1 }]}
              >
                <View style={styles.swatch}>
                  {[s.light, s.dark, s.dark, s.light].map((bg, i) => (
                    <View key={i} style={{ width: '50%', height: '50%', backgroundColor: bg }} />
                  ))}
                </View>
                <Text variant="caption">{s.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  boards: { flexDirection: 'row', gap: 8 },
  board: { flex: 1, alignItems: 'center', gap: 6, padding: 8, borderRadius: radius.sm },
  swatch: { width: 40, height: 40, flexDirection: 'row', flexWrap: 'wrap', borderRadius: 6, overflow: 'hidden' },
});
