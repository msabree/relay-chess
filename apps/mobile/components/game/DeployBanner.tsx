import { Text } from '@/components/ui/Text';
import { useDeployPhase } from '@/lib/deployWindow';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';
import React from 'react';
import { View } from 'react-native';

/** Shown on the game screen around the weekly deployment window. */
export default function DeployBanner() {
  const { c } = useTheme();
  const phase = useDeployPhase();
  if (!phase) return null;
  return (
    <View accessibilityRole="alert" style={{ backgroundColor: alpha(c.accent, 0.15), borderRadius: 10, padding: 10 }}>
      <Text variant="small" style={{ textAlign: 'center' }}>
        {phase === 'soon' ? (
          <>
            <Text variant="small" style={{ fontWeight: '600' }}>
              Deployments and maintenance happen Fridays at 12 AM ET.
            </Text>{' '}
            Games may reset between 12:00 and 12:15 AM.
          </>
        ) : (
          <>
            <Text variant="small" style={{ fontWeight: '600' }}>
              We&apos;re doing weekly deployments and maintenance.
            </Text>{' '}
            Games may reset.
          </>
        )}
      </Text>
    </View>
  );
}
