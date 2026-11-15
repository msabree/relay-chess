import { Screen } from '@/components/Screen';
import Button from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { Text } from '@/components/ui/Text';
import { useLeaderboard, useUserPosition, type Period } from '@/hooks/useLeaderboard';
import { useUser } from '@/hooks/useUser';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, radius } from '@/theme/tokens';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

const PAGE_SIZE = 25;

const resetsIn = (iso?: string) => {
  if (!iso) return '';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'resets any moment';
  const h = Math.floor(ms / 3_600_000);
  if (h >= 48) return `resets in ${Math.round(h / 24)} days`;
  if (h >= 1) return `resets in ${h}h`;
  return `resets in ${Math.max(1, Math.round(ms / 60_000))}m`;
};

/** Today and this week, just for fun. Resets on its own. */
export default function LeaderboardScreen() {
  const { c } = useTheme();
  const [period, setPeriod] = useState<Period>('daily');
  const [page, setPage] = useState(0);
  const me = useUser();
  const board = useLeaderboard(page, PAGE_SIZE, period);
  const mine = useUserPosition(me.data?._id, period);

  const rows = board.data?.rows ?? [];
  const total = board.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Screen
      onRefresh={() => {
        board.refetch();
        mine.refetch();
      }}
      refreshing={board.isRefetching}
    >
      <View style={{ gap: 4 }}>
        <Text variant="title">Leaderboard</Text>
        <Text tone="muted">
          Resets {period === 'daily' ? 'daily' : 'every Monday'} (UTC).
        </Text>
      </View>

      <Segmented
        accessibilityLabel="Period"
        value={period}
        onChange={(p) => {
          setPeriod(p);
          setPage(0);
        }}
        options={[
          { value: 'daily', label: 'Today' },
          { value: 'weekly', label: 'This week' },
        ]}
      />

      {mine.data && (
        <View style={[styles.mine, { borderColor: c.accent, backgroundColor: alpha(c.accent, 0.1) }]}>
          <Text variant="small">
            You&apos;re <Text variant="small" style={{ fontWeight: '700' }}>#{mine.data.rank}</Text>{' '}
            {period === 'daily' ? 'today' : 'this week'} with {mine.data.user.wins}{' '}
            {mine.data.user.wins === 1 ? 'win' : 'wins'}.
          </Text>
        </View>
      )}

      <View style={[styles.table, { borderColor: c.line, backgroundColor: c.surface }]}>
        <View style={[styles.tableHead, { borderBottomColor: c.line }]}>
          <Text variant="caption" tone="subtle">
            {total} {total === 1 ? 'player' : 'players'}
          </Text>
          <Text variant="caption" tone="subtle">
            {resetsIn(board.data?.resetsAt)}
          </Text>
        </View>
        {board.isLoading ? (
          <ActivityIndicator color={c.fgMuted} style={{ paddingVertical: 32 }} />
        ) : rows.length === 0 ? (
          <Text tone="muted" style={{ textAlign: 'center', padding: 28 }}>
            Nobody on the board yet {period === 'daily' ? 'today' : 'this week'}. Finish a game and you&apos;re on it.
          </Text>
        ) : (
          <>
            <View style={styles.row}>
              {['#', 'Player', 'W', 'L', 'D'].map((h, i) => (
                <Text
                  key={h}
                  variant="caption"
                  tone="subtle"
                  style={[i === 0 ? styles.rank : i === 1 ? styles.player : styles.num, { textTransform: 'uppercase' }]}
                >
                  {h}
                </Text>
              ))}
            </View>
            {rows.map((r) => {
              const isMe = r.userId === me.data?._id;
              return (
                <View
                  key={r.userId}
                  style={[
                    styles.row,
                    { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line },
                    isMe && { backgroundColor: alpha(c.accent, 0.1) },
                  ]}
                >
                  <Text variant="mono" tone="muted" style={styles.rank}>
                    {r._rank}
                  </Text>
                  <View style={[styles.player, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <Text variant="small" numberOfLines={1} style={{ fontWeight: '500', flexShrink: 1 }}>
                      {r.username}
                    </Text>
                    {isMe && (
                      <View style={[styles.you, { backgroundColor: c.accent }]}>
                        <Text style={{ color: c.accentFg, fontSize: 10, fontWeight: '700' }}>YOU</Text>
                      </View>
                    )}
                  </View>
                  <Text variant="mono" style={[styles.num, { fontWeight: '600' }]}>
                    {r.wins}
                  </Text>
                  <Text variant="mono" tone="muted" style={styles.num}>
                    {r.losses}
                  </Text>
                  <Text variant="mono" tone="muted" style={styles.num}>
                    {r.draws}
                  </Text>
                </View>
              );
            })}
          </>
        )}
      </View>

      {pages > 1 && (
        <View style={styles.pager}>
          <Button variant="secondary" disabled={page === 0} onPress={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Text variant="small" tone="muted">
            Page {page + 1} of {pages}
          </Text>
          <Button variant="secondary" disabled={page + 1 >= pages} onPress={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  mine: { borderWidth: 1, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  table: { borderWidth: 1, borderRadius: radius.md, overflow: 'hidden' },
  tableHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  rank: { width: 36 },
  player: { flex: 1, minWidth: 0 },
  num: { width: 32, textAlign: 'right' },
  you: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
