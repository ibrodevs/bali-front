import './globals.css';
import type { Metadata } from 'next';
import Providers from '@/components/Providers';
import { buildManagedPageMetadata, getSiteUrl } from '@/lib/seo';

const GOOGLE_TAG_MANAGER_ID = 'GTM-M6JD3FLW';
const GOOGLE_ANALYTICS_ID = 'G-NH1PZRH7XL';
const GOOGLE_ADS_ID = 'AW-18373201500';

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await buildManagedPageMetadata('home');
  return {
    metadataBase: new URL(getSiteUrl()),
    applicationName: 'BALI-RENT',
    title: metadata.title,
    description: metadata.description,
    alternates: metadata.alternates,
    openGraph: metadata.openGraph,
    twitter: metadata.twitter,
    robots: metadata.robots,
    icons: {
      icon: '/logo1.svg',
      shortcut: '/logo1.svg',
      apple: '/logo1.svg',
    },
    manifest: '/manifest.webmanifest',
    formatDetection: {
      email: false,
      address: false,
      telephone: true,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />

        {/* Google Analytics 4 + Google Ads */}
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GOOGLE_ANALYTICS_ID}');
              gtag('config', '${GOOGLE_ADS_ID}');
            `,
          }}
        />

        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GOOGLE_TAG_MANAGER_ID}');
            `,
          }}
        />
      </head>
      <body className="br" style={{ margin: 0, background: '#fff' }}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GOOGLE_TAG_MANAGER_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="Google Tag Manager"
          />
        </noscript>

        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
