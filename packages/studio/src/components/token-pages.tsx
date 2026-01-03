import { useStore } from '@nanostores/react'
import type { TokenDataTypes } from '@pandacss/types'
import React, { useEffect, useState } from 'react'
import { css } from '../../styled-system/css'
import { Center } from '../../styled-system/jsx'
import { availableThemes } from '../lib/panda-context'
import { currentThemeStore } from '../lib/theme-store'
import { useThemeTokens } from '../lib/use-theme-tokens'
import { Colors } from './colors'
import { FontFamily } from './font-family'
import FontTokens from './font-tokens'
import { Radii } from './radii'
import Sizes from './sizes'

type TokenCategory = keyof TokenDataTypes

const hasThemes = availableThemes.length > 0

const loadingStyles = css({
  width: '40px',
  height: '40px',
  border: '2px solid #FFF',
  borderColor: 'yellow.400',
  borderBottomColor: 'transparent',
  borderRadius: '50%',
  display: 'inline-block',
  boxSizing: 'border-box',
  animation: 'spin 0.6s linear infinite',
})

function Loader() {
  return (
    <Center height="400px">
      <span className={loadingStyles} />
    </Center>
  )
}

function ThemeLoading({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)
  useStore(currentThemeStore)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    return <Loader />
  }

  return <>{children}</>
}

function createTokenPage<T extends TokenCategory>(
  tokenType: T,
  render: (tokens: ReturnType<typeof useThemeTokens>) => React.ReactNode,
) {
  return function TokenPage() {
    const tokens = useThemeTokens(tokenType)
    return hasThemes ? <ThemeLoading>{render(tokens)}</ThemeLoading> : <>{render(tokens)}</>
  }
}

export const SizesPage = createTokenPage('sizes', (tokens) => <Sizes sizes={tokens} name="sizes" />)

export const SpacingPage = createTokenPage('spacing', (tokens) => <Sizes sizes={tokens} name="spacing" />)

export const FontSizesPage = createTokenPage('fontSizes', (tokens) => (
  <FontTokens fontTokens={tokens} token="fontSize" />
))

export const FontWeightsPage = createTokenPage('fontWeights', (tokens) => (
  <FontTokens fontTokens={tokens} token="fontWeight" />
))

export const LetterSpacingsPage = createTokenPage('letterSpacings', (tokens) => (
  <FontTokens fontTokens={tokens} token="letterSpacing" text="The quick brown fox jumps over the lazy dog." />
))

export const LineHeightsPage = createTokenPage('lineHeights', (tokens) => (
  <FontTokens
    fontTokens={tokens}
    token="lineHeight"
    largeText
    text="Panda design system lineHeight specifies the vertical distance between two lines of text. You can preview this visually here."
  />
))

export const RadiiPage = createTokenPage('radii', (tokens) => <Radii radii={tokens} />)

export const FontsPage = createTokenPage('fonts', (tokens) => <FontFamily fonts={tokens} />)

export function ColorsPage() {
  const theme = hasThemes ? useStore(currentThemeStore) : undefined
  return hasThemes ? (
    <ThemeLoading>
      <Colors theme={theme} />
    </ThemeLoading>
  ) : (
    <Colors />
  )
}
