import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { ChessGameContext } from '@/contexts/ChessGame';
import { useTheme } from '@/theme/ThemeProvider';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ColorSwatch } from './ColorSwatch';

/** Room chat. Everyone in the room, including the other team, can read it. */
export default function RoomChat() {
  const { c } = useTheme();
  const { room, game, sendChatMessage, userId, teamColor } = useContext(ChessGameContext);
  const [text, setText] = useState('');
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const chat = room?.chat ?? [];
  const sideOf = (id: string) =>
    game?.teams.w.some((p) => p.id === id) ? 'w' : game?.teams.b.some((p) => p.id === id) ? 'b' : null;

  useEffect(() => {
    scroll.current?.scrollToEnd({ animated: true });
  }, [chat.length]);

  // Players muted spectators; spectators can't post until the game ends.
  const silenced = !!room?.spectatorsMuted && game?.status === 'playing' && !teamColor;

  const send = () => {
    if (!text.trim()) return;
    sendChatMessage(text.trim());
    setText('');
  };

  return (
    <View style={{ height: 360 }}>
      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, gap: 10 }}
        nestedScrollEnabled
        accessibilityLiveRegion="polite"
      >
        {chat.length === 0 && (
          <Text variant="small" tone="subtle">
            Say hi. The other team can read this too.
          </Text>
        )}
        {chat.map((m) => (
          <View key={m.id} style={styles.msg}>
            <View style={{ paddingTop: 5 }}>
              <ColorSwatch color={sideOf(m.userId)} size={8} />
            </View>
            <Text variant="small" style={{ flex: 1 }}>
              <Text variant="small" tone={m.userId === userId ? 'accent' : 'default'} style={{ fontWeight: '600' }}>
                {m.userId === userId ? 'You' : m.name}
              </Text>
              {'  '}
              <Text variant="small" tone="muted">
                {m.text}
              </Text>
            </Text>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.form, { borderTopColor: c.line }]}>
        <Input
          value={text}
          onChangeText={setText}
          maxLength={500}
          editable={!silenced}
          placeholder={silenced ? 'Players muted spectators until the game ends' : 'Message the room'}
          returnKeyType="send"
          onSubmitEditing={send}
          accessibilityLabel="Message the room"
          style={{ flex: 1, opacity: silenced ? 0.6 : 1 }}
        />
        <Button variant="dark" disabled={silenced || !text.trim()} onPress={send}>
          Send
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  msg: { flexDirection: 'row', gap: 8 },
  form: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: StyleSheet.hairlineWidth },
});
