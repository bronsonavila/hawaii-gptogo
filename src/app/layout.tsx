import type { Metadata } from 'next'
import { MuiThemeProvider } from './theme-provider'
import './globals.css'

export const metadata: Metadata = {
  description:
    'A web application designed to fetch, display, and analyze lane closure information for the state of Hawaii.',
  title: 'GPToGo - AI Lane Closure Analysis'
}

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <html lang="en">
      <body>
        <MuiThemeProvider>{children}</MuiThemeProvider>
      </body>
    </html>
  )
}

export default RootLayout
