import Button from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { SITE_URL } from '@/constants/URLs';
import { ChessGameContext } from '@/contexts/ChessGame';
import { shareText } from '@/lib/result';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, radius } from '@/theme/tokens';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import { Linking, Pressable, Share, StyleSheet, View } from 'react-native';
import { resultText } from './util';

/** Result card after the game; draw/resign/abort during it. */
export default function GameActions() {
  const { c } = useTheme();
  const { game, room, teamColor, changeTeam, abortGame, resignGame, offerDraw, offerRematch, drawOfferedBy, roomId } =
    useContext(ChessGameContext);
  const [confirmResign, setConfirmResign] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!confirmResign) return;
    const t = setTimeout(() => setConfirmResign(false), 3000);
    return () => clearTimeout(t);
  }, [confirmResign]);

  if (!game) return null;

  if (game.status === 'over') {
    const r = resultText(game);
    const rematchId = room?.rematchRoomId;
    const played = game.result?.reason !== 'aborted' && game.moves.length > 0;
    const reviewUrl = `${SITE_URL}/analysis/${roomId}`;
    return (
      <View style={styles.wrap}>
        <View style={[styles.result, { backgroundColor: c.raised }]}>
          <Text variant="heading" style={{ fontSize: 19 }}>
            {r.title}
          </Text>
          {r.detail ? (
            <Text variant="small" tone="muted">
              {r.detail}
            </Text>
          ) : null}
        </View>
        <View style={styles.row}>
          {game.result?.reason === 'aborted' && !room?.isPrivate ? (
            <Button style={{ flex: 1 }} onPress={() => router.dismissTo('/')}>
              Find a new game
            </Button>
          ) : rematchId ? (
            <Button style={{ flex: 1 }} onPress={() => router.replace(`/games/${rematchId}`)}>
              Join rematch
            </Button>
          ) : teamColor ? (
            <Button style={{ flex: 1 }} onPress={offerRematch}>
              Rematch
            </Button>
          ) : null}
          {played && (
            <Button variant="secondary" style={{ flex: 1 }} onPress={() => Linking.openURL(reviewUrl)}>
              Review game
            </Button>
          )}
        </View>
        {played && (
          <Button
            variant="secondary"
            onPress={() =>
              Share.share({
                message: `${shareText({
                  winner: game.result?.winner,
                  reason: game.result?.reason ?? '',
                  plies: game.moves.length,
                  me: teamColor ?? null,
                })} ${reviewUrl}`,
              })
            }
          >
            Share result
          </Button>
        )}
        <Pressable accessibilityRole="link" onPress={() => router.dismissTo('/')} style={{ alignSelf: 'center' }}>
          <Text variant="small" tone="muted" style={{ textDecorationLine: 'underline' }}>
            Back to the lobby
          </Text>
        </Pressable>
      </View>
    );
  }

  // A quick match before the first move: anyone watching can fill a seat whose player left.
  const openSeats =
    game.status === 'waiting' && !room?.isPrivate
      ? (['w', 'b'] as const).filter((side) => game.teams[side].some((p) => !p.connected))
      : [];
  if (!teamColor && openSeats.length > 0) {
    return (
      <View style={[styles.wrap, styles.row]}>
        {openSeats.map((side) => (
          <Button key={side} style={{ flex: 1 }} onPress={() => changeTeam(side)}>
            {`Take ${side === 'w' ? 'White' : 'Black'} seat`}
          </Button>
        ))}
      </View>
    );
  }

  if (!teamColor) {
    const url = `${SITE_URL}/games/${roomId}`;
    return (
      <View style={[styles.wrap, styles.row]}>
        <Button variant="secondary" style={{ flex: 1 }} onPress={() => Share.share({ message: url })}>
          Share this game
        </Button>
        <Button
          variant="secondary"
          onPress={() =>
            Clipboard.setStringAsync(url).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            })
          }
        >
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      </View>
    );
  }

  if (game.status === 'waiting' && room?.isPrivate) return null;

  if (game.moves.length < 2) {
    return (
      <View style={styles.wrap}>
        <Button variant="secondary" onPress={abortGame}>
          {game.status === 'waiting' ? 'Cancel game' : 'Abort game'}
        </Button>
      </View>
    );
  }

  const theyOffered = !!drawOfferedBy && drawOfferedBy !== teamColor;
  const weOffered = drawOfferedBy === teamColor;
  return (
    <View style={[styles.wrap, styles.row]}>
      <Button
        variant={theyOffered ? 'primary' : 'secondary'}
        disabled={weOffered}
        style={{ flex: 1 }}
        onPress={offerDraw}
      >
        {theyOffered ? 'Accept draw' : weOffered ? 'Draw offered' : 'Offer draw'}
      </Button>
      <Button
        variant="danger"
        style={[{ flex: 1 }, confirmResign && { borderColor: c.danger, backgroundColor: alpha(c.danger, 0.1) }]}
        onPress={() => {
          if (confirmResign) {
            setConfirmResign(false);
            resignGame();
          } else setConfirmResign(true);
        }}
      >
        {confirmResign ? 'Tap again to resign' : 'Resign'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 4, gap: 10 },
  row: { flexDirection: 'row', gap: 8 },
  result: { borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', gap: 2 },
});
