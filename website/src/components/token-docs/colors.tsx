import { css } from '@/styled-system/css'
import { stack } from '@/styled-system/patterns'
import { ColorGrid } from './color-grid'
import { defaultColors } from './query'

export const Colors = () => {
  return (
    <div className={stack({ gap: '8' })}>
      {defaultColors.map(color => (
        <div key={color.key} className={stack()}>
          <p
            className={css({
              textTransform: 'capitalize',
              fontWeight: 'medium'
            })}
          >
            {color.key}
          </p>
          <ColorGrid tokens={color.values} />
        </div>
      ))}
    </div>
  )
}
