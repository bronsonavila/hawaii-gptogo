import type { Metadata } from 'next'
import { MuiThemeProvider } from './theme-provider'
import './globals.css'

export const metadata: Metadata = {
  description: 'Displays current and upcoming lane closures in Hawaii.',
  title: 'Hawaii Lane Closures'
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
