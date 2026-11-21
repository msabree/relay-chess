import { Head, Html, Main, NextScript } from 'next/document';

export default function RelayDocument() {
  return (
    // next-themes sets the theme class on <html> before hydration
    <Html lang="en" suppressHydrationWarning>
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0E0F11" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#FAF8F2" media="(prefers-color-scheme: light)" />
        {/* Signed in? Mark <html> before first paint so the guest landing page never flashes. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(JSON.parse(localStorage.getItem('relaychess.player')||'{}').session)document.documentElement.dataset.signedIn=''}catch(e){}`,
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
