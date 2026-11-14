import { Screen } from '@/components/Screen';
import Button from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { router } from 'expo-router';
import React from 'react';

export default function NotFoundScreen() {
  return (
    <Screen contentStyle={{ alignItems: 'center', paddingTop: 64 }}>
      <Text variant="title">This screen does not exist.</Text>
      <Button onPress={() => router.dismissTo('/')}>Go home</Button>
    </Screen>
  );
}
