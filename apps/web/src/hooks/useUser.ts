import { useQuery } from 'react-query';
import { getUser } from '../apis/auth';
import { APIError, UserProfile } from '@/types';
import { useContext, useMemo } from 'react';
import { AppContext } from '@/contexts/App';
import { useSession } from 'next-auth/react';
import randomstring from 'randomstring';
import { getChessComStats, getLiChessRating } from '@/apis/users';

// Module-level variable - unique per JavaScript context (guaranteed unique per window)
// This is more reliable than storage for testing with multiple incognito windows
let moduleAnonId: string | null = null;

function generateUniqueAnonId(): string {
  // Generate a highly unique ID combining multiple sources
  const timestamp = Date.now().toString(36);
  const performanceId = typeof performance !== 'undefined' && performance.now 
    ? Math.floor(performance.now() * 1000000).toString(36) 
    : '';
  const random = randomstring.generate(8);
  const mathRandom = Math.random().toString(36).substr(2, 9);
  
  return `${timestamp}-${performanceId}-${random}-${mathRandom}`.replace(/^-+|-+$/g, '');
}

export const useUser = () => {
  const { 
    testUserEmail,
  } = useContext(AppContext);
  const { data:session } = useSession();
  const email = session?.user?.email ?? testUserEmail ?? '';
  
  // Calculate anonId BEFORE the query so it can be used in cache key
  // Use module-level variable for guaranteed uniqueness per window context
  // Also persist to sessionStorage for page refreshes, but module var is primary
  const anonId = useMemo(() => {
    if (typeof window === 'undefined') {
      // SSR fallback
      return generateUniqueAnonId();
    }
    
    // Initialize module-level ID if not set (happens once per JavaScript context/window)
    if (!moduleAnonId) {
      // Try to get from sessionStorage first (persists across page refreshes)
      try {
        const stored = window.sessionStorage.getItem('anonId');
        if (stored) {
          moduleAnonId = stored;
        }
      } catch {
        // sessionStorage might be disabled, continue
      }
      
      // If not in storage, generate new unique ID
      if (!moduleAnonId) {
        moduleAnonId = generateUniqueAnonId();
        
        // Store in sessionStorage for persistence across page refreshes
        try {
          window.sessionStorage.setItem('anonId', moduleAnonId);
        } catch {
          // Storage might be disabled, but we still have the ID in memory
        }
      }
    }
    
    return moduleAnonId;
  }, []); // Only calculate once per component mount
  
  // Include anonId in cache key so each window gets its own cache entry
  // This is critical for testing with multiple incognito windows
  const cacheKey = useMemo(() => {
    if (email) {
      return ['user', email];
    }
    // For anonymous users, include anonId in cache key
    // This ensures different windows have different cache entries
    return ['user', 'anon', anonId];
  }, [email, anonId]);
  
  return useQuery<UserProfile, APIError>(cacheKey, async () => {
    try {
      const res = await getUser(email);
      const user = res.data?.user ?? {} as UserProfile;

      // Generate a short display name for anonymous users (first 8 chars of anonId)
      // This allows identification while keeping it readable for analysis
      const anonDisplayName = anonId ? `Anon-${anonId.substring(0, 8)}` : 'Anon';
      
      return {
        ...user,
        _id: user._id ?? anonId,
        username: user.username ?? anonDisplayName,
      };
    } catch (err) {
      throw err;
    }
  }, {
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });
};

export const useLichessRating = (username: string) => {
  return useQuery<number, APIError>(['lichessRating', username], async () => {
    const res = await getLiChessRating(username);
    return res.data?.rating ?? 0;
  });
};

export const useChessComStats = (username: string) => {
  return useQuery<number, APIError>(['chessComStats', username], async () => {
    const res = await getChessComStats(username);
    return res.data?.stats ?? 0;
  });
};