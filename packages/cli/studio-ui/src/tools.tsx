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
