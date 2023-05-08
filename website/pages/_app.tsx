// https://nextjs.org/docs/basic-features/built-in-css-support#adding-a-global-stylesheet
import '../styles/global.css'
import '../styles/tw-preflight.css'
import '../styles/panda.css'

export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}
