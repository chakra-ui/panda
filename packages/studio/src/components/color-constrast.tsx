import * as React from 'react'
import { HStack, Stack, VStack, panda } from '../../styled-system/jsx'
import { getContrastPairs, getContrastRatio } from '../lib/color'
import * as context from '../lib/panda-context'
import { Select } from './input'
import { TestScore } from './test-score'
import { TokenContent } from './token-content'
import { TokenGroup } from './token-group'

interface ColorSelectProps {
  title: string
  value: string
  colors: {
    label: string
    value: string
  }[]
  onChange: (value: string) => void
}

function ColorSelect(props: ColorSelectProps) {
  const { title, colors, onChange, value } = props
  return (
    <Stack flex="1">
      <panda.span fontWeight="semibold">{title}</panda.span>
      <panda.div
        display="flex"
        flexDirection="column"
        borderWidth="1px"
        borderColor="card"
        pt="16"
        style={{ background: value }}
      />
      <Select value={value} onChange={(e) => onChange(e.currentTarget.value)}>
        {colors.map((color) => (
          <option key={color.label} value={color.label}>
            {color.label}
          </option>
        ))}
      </Select>
    </Stack>
  )
}

export default function ColorContrastChecker() {
  const colors = context.colors

  const [foreground, setForeGround] = React.useState('#000000')
  const [background, setBackground] = React.useState('#ffffff')

  const activeForeground = (colors.find((col) => col.label === foreground)?.value || foreground) as string
  const activeBackground = (colors.find((col) => col.label === background)?.value || background) as string

  const wcag = getContrastPairs(activeForeground, activeBackground)
  const constrastRatio = getContrastRatio(activeForeground, activeBackground)

  return (
    <TokenGroup>
      <TokenContent>
        <HStack gap="3" p="2">
          <ColorSelect title="Background" value={activeBackground} onChange={setBackground} colors={colors} />
          <ColorSelect title="Foreground" value={activeForeground} onChange={setForeGround} colors={colors} />
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
