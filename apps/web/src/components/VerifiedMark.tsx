/**
 * Grey check next to a signed-in player's name. (Supporters get a blue one, later.)
 * No hover tooltip; screen readers hear "signed in" unless it sits inside a
 * control that already has its own label (`decorative`).
 */
const VerifiedMark = ({ size = 14, className = '', decorative = false }: { size?: number; className?: string; decorative?: boolean }) => (
  <>
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`inline-block shrink-0 align-[-2px] text-fg-subtle ${className}`}
    >
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="m7 12.5 3.2 3.2L17 9" fill="none" stroke="hsl(var(--bg))" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    {!decorative && <span className="sr-only">, signed in</span>}
  </>
);

export default VerifiedMark;
