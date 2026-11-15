/**
 * A site-wide banner (a launch, a planned deploy, anything). They live in the
 * server's `announcements` collection; GET /announcements returns the live ones.
 */
export interface Announcement {
  id: string;
  text: string;
  /** optional link at the end of the banner (http/https only) */
  link?: string;
  linkText?: string;
  /** warning: can't be dismissed (use it for deploys). info: can. */
  tone: 'info' | 'warning';
}
