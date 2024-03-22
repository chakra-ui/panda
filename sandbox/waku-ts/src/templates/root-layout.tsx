import '../styles.css'

import type { ReactNode } from 'react'
import { css } from '../../styled-system/css/index.js'
import { hstack } from '../../styled-system/patterns/index.js'
import { Footer } from '../components/footer.js'
import { Header } from '../components/header.js'

type RootLayoutProps = { children: ReactNode }

export const RootLayout = async ({ children }: RootLayoutProps) => {
  const data = await getData()

  return (
    <div id="__waku" className={css({ fontFamily: 'Nunito' })}>
      <meta property="description" content={data.description} />
      <link rel="icon" type="image/png" href={data.icon} />
      <Header />
      <main
        className={hstack({
          minH: 'svh',
          justify: 'center',
        })}
      >
        {children}
      </main>
      <Footer />
    </div>
  )
}

const getData = async () => {
  const data = {
    description: 'An internet website!',
    icon: '/images/favicon.png',
  }

  return data
}
