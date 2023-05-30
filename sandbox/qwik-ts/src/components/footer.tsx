import { component$ } from '@builder.io/qwik'
import { hstack } from 'styled-system/patterns'
import { useServerTimeLoader } from '~/routes/layout'

export default component$(() => {
  const serverTime = useServerTimeLoader()

  return (
    <footer>
      <div class="container">
        <a href="https://www.builder.io/" target="_blank" class={hstack({ color: 'white' })}>
          <span>Made with ♡ by Builder.io</span>
          <span>|</span>
          <span>{serverTime.value.date}</span>
        </a>
      </div>
    </footer>
  )
})
