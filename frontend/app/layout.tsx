import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: 'Auditor AI Twin | ISO Standards Compliance Engine',
  description: 'Enterprise AI Twin for ISO 17025, ISO 12207, and ISO 15504 auditing with Knowledge Graph, Vector RAG, and Digital Signatures.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
