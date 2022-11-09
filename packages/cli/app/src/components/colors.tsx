import type { Token } from '@css-panda/types'
import { useState } from 'react'

type Color = {
  isConditional?: boolean
  isReference?: boolean
  name: string
  originalValue: string
  path: string[]
}

type ColorToken = Token & Color

type ColorsProps = {
  colors: Map<string, any>
  allTokens: ColorToken[]
}

const UNCATEGORIZED_ID = 'uncategorized' as const

const extractColor = (col: string) => {
  const format = /{colors.(.*)}/
  const result = col.match(format)
  return `colors.${result?.[1]}`
}

const groupByPalette = (colors: Map<string, any>, filterMethod: (token: ColorToken) => boolean = () => true) => {
  const values = Array.from(colors.values()).filter((color) => !color.isConditional && !color.extensions.isVirtual)
  return values.reduce((acc, nxt) => {
    if (!filterMethod?.(nxt)) return acc

    const palette = nxt.extensions.palette || UNCATEGORIZED_ID
    if (!(palette in acc)) acc[palette] = []
    const exists = (acc[palette] as any[]).find((tok) => tok.name === nxt.name)
    if (!exists) acc[palette].push(nxt)
    return acc
  }, {})
}

const getSemanticTokens = (
  allTokens: ColorsProps['allTokens'],
  filterMethod: (token: ColorToken) => boolean = () => true,
) => {
  const semanticTokens = allTokens.filter(
    (token) => token.type === 'color' && token.isConditional && !token.extensions?.isVirtual,
  )
  return semanticTokens
    .reduce((acc, nxt) => {
      const rawQualified = semanticTokens.filter(filterMethod)

      if (filterMethod(nxt) || rawQualified.some((tok) => tok.name === nxt.name)) {
        acc.push(nxt)
      }
      return acc
    }, [] as ColorToken[])
    .reduce(
      (acc, nxt) => ({
        ...acc,
        [nxt.extensions?.prop]: {
          ...acc[nxt.extensions?.prop],
          [nxt.extensions?.condition]: { value: nxt.value, isReference: nxt.isReference },
          extensions: nxt.extensions,
        },
      }),
      {},
    )
}

export function Colors(props: ColorsProps) {
  const { colors, allTokens } = props

  const [filterQuery, setFilterQuery] = useState('')

  const filterMethod = (token: ColorToken) => {
    return [
      ...token.path,
      token.originalValue,
      token.description,
      token.value,
      token.name,
      token.extensions?.var,
      token.extensions?.prop,
      ...Object.values(token.extensions?.conditions || {}),
    ]
      .filter(Boolean)
      .some((prop) => prop.includes(filterQuery))
  }

  const colorsInCategories = groupByPalette(colors, filterMethod)
  const uncategorized = colorsInCategories[UNCATEGORIZED_ID]

  const categorizedColors = Object.entries<any[]>(colorsInCategories).filter(
    ([category]) => category !== UNCATEGORIZED_ID,
  )

  const semanticTokens = getSemanticTokens(allTokens, filterMethod)

  const renderSemanticTokens = () => {
    return Object.entries<Record<string, any>>(semanticTokens).map(([name, colors], i) => {
      return (
        <div className="shade" key={i}>
          <div className="color-box semantic-wrapper" style={{ background: colors[colors.extensions.condition].value }}>
            <span>{colors.extensions.condition}</span>
            <div className="color-box condition" style={{ background: colors.base.value }}>
              <span>Base</span>
            </div>
          </div>
          <span>
            <span className="semantic-title">{name}</span>
          </span>
          {Object.entries<string>(colors.extensions.conditions).map(([cond, val]) => {
            const isLinked = colors[cond].isReference
            return (
              <div key={cond}>
                <span>
                  <span>{`${cond}: ${extractColor(val)}`}</span>
                  {isLinked && <span className="alias">🔗 alias</span>}
                </span>
              </div>
            )
          })}
        </div>
      )
    })
  }
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
      <div className="font-token-input-wrapper">
        <input
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          className="font-token-input"
          placeholder="Filter tokens by text, property or value"
        />
      </div>
      <div className="token-content">
        <div className="color-wrapper">
          {categorizedColors.map(([category, colors]) => (
            <div key={category}>
              <span className="title">{category}</span>
              <div className="shades" key={category}>
                {renderColors(colors)}
              </div>
            </div>
          ))}
          {uncategorized?.length && (
            <div>
              <span className="title">{UNCATEGORIZED_ID}</span>
              <div className="shades">{renderColors(uncategorized)}</div>
            </div>
          )}
          <div>
            <span className="title">Semantic tokens</span>
            <div className="shades">{renderSemanticTokens()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
