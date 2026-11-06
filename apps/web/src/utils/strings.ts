/**
 * Formats anonymous usernames for display
 * Takes a long anonId and returns a shorter, readable format
 * Example: "Anon-mjbicsh3-1dp7sz-O2WStX-abc123" -> "Anon-mjbicsh3"
 */
export const formatAnonUsername = (username: string | boolean | undefined | null): string => {
  // Handle edge cases
  if (!username || typeof username === 'boolean') {
    return 'Anonymous';
  }
  
  // If it's already a short format or not an anon username, return as-is
  if (!username.startsWith('Anon-')) {
    return username;
  }
  
  // Extract the part after "Anon-" and take first 8 characters
  const anonId = username.substring(5); // Skip "Anon-"
  
  // Use first 8 characters for uniqueness while keeping it readable
  const shortId = anonId.substring(0, 8);
  
  return `Anon-${shortId}`;
};