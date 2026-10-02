import NextAuth, { type AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';

const providers: AuthOptions['providers'] = [];
if (process.env.GOOGLE_CLIENT_ID) {
  providers.push(GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '' }));
}
if (process.env.APPLE_CLIENT_ID) {
  providers.push(AppleProvider({ clientId: process.env.APPLE_CLIENT_ID, clientSecret: process.env.APPLE_CLIENT_SECRET ?? '' }));
}

const secureCookies = process.env.NODE_ENV === 'production';

export const authOptions: AuthOptions = {
  providers,
  cookies: {
    // Apple signs in with a cross-site form POST, so the PKCE cookie must be SameSite=None.
    pkceCodeVerifier: {
      name: 'next-auth.pkce.code_verifier',
      options: { httpOnly: true, sameSite: secureCookies ? 'none' : 'lax', path: '/', secure: secureCookies },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
