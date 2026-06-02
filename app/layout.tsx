import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { I18nProvider } from '@/lib/i18n'
import { FaceModelPreloader } from '@/components/face-model-preloader'

import './globals.css'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ColocDZ - Find Your Perfect Home',
  description: 'Find roommates, rent apartments, and share living spaces in Algeria',
  generator: 'ColocDZ',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <I18nProvider>
          <FaceModelPreloader />
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
