import './globals.css'
import type { Metadata } from 'next'
import LayoutShell from '../components/LayoutShell'

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
      <body>
        <LayoutShell>
          {children}
        </LayoutShell>
      </body>
    </html>
  )
}
