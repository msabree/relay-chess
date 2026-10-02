export const capitalizeFirstLetter = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const validateEmail = (str: string) => {
  return String(str)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

// alpha numeric and underscores
export const validateUsername = (str: string) => {
  return String(str).toLowerCase().match(/^[a-zA-Z0-9_]*$/);
};

// alpha numeric and underscores and white space and apostrophes
export const validateTeamname = (str: string) => {
  return String(str).toLowerCase().match(/^[a-zA-Z0-9_'\s]*$/);
};

export const containsLink = (str: string) => {
  return String(str).match(
    /((http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-]))/
  );
};

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