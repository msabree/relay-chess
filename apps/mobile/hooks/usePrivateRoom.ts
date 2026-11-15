import { TIMER_OPTIONS } from '@/constants/Games';
import { request, toServerTimer, useSocket } from '@/lib/socket';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

/** Make a private room and go straight to its setup (clock and sides are picked there). */
export function usePrivateRoom() {
  const { socket } = useSocket();
  const [creating, setCreating] = useState(false);

  const create = async (replace = false) => {
    if (creating) return;
    setCreating(true);
    const res = await request<{ roomId: string }>(socket, 'room:create', {
      timeControl: toServerTimer(TIMER_OPTIONS[0]!.time),
    });
    setCreating(false);
    if (!res.ok) {
      Alert.alert("Couldn't make a room", res.error === 'offline' ? 'Check your connection and try again.' : res.error);
      return;
    }
    const href = `/games/${res.roomId}` as const;
    if (replace) router.replace(href);
    else router.push(href);
  };

  return { create, creating };
}
