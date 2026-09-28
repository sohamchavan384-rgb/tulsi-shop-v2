import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Tulsi Shop — Sacred Radha Kund Crafts',
  description: 'Hand-carved Tulsi Kanthi Malas and accessories crafted at Radha Kund.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
