import { css } from '@/styled-system/css'
import { grid, hstack, square } from '@/styled-system/patterns'
import { Token } from '@pandacss/token-dictionary'

export const ColorGrid = ({ tokens }: { tokens: Token[] }) => (
  <div className={grid({ columns: 3, gap: '2' })}>
    {tokens.map((token, index) => (
      <div key={index} className={hstack()}>
        <div
          className={square({ size: '8', rounded: 'sm' })}
          style={{ background: token.extensions.varRef }}
        />
        <div>
          <div>{token.extensions.prop}</div>
          <div className={css({ opacity: '0.6', fontSize: 'sm' })}>
            {token.value}
          </div>
        </div>
      </div>
    ))}
  </div>
)
