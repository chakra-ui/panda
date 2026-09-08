import { css, keyframes } from '../styled-system/css'

const fade = keyframes({
  from: { opacity: 0, transform: 'translateY(8px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
})

const pulse = keyframes({
  '0%': { transform: 'scale(1)' },
  '50%': { transform: 'scale(1.25)' },
  '100%': { transform: 'scale(1)' },
})

export function KeyframesDemo() {
  return (
    <section className={css({ padding: '5', borderWidth: '1px', display: 'grid', gap: '4' })}>
      <p className={css({ fontWeight: 'semibold', mb: '0' })}>keyframes(...)</p>
      <p className={css({ color: 'fg.muted', fontSize: 'sm' })}>
        Names: <code className={css({ fontFamily: 'mono' })}>{fade}</code>,{' '}
        <code className={css({ fontFamily: 'mono' })}>{pulse}</code>
      </p>

      <div className={css({ display: 'flex', gap: '6', alignItems: 'center' })}>
        <div
          className={css({
            padding: '3',
            background: 'teal.500',
            color: 'white',
            borderRadius: '8px',
            fontSize: 'sm',
            animationName: fade,
            animationDuration: '0.6s',
            animationTimingFunction: 'ease-out',
          })}
        >
          fades in
        </div>

        <span
          className={css({
            display: 'inline-flex',
            height: '5',
            width: '5',
            borderRadius: 'full',
            background: 'purple.500',
            animation: `${pulse} 1.2s ease-in-out infinite`,
          })}
        />
      </div>
    </section>
  )
}
