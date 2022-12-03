import { useState } from 'react'
import { getContrastPairs, getContrastRatio } from '../utils/color'
import { ErrorIcon, SuccessIcon } from './icons'
import { config } from 'virtual:panda'
import { TokenDictionary } from '@pandacss/token-dictionary'
import { panda, HStack, VStack, Stack } from '../../design-system/jsx'
import { TokenGroup } from './token-group'
import { TokenContent } from './token-content'

export function ColorContrastChecker() {
  const tokenDictionary = new TokenDictionary(config)
  const tokens = Object.fromEntries(tokenDictionary.categoryMap)

  const { colors: colorsMap } = tokens
  const values = Array.from(colorsMap.values())

  const colors = values
    .filter((color) => !color.isConditional && !color.extensions.isVirtual)
    .map((color) => ({
      label: color.extensions.prop,
      value: color.value,
    }))

  const [foreground, setForeGround] = useState('#000000')
  const [background, setBackground] = useState('#ffffff')

  const activeForeground = (colors.find((col) => col.label === foreground)?.value || foreground) as string
  const activeBackground = (colors.find((col) => col.label === background)?.value || background) as string

  const wcag = getContrastPairs(activeForeground, activeBackground)
  const constrastRatio = getContrastRatio(activeForeground, activeBackground)

  const renderTestScore = (score: { WCAG_AA: boolean; WCAG_AAA: boolean }, size: 'regular' | 'large') => {
    return (
      <>
        <HStack justify="space-between" fontWeight="medium">
          <HStack gap="2">
            <span>{score.WCAG_AA ? <SuccessIcon /> : <ErrorIcon />}</span>
            <span>AA</span>
          </HStack>
          <span>{size === 'regular' ? '4.5:1' : '3:1'}</span>
        </HStack>
        <HStack justify="space-between" fontWeight="medium">
          <HStack gap="2">
            <span>{score.WCAG_AAA ? <SuccessIcon /> : <ErrorIcon />}</span>
            <span>AAA</span>
          </HStack>
          <span>{size === 'regular' ? '7:1' : '4.5:1'}</span>
        </HStack>
      </>
    )
  }

  return (
    <TokenGroup>
      <TokenContent>
        <HStack gap="3" padding="2">
          <panda.div
            display="flex"
            flexDirection="column"
            borderSlim="card"
            flex="1"
            paddingTop="16"
            style={{ background: activeForeground }}
          >
            <select value={foreground} onChange={(e: any) => setForeGround(e.currentTarget.value)}>
              {colors.map((color) => (
                <option key={color.label} value={color.label}>
                  {color.label}
                </option>
              ))}
            </select>
          </panda.div>
          <panda.div
            display="flex"
            flexDirection="column"
            borderSlim="card"
            flex="1"
            paddingTop="16"
            style={{ background: activeBackground }}
          >
            <select value={background} onChange={(e: any) => setBackground(e.currentTarget.value)}>
              {colors.map((color) => (
                <option key={color.label} value={color.label}>
                  {color.label}
                </option>
              ))}
            </select>
          </panda.div>
        </HStack>

        <HStack
          justify="center"
          fontWeight="semibold"
          fontSize="2xl"
          padding="2"
          outline="none"
          borderSlim="card"
          suppressContentEditableWarning
          contentEditable
          style={{ background: activeBackground, color: activeForeground }}
        >
          example text showing contrast
        </HStack>

        <div>
          <VStack textAlign="center" gap="2.5">
            <panda.span fontWeight="bold" fontSize="4xl">
              {constrastRatio ? `${constrastRatio?.toFixed(2).replace(/[.,]00$/, '')}:1` : ':'}
            </panda.span>
            <panda.span fontWeight="semibold" opacity="0.5">
              Contrast ratio
            </panda.span>
          </VStack>
          {wcag && (
            <panda.div display="flex" gap="5" marginTop="10">
              <Stack flex="1" gap="4">
                <panda.span fontWeight="semibold">Normal Text</panda.span>
                {renderTestScore(wcag[0], 'regular')}
              </Stack>
              <Stack flex="1" gap="4">
                <panda.span fontWeight="semibold">Large Text</panda.span>
                {renderTestScore(wcag[1], 'large')}
              </Stack>
            </panda.div>
          )}
        </div>
      </TokenContent>
    </TokenGroup>
  )
}
