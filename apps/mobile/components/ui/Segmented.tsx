import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/** Web's tab pill group (bg-raised track, bg-surface selected). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  accessibilityLabel?: string;
}) {
  const { c } = useTheme();
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[styles.track, { backgroundColor: c.raised }]}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.item, on && { backgroundColor: c.surface }]}
          >
            <Text style={[styles.label, { color: on ? c.fg : c.fgMuted }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 4, borderRadius: radius.sm, gap: 4 },
  item: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 6 },
  label: { fontSize: 14, fontWeight: '500' },
});
