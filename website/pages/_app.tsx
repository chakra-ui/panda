// https://nextjs.org/docs/basic-features/built-in-css-support#adding-a-global-stylesheet
import { FiraCode, MonaSans } from 'styles/fonts'

import '../styles/global.css'
import '../styles/panda.css'


export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <style jsx global>
        {`
          :root {
            font-size: 0.9em;
            --font-mona-sans: ${MonaSans.style.fontFamily};
            --font-fira-code: ${FiraCode.style.fontFamily};
          }
        `}
      </style>
      <Component {...pageProps} />
    </>
  )
}
