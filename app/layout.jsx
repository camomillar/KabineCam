import { Quicksand } from 'next/font/google'
import './globals.css'

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const description =
  'Your own little photobooth, right in the browser. Press start, strike a pose, and let the booth do the rest.'

export const metadata = {
  // Lets the social preview image resolve to an absolute URL when shared
  metadataBase: new URL('https://kabinecam.com'),
  title: 'KabineCam',
  description,
  openGraph: {
    url: 'https://kabinecam.com',
    title: 'KabineCam',
    description,
    siteName: 'KabineCam',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KabineCam',
    description,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={quicksand.className}>{children}</body>
    </html>
  )
}
