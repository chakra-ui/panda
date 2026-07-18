import { useState } from 'preact/hooks'
import type { JSX } from 'preact'
import { contrastRatio, luminance, SAMPLE, type StudioToken } from './helpers'

function badge(label: string, pass: boolean) {
  return (
    <span class={`badge ${pass ? 'pass' : 'fail'}`}>
      {pass ? '✓ ' : '✗ '}
      {label}
    </span>
  )
}

export function Contrast({ colors }: { colors: StudioToken[] }) {
  const dark = colors.find((token) => luminance(token.value) < 0.2)
  const light = colors.find((token) => luminance(token.value) > 0.8)
  const [fg, setFg] = useState((dark ?? colors[0])?.value)
  const [bg, setBg] = useState((light ?? colors[colors.length - 1])?.value)
  const ratio = contrastRatio(fg, bg)
  const options = colors.map((token) => (
    <option value={token.value} key={token.path}>
      {token.name}
    </option>
  ))
  return (
    <section>
      <h2>contrast</h2>
      <div class="tool">
        <div class="tool-controls">
          <label>
            Foreground
            <select value={fg} onChange={(e) => setFg((e.currentTarget as HTMLSelectElement).value)}>
              {options}
            </select>
          </label>
          <label>
            Background
            <select value={bg} onChange={(e) => setBg((e.currentTarget as HTMLSelectElement).value)}>
              {options}
            </select>
          </label>
        </div>
        <div>
          <div class="contrast-preview" style={{ color: fg, background: bg }}>
            Aa
          </div>
          <div class="contrast-score">{ratio.toFixed(2)} : 1</div>
          <div class="badges">
            {badge('AA', ratio >= 4.5)}
            {badge('AA Large', ratio >= 3)}
            {badge('AAA', ratio >= 7)}
            {badge('AAA Large', ratio >= 4.5)}
          </div>
        </div>
      </div>
    </section>
  )
}

const TYPO_FIELDS = [
  { prop: 'fontSize', css: 'font-size', category: 'fontSizes', label: 'Font size' },
  { prop: 'fontWeight', css: 'font-weight', category: 'fontWeights', label: 'Font weight' },
  { prop: 'fontFamily', css: 'font-family', category: 'fonts', label: 'Font family' },
  { prop: 'lineHeight', css: 'line-height', category: 'lineHeights', label: 'Line height' },
  { prop: 'letterSpacing', css: 'letter-spacing', category: 'letterSpacings', label: 'Letter spacing' },
] as const

export function TypographyPlayground({ tokens }: { tokens: StudioToken[] }) {
  const fields = TYPO_FIELDS.filter((field) => tokens.some((token) => token.category === field.category))
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const field of fields) initial[field.prop] = tokens.find((token) => token.category === field.category)!.value
    return initial
  })
  const [text, setText] = useState(SAMPLE)
  const style = Object.fromEntries(fields.map((field) => [field.prop, values[field.prop]])) as JSX.CSSProperties
  const css = fields.map((field) => `${field.css}: ${values[field.prop]};`).join('\n')
  return (
    <section>
      <h2>typography</h2>
      <div class="tool">
        <div class="tool-controls">
          {fields.map((field) => (
            <label key={field.prop}>
              {field.label}
              <select
                value={values[field.prop]}
                onChange={(e) => setValues({ ...values, [field.prop]: (e.currentTarget as HTMLSelectElement).value })}
              >
                {tokens
                  .filter((token) => token.category === field.category)
                  .map((token) => (
                    <option value={token.value} key={token.path}>
                      {token.name} ({token.value})
                    </option>
                  ))}
              </select>
            </label>
          ))}
          <label>
            Sample text
            <textarea value={text} onInput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)} />
          </label>
        </div>
        <div class="type-play">
          <div class="type-play-preview" style={style}>
            {text}
          </div>
          <div class="type-play-css">{css}</div>
        </div>
      </div>
    </section>
  )
}

const PG_HTML = `<div class="card">
  <span class="tag">Panda</span>
  <h1>Design tokens, live</h1>
  <p>Edit the HTML and CSS. Every token in your config is a CSS variable, e.g. var(--colors-accent).</p>
  <button>Get started</button>
</div>`

const PG_CSS = `.card {
  max-width: 380px;
  padding: var(--spacing-6, 24px);
  border-radius: var(--radii-xl, 16px);
  background: var(--colors-bg, #fff);
  color: var(--colors-text, #111);
  box-shadow: var(--shadows-lg, 0 10px 30px rgba(0, 0, 0, 0.12));
}
.tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--colors-accent, #f6e458);
  color: #1a1a1a;
}
h1 { font-size: var(--fontSizes-2xl, 1.6rem); margin: 14px 0 6px; }
p { color: var(--colors-muted, #667085); line-height: 1.6; }
button {
  margin-top: 16px;
  border: 0;
  padding: 10px 18px;
  border-radius: var(--radii-md, 8px);
  background: var(--colors-accent, #f6e458);
  font-weight: 600;
  cursor: pointer;
}`

export function Playground({ tokens }: { tokens: StudioToken[] }) {
  const vars = tokens.map((token) => `  --${token.path.replace(/\./g, '-')}: ${token.value};`).join('\n')
  const [html, setHtml] = useState(PG_HTML)
  const [css, setCss] = useState(PG_CSS)
  const srcdoc = `<!doctype html><html><head><meta charset="utf-8" /><style>
:root {
${vars}
}
* { box-sizing: border-box; }
body { margin: 0; padding: 28px; font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #111; }
${css}
</style></head><body>
${html}
</body></html>`

  return (
    <section>
      <h2>playground</h2>
      <div class="pg-editor">
        <div class="pg-panes">
          <label class="pg-pane">
            <span>HTML</span>
            <textarea
              spellcheck={false}
              value={html}
              onInput={(e) => setHtml((e.currentTarget as HTMLTextAreaElement).value)}
            />
          </label>
          <label class="pg-pane">
            <span>CSS</span>
            <textarea
              spellcheck={false}
              value={css}
              onInput={(e) => setCss((e.currentTarget as HTMLTextAreaElement).value)}
            />
          </label>
        </div>
        <iframe class="pg-frame" title="Playground preview" srcdoc={srcdoc} />
      </div>
    </section>
  )
}
