import { useEffect, useState } from 'react';

/**
 * Weekly deployments and maintenance, US Eastern time (follows daylight saving).
 * Releases restart the server, which resets games in progress.
 * day: 0 = Sunday ... 6 = Saturday. Default: Friday 12:00 AM ET (Thursday night).
 */
export const DEPLOY_WINDOW = { day: 5, hour: 0, minute: 0, minutes: 15, warnMinutes: 15 };

export type DeployPhase = 'soon' | 'now' | null;

const WEEK = 7 * 24 * 60;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const fmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'short',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
});

/** 'soon' in the warning before the window, 'now' during it, otherwise null. */
export function deployPhase(at: Date = new Date()): DeployPhase {
  const p = Object.fromEntries(fmt.formatToParts(at).map((x) => [x.type, x.value]));
  const nowMin = DAYS.indexOf(p.weekday) * 1440 + Number(p.hour) * 60 + Number(p.minute);
  const start = DEPLOY_WINDOW.day * 1440 + DEPLOY_WINDOW.hour * 60 + DEPLOY_WINDOW.minute;
  const offset = (((nowMin - start) % WEEK) + WEEK) % WEEK; // minutes since the window opened
  if (offset < DEPLOY_WINDOW.minutes) return 'now';
  if (offset >= WEEK - DEPLOY_WINDOW.warnMinutes) return 'soon';
  return null;
}

/** Current phase, checked every 30s. Null on the server render. */
export function useDeployPhase(): DeployPhase {
  const [phase, setPhase] = useState<DeployPhase>(null);
  useEffect(() => {
    const check = () => setPhase(deployPhase());
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, []);
  return phase;
}
