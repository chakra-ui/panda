import { useClipboard } from '@/mdx/use-clipboard'
import { css, cva } from '@/styled-system/css'
import { grid, hstack, square } from '@/styled-system/patterns'
import { Token } from '@pandacss/token-dictionary'

export const ColorGrid = ({ tokens }: { tokens: Token[] }) => (
  <div className={grid({ minChildWidth: '11rem', gap: '2', fontSize: 'sm' })}>
    {tokens.map((token, index) => (
      <ColorGridToken token={token} key={index} />
    ))}
  </div>
)

export const ColorGridToken = ({ token }: { token: Token }) => {
  const { isCopied, copy } = useClipboard({ getValue: () => token.value })

  return (
    <div className={hstack({ cursor: 'pointer' })} onClick={copy}>
      <div
        className={square({ size: '8', rounded: 'sm' })}
        style={{ background: token.extensions.varRef }}
      />
      <div>
        <div className={css({ fontWeight: 'medium' })}>
          {token.extensions.prop}
        </div>
        <div className={colorTokenValue({ copied: isCopied })}>
          {token.value}
        </div>
      </div>
    </div>
  )
}

const colorTokenValue = cva({
  base: {
    opacity: '0.6'
  },
  variants: {
    copied: {
      true: {
        opacity: '1',
        color: 'green.500'
      }
    }
  }
})
