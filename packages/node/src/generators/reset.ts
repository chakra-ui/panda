// Used to get syntax highlighting.
const css = (v: any) => v[0]

const reset = css`
  * {
    margin: 0;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
    border-width: 0;
    border-style: solid;
  }

  html,
  body {
    height: 100%;
  }

  body {
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
  }

  img {
    border-style: none;
  }

  img,
  picture,
  video,
  canvas,
  svg {
    display: block;
    max-width: 100%;
  }

  input,
  button,
  textarea,
  select {
    font: inherit;
  }

  p,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    overflow-wrap: break-word;
  }

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  ::-webkit-file-upload-button {
    -webkit-appearance: button;
    font: inherit;
  }

  ::-webkit-inner-spin-button,
  ::-webkit-outer-spin-button {
    height: auto;
  }

  code,
  kbd,
  pre,
  samp {
    font-size: 1em;
  }

  table {
    border-collapse: collapse;
  }

  textarea {
    resize: vertical;
  }

  sub {
    bottom: -0.25em;
  }

  sup {
    top: -0.5em;
  }
`

export function generateReset() {
  return reset
}
