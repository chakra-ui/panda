import { defaultFontSizes } from '@/components/token-docs/query'
import { css } from '@/styled-system/css'
import { hstack, stack } from '@/styled-system/patterns'

export const FontSizes = () => {
  return (
    <div className={stack({ gap: '4', fontSize: 'sm' })}>
      {defaultFontSizes.map(token => (
        <div key={token.name} className={hstack()}>
          <p className={css({ width: '10' })}>{token.extensions.prop}</p>
          <div style={{ fontSize: token.value }}>Ag</div>
        </div>
      ))}
    </div>
  )
}
