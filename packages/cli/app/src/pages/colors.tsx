import type { Token } from '@pandacss/types'
import { useState } from 'react'

import { config } from 'virtual:panda'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { panda } from 'design-system/jsx'
import { css } from 'design-system/css'

type Color = {
  isConditional?: boolean
  isReference?: boolean
  name: string
  originalValue: string
  path: string[]
}

type ColorToken = Token & Color

const UNCATEGORIZED_ID = 'uncategorized' as const

const extractColor = (col: string) => {
  const format = /{colors.(.*)}/
  const result = col.match(format)
  return `colors.${result?.[1]}`
}

const groupByColorPalette = (colors: Map<string, any>, filterMethod?: (token: ColorToken) => boolean) => {
  const values = Array.from(colors.values()).filter((color) => !color.isConditional && !color.extensions.isVirtual)
  return values.reduce((acc, nxt) => {
    if (!filterMethod?.(nxt)) return acc

    const colorPalette = nxt.extensions.colorPalette || UNCATEGORIZED_ID
    if (!(colorPalette in acc)) acc[colorPalette] = []
    const exists = (acc[colorPalette] as any[]).find((tok) => tok.name === nxt.name)
    if (!exists) acc[colorPalette].push(nxt)
    return acc
  }, {})
}

const getSemanticTokens = (
  allTokens: ColorToken[],
  filterMethod?: (token: ColorToken) => boolean,
  // filterMethod: (token: ColorToken) => boolean = () => true,
) => {
  const semanticTokens = allTokens.filter(
    (token) => token.type === 'color' && token.isConditional && !token.extensions?.isVirtual,
  )
  return semanticTokens
    .reduce((acc, nxt) => {
      if (!filterMethod) {
        acc.push(nxt)
      } else {
        const rawQualified = semanticTokens.filter(filterMethod)

        if (filterMethod(nxt) || rawQualified.some((tok) => tok.name === nxt.name)) {
          acc.push(nxt)
        }
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

const useColorDocs = () => {
  const tokenDictionary = new TokenDictionary(config)
  const tokens = Object.fromEntries(tokenDictionary.categoryMap)
  const allTokens = tokenDictionary.allTokens

  const { colors } = tokens

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

  const colorsInCategories = groupByColorPalette(colors, filterMethod)
  const uncategorizedColors = colorsInCategories[UNCATEGORIZED_ID]

  const categorizedColors = Object.entries<any[]>(colorsInCategories).filter(
    ([category]) => category !== UNCATEGORIZED_ID,
  )

  const semanticTokens = Object.entries<Record<string, any>>(getSemanticTokens(allTokens, filterMethod))
  const hasResults =
    !!categorizedColors.length || !!uncategorizedColors?.length || !!Object.values(semanticTokens).length

  return {
    filterQuery,
    setFilterQuery,
    uncategorizedColors,
    categorizedColors,
    semanticTokens,
    hasResults,
  }
}

export default function Colors() {
  const { filterQuery, setFilterQuery, semanticTokens, hasResults, uncategorizedColors, categorizedColors } =
    useColorDocs()

  const renderSemanticTokens = () => {
    return semanticTokens.map(([name, colors], i) => {
      return (
        <panda.div display="flex" flexDir="column" gap="4px" key={i}>
          <panda.div
            width="full"
            height="10rem"
            borderRadius="14px"
            position="relative"
            overflow="hidden"
            before={{
              content: "''",
              position: 'absolute',
              borderRadius: '14px',
              width: 'full',
              height: 'full',
              backgroundSize: '12px',
              zIndex: '-1',
              background:
                'url(data:image/svg+xml;utf8,%3Csvg%20width%3D%226%22%20height%3D%226%22%20viewBox%3D%220%200%206%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M0%200H3V3H0V0Z%22%20fill%3D%22%23E1E1E1%22/%3E%3Cpath%20d%3D%22M3%200H6V3H3V0Z%22%20fill%3D%22white%22/%3E%3Cpath%20d%3D%22M3%203H6V6H3V3Z%22%20fill%3D%22%23E1E1E1%22/%3E%3Cpath%20d%3D%22M0%203H3V6H0V3Z%22%20fill%3D%22white%22/%3E%3C/svg%3E%0A)',
            }}
            style={{ background: colors[colors.extensions.condition].value }}
          >
            <panda.span
              position="absolute"
              top="50%"
              right="8px"
              textTransform="uppercase"
              fontWeight={600}
              fontSize="medium"
              writingMode="vertical-lr"
              transform="rotate(100deg)"
              minW="20px"
            >
              {colors.extensions.condition}
            </panda.span>
            <panda.div
              height="10rem"
              width="80%"
              borderRadius="14px"
              position="relative"
              overflow="hidden"
              before={{
                content: "''",
                position: 'absolute',
                borderRadius: '14px',
                width: 'full',
                height: 'full',
                backgroundSize: '12px',
                zIndex: '-1',
                background:
                  'url(data:image/svg+xml;utf8,%3Csvg%20width%3D%226%22%20height%3D%226%22%20viewBox%3D%220%200%206%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M0%200H3V3H0V0Z%22%20fill%3D%22%23E1E1E1%22/%3E%3Cpath%20d%3D%22M3%200H6V3H3V0Z%22%20fill%3D%22white%22/%3E%3Cpath%20d%3D%22M3%203H6V6H3V3Z%22%20fill%3D%22%23E1E1E1%22/%3E%3Cpath%20d%3D%22M0%203H3V6H0V3Z%22%20fill%3D%22white%22/%3E%3C/svg%3E%0A)',
              }}
              className=" condition"
              style={{ background: colors.base.value }}
            >
              <panda.span
                position="absolute"
                top="50%"
                right="8px"
                textTransform="uppercase"
                fontWeight={600}
                fontSize="medium"
                writingMode="vertical-lr"
                transform="rotate(100deg)"
                minW="20px"
              >
                Base
              </panda.span>
            </panda.div>
          </panda.div>
          <span>
            <panda.span textTransform="capitalize" fontWeight={600}>
              {name}
            </panda.span>
          </span>
          {Object.entries<string>(colors.extensions.conditions).map(([cond, val]) => {
            const isLinked = colors[cond].isReference
            return (
              <div key={cond}>
                <span>
                  <span>{`${cond}: ${extractColor(val)}`}</span>
                  {isLinked && (
                    <panda.span
                      fontSize="small"
                      borderRadius="24px"
                      padding="3px 8px"
                      marginLeft="12px"
                      background="#1a1a1a"
                      color="white"
                    >
                      🔗 alias
                    </panda.span>
                  )}
                </span>
              </div>
            )
          })}
        </panda.div>
      )
    })
  }
  const renderColors = (values: any[]) => {
    return values?.map((color, i) => {
      return (
        <panda.div display="flex" flexDir="column" gap="4px" key={i}>
          <panda.div
            width="full"
            height="5rem"
            borderRadius="4px"
            position="relative"
            overflow="hidden"
            before={{
              content: "''",
              position: 'absolute',
              borderRadius: '4px',
              width: 'full',
              height: 'full',
              backgroundSize: '12px',
              zIndex: '-1',
              background:
                'url(data:image/svg+xml;utf8,%3Csvg%20width%3D%226%22%20height%3D%226%22%20viewBox%3D%220%200%206%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M0%200H3V3H0V0Z%22%20fill%3D%22%23E1E1E1%22/%3E%3Cpath%20d%3D%22M3%200H6V3H3V0Z%22%20fill%3D%22white%22/%3E%3Cpath%20d%3D%22M3%203H6V6H3V3Z%22%20fill%3D%22%23E1E1E1%22/%3E%3Cpath%20d%3D%22M0%203H3V6H0V3Z%22%20fill%3D%22white%22/%3E%3C/svg%3E%0A)',
            }}
            style={{
              background: color.value,
            }}
          />
          <panda.div opacity="0.7">{color.value}</panda.div>
          <panda.div opacity="0.7">{color.extensions.prop}</panda.div>
          <panda.div opacity="0.7">{color.extensions.varRef}</panda.div>
        </panda.div>
      )
    })
  }

  return (
    <panda.div className={css({ layerStyle: 'token-group' })}>
      <panda.div
        marginBottom="14px"
        position="sticky"
        top="0"
        boxShadow="0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
        background="var(--bg)"
      >
        <input
          className={css({
            width: 'full',
            resize: 'vertical',
            padding: '4px',
          })}
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter tokens by text, property or value"
        />
      </panda.div>
      <panda.div layerStyle="token-content">
        <div>
          {!!categorizedColors.length &&
            categorizedColors.map(([category, colors]) => (
              <div key={category}>
                <panda.span fontWeight={500} textTransform="capitalize" fontSize="1.2em">
                  {category}
                </panda.span>
                <panda.div
                  display="grid"
                  //TODO use jsx after fix
                  // gridGap="16px"
                  className={css({
                    gridGap: '16px',
                  })}
                  gridTemplateColumns="repeat(auto-fit, minmax(13rem, 1fr))"
                  margin="20px 0 40px 0"
                  key={category}
                >
                  {renderColors(colors)}
                </panda.div>
              </div>
            ))}
          {!!uncategorizedColors?.length && (
            <div>
              <panda.span fontWeight={500} textTransform="capitalize" fontSize="1.2em">
                {UNCATEGORIZED_ID}
              </panda.span>
              <panda.div
                display="grid"
                //TODO remove `style` after fix
                // gridGap="16px"
                style={{
                  gridGap: '16px',
                }}
                gridTemplateColumns="repeat(auto-fit, minmax(13rem, 1fr))"
                margin="20px 0 40px 0"
              >
                {renderColors(uncategorizedColors)}
              </panda.div>
            </div>
          )}
          {!!semanticTokens.length && (
            <div>
              <panda.span fontWeight={500} textTransform="capitalize" fontSize="1.2em">
                Semantic tokens
              </panda.span>
              <panda.div
                display="grid"
                //TODO remove `style` after fix
                // gridGap="16px"
                style={{
                  gridGap: '16px',
                }}
                gridTemplateColumns="repeat(auto-fit, minmax(13rem, 1fr))"
                margin="20px 0 40px 0"
              >
                {renderSemanticTokens()}
              </panda.div>
            </div>
          )}
          {!hasResults && <div>No pandas found! Try a different breed. 🐼</div>}
        </div>
      </panda.div>
    </panda.div>
  )
}
