import type { Token } from '@pandacss/token-dictionary'
import * as React from 'react'
import { Grid, HStack, Stack, panda } from '../../styled-system/jsx'
import { ColorWrapper } from '../components/color-wrapper'
import { TokenContent } from '../components/token-content'
import { TokenGroup } from '../components/token-group'
import { useColorDocs } from '../lib/use-color-docs'
import { Input } from './input'
import { SemanticColorDisplay } from './semantic-color'
import { StickyTop } from './sticky-top'

const UNCATEGORIZED_ID = 'uncategorized' as const

function getColorFromReference(reference: string) {
  return reference.match(/{colors\.(.*?)}/)?.[1]
}

export default function Colors() {
  const { filterQuery, setFilterQuery, semanticTokens, hasResults, uncategorizedColors, categorizedColors } =
    useColorDocs()

  const renderSemanticTokens = () => {
    return semanticTokens.map(([name, colors], i) => {
      return (
        <Stack gap="2" key={i} width="full">
          <HStack gap="1">
            <SemanticColorDisplay
              value={colors.base.value}
              condition="base"
              token={getColorFromReference(colors.extensions.conditions!.base)}
            />
            <SemanticColorDisplay
              value={colors[colors.extensions.condition!].value}
              condition={colors.extensions.condition!}
              token={getColorFromReference(colors.extensions.conditions![colors.extensions.condition!])}
            />
          </HStack>

          <panda.span fontWeight="semibold">{name}</panda.span>
        </Stack>
      )
    })
  }

  return (
    <TokenGroup>
      <StickyTop>
        <Input
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter tokens by text, property or value"
        />
      </StickyTop>

      <TokenContent>
        <Stack gap="10">
          {categorizedColors.map(([category, colors]) => (
            <ColorGroup key={category} title={category} colors={colors} />
          ))}

          <ColorGroup title={UNCATEGORIZED_ID} colors={uncategorizedColors} />

          {!!semanticTokens.length && <ColorGroup title="Semantic Tokens">{renderSemanticTokens()}</ColorGroup>}

          {!hasResults && <div>No result found! 🐼</div>}
        </Stack>
      </TokenContent>
    </TokenGroup>
  )
}

function PrimitiveColors(props: { values?: Token[] }) {
  const { values = [] } = props
  return values.map((color, i) => {
    return (
      <Stack gap="1" key={i}>
        <ColorWrapper style={{ background: color.value }} />
        <Stack mt="2" gap="0.5">
          <panda.div fontWeight="medium">{color.extensions.prop}</panda.div>
          <panda.div opacity="0.7" fontSize="sm" textTransform="uppercase">
            {color.value}
          </panda.div>
        </Stack>
      </Stack>
    )
  })
}

function ColorGroup(props: { colors?: Token[]; title: string; children?: React.ReactNode }) {
  const { children, colors, title } = props

  const isEmpty = colors == null || colors.length === 0

  if (!children && isEmpty) return null

  return (
    <div>
      <panda.span fontWeight="medium" textTransform="capitalize" fontSize="xl">
        {title}
      </panda.span>
      {children ? (
        <Stack gap="10" mt="10">
          {children}
        </Stack>
      ) : (
        <Grid gap="4" minChildWidth="13rem" my="5" mx="0">
          <PrimitiveColors values={colors} />
        </Grid>
      )}
    </div>
  )
}
