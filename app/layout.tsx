import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prof. Dux - Student Dashboard',
  description: 'Graduation Project - Practice More Module',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
