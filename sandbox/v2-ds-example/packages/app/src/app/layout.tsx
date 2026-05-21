import './globals.css'

export const metadata = {
  title: 'v2-ds-example app',
  description: 'sandbox app consuming @v2-ds-example/lib as a panda design system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
