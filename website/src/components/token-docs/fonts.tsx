import { defaultFonts } from '@/components/token-docs/query'
import { css } from '@/styled-system/css'
import { stack } from '@/styled-system/patterns'

export const Fonts = () => {
  return (
    <div className={stack({ gap: '4', fontSize: 'sm' })}>
      {defaultFonts.map(token => (
        <div key={token.name} className={stack({ w: 'full' })}>
          <div style={{ fontFamily: token.value, fontSize: '32px' }}>Ag</div>
          <p className={css({ fontWeight: 'medium' })}>
            {token.extensions.prop}
          </p>
          <p className={css({ opacity: '0.6' })}>{token.value}</p>
        </div>
      ))}
    </div>
  )
}
