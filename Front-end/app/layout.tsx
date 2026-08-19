import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/components/LanguageProvider'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://siyowin.lk'),
  title: {
    default: 'Siyowin Higher Education Institute',
    template: '%s | Siyowin Academy'
  },
  description: 'Siyowin Academy - Sri Lanka\'s most trusted academy for quality education',
  keywords: ['education', 'Sri Lankan education', 'academy', 'A/L classes', 'higher education', 'Siyowin', 'siyowin kegalle', 'O/L', 'Mathematics', 'Rukshan Kulakumara', 'Pradeep Sudusingha', 'Nalaka Pradeep'],
  icons: {
    icon: [
      {
        url: '/photos/logo.png',
        type: 'image/png',
      },
    ],
    apple: '/photos/logo.png',
  },
  openGraph: {
    title: 'Siyowin Higher Education Institute',
    description: 'Siyowin Academy - Sri Lanka\'s most trusted academy for quality education.',
    url: '/',
    siteName: 'Siyowin',
    images: [
      {
        url: '/photos/logo.png', // Fallback to logo if no specific OG image is set
        width: 1200,
        height: 630,
        alt: 'Siyowin Academy',
      },
    ],
    locale: 'en_LK',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Siyowin Higher Education Institute',
    url: 'https://siyowin.lk',
    logo: 'https://siyowin.lk/photos/logo.png',
    sameAs: [
      'https://www.facebook.com/p/Siyowin-61554967645663/'
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="siyowin-theme">
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
