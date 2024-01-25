import * as React from 'react'
import { HStack } from '../../styled-system/jsx'
import { ErrorIcon, SuccessIcon } from './icons'

interface TestScore {
  WCAG_AA: boolean
  WCAG_AAA: boolean
}

interface TestScoreProps {
  score: TestScore
  size: 'regular' | 'large'
}

export function TestScore(props: TestScoreProps) {
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
