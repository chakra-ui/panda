import type { StudioToken } from './helpers'

export function Showcase({ tokens, theme }: { tokens: StudioToken[]; theme: string }) {
  const pick = (token: StudioToken) =>
    theme === 'dark'
      ? token.conditions?.['_dark'] ?? token.conditions?.['_dark:base'] ?? token.conditions?.base ?? token.value
      : token.conditions?.base ?? token.value
  const vars = Object.fromEntries(
    tokens.map((token) => [`--${token.path.replace(/\./g, '-')}`, pick(token)]),
  ) as Record<string, string>

  return (
    <div class="showcase" style={vars}>
      <header class="sc-hero">
        <span class="sc-eyebrow">Design system</span>
        <h1>Your tokens, in action</h1>
        <p class="sc-lead">
          Every element here is built from your Panda tokens — colors, typography, spacing, radii and shadows.
        </p>
        <div class="sc-row">
          <button class="sc-btn sc-solid">Primary</button>
          <button class="sc-btn sc-outline">Secondary</button>
          <button class="sc-btn sc-ghost">Ghost</button>
        </div>
      </header>

      <div class="sc-grid2">
        <section class="sc-card">
          <h3>Overview</h3>
          <p class="sc-muted">Cards compose surface, border, radius and shadow tokens.</p>
          <div class="sc-badges">
            <span class="sc-badge sc-accent">Accent</span>
            <span class="sc-badge sc-ok">Success</span>
            <span class="sc-badge sc-warn">Warning</span>
            <span class="sc-badge sc-err">Danger</span>
          </div>
        </section>
        <section class="sc-card">
          <label class="sc-field">
            Email
            <input placeholder="you@example.com" />
          </label>
          <label class="sc-field">
            Plan
            <select>
              <option>Starter</option>
              <option>Pro</option>
            </select>
          </label>
          <button class="sc-btn sc-solid sc-block">Continue</button>
        </section>
      </div>

      <div class="sc-alert">Heads up — alerts, inputs and buttons all pull from the same tokens.</div>

      <section class="sc-type">
        <div class="sc-display">Display</div>
        <h2>Heading level two</h2>
        <h4>Heading level four</h4>
        <p>
          Body text sets in your base font and line-height, so paragraphs read exactly as they will in your product
          interface.
        </p>
        <p class="sc-caption">Caption / small print</p>
      </section>
    </div>
  )
}
