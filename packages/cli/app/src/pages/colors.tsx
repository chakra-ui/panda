import type { Token } from '@pandacss/types'
import { useState } from 'react'

import { config } from 'virtual:panda'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { panda, Stack, Grid } from 'design-system/jsx'
import { TokenGroup } from '../components/token-group'
import { TokenContent } from '../components/token-content'

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

const getSemanticTokens = (allTokens: ColorToken[], filterMethod?: (token: ColorToken) => boolean) => {
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
        <Stack gap="1" key={i}>
          <panda.div
            width="full"
            height="40"
            borderRadius="xl"
            position="relative"
            overflow="hidden"
            before={{
              content: "''",
              position: 'absolute',
              borderRadius: 'xl',
              width: 'full',
              height: 'full',
              backgroundSize: '3',
              zIndex: '-1',
              background:
                'url(data:image/svg+xml;utf8,%3Csvg%20width%3D%226%22%20height%3D%226%22%20viewBox%3D%220%200%206%206%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M0%200H3V3H0V0Z%22%20fill%3D%22%23E1E1E1%22/%3E%3Cpath%20d%3D%22M3%200H6V3H3V0Z%22%20fill%3D%22white%22/%3E%3Cpath%20d%3D%22M3%203H6V6H3V3Z%22%20fill%3D%22%23E1E1E1%22/%3E%3Cpath%20d%3D%22M0%203H3V6H0V3Z%22%20fill%3D%22white%22/%3E%3C/svg%3E%0A)',
            }}
            style={{ background: colors[colors.extensions.condition].value }}
          >
            <panda.span
              position="absolute"
              top="50%"
              right="2"
              textTransform="uppercase"
              fontWeight="semibold"
              fontSize="medium"
              writingMode="vertical-lr"
              transform="rotate(100deg)"
              minW="5"
            >
              {colors.extensions.condition}
            </panda.span>
            <panda.div
              height="40"
              width="80%"
              borderRadius="sm"
              position="relative"
              overflow="hidden"
              before={{
                content: "''",
                position: 'absolute',
                borderRadius: 'sm',
                width: 'full',
                height: 'full',
                backgroundSize: '3',
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
                right="2"
                textTransform="uppercase"
                fontWeight="semibold"
                fontSize="medium"
                writingMode="vertical-lr"
                transform="rotate(100deg)"
                minW="5"
              >
                Base
              </panda.span>
            </panda.div>
          </panda.div>
          <span>
            <panda.span textTransform="capitalize" fontWeight="semibold">
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
                      borderRadius="lg"
                      paddingX="2"
                      paddingY="0.5"
                      marginLeft="3"
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
        </Stack>
      )
    })
  }
  const renderColors = (values: any[]) => {
    return values?.map((color, i) => {
      return (
        <Stack gap="1" key={i}>
          <panda.div
            width="full"
            height="20"
            borderRadius="sm"
            position="relative"
            overflow="hidden"
            before={{
              content: "''",
              position: 'absolute',
              borderRadius: 'sm',
              width: 'full',
              height: 'full',
              backgroundSize: '3',
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
        </Stack>
      )
    })
  }

  return (
    <TokenGroup>
      <panda.div marginBottom="3.5" position="sticky" top="0" boxShadow="lg" background="bg" zIndex="1">
        <panda.input
          width="full"
          padding="1"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter tokens by text, property or value"
        />
      </panda.div>
      <TokenContent>
        <div>
          {!!categorizedColors.length &&
            categorizedColors.map(([category, colors]) => (
              <div key={category}>
                <panda.span fontWeight="medium" textTransform="capitalize" fontSize="xl">
                  {category}
                </panda.span>

                <Grid gap="4" minChildWidth="13rem" marginY="5" marginX="0" key={category}>
                  {renderColors(colors)}
                </Grid>
              </div>
            ))}
          {!!uncategorizedColors?.length && (
            <div>
              <panda.span fontWeight="medium" textTransform="capitalize" fontSize="xl">
                {UNCATEGORIZED_ID}
              </panda.span>
              <Grid gap="4" minChildWidth="13rem" marginY="5" marginX="0">
                {renderColors(uncategorizedColors)}
              </Grid>
            </div>
          )}
          {!!semanticTokens.length && (
            <div>
              <panda.span fontWeight="medium" textTransform="capitalize" fontSize="xl">
                Semantic tokens
              </panda.span>
              <Grid gap="4" minChildWidth="13rem" marginY="5" marginX="0">
                {renderSemanticTokens()}
              </Grid>
            </div>
          )}
          {!hasResults && <div>No pandas found! Try a different breed. 🐼</div>}
        </div>
      </TokenContent>
    </TokenGroup>
  )
}
