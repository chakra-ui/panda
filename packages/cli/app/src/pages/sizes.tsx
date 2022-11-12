import { TokenDictionary } from '@css-panda/token-dictionary'
import { config } from 'virtual:panda'
import { remToPixels } from '../utils/rem-to-pixels'
import { getSortedSizes } from '../utils/sizes-sort'

export type SizesProps = { sizes: Map<string, any> }

export const renderPixels = (size: string) => {
  if (size.endsWith('px')) return size
  else return remToPixels(size)
}

export default function Page() {
  const tokenDictionary = new TokenDictionary(config)
  const tokens = Object.fromEntries(tokenDictionary.categoryMap)
  const values = Array.from(tokens.sizes.values())

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
