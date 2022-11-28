import { TokenDictionary } from '@pandacss/token-dictionary'
import { config } from 'virtual:panda'
import { remToPixels } from '../utils/rem-to-pixels'
import { getSortedSizes } from '../utils/sizes-sort'
import { panda } from 'design-system/jsx'
import { css } from 'design-system/css'

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
    <panda.div
      className={css({
        layerStyle: 'token-group',
      })}
    >
      <panda.div
        display="grid"
        gap="10px 40px"
        gridTemplateColumns="repeat(5, minmax(0px, 1fr))"
        className="token-content "
      >
        <panda.span fontWeight={600}>Name</panda.span>
        <panda.span fontWeight={600}>Size</panda.span>
        <panda.span fontWeight={600} style={{ gridColumn: 'span 3 / span 3' }}>
          Pixels
        </panda.span>
        <panda.hr gridColumn="span 5 / span 5" />
        {sizes
          .sort((a, b) => a.extensions.prop - b.extensions.prop)
          .map((size) => (
            <>
              <b>{size.extensions.prop}</b>
              <span>{size.value}</span>
              <span>{renderPixels(size.value as string)}</span>
              <panda.span
                height="20px"
                background="rgba(255, 192, 203, 0.5)"
                className="size-box"
                gridColumn="span 2 / span 2"
                style={{ width: size.value }}
              />
            </>
          ))}
      </panda.div>
    </panda.div>
  )
}
