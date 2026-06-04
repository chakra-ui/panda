import { css } from '../styled-system/css/index.mjs'

export function App() {
  return (
    <main
      className={css({
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        backgroundColor: 'brand.50',
        color: 'brand.700',
      })}
    >
      <section
        className={css({
          display: 'grid',
          gap: '24px',
          padding: '32px',
          borderRadius: '16px',
          backgroundColor: 'white',
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.16)',
        })}
      >
        <p
          className={css({
            fontSize: '18px',
            fontWeight: '700',
            color: 'brand.500',
          })}
        >
          Panda v2 PostCSS Sandbox
        </p>
      </section>
    </main>
  )
}
