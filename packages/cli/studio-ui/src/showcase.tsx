import type { ComponentChildren } from 'preact'
import type { StudioToken } from './helpers'

function Section({ title, children }: { title: string; children: ComponentChildren }) {
  return (
    <section class="sc-section">
      <div class="sc-section-title">{title}</div>
      <div class="sc-section-body">{children}</div>
    </section>
  )
}

const PEOPLE = [
  { name: 'Ada Lovelace', role: 'Engineering', status: 'ok', label: 'Active' },
  { name: 'Grace Hopper', role: 'Design', status: 'warn', label: 'Away' },
  { name: 'Alan Turing', role: 'Research', status: 'err', label: 'Offline' },
]

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')

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
      <div class="sc-intro">
        <h1>Your tokens, in action</h1>
        <p class="sc-lead">
          A live preview of your design tokens across real components — colors, typography, spacing, radii and shadows.
        </p>
      </div>

      <div class="sc-grid">
        <Section title="Buttons">
          <div class="sc-row">
            <button class="sc-btn sc-solid">Solid</button>
            <button class="sc-btn sc-outline">Outline</button>
            <button class="sc-btn sc-subtle">Subtle</button>
            <button class="sc-btn sc-ghost">Ghost</button>
            <button class="sc-btn sc-solid" disabled>
              Disabled
            </button>
          </div>
          <div class="sc-row">
            <button class="sc-btn sc-solid sc-sm">Small</button>
            <button class="sc-btn sc-solid">Medium</button>
            <button class="sc-btn sc-solid sc-lg">Large</button>
            <button class="sc-icon-btn" aria-label="Add">
              +
            </button>
          </div>
        </Section>

        <Section title="Controls">
          <div class="sc-controls">
            <label class="sc-check">
              <input type="checkbox" checked /> Checkbox
            </label>
            <label class="sc-check">
              <span class="sc-switch">
                <input type="checkbox" checked />
                <span class="sc-switch-track" />
              </span>
              Switch
            </label>
            <label class="sc-check">
              <input type="radio" name="sc-radio" checked /> Radio
            </label>
          </div>
          <label class="sc-range-field">
            Slider
            <input class="sc-range" type="range" value={62} />
          </label>
        </Section>

        <Section title="Tabs">
          <div class="sc-tabs">
            <button class="sc-tab sc-tab-on">Components</button>
            <button class="sc-tab">Hooks</button>
            <button class="sc-tab">Utilities</button>
          </div>
        </Section>

        <Section title="Badges">
          <div class="sc-row">
            <span class="sc-badge sc-accent">Accent</span>
            <span class="sc-badge sc-ok">Success</span>
            <span class="sc-badge sc-warn">Warning</span>
            <span class="sc-badge sc-err">Danger</span>
          </div>
        </Section>

        <Section title="Rating">
          <div class="sc-rating">
            <span class="sc-star sc-on">★</span>
            <span class="sc-star sc-on">★</span>
            <span class="sc-star sc-on">★</span>
            <span class="sc-star">★</span>
            <span class="sc-star">★</span>
          </div>
        </Section>

        <Section title="Keyboard">
          <div class="sc-row">
            <kbd class="sc-kbd">⌘</kbd>
            <kbd class="sc-kbd">K</kbd>
            <span class="sc-muted">to search</span>
          </div>
        </Section>
      </div>

      <Section title="Steps">
        <div class="sc-steps">
          <div class="sc-step sc-step-done">
            <span class="sc-step-dot">✓</span>
            <span class="sc-step-label">Cart</span>
          </div>
          <div class="sc-step-line sc-step-line-done" />
          <div class="sc-step sc-step-on">
            <span class="sc-step-dot">2</span>
            <span class="sc-step-label">Shipping</span>
          </div>
          <div class="sc-step-line" />
          <div class="sc-step">
            <span class="sc-step-dot">3</span>
            <span class="sc-step-label">Payment</span>
          </div>
        </div>
      </Section>

      <Section title="Forms">
        <div class="sc-form">
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
          <label class="sc-field sc-span2">
            Message
            <textarea placeholder="Type a message…" rows={3} />
          </label>
        </div>
      </Section>

      <Section title="Feedback">
        <div class="sc-progress" role="progressbar">
          <div class="sc-progress-bar" style={{ width: '64%' }} />
        </div>
        <div class="sc-feedback-row">
          <span class="sc-spinner" aria-label="Loading" />
          <div class="sc-alert">Alerts, spinners and progress all pull from the same tokens.</div>
        </div>
      </Section>

      <Section title="Pagination">
        <div class="sc-pagination">
          <button class="sc-page" aria-label="Previous">
            ‹
          </button>
          <button class="sc-page sc-page-on">1</button>
          <button class="sc-page">2</button>
          <button class="sc-page">3</button>
          <button class="sc-page">4</button>
          <button class="sc-page" aria-label="Next">
            ›
          </button>
        </div>
      </Section>

      <Section title="Quote">
        <blockquote class="sc-quote">
          If anyone thinks he is something when he is nothing, he deceives himself. Each one should test his own
          actions.
          <cite>— Uzumaki Naruto</cite>
        </blockquote>
      </Section>

      <Section title="Surfaces">
        <div class="sc-stats">
          <div class="sc-stat">
            <span class="sc-stat-label">Revenue</span>
            <span class="sc-stat-value">$48.2k</span>
            <span class="sc-badge sc-ok">+12%</span>
          </div>
          <div class="sc-stat">
            <span class="sc-stat-label">Active users</span>
            <span class="sc-stat-value">1,284</span>
            <span class="sc-badge sc-accent">Live</span>
          </div>
          <div class="sc-stat">
            <span class="sc-stat-label">Churn</span>
            <span class="sc-stat-value">2.1%</span>
            <span class="sc-badge sc-err">-3%</span>
          </div>
        </div>
        <div class="sc-grid2">
          <div class="sc-card">
            <h3>Card</h3>
            <p class="sc-muted">Surface, border and radius tokens with a subtle shadow.</p>
          </div>
          <div class="sc-card sc-elevated">
            <h3>Elevated</h3>
            <p class="sc-muted">A larger shadow token lifts this surface off the page.</p>
          </div>
        </div>
      </Section>

      <Section title="Data">
        <table class="sc-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Team</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {PEOPLE.map((person) => (
              <tr key={person.name}>
                <td>
                  <span class="sc-person">
                    <span class="sc-avatar">{initials(person.name)}</span>
                    {person.name}
                  </span>
                </td>
                <td class="sc-muted">{person.role}</td>
                <td>
                  <span class={`sc-badge sc-${person.status}`}>{person.label}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Typography">
        <div class="sc-type">
          <div class="sc-display">Display</div>
          <h2>Heading level two</h2>
          <h4>Heading level four</h4>
          <p>
            Body text sets in your base font and line-height, so paragraphs read exactly as they will in your product
            interface.
          </p>
          <p class="sc-caption">Caption / small print</p>
        </div>
      </Section>
    </div>
  )
}
