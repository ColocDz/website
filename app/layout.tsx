import type { Metadata } from 'next'
import { I18nProvider } from '@/lib/i18n'
import { FaceModelPreloader } from '@/components/face-model-preloader'

import './globals.css'

export const metadata: Metadata = {
  title: 'ColocDz',
  description: 'Find roommates, rent apartments, and share living spaces in Algeria',
  generator: 'ColocDz',
  icons: {
    icon: '/ColocDz_Logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body className="font-sans antialiased">
        <I18nProvider>
          <FaceModelPreloader />
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
