import type { Config } from '@css-panda/types'
import { remToPixels } from '../utilities/rem-to-pixels'
import { getSortedSizes } from '../utilities/sizes-sort'

export type SizesProps = { sizes: NonNullable<Config['tokens']>['sizes'] }

export const renderPixels = (size: string) => {
  if (size.endsWith('px')) return size
  else return remToPixels(size)
}

export function Sizes(props: SizesProps) {
  const { sizes: sizesProp } = props

  const sizes = getSortedSizes(sizesProp)

  return (
    <div className="token-group sizes-tokens">
      <div className="token-content ">
        <span>Name</span>
        <span>Size</span>
        <span style={{ gridColumn: 'span 3 / span 3' }}>Pixels</span>
        <hr />
        {sizes.map(([name, size]) => (
          <>
            <span>{name}</span>
            <span>{size}</span>
            <span>{renderPixels(size as string)}</span>
            <span className="size-box" style={{ width: size as string }} />
          </>
        ))}
      </div>
    </div>
  )
}
