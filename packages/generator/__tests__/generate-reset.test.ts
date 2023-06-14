import { describe, expect, test } from 'vitest'
import { generateResetCss } from '../src/artifacts/css/reset-css'
import { createHooks } from 'hookable'
import type { PandaHooks } from '@pandacss/types'

describe('generate reset', () => {
  test('should work', () => {
    expect(generateResetCss({ hooks: createHooks<PandaHooks>() } as any, '.pd-reset')).toMatchInlineSnapshot(`
      "
          @layer reset {
            .pd-reset * {
              margin: 0;
              padding: 0;
              font: inherit;
            }

            .pd-reset *,
            .pd-reset *::before,
            .pd-reset *::after {
              box-sizing: border-box;
              border-width: 0;
              border-style: solid;
              border-color: var(--global-color-border, currentColor);
            }

            .pd-reset {
              line-height: 1.5;
              --font-fallback: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
                'Noto Color Emoji';
              -webkit-text-size-adjust: 100%;
              -webkit-text-size-adjust: 100%;
              -webkit-font-smoothing: antialiased;
              -moz-tab-size: 4;
              tab-size: 4;
              font-family: var(--global-font-body, var(--font-fallback));
            }

            .pd-reset hr {
              height: 0;
              color: inherit;
              border-top-width: 1px;
            }

            body {
              height: 100%;
              line-height: inherit;
            }

            .pd-reset img {
              border-style: none;
            }

            .pd-reset img,
            .pd-reset svg,
            .pd-reset video,
            .pd-reset canvas,
            .pd-reset audio,
            .pd-reset iframe,
            .pd-reset embed,
            .pd-reset object {
              display: block;
              vertical-align: middle;
            }

            .pd-reset img,
            .pd-reset video {
              max-width: 100%;
              height: auto;
            }

            .pd-reset p,
            .pd-reset h1,
            .pd-reset h2,
            .pd-reset h3,
            .pd-reset h4,
            .pd-reset h5,
            .pd-reset h6 {
              overflow-wrap: break-word;
            }

            .pd-reset ol,
            .pd-reset ul {
              list-style: none;
            }

            .pd-reset code,
            .pd-reset kbd,
            .pd-reset pre,
            .pd-reset samp {
              font-size: 1em;
            }

            .pd-reset button,
            .pd-reset [type='button'],
            .pd-reset [type='reset'],
            .pd-reset [type='submit'] {
              -webkit-appearance: button;
              background-color: transparent;
              background-image: none;
            }

            .pd-reset button,
            .pd-reset select {
              text-transform: none;
            }

            .pd-reset table {
              text-indent: 0;
              border-color: inherit;
              border-collapse: collapse;
            }

            .pd-reset input::placeholder,
            .pd-reset textarea::placeholder {
              opacity: 1;
              color: var(--global-color-placeholder, #9ca3af);
            }

            .pd-reset textarea {
              resize: vertical;
            }

            .pd-reset summary {
              display: list-item;
            }

            .pd-reset small {
              font-size: 80%;
            }

            .pd-reset sub,
            .pd-reset sup {
              font-size: 75%;
              line-height: 0;
              position: relative;
              vertical-align: baseline;
            }

            .pd-reset sub {
              bottom: -0.25em;
            }

            .pd-reset sup {
              top: -0.5em;
            }

            .pd-reset dialog {
              padding: 0;
            }

            .pd-reset a {
              color: inherit;
              text-decoration: inherit;
            }

            .pd-reset abbr:where([title]) {
              text-decoration: underline dotted;
            }

            .pd-reset b,
            .pd-reset strong {
              font-weight: bolder;
            }

            .pd-reset code,
            .pd-reset kbd,
            .pd-reset samp,
            .pd-reset pre {
              font-size: 1em;
              --font-mono-fallback: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New';
              font-family: var(--global-font-mono, var(--font-fallback));
            }

            .pd-reset [type='search'] {
              -webkit-appearance: textfield;
              outline-offset: -2px;
            }

            .pd-reset ::-webkit-search-decoration {
              -webkit-appearance: none;
            }

            .pd-reset ::-webkit-file-upload-button {
              -webkit-appearance: button;
            }

            .pd-reset ::-webkit-inner-spin-button,
            .pd-reset ::-webkit-outer-spin-button {
              height: auto;
            }

            .pd-reset :-moz-ui-invalid {
              box-shadow: none;
            }

            .pd-reset :-moz-focusring {
              outline: auto;
            }
          }
        "
    `)
  })
})
