import { component$ } from '@builder.io/qwik'
import type { DocumentHead } from '@builder.io/qwik-city'
import { css } from 'styled-system/css'

export default component$(() => {
  return (
    <div
      class={css({
        bg: 'purple.600',
        color: 'wheat',
        padding: '8',
      })}
    >
      Welcome to Panda's Qwik City
    </div>
  )
})

export const head: DocumentHead = {
  title: 'Welcome to Qwik',
  meta: [
    {
      name: 'description',
      content: 'Qwik site description',
    },
  ],
}
