import type { PublicPlayer } from '@/apis/players';

/** X and Instagram links for a profile. */
const Socials = ({ player }: { player: PublicPlayer }) => {
  if (!player.x && !player.instagram) return null;
  const link = 'inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium hover:bg-fg/5';
  return (
    <div className="flex flex-wrap gap-2">
      {player.x && (
        <a href={`https://x.com/${player.x}`} target="_blank" rel="noopener noreferrer nofollow" className={link}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.9 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
          </svg>
          @{player.x}
        </a>
      )}
      {player.instagram && (
        <a href={`https://instagram.com/${player.instagram}`} target="_blank" rel="noopener noreferrer nofollow" className={link}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
          </svg>
          @{player.instagram}
        </a>
      )}
    </div>
  );
};

export default Socials;
