import './globals.css'

export const metadata = {
  title: 'KabineCam',
  description: 'Classic black-and-white photobooth inspired by Berlin',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
