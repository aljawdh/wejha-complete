import './globals.css'

export const metadata = {
  title: 'وِجهة - عروض وكوبونات قطر',
  description: 'اكتشف أفضل العروض والكوبونات في دولة قطر',
  manifest: '/manifest.json',
  themeColor: '#8B1F24',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#8B1F24" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" />
      </head>
      <body style={{ 
        fontFamily: "'Tajawal', sans-serif",
        margin: 0,
        padding: 0,
        backgroundColor: '#080608',
        color: '#F0EDE8',
        direction: 'rtl'
      }}>
        {children}
      </body>
    </html>
  )
}
