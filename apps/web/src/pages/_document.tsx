import { Head, Html, Main, NextScript } from 'next/document';

export default function RelayDocument() {
  return (
    // next-themes sets the theme class on <html> before hydration
    <Html lang="en" suppressHydrationWarning>
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0E0F11" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#FAF8F2" media="(prefers-color-scheme: light)" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
