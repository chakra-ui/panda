// https://nextjs.org/docs/basic-features/built-in-css-support#adding-a-global-stylesheet
import '../styles/global.css'
import '../styles/panda.css'
import { Fira_Code } from 'next/font/google'
import localFont from 'next/font/local'

const MonaSans = localFont({
  src: '../styles/Mona-Sans.woff2',
  display: 'swap',
  variable: '--font-mona-sans'
})

const FiraCode = Fira_Code({
  weight: ['400', '500', '700'],
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-fira-code'
})

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <style jsx global>
        {`
          :root {
            --font-mona-sans: ${MonaSans.style.fontFamily};
            --font-fira-code: ${FiraCode.style.fontFamily};
          }
        `}
      </style>
      <Component {...pageProps} />
    </>
  )
}
