const css = String.raw

export function generateResetCss(scope = '') {
  const selector = scope ? `${scope} ` : ''
  return css`
    @layer reset {
      ${selector}* {
        margin: 0;
        padding: 0;
        font: inherit;
      }

      ${selector}*,
      ${selector}*::before,
      ${selector}*::after {
        box-sizing: border-box;
        border-width: 0;
        border-style: solid;
        border-color: var(--global-color-border, currentColor);
      }

      ${scope || 'html'} {
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

      ${selector}hr {
        height: 0;
        color: inherit;
        border-top-width: 1px;
      }

      body {
        height: 100%;
        line-height: inherit;
      }

      ${selector}img {
        border-style: none;
      }

      ${selector}img,
      ${selector}svg,
      ${selector}video,
      ${selector}canvas,
      ${selector}audio,
      ${selector}iframe,
      ${selector}embed,
      ${selector}object {
        display: block;
        vertical-align: middle;
      }

      ${selector}img,
      ${selector}video {
        max-width: 100%;
        height: auto;
      }

      ${selector}p,
      ${selector}h1,
      ${selector}h2,
      ${selector}h3,
      ${selector}h4,
      ${selector}h5,
      ${selector}h6 {
        overflow-wrap: break-word;
      }

      ${selector}ol,
      ${selector}ul {
        list-style: none;
      }

      ${selector}code,
      ${selector}kbd,
      ${selector}pre,
      ${selector}samp {
        font-size: 1em;
      }

      ${selector}button,
      ${selector}[type='button'],
      ${selector}[type='reset'],
      ${selector}[type='submit'] {
        -webkit-appearance: button;
        background-color: transparent;
        background-image: none;
      }

      ${selector}button,
      ${selector}select {
        text-transform: none;
      }

      ${selector}table {
        text-indent: 0;
        border-color: inherit;
        border-collapse: collapse;
      }

      ${selector}input::placeholder,
      ${selector}textarea::placeholder {
        opacity: 1;
        color: var(--global-color-placeholder, #9ca3af);
      }

      ${selector}textarea {
        resize: vertical;
      }

      ${selector}summary {
        display: list-item;
      }

      ${selector}small {
        font-size: 80%;
      }

      ${selector}sub,
      ${selector}sup {
        font-size: 75%;
        line-height: 0;
        position: relative;
        vertical-align: baseline;
      }

      ${selector}sub {
        bottom: -0.25em;
      }

      ${selector}sup {
        top: -0.5em;
      }

      ${selector}dialog {
        padding: 0;
      }

      ${selector}a {
        color: inherit;
        text-decoration: inherit;
      }

      ${selector}abbr:where([title]) {
        text-decoration: underline dotted;
      }

      ${selector}b,
      ${selector}strong {
        font-weight: bolder;
      }

      ${selector}code,
      ${selector}kbd,
      ${selector}samp,
      ${selector}pre {
        font-size: 1em;
        --font-mono-fallback: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New';
        font-family: var(--global-font-mono, var(--font-fallback));
      }

      ${selector}[type='search'] {
        -webkit-appearance: textfield;
        outline-offset: -2px;
      }

      ${selector}::-webkit-search-decoration {
        -webkit-appearance: none;
      }

      ${selector}::-webkit-file-upload-button {
        -webkit-appearance: button;
      }

      ${selector}::-webkit-inner-spin-button,
      ${selector}::-webkit-outer-spin-button {
        height: auto;
      }

      ${selector}:-moz-ui-invalid {
        box-shadow: none;
      }

      ${selector}:-moz-focusring {
        outline: auto;
      }
    }
  `
}
