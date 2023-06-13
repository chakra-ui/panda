import { defaultBorderRadius } from '@/components/token-docs/query'
import { css } from '@/styled-system/css'
import { grid, square, stack } from '@/styled-system/patterns'

export const Radii = () => {
  return (
    <div className={grid({ columns: 3, gap: '8', fontSize: 'sm' })}>
      {defaultBorderRadius.map(token => (
        <div key={token.name} className={stack()}>
          <div
            className={square({ size: '8', bg: 'pink.200' })}
            style={{ borderRadius: token.value }}
          />
          <p className={css({ fontWeight: 'medium' })}>
            {token.extensions.prop}
          </p>
        </div>
      ))}
    </div>
  )
}
