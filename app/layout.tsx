import type { Metadata } from 'next';
import Script from 'next/script';
import { IBM_Plex_Sans } from 'next/font/google';
import { buildFaviconUri } from '@/lib/build-favicon-uri';
import { getLogoSrc } from '@/lib/get-logo-src';
import { getSupabaseBrowserConfig } from '@/lib/supabase/config';
import { inter, FONT_CLASS_MAP } from '@/lib/fonts';
import { TemplateLayout } from '@/components/custom/template-layout';
import { LogoSrcProvider } from '@/components/custom/logo-src-provider';
import { TemplateI18nProvider } from '../lib/i18n/provider';
import '@/app/globals.css';
import './landing.css';
import './globals.css';
import '@deriv-com/smartcharts-champion/dist/smartcharts.css';
import './custom.css';

// SmartCharts declares `font-family: IBM Plex Sans, sans-serif` internally.
// Loading the font here makes it available to those declarations so the chart
// renders with its intended typeface instead of falling back to the system
// sans-serif.  We apply the variable to <body> so the @font-face rules are
// emitted; SmartCharts resolves the family name automatically.
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
  display: 'swap',
});

export function generateMetadata(): Metadata {
  const faviconUri = buildFaviconUri();
  const siteName = 'Crypto Binary';
  const title = `Get a $20 Welcome Bonus | ${siteName}`;
  const description = 'Join Crypto Binary and unlock a one-time $20 withdrawable, tradable welcome bonus with your first deposit of at least $10.';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const shareImage = getLogoSrc() ?? '/logo.jpg';

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    openGraph: {
      type: 'website',
      siteName,
      title,
      description,
      images: [{ url: shareImage, alt: `${siteName} logo` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: shareImage, alt: `${siteName} logo` }],
    },
    icons: {
      icon: faviconUri ?? '/icon.svg',
      apple: '/apple-touch-icon.png',
    },
    appleWebApp: {
      capable: true,
      title: siteName,
      statusBarStyle: 'default',
    },
  };
}

const fontClass =
  FONT_CLASS_MAP[process.env.FONT_FAMILY ?? 'Inter'] ??
  inter.className;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const logoSrc = getLogoSrc();
  const supabaseConfig = getSupabaseBrowserConfig();
  return (
    <html lang="en" className="h-full lg:h-auto" suppressHydrationWarning>
      <body
        className={`${fontClass} ${ibmPlexSans.variable} bg-background flex h-dvh min-h-0 flex-col overflow-hidden`}
      >
        <Script src="/pwa-install-prompt.js" strategy="beforeInteractive" />
        <TemplateI18nProvider>
          <TemplateLayout supabaseConfig={supabaseConfig}>
            <LogoSrcProvider logoSrc={logoSrc}>{children}</LogoSrcProvider>
          </TemplateLayout>
        </TemplateI18nProvider>
      </body>
    </html>
  );
}
