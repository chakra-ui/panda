import { css } from '@/styled-system/css'
import { defaultBreakpoints } from './query'
import { hstack, stack } from '@/styled-system/patterns'

const itemStyle = css({
  rounded: 'sm',
  height: '12',
  borderXWidth: '4px',
  borderTopWidth: '4px',
  borderBottomWidth: '12px'
})

export const Breakpoints = () => {
  return (
    <div className={stack({ gap: '8' })}>
      {Object.entries(defaultBreakpoints).map(([key, value], index) => {
        const width = (index + 1) * 20
        return (
          <div key={key} className={hstack()}>
            <div className={css({ minWidth: '120px' })}>
              <div className={itemStyle} style={{ width }} />
            </div>
            <div className={css({ minWidth: '80px' })}>
              <div className={css({ py: '2', fontWeight: 'medium' })}>
                {key}
              </div>
            </div>
            <div
              className={css({ py: '2', opacity: '0.6' })}
            >{`@media screen (min-width >= ${value})`}</div>
          </div>
        )
      })}
    </div>
  )
}
