import { defaultKeyframes } from '@/components/token-docs/query'
import { css } from '@/styled-system/css'
import { grid, square, stack } from '@/styled-system/patterns'
import { Token, token } from '@/styled-system/tokens'

export const Keyframes = () => {
  return (
    <div className={grid({ columns: 3, gap: '8', fontSize: 'sm' })}>
      {Object.keys(defaultKeyframes).map(keyframe => {
        return (
          <div key={keyframe} className={stack()}>
            <div
              className={square({
                size: '12',
                bg: 'pink.200'
              })}
              style={{ animation: token(`animations.${keyframe}` as Token) }}
            />
            <p className={css({ fontWeight: 'medium' })}>{keyframe}</p>
          </div>
        )
      })}
    </div>
  )
}
