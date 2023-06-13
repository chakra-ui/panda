import { css } from '@/styled-system/css'
import { grid, hstack, square } from '@/styled-system/patterns'
import { Token } from '@pandacss/token-dictionary'

export const ColorGrid = ({ tokens }: { tokens: Token[] }) => (
  <div className={grid({ columns: 3, gap: '2', fontSize: 'sm' })}>
    {tokens.map((token, index) => (
      <div key={index} className={hstack()}>
        <div
          className={square({ size: '8', rounded: 'sm' })}
          style={{ background: token.extensions.varRef }}
        />
        <div>
          <div className={css({ fontWeight: 'medium' })}>
            {token.extensions.prop}
          </div>
          <div className={css({ opacity: '0.6' })}>{token.value}</div>
        </div>
      </div>
    ))}
  </div>
)
