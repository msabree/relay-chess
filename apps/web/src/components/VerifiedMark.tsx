/**
 * Grey check next to a signed-in player's name. (Supporters get a blue one, later.)
 */
const VerifiedMark = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    role="img"
    aria-label="Signed in player"
    className={`inline-block shrink-0 align-[-2px] text-fg-subtle ${className}`}
  >
    <title>Signed in player</title>
    <circle cx="12" cy="12" r="11" fill="currentColor" />
    <path d="m7 12.5 3.2 3.2L17 9" fill="none" stroke="hsl(var(--bg))" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default VerifiedMark;
