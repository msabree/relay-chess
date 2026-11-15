import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

/**
 * One field for any code a friend sends: a room link, a room code (11 chars)
 * or a team code. "Start a team" makes a team code to share.
 */
export function CodeJoin() {
  const [code, setCode] = useState('');

  const join = () => {
    const raw = code.trim();
    if (!raw) return;
    const fromLink = raw.match(/\/games\/([\w-]+)/)?.[1];
    const room = fromLink ?? (/^[\w-]{11}$/.test(raw) ? raw : null);
    setCode('');
    if (room) router.push(`/games/${room}`);
    else router.push({ pathname: '/modals/invite-teammates', params: { teamCode: raw } });
  };

  return (
    <View style={{ gap: 8 }}>
      <Text variant="small" tone="muted" style={{ fontWeight: '600' }}>
        Have a code?
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Input
          value={code}
          onChangeText={setCode}
          placeholder="Room or team code"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={join}
          accessibilityLabel="Room or team code"
          style={{ flex: 1 }}
        />
        <Button variant="dark" disabled={!code.trim()} onPress={join}>
          Join
        </Button>
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push('/modals/invite-teammates')}>
        <Text variant="small" tone="accent" style={{ fontWeight: '600' }}>
          Or start a team with a partner
        </Text>
      </Pressable>
    </View>
  );
}
