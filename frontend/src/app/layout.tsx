import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import ErrorBoundary from '@/components/common/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'F1 Dashboard - Real-time Formula 1 Analytics',
  description: 'Real-time Formula 1 telemetry, timing, and race analysis dashboard',
  keywords: 'Formula 1, F1, telemetry, racing, dashboard, analytics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <div className="min-h-screen bg-background">
            <Header />
            <main>
              {children}
            </main>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  )
}