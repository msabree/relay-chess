import { Text } from '@/components/ui/Text';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';
import { router } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

/** Centered card over a dimmed backdrop, for the modal routes. Tap outside to close. */
export function Dialog({
  title,
  children,
  onClose = () => router.back(),
}: {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  const { c } = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(150)} style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close" onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.center}>
        <Animated.View
          entering={SlideInDown.duration(220)}
          accessibilityViewIsModal
          style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}
        >
          <Text variant="title" style={{ textAlign: 'center' }} accessibilityRole="header">
            {title}
          </Text>
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  center: { flex: 1, justifyContent: 'center', padding: 16 },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: 22, gap: 18 },
});
