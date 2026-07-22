import { createFileRoute, Link } from '@tanstack/react-router'
import { css } from '../../styled-system/css'
import { prose } from '../../styled-system/recipes'

export const Route = createFileRoute('/not-prose')({
  component: NotProsePage,
})

function NotProsePage() {
  return (
    <main className={css({ px: '4', py: '10' })}>
      <article className={css({ mx: 'auto' })}>
        <p className={css({ mb: '6', fontSize: 'sm' })}>
          <Link to="/" className={css({ textDecoration: 'underline' })}>
            ← Playground
          </Link>
        </p>
        <div className={prose({ size: 'md' })}>
          <h1>not-prose islands</h1>
          <p>
            With <code>notProse: true</code> on the preset, wrap UI that should keep looking like app
            chrome — not article copy — in a <code>not-prose</code> class.
          </p>
          <p>The card below sits inside the prose container but opts out of typography styles:</p>
          <div
            className="not-prose"
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              padding: '16px',
              border: '1px solid',
              borderRadius: '8px',
            }}
          >
            <button type="button">Primary</button>
            <button type="button">Secondary</button>
            <span>Toolbar actions stay dense and un-prosed.</span>
          </div>
          <p>
            After the island, prose resumes — headings, paragraphs, and lists pick up the recipe
            again.
          </p>
          <ul>
            <li>Nested content outside <code>not-prose</code> is still styled.</li>
            <li>Useful for CTAs and interactive widgets in MDX layouts.</li>
          </ul>
        </div>
      </article>
    </main>
  )
}
