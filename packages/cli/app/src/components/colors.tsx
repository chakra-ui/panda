import type { Token } from '@css-panda/types'

type Color = {
  isConditional?: boolean
}
type ColorsProps = {
  colors: Map<string, any>
  allTokens: (Token & Color)[]
}

const UNCATEGORIZED_ID = 'uncategorized' as const
export function Colors(props: ColorsProps) {
  const { colors, allTokens } = props

  const values = Array.from(colors.values()).filter((color) => !color.isConditional && !color.extensions.isVirtual)

  const colorsInCategories = values.reduce((acc, nxt) => {
    const palette = nxt.extensions.palette || UNCATEGORIZED_ID
    if (!(palette in acc)) acc[palette] = []
    const exists = (acc[palette] as any[]).find((tok) => tok.name === nxt.name)
    if (!exists) acc[palette].push(nxt)
    return acc
  }, {})

  const categorizedColors = Object.entries<any[]>(colorsInCategories).filter(
    ([category]) => category !== UNCATEGORIZED_ID,
  )

  const semanticTokens = allTokens
    .filter((token) => token.type === 'color' && token.isConditional && !token.extensions?.isVirtual)
    .reduce(
      (acc, nxt) => ({
        ...acc,
        [nxt.extensions?.prop]: { ...acc[nxt.extensions?.prop], [nxt.extensions?.condition]: nxt.value },
      }),
      {},
    )
  console.log('semanticTokens :>> ', semanticTokens)

  const renderColors = (values: any[]) => {
    return values?.map((color, i) => {
      return (
        <div className="shade" key={i}>
          <div className="color-box" style={{ background: color.value }} />
          <div className="shade-value">{color.value}</div>
          <div className="shade-value">{color.extensions.prop}</div>
          <div className="shade-value">{color.extensions.varRef}</div>
        </div>
      )
    })
  }

  return (
    <div className="token-group">
      <div className="token-content">
        <div className="color-wrapper">
          {categorizedColors.map(([category, colors]) => (
            <div>
              <span className="title">{category}</span>
              <div className="shades" key={category}>
                {renderColors(colors)}
              </div>
            </div>
          ))}
          <div>
            <span className="title">{UNCATEGORIZED_ID}</span>
            <div className="shades">{renderColors(colorsInCategories[UNCATEGORIZED_ID])}</div>
          </div>
          <div>
            <span className="title">Semantic tokens</span>
            <div className="shades">semantic tokens</div>
          </div>
        </div>
      </div>
    </div>
  )
}
