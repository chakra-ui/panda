import { TokenDictionary } from '@pandacss/token-dictionary'
import { config } from 'virtual:panda'
import { remToPixels } from '../utils/rem-to-pixels'
import { getSortedSizes } from '../utils/sizes-sort'
import { panda, Grid } from 'design-system/jsx'
import { TokenGroup } from '../components/token-group'

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
    <TokenGroup>
      <Grid display="grid" colGap="10" rowGap="2.5" columns={5} layerStyle="token-content ">
        <panda.span fontWeight="semibold">Name</panda.span>
        <panda.span fontWeight="semibold">Size</panda.span>
        <panda.span fontWeight="semibold" gridColumn="span 3 / span 3">
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
                height="5"
                background="rgba(255, 192, 203, 0.5)"
                gridColumn="span 2 / span 2"
                style={{ width: size.value }}
              />
            </>
          ))}
      </Grid>
    </TokenGroup>
  )
}
