import { css } from '@/styled-system/css'
import { hstack, stack } from '@/styled-system/patterns'
import { defaultSizings } from './query'

export const Sizings = () => {
  return (
    <div>
      <div
        className={hstack({
          bg: { base: 'neutral.100', _dark: 'neutral.900' },
          fontSize: 'sm',
          fontWeight: 'medium',
          py: '1',
          px: '3',
          borderBottomWidth: '1px'
        })}
      >
        <p className={css({ width: '100px' })}>Name</p>
        <p className={css({ width: '100px' })}>Value</p>
      </div>

      <div className={stack({ px: '3', pt: '2' })}>
        {defaultSizings.map(token => (
          <div key={token.name} className={hstack({ py: '1', fontSize: 'sm' })}>
            <p className={css({ width: '100px', fontWeight: 'medium' })}>
              {token.extensions.prop}
            </p>
            <p className={css({ width: '100px' })}>{token.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
