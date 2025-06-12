import { createContext } from '@pandacss/fixture'
import type { Config } from '@pandacss/types'
import { describe, expect, test } from 'vitest'

const resetCss = (config?: Config) => {
  const ctx = createContext(config)
  const sheet = ctx.createSheet()
  ctx.appendCssOfType('preflight', sheet)
  return sheet.toCss()
}

describe('generate reset', () => {
  test('basic', () => {
    const css = resetCss()

    expect(css).toMatchInlineSnapshot(`
      "@layer reset {
        html,:host {
          --font-fallback: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
          line-height: 1.5;
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          -moz-tab-size: 4;
          tab-size: 4;
          font-family: var(--global-font-body, var(--font-fallback));
          -webkit-tap-highlight-color: transparent;
      }

        *,::before,::after,::backdrop,::file-selector-button {
          margin: 0px;
          padding: 0px;
          border-width: 0px;
          border-style: solid;
          border-color: var(--global-color-border, currentcolor);
          box-sizing: border-box;
      }

        hr {
          color: inherit;
          height: 0px;
          border-top-width: 1px;
      }

        body {
          line-height: inherit;
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

        h1,h2,h3,h4,h5,h6 {
          text-wrap: balance;
          font-size: inherit;
          font-weight: inherit;
      }

        p,h1,h2,h3,h4,h5,h6 {
          overflow-wrap: break-word;
      }

        ol,ul,menu {
          list-style: none;
      }

        button,input:where([type='button'], [type='reset'], [type='submit']),::file-selector-button {
          appearance: button;
          -webkit-appearance: button;
      }

        button,input,optgroup,select,textarea,::file-selector-button {
          font: inherit;
          background: var(--colors-transparent);
          font-feature-settings: inherit;
          font-variation-settings: inherit;
          letter-spacing: inherit;
          color: inherit;
      }

        ::placeholder {
          --placeholder-fallback: rgba(0, 0, 0, 0.5);
          opacity: 1;
          color: var(--global-color-placeholder, var(--placeholder-fallback));
      }

        @supports (not (-webkit-appearance: -apple-pay-button)) or (contain-intrinsic-size: 1px) {
          ::placeholder {
            --placeholder-fallback: color-mix(in oklab, currentcolor 50%, transparent);
      }
      }

        textarea {
          resize: vertical;
      }

        table {
          border-color: inherit;
          text-indent: 0px;
          border-collapse: collapse;
      }

        summary {
          display: list-item;
      }

        small {
          font-size: 80%;
      }

        sub,sup {
          font-size: 75%;
          line-height: 0;
          position: relative;
          vertical-align: baseline;
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
          text-decoration: inherit;
          color: inherit;
      }

        abbr:where([title]) {
          text-decoration: underline dotted;
      }

        b,strong {
          font-weight: bolder;
      }

        code,kbd,samp,pre {
          --font-mono-fallback: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New';
          font-family: var(--global-font-mono, var(--font-mono-fallback));
          font-size: 1em;
          font-feature-settings: normal;
          font-variation-settings: normal;
      }

        progress {
          vertical-align: baseline;
      }

        ::-webkit-search-decoration,::-webkit-search-cancel-button {
          -webkit-appearance: none;
      }

        ::-webkit-inner-spin-button,::-webkit-outer-spin-button {
          height: auto;
      }

        :-moz-ui-invalid {
          box-shadow: none;
      }

        :-moz-focusring {
          outline: auto;
      }

        [hidden]:where(:not([hidden='until-found'])) {
          display: none !important;
      }
      }"
    `)
  })

  test('with parent scope', () => {
    const css = resetCss({
      preflight: { scope: '.pd-reset' },
    })

    expect(css).toMatchInlineSnapshot(`
      "@layer reset {
        .pd-reset {
          --font-fallback: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
          line-height: 1.5;
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          -moz-tab-size: 4;
          tab-size: 4;
          font-family: var(--global-font-body, var(--font-fallback));
          -webkit-tap-highlight-color: transparent;
      }

        .pd-reset ::placeholder {
          --placeholder-fallback: rgba(0, 0, 0, 0.5);
          opacity: 1;
          color: var(--global-color-placeholder, var(--placeholder-fallback));
      }

        .pd-reset code,.pd-reset kbd,.pd-reset samp,.pd-reset pre {
          --font-mono-fallback: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New';
          font-family: var(--global-font-mono, var(--font-mono-fallback));
          font-size: 1em;
          font-feature-settings: normal;
          font-variation-settings: normal;
      }

        .pd-reset *,.pd-reset ::before,.pd-reset ::after,.pd-reset ::backdrop,.pd-reset ::file-selector-button {
          margin: 0px;
          padding: 0px;
          border-width: 0px;
          border-style: solid;
          border-color: var(--global-color-border, currentcolor);
          box-sizing: border-box;
      }

        .pd-reset button,.pd-reset input,.pd-reset optgroup,.pd-reset select,.pd-reset textarea,.pd-reset ::file-selector-button {
          font: inherit;
          background: var(--colors-transparent);
          font-feature-settings: inherit;
          font-variation-settings: inherit;
          letter-spacing: inherit;
          color: inherit;
      }

        .pd-reset dialog {
          padding: 0px;
      }

        .pd-reset img {
          border-style: none;
      }

        .pd-reset h1,.pd-reset h2,.pd-reset h3,.pd-reset h4,.pd-reset h5,.pd-reset h6 {
          text-wrap: balance;
          font-size: inherit;
          font-weight: inherit;
      }

        .pd-reset ol,.pd-reset ul,.pd-reset menu {
          list-style: none;
      }

        .pd-reset table {
          border-color: inherit;
          text-indent: 0px;
          border-collapse: collapse;
      }

        .pd-reset a {
          text-decoration: inherit;
          color: inherit;
      }

        .pd-reset abbr:where([title]) {
          text-decoration: underline dotted;
      }

        .pd-reset :-moz-focusring {
          outline: auto;
      }

        .pd-reset hr {
          color: inherit;
          height: 0px;
          border-top-width: 1px;
      }

        .pd-reset body {
          line-height: inherit;
          height: 100%;
      }

        .pd-reset img,.pd-reset svg,.pd-reset video,.pd-reset canvas,.pd-reset audio,.pd-reset iframe,.pd-reset embed,.pd-reset object {
          display: block;
          vertical-align: middle;
      }

        .pd-reset p,.pd-reset h1,.pd-reset h2,.pd-reset h3,.pd-reset h4,.pd-reset h5,.pd-reset h6 {
          overflow-wrap: break-word;
      }

        .pd-reset button,.pd-reset input:where([type='button'], [type='reset'], [type='submit']),.pd-reset ::file-selector-button {
          appearance: button;
          -webkit-appearance: button;
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

        .pd-reset sub,.pd-reset sup {
          font-size: 75%;
          line-height: 0;
          position: relative;
          vertical-align: baseline;
      }

        .pd-reset b,.pd-reset strong {
          font-weight: bolder;
      }

        .pd-reset progress {
          vertical-align: baseline;
      }

        .pd-reset ::-webkit-search-decoration,.pd-reset ::-webkit-search-cancel-button {
          -webkit-appearance: none;
      }

        .pd-reset :-moz-ui-invalid {
          box-shadow: none;
      }

        .pd-reset [hidden]:where(:not([hidden='until-found'])) {
          display: none !important;
      }

        .pd-reset img,.pd-reset video {
          max-width: 100%;
          height: auto;
      }

        .pd-reset sub {
          bottom: -0.25em;
      }

        .pd-reset sup {
          top: -0.5em;
      }

        .pd-reset ::-webkit-inner-spin-button,.pd-reset ::-webkit-outer-spin-button {
          height: auto;
      }

        @supports (not (-webkit-appearance: -apple-pay-button)) or (contain-intrinsic-size: 1px) {
          .pd-reset ::placeholder {
            --placeholder-fallback: color-mix(in oklab, currentcolor 50%, transparent);
      }
      }
      }"
    `)
  })

  test('with element scope', () => {
    const css = resetCss({
      preflight: { scope: '.pd-reset', level: 'element' },
    })

    expect(css).toMatchInlineSnapshot(`
      "@layer reset {
        .pd-reset {
          --font-fallback: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
          line-height: 1.5;
          -webkit-text-size-adjust: 100%;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          -moz-tab-size: 4;
          tab-size: 4;
          font-family: var(--global-font-body, var(--font-fallback));
          -webkit-tap-highlight-color: transparent;
      }

        *.pd-reset,::before.pd-reset,::after.pd-reset,::backdrop.pd-reset,::file-selector-button.pd-reset {
          margin: 0px;
          padding: 0px;
          border-width: 0px;
          border-style: solid;
          border-color: var(--global-color-border, currentcolor);
          box-sizing: border-box;
      }

        hr.pd-reset {
          color: inherit;
          height: 0px;
          border-top-width: 1px;
      }

        body.pd-reset {
          line-height: inherit;
          height: 100%;
      }

        img.pd-reset {
          border-style: none;
      }

        img.pd-reset,svg.pd-reset,video.pd-reset,canvas.pd-reset,audio.pd-reset,iframe.pd-reset,embed.pd-reset,object.pd-reset {
          display: block;
          vertical-align: middle;
      }

        img.pd-reset,video.pd-reset {
          max-width: 100%;
          height: auto;
      }

        h1.pd-reset,h2.pd-reset,h3.pd-reset,h4.pd-reset,h5.pd-reset,h6.pd-reset {
          text-wrap: balance;
          font-size: inherit;
          font-weight: inherit;
      }

        p.pd-reset,h1.pd-reset,h2.pd-reset,h3.pd-reset,h4.pd-reset,h5.pd-reset,h6.pd-reset {
          overflow-wrap: break-word;
      }

        ol.pd-reset,ul.pd-reset,menu.pd-reset {
          list-style: none;
      }

        button.pd-reset,input:where([type='button'], [type='reset'], [type='submit']).pd-reset,::file-selector-button.pd-reset {
          appearance: button;
          -webkit-appearance: button;
      }

        button.pd-reset,input.pd-reset,optgroup.pd-reset,select.pd-reset,textarea.pd-reset,::file-selector-button.pd-reset {
          font: inherit;
          background: var(--colors-transparent);
          font-feature-settings: inherit;
          font-variation-settings: inherit;
          letter-spacing: inherit;
          color: inherit;
      }

        ::placeholder.pd-reset {
          --placeholder-fallback: rgba(0, 0, 0, 0.5);
          opacity: 1;
          color: var(--global-color-placeholder, var(--placeholder-fallback));
      }

        @supports (not (-webkit-appearance: -apple-pay-button)) or (contain-intrinsic-size: 1px) {
          ::placeholder.pd-reset {
            --placeholder-fallback: color-mix(in oklab, currentcolor 50%, transparent);
      }
      }

        textarea.pd-reset {
          resize: vertical;
      }

        table.pd-reset {
          border-color: inherit;
          text-indent: 0px;
          border-collapse: collapse;
      }

        summary.pd-reset {
          display: list-item;
      }

        small.pd-reset {
          font-size: 80%;
      }

        sub.pd-reset,sup.pd-reset {
          font-size: 75%;
          line-height: 0;
          position: relative;
          vertical-align: baseline;
      }

        sub.pd-reset {
          bottom: -0.25em;
      }

        sup.pd-reset {
          top: -0.5em;
      }

        dialog.pd-reset {
          padding: 0px;
      }

        a.pd-reset {
          text-decoration: inherit;
          color: inherit;
      }

        abbr:where([title]).pd-reset {
          text-decoration: underline dotted;
      }

        b.pd-reset,strong.pd-reset {
          font-weight: bolder;
      }

        code.pd-reset,kbd.pd-reset,samp.pd-reset,pre.pd-reset {
          --font-mono-fallback: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New';
          font-family: var(--global-font-mono, var(--font-mono-fallback));
          font-size: 1em;
          font-feature-settings: normal;
          font-variation-settings: normal;
      }

        progress.pd-reset {
          vertical-align: baseline;
      }

        ::-webkit-search-decoration.pd-reset,::-webkit-search-cancel-button.pd-reset {
          -webkit-appearance: none;
      }

        ::-webkit-inner-spin-button.pd-reset,::-webkit-outer-spin-button.pd-reset {
          height: auto;
      }

        :-moz-ui-invalid.pd-reset {
          box-shadow: none;
      }

        :-moz-focusring.pd-reset {
          outline: auto;
      }

        [hidden]:where(:not([hidden='until-found'])).pd-reset {
          display: none !important;
      }
      }"
    `)
  })
})
