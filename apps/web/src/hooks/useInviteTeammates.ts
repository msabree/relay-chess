import { useEffect, useMemo, useState } from 'react';
import randomstring from 'randomstring';
import type { Party } from '@relay-chess/game';
import { request, toServerTimer, useSocket } from '@/lib/socket';

interface UseInviteTeammatesProps {
  selectedTimer: string;
  open: boolean;
  /** set when you followed someone's invite link */
  inviteCode: string;
}

/** A teammate lobby (party). Friends join with the invite code; the host queues the team. */
const useInviteTeammates = ({ selectedTimer, open, inviteCode }: UseInviteTeammatesProps) => {
  const ownCode = useMemo(() => randomstring.generate(8), []);
  const roomId = inviteCode === '' ? ownCode : inviteCode;
  const { socket, connected } = useSocket();
  const [party, setParty] = useState<Party | null>(null);

  useEffect(() => {
    if (!socket || !connected || !open) return;
    const onParty = (p: Party) => p.id === roomId && setParty(p);
    socket.on('party:state', onParty);
    request<{ party: Party }>(socket, 'party:join', { partyId: roomId }).then((res) => res.ok && setParty(res.party));
    return () => {
      socket.off('party:state', onParty);
      socket.emit('party:leave', { partyId: roomId });
    };
  }, [socket, connected, open, roomId]);

  const teammateLobby = (party?.members ?? []).map((m) => ({ isHost: m.isHost, userId: m.id, username: m.name }));

  const startTeamMatchmaking = () =>
    request(socket, 'party:queue', { partyId: roomId, timeControl: toServerTimer(selectedTimer) });

  return { teammateLobby, roomId, startTeamMatchmaking, matchmakingStarted: party?.queuedFor != null };
};

export default useInviteTeammates;
