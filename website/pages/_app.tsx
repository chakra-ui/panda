// https://nextjs.org/docs/basic-features/built-in-css-support#adding-a-global-stylesheet
import '../styles/global.css'
import '../styles/panda.css'

import { fontClassName } from '../styles/fonts'

export default function MyApp({ Component, pageProps }) {
  return (
    <div className={fontClassName}>
      <Component {...pageProps} />
    </div>
  )
}
