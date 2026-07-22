import { useState } from 'react'
import { css, cx, viewTransition } from '../styled-system/css'

const slide = viewTransition({
  group: {
    animationDuration: '0.45s',
    animationTimingFunction: 'ease-in-out',
  },
  old: { opacity: 0 },
  new: { opacity: 1 },
})

export function ViewTransitionDemo() {
  const [large, setLarge] = useState(false)

  const toggle = () => {
    const next = !large
    const run = () => setLarge(next)
    if (document.startViewTransition) {
      document.startViewTransition(run)
    } else {
      run()
    }
  }

  return (
    <section className={css({ padding: '5', borderWidth: '1px', display: 'grid', gap: '4' })}>
      <p className={css({ fontWeight: 'semibold', mb: '0' })}>viewTransition()</p>
      <p className={css({ color: 'fg.muted', fontSize: 'sm' })}>
        Bag class: <code className={css({ fontFamily: 'mono' })}>{slide}</code>
      </p>

      <button
        type="button"
        onClick={toggle}
        className={css({
          height: '40px',
          width: 'fit-content',
          background: 'teal.500',
          color: 'white',
          borderRadius: '8px',
          paddingX: '24px',
          fontWeight: 'medium',
          cursor: 'pointer',
        })}
      >
        Toggle card size
      </button>

      <div
        className={css({
          display: 'flex',
          justifyContent: large ? 'flex-end' : 'flex-start',
          alignItems: 'center',
          minHeight: '220px',
          background: 'gray.50',
          borderRadius: '12px',
          padding: '6',
        })}
      >
        <div
          className={cx(
            slide,
            css({
              background: 'teal.600',
              color: 'white',
              borderRadius: '16px',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 'bold',
              fontSize: large ? '2xl' : 'lg',
              width: large ? '280px' : '120px',
              height: large ? '180px' : '80px',
              boxShadow: 'lg',
            }),
          )}
          style={{ viewTransitionName: 'panda-hero' }}
        >
          Hero
        </div>
      </div>
    </section>
  )
}
