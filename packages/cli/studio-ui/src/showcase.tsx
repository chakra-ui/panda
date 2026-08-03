import { useMemo, useState } from 'preact/hooks'
import type { StudioToken } from './helpers'
import { Buttons } from './sc/buttons'
import { Controls } from './sc/controls'
import { DataDisplay } from './sc/data-display'
import { Feedback } from './sc/feedback'
import { ThemePanel } from './theme-panel'

const varName = (path: string) => `--${path.replace(/\./g, '-')}`

export function Showcase({ tokens, theme }: { tokens: StudioToken[]; theme: string }) {
  const pick = (token: StudioToken) =>
    theme === 'dark'
      ? token.conditions?.['_dark'] ?? token.conditions?.['_dark:base'] ?? token.conditions?.base ?? token.value
      : token.conditions?.base ?? token.value

  const baseVars = useMemo(
    () => Object.fromEntries(tokens.map((token) => [varName(token.path), pick(token)])) as Record<string, string>,
    [tokens, theme],
  )

  const colorOptions = tokens
    .filter((token) => token.category === 'colors' && !token.conditions && token.name.endsWith('.500'))
    .map((token) => ({ name: token.name, value: token.value }))
  const fontOptions = tokens
    .filter((token) => token.category === 'fonts' && !token.conditions)
    .map((token) => ({ name: token.name, value: token.value }))
  const radiusOptions = tokens
    .filter(
      (token) => token.category === 'radii' && !token.conditions && token.name !== 'full' && token.name !== 'none',
    )
    .map((token) => ({ name: token.name, value: token.value }))

  const defaultAccent =
    tokens.find((token) => token.path === 'colors.accent')?.value ?? colorOptions[0]?.value ?? '#f6e458'
  const [accent, setAccent] = useState(defaultAccent)
  const [font, setFont] = useState(fontOptions[0]?.value ?? '')
  const [radius, setRadius] = useState(
    radiusOptions.find((option) => option.name === 'md')?.value ?? radiusOptions[0]?.value ?? '',
  )

  const vars: Record<string, string> = { ...baseVars, '--colors-accent': accent }
  if (font) vars['--fonts-body'] = font
  if (radius) {
    vars['--radii-md'] = radius
    vars['--radii-lg'] = radius
    vars['--radii-xl'] = radius
  }

  return (
    <div class="pg-root" style={vars}>
      <div class="pg-main">
        <div class="pg-intro">
          <h1>Your tokens, in action</h1>
          <p>
            A live preview of your design tokens across real components. Use the theme panel to recolor, restyle and
            reshape everything.
          </p>
        </div>
        <Buttons />
        <Controls />
        <DataDisplay />
        <Feedback />
      </div>
      <ThemePanel
        colors={colorOptions}
        activeColor={accent}
        onColor={setAccent}
        fonts={fontOptions}
        activeFont={font}
        onFont={setFont}
        radii={radiusOptions}
        activeRadius={radius}
        onRadius={setRadius}
      />
    </div>
  )
}
