import { useState } from 'react'
import { HStack, Stack, VStack, panda } from '../../styled-system/jsx'
import { getContrastPairs, getContrastRatio } from '../lib/color'
import context from '../lib/panda.context'
import { ErrorIcon, SuccessIcon } from './icons'
import { TokenContent } from './token-content'
import { TokenGroup } from './token-group'

function TestScore(props: { score: { WCAG_AA: boolean; WCAG_AAA: boolean }; size: 'regular' | 'large' }) {
  const { score, size } = props
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

export function ColorContrastChecker() {
  const colorsMap = context.getCategory('colors')
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

  return (
    <TokenGroup>
      <TokenContent>
        <HStack gap="3" p="2">
          <panda.div
            display="flex"
            flexDirection="column"
            borderWidth="1px"
            borderColor="card"
            flex="1"
            pt="16"
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
            borderWidth="1px"
            borderColor="card"
            flex="1"
            pt="16"
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
          p="2"
          outline="none"
          borderWidth="1px"
          borderColor="card"
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
                <TestScore score={wcag[0]} size="regular" />
              </Stack>
              <Stack flex="1" gap="4">
                <panda.span fontWeight="semibold">Large Text</panda.span>
                <TestScore score={wcag[1]} size="large" />
              </Stack>
            </panda.div>
          )}
        </div>
      </TokenContent>
    </TokenGroup>
  )
}
