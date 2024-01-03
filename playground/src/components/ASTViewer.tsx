import { css, cva } from '@/styled-system/css'
import { Stack, panda } from '@/styled-system/jsx'
import { hstack } from '@/styled-system/patterns'
import type { ResultItem } from '@pandacss/types'
import { useTheme } from 'next-themes'
import { usePanda } from '../hooks/usePanda'

import dynamic from 'next/dynamic'

const ResultItemRowJson = dynamic(() => import('./ASTViewer-row'))

export const ASTViewer = (props: { parserResult: ReturnType<typeof usePanda>['parserResult'] }) => {
  if (!props.parserResult) return null

  return (
    <Stack py="4" h="full" overflow="auto">
      {Array.from(props.parserResult.toArray()).map((result, index) => {
        return <ResultItemRow key={index} result={result} />
      })}
    </Stack>
  )
}

const resultType = cva({
  base: {
    py: '1',
    px: '2',
    borderRadius: 'lg',
    fontWeight: 'semibold',
    borderWidth: '1px',
  },
  variants: {
    type: {
      object: { bg: { base: 'gray.100', _dark: '#FFFFFF08' }, color: { base: 'gray.700', _dark: 'white' } },
      cva: { bg: { base: 'gray.300', _dark: '#FFFFFF12' }, color: { base: 'gray.700', _dark: 'white' } },
      sva: { bg: { base: 'gray.300', _dark: '#FFFFFF12' }, color: { base: 'gray.700', _dark: 'white' } },
      jsx: { bg: { base: 'blue.300', _dark: 'blue.500' } },
      'jsx-factory': { bg: { base: 'blue.100', _dark: 'blue.300' }, color: { _dark: 'black' } },
      pattern: { bg: { base: 'indigo.400', _dark: 'indigo.500' }, color: 'white' },
      'jsx-pattern': { bg: { base: 'indigo.400', _dark: 'indigo.500' }, color: 'white' },
      recipe: { bg: { base: 'yellow.300', _dark: 'yellow.500' }, color: { _dark: 'black' } },
      'jsx-recipe': { bg: { base: 'yellow.300', _dark: 'yellow.500' }, color: { _dark: 'black' } },
    },
    name: {
      cva: { bg: { base: 'teal.500', _dark: 'teal.700' }, color: 'white' },
      css: { bg: { base: 'blue.500', _dark: 'blue.700' }, color: 'white' },
    },
  },
})

const rowClassName = css({
  '&.json-viewer-theme-dark': {
    bg: 'transparent !important',
  },
  '& data-object-start, .data-object-end': {
    color: { _dark: 'white' },
  },
})

const ResultItemRow = (props: { result: ResultItem }) => {
  const { result } = props
  const { resolvedTheme } = useTheme()
  return (
    <Stack px="6">
      <panda.div className={hstack()}>
        <span className={resultType({ type: result.type })}>{result.type}</span>{' '}
        <span className={resultType({ name: result.name as 'cva' | 'css' })}>{result.name}</span>
        <panda.span ml="auto">(l{getReportRange(result)})</panda.span>
      </panda.div>
      <ResultItemRowJson theme={resolvedTheme} data={result.data} className={rowClassName} />
    </Stack>
  )
}

const getReportRange = (reportItem: ResultItem) => {
  if (!reportItem.box) return ''

  const node = reportItem.box.getNode()
  const src = node.getSourceFile()

  const startPosition = node.getStart()
  const startInfo = src.getLineAndColumnAtPos(startPosition)

  return `:${startInfo.line}:${startInfo.column}`
}
