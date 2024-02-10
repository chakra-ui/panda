import { createContext } from '@pandacss/fixture'
import type { Config } from '@pandacss/types'
import { describe, expect, test } from 'vitest'

const resetCss = (config?: Config) => {
  const ctx = createContext(config)
  const sheet = ctx.createSheet()
  ctx.appendCssOfType('preflight', sheet)
  return sheet.toCss({ optimize: true })
}

describe('generate reset', () => {
  test('basic', () => {
    const css = resetCss()

    expect(css).toMatchInlineSnapshot(`
      "@layer reset {
        html {
          --font-fallback: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          -moz-tab-size: 4;
          tab-size: 4;
          line-height: 1.5;
          font-family: var(--global-font-body, var(--font-fallback));
      }

        * {
          margin: 0px;
          padding: 0px;
          font: inherit;
      }

        *,*::before,*::after {
          box-sizing: border-box;
          border-width: 0px;
          border-style: solid;
          border-color: var(--global-color-border, currentColor);
      }

        hr {
          height: 0px;
          color: inherit;
          border-top-width: 1px;
      }

        body {
          height: 100%;
      }

        img {
          border-style: none;
      }

        img,svg,video,canvas,audio,iframe,embed,object {
          display: block;
          vertical-align: middle;
      }

        img,video {
          max-width: 100%;
          height: auto;
      }

        p,h1,h2,h3,h4,h5,h6 {
          overflow-wrap: break-word;
      }

        ol,ul {
          list-style: none;
      }

        code,kbd,pre,samp {
          font-size: 1em;
      }

        button,[type='button'],[type='reset'],[type='submit'] {
          -webkit-appearance: button;
          background-color: var(--colors-transparent);
          background-image: none;
      }

        button,input,optgroup,select,textarea {
          color: inherit;
      }

        button,select {
          text-transform: none;
      }

        table {
          text-indent: 0px;
          border-collapse: collapse;
          border-color: inherit;
      }

        input::placeholder,textarea::placeholder {
          opacity: 1;
          color: var(--global-color-placeholder, #9ca3af);
      }

        textarea {
          resize: vertical;
      }

        summary {
          display: list-item;
      }

        small {
          font-size: 80%;
      }

        sub,sup {
          position: relative;
          vertical-align: baseline;
          font-size: 75%;
          line-height: 0;
      }

        sub {
          bottom: -0.25em;
      }

        sup {
          top: -0.5em;
      }

        dialog {
          padding: 0px;
      }

        a {
          color: inherit;
          text-decoration: inherit;
      }

        abbr:where([title]) {
          text-decoration: underline dotted;
      }

        b,strong {
          font-weight: bolder;
      }

        code,kbd,samp,pre {
          --font-mono-fallback: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New';
          font-size: 1em;
          font-family: var(--global-font-mono, var(--font-mono-fallback));
      }

        input[type="text"],input[type="email"],input[type="search"],input[type="password"] {
          -webkit-appearance: none;
          -moz-appearance: none;
      }

        input[type='search'] {
          -webkit-appearance: textfield;
          outline-offset: -2px;
      }

        ::-webkit-search-decoration,::-webkit-search-cancel-button {
          -webkit-appearance: none;
      }

        ::-webkit-file-upload-button {
          -webkit-appearance: button;
          font: inherit;
      }

        input[type="number"]::-webkit-inner-spin-button,input[type="number"]::-webkit-outer-spin-button {
          height: auto;
      }

        input[type='number'] {
          -moz-appearance: textfield;
      }

        :-moz-ui-invalid {
          box-shadow: none;
      }

        :-moz-focusring {
          outline: auto;
      }

        [hidden] {
          display: none !important;
      }
      }"
    `)
  })

  test('with scope', () => {
    const css = resetCss({
      preflight: { scope: '.pd-reset' },
    })

    expect(css).toMatchInlineSnapshot(`
      "@layer reset {
        .pd-reset {
          --font-fallback: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          -moz-tab-size: 4;
          tab-size: 4;
          line-height: 1.5;
          font-family: var(--global-font-body, var(--font-fallback));
      }

        .pd-reset * {
          margin: 0px;
          padding: 0px;
          font: inherit;
      }

        .pd-reset *,.pd-reset *::before,.pd-reset *::after {
          box-sizing: border-box;
          border-width: 0px;
          border-style: solid;
          border-color: var(--global-color-border, currentColor);
      }

        .pd-reset hr {
          height: 0px;
          color: inherit;
          border-top-width: 1px;
      }

        .pd-reset body {
          height: 100%;
      }

        .pd-reset img,.pd-reset svg,.pd-reset video,.pd-reset canvas,.pd-reset audio,.pd-reset iframe,.pd-reset embed,.pd-reset object {
          display: block;
          vertical-align: middle;
      }

        .pd-reset img,.pd-reset video {
          max-width: 100%;
          height: auto;
      }

        .pd-reset p,.pd-reset h1,.pd-reset h2,.pd-reset h3,.pd-reset h4,.pd-reset h5,.pd-reset h6 {
          overflow-wrap: break-word;
      }

        .pd-reset ol,.pd-reset ul {
          list-style: none;
      }

        .pd-reset button,.pd-reset [type='button'],.pd-reset [type='reset'],.pd-reset [type='submit'] {
          -webkit-appearance: button;
          background-color: var(--colors-transparent);
          background-image: none;
      }

        .pd-reset button,.pd-reset input,.pd-reset optgroup,.pd-reset select,.pd-reset textarea {
          color: inherit;
      }

        .pd-reset button,.pd-reset select {
          text-transform: none;
      }

        .pd-reset table {
          text-indent: 0px;
          border-collapse: collapse;
          border-color: inherit;
      }

        .pd-reset input::placeholder,.pd-reset textarea::placeholder {
          opacity: 1;
          color: var(--global-color-placeholder, #9ca3af);
      }

        .pd-reset textarea {
          resize: vertical;
      }

        .pd-reset summary {
          display: list-item;
      }

        .pd-reset sub,.pd-reset sup {
          position: relative;
          vertical-align: baseline;
          font-size: 75%;
          line-height: 0;
      }

        .pd-reset dialog {
          padding: 0px;
      }

        .pd-reset a {
          color: inherit;
          text-decoration: inherit;
      }

        .pd-reset abbr:where([title]) {
          text-decoration: underline dotted;
      }

        .pd-reset code,.pd-reset kbd,.pd-reset samp,.pd-reset pre {
          --font-mono-fallback: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New';
          font-size: 1em;
          font-family: var(--global-font-mono, var(--font-mono-fallback));
      }

        .pd-reset input[type="text"],.pd-reset input[type="email"],.pd-reset input[type="search"],.pd-reset input[type="password"] {
          -webkit-appearance: none;
          -moz-appearance: none;
      }

        .pd-reset input[type='search'] {
          -webkit-appearance: textfield;
          outline-offset: -2px;
      }

        .pd-reset ::-webkit-search-decoration,.pd-reset ::-webkit-search-cancel-button {
          -webkit-appearance: none;
      }

        .pd-reset ::-webkit-file-upload-button {
          -webkit-appearance: button;
          font: inherit;
      }

        .pd-reset input[type="number"]::-webkit-inner-spin-button,.pd-reset input[type="number"]::-webkit-outer-spin-button {
          height: auto;
      }

        .pd-reset input[type='number'] {
          -moz-appearance: textfield;
      }

        .pd-reset :-moz-ui-invalid {
          box-shadow: none;
      }

        .pd-reset :-moz-focusring {
          outline: auto;
      }

        .pd-reset [hidden] {
          display: none !important;
      }

        .pd-reset img {
          border-style: none;
      }

        .pd-reset code,.pd-reset kbd,.pd-reset pre,.pd-reset samp {
          font-size: 1em;
      }

        .pd-reset small {
          font-size: 80%;
      }

        .pd-reset sub {
          bottom: -0.25em;
      }

        .pd-reset sup {
          top: -0.5em;
      }

        .pd-reset b,.pd-reset strong {
          font-weight: bolder;
      }
      }"
    `)
  })
})
