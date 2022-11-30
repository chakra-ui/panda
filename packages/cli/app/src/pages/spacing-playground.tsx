import { useState } from 'react'
import { getSortedSizes } from '../utils/sizes-sort'
import { renderPixels } from './sizes'
import { config } from 'virtual:panda'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { panda, HStack } from 'design-system/jsx'
import { TokenGroup } from '../components/token-group'
import { TokenContent } from '../components/token-content'

const NUMBER_OF_ITEMS = 3

export default function SpacingPlayground() {
  const tokenDictionary = new TokenDictionary(config)
  const tokens = Object.fromEntries(tokenDictionary.categoryMap)

  const { sizes: sizesProp } = tokens
  const values = Array.from(sizesProp.values())
  if (typeof sizesProp === 'string') return null

  const sizes = getSortedSizes(values)

  const [gapSize, setGapSize] = useState(sizes[6]?.extensions.prop)
  const gap = sizesProp.get(gapSize)?.value

  const [paddingSize, setPaddingSize] = useState(sizes[6]?.extensions.prop)
  const padding = sizesProp.get(paddingSize)?.value

  const spacingItems = Array.from({ length: NUMBER_OF_ITEMS }).map((_, i) => (
    <panda.div
      width="full"
      height="10"
      background="rgb(99 102 241)"
      borderRadius="sm"
      display="flex"
      alignItems="center"
      justifyContent="center"
      fontWeight="bold"
      key={i}
    >
      {i < 10 ? 0 : ''}
      {i + 1}
    </panda.div>
  ))

  return (
    <TokenGroup>
      <div>
        <panda.h3 marginBottom="8" id="gap">
          Gap
        </panda.h3>
        <div id="gap-view">
          <TokenContent>
            <panda.div
              display="flex"
              alignItems="center"
              gap="1"
              whiteSpace="nowrap"
              position="sticky"
              top="0"
              boxShadow="lg"
              background="bg"
            >
              <panda.span fontWeight="bold" marginY="4">
                Spacing
              </panda.span>
              <select
                value={gapSize}
                onChange={(e) => {
                  setGapSize(e.currentTarget.value)
                }}
                className="token-switch"
              >
                {sizes.map((size) => (
                  <option key={size.value} value={size.extensions.prop}>
                    {size.extensions.prop}
                    {size.value.endsWith('px') ? '' : ` - ${renderPixels(size.value)}`}
                  </option>
                ))}
              </select>
            </panda.div>

            <panda.div>
              <panda.span fontWeight="bold">Horizontal</panda.span>
              <panda.div
                marginTop="3"
                display="flex"
                background="#e879f91a"
                backgroundImage="linear-gradient(
                  135deg,
                  #d946ef80 10%,
                  transparent 0,
                  transparent 50%,
                  #d946ef80 0,
                  #d946ef80 60%,
                  transparent 0,
                  transparent
                )"
                backgroundSize="7.07px 7.07px"
                width="fit-content"
                css={{
                  '& div': {
                    background: 'rgb(217 70 239)',
                    width: '14',
                    height: '14',
                  },
                }}
                style={{ gap }}
              >
                {spacingItems}
              </panda.div>
            </panda.div>

            <panda.div>
              <panda.span fontWeight="bold">Vertical</panda.span>
              <panda.div
                marginTop="3"
                display="flex"
                flexDir="column"
                background="#e879f91a"
                backgroundImage="linear-gradient(
                  135deg,
                  #d946ef80 10%,
                  transparent 0,
                  transparent 50%,
                  #d946ef80 0,
                  #d946ef80 60%,
                  transparent 0,
                  transparent
                )"
                backgroundSize="7.07px 7.07px"
                className="stack-h"
                style={{ gap }}
              >
                {spacingItems}
              </panda.div>
            </panda.div>
          </TokenContent>
        </div>

        <hr />

        <panda.h3 marginY="8" id="padding">
          Padding
        </panda.h3>
        <div id="padding-view">
          <panda.div layerStyle="token-content ">
            <panda.div
              display="flex"
              alignItems="center"
              gap="1"
              whiteSpace="nowrap"
              position="sticky"
              top="0"
              boxShadow="lg"
              background="bg"
            >
              <panda.span fontWeight="bold" marginY="4">
                Spacing
              </panda.span>
              <select
                value={paddingSize}
                onChange={(e) => {
                  setPaddingSize(e.currentTarget.value)
                }}
                className="token-switch"
              >
                {sizes.map((size) => (
                  <option key={size.value} value={size.extensions.prop}>
                    {size.extensions.prop}
                    {size.value.endsWith('px') ? '' : ` - ${renderPixels(size.value)}`}
                  </option>
                ))}
              </select>
            </panda.div>

            <Section
              title="Horizontal"
              style={{ paddingInline: padding }}
              padding={padding}
              itemBackground="rgb(139 100 246)"
            />

            <Section
              title="Vertical"
              style={{ padding: `${padding} 0` }}
              padding={padding}
              itemBackground="rgb(236 72 153)"
            />
            <Section title="All sides" style={{ padding }} padding={padding} itemBackground="rgb(139 92 246)" />
          </panda.div>
        </div>
      </div>
    </TokenGroup>
  )
}

type SectionProps = {
  title: string
  style: Record<string, any>
  padding: string
  itemBackground: string
}

function Section(props: SectionProps) {
  const { title, style, padding, itemBackground, ...rest } = props
  return (
    <panda.div>
      <panda.span fontWeight="bold">{title}</panda.span>
      <panda.div
        marginTop="3"
        width="fit-content"
        borderRadius="lg"
        backgroundSize="7.07px 7.07px"
        style={{ ...style, backgroundColor: itemBackground }}
        backgroundImage="linear-gradient(
          135deg,
          hsla(0, 0%, 100%, 0.75) 10%,
          transparent 0,
          transparent 50%,
          hsla(0, 0%, 100%, 0.75) 0,
          hsla(0, 0%, 100%, 0.75) 60%,
          transparent 0,
          transparent
        )"
        {...rest}
      >
        <HStack
          className="item"
          style={{
            background: itemBackground || 'rgb(99 102 241)',
          }}
          paddingInline="4"
          justify="center"
          fontWeight="bold"
          height="14"
        >
          {padding}
        </HStack>
      </panda.div>
    </panda.div>
  )
}
