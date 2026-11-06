import { deployPhase } from '@/lib/deployWindow';

// Window: Friday 12:00 to 12:15 AM ET, warning from Thursday 11:45 PM.
describe('deployPhase', () => {
  it('warns 15 minutes before', () => {
    expect(deployPhase(new Date('2026-11-13T04:45:00Z'))).toBe('soon'); // Thu 11:45 PM EST
    expect(deployPhase(new Date('2026-11-13T04:59:00Z'))).toBe('soon'); // Thu 11:59 PM EST
  });
  it('is on during the window, in EST and EDT', () => {
    expect(deployPhase(new Date('2026-11-13T05:00:00Z'))).toBe('now'); // Fri 12:00 AM EST
    expect(deployPhase(new Date('2026-07-10T04:14:00Z'))).toBe('now'); // Fri 12:14 AM EDT
  });
  it('is off otherwise', () => {
    expect(deployPhase(new Date('2026-11-13T04:44:00Z'))).toBeNull(); // Thu 11:44 PM EST
    expect(deployPhase(new Date('2026-11-13T05:15:00Z'))).toBeNull(); // Fri 12:15 AM EST
    expect(deployPhase(new Date('2026-11-14T05:05:00Z'))).toBeNull(); // Sat 12:05 AM EST
  });
});
