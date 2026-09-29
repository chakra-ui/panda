import { component$, Slot } from '@builder.io/qwik'
import { routeLoader$ } from '@builder.io/qwik-city'
import { css } from 'styled-system/css'
import { stack } from 'styled-system/patterns'

import Footer from '~/components/footer'
import Header from '~/components/header'

export const useServerTimeLoader = routeLoader$(() => {
  return {
    date: new Date().toISOString(),
  }
})

export default component$(() => {
  return (
    <div class={stack({ padding: '10', bg: 'gray.900', height: '100vh', gap: '10' })}>
      <Header />
      <main class={css({ flex: '1' })}>
        <Slot />
      </main>
      <Footer />
    </div>
  )
})
