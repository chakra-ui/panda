import { css, positionTry } from '../styled-system/css'

// Named theme fallback + an ad-hoc inline fallback. Both inline to a
// dashed-ident and emit their `@position-try` block.
const flip = positionTry('flip')
const shift = positionTry({ insetInlineEnd: 'anchor(end)', insetBlockStart: 'anchor(bottom)' })

export function PositionTryDemo() {
  return (
    <section className={css({ padding: '5', borderWidth: '1px', display: 'grid', gap: '4' })}>
      <p className={css({ fontWeight: 'semibold', mb: '0' })}>positionTry(...)</p>
      <p className={css({ color: 'fg.muted', fontSize: 'sm' })}>
        Fallbacks: <code className={css({ fontFamily: 'mono' })}>{flip}</code>,{' '}
        <code className={css({ fontFamily: 'mono' })}>{shift}</code>
      </p>

      <div className={css({ position: 'relative', minHeight: '160px' })}>
        <button
          type="button"
          className={css({
            anchorName: '--pt-trigger',
            height: '40px',
            width: 'fit-content',
            background: 'purple.500',
            color: 'white',
            borderRadius: '8px',
            paddingX: '24px',
            fontWeight: 'medium',
            cursor: 'pointer',
          })}
        >
          Anchor
        </button>

        <div
          className={css({
            position: 'absolute',
            positionAnchor: '--pt-trigger',
            top: 'anchor(bottom)',
            insetInlineStart: 'anchor(start)',
            positionTryFallbacks: `${flip}, ${shift}`,
            marginTop: '2',
            background: 'purple.600',
            color: 'white',
            borderRadius: '8px',
            padding: '3',
            fontSize: 'sm',
          })}
        >
          Popover that flips when it runs out of room
        </div>
      </div>
    </section>
  )
}
