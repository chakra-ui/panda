import { component$ } from '@builder.io/qwik'
import { QwikLogo } from './qwik-logo'
import { hstack } from 'styled-system/patterns'
import { css } from 'styled-system/css'

export default component$(() => {
  return (
    <header>
      <div class={hstack({ justify: 'space-between' })}>
        <div class={css({ maxW: '20px' })}>
          <a href="/" title="qwik">
            <QwikLogo height={50} width={143} />
          </a>
        </div>
        <ul class={hstack({ color: 'white', gap: '6' })}>
          <li>
            <a href="https://qwik.builder.io/docs/components/overview/" target="_blank">
              Docs
            </a>
          </li>
          <li>
            <a href="https://qwik.builder.io/examples/introduction/hello-world/" target="_blank">
              Examples
            </a>
          </li>
          <li>
            <a href="https://qwik.builder.io/tutorial/welcome/overview/" target="_blank">
              Tutorials
            </a>
          </li>
        </ul>
      </div>
    </header>
  )
})
