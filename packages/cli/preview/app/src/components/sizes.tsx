import { remToPixels } from '../utils/rem-to-pixels'
import { getSortedSizes } from '../utils/sizes-sort'

export type SizesProps = { sizes: Map<string, any> }

export const renderPixels = (size: string) => {
  if (size.endsWith('px')) return size
  else return remToPixels(size)
}

export function Sizes(props: SizesProps) {
  const { sizes: sizesProp } = props
  const values = Array.from(sizesProp.values())

  const sizes = getSortedSizes(values)

  return (
    <div className="token-group sizes-tokens">
      <div className="token-content ">
        <span>Name</span>
        <span>Size</span>
        <span style={{ gridColumn: 'span 3 / span 3' }}>Pixels</span>
        <hr />
        {sizes
          .sort((a, b) => a.extensions.prop - b.extensions.prop)
          .map((size) => (
            <>
              <b>{size.extensions.prop}</b>
              <span>{size.value}</span>
              <span>{renderPixels(size.value as string)}</span>
              <span className="size-box" style={{ width: size.value }} />
            </>
          ))}
      </div>
    </div>
  )
}
