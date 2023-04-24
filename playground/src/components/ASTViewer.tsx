import { cva } from '@/styled-system/css'
import { Stack, panda } from '@/styled-system/jsx'
import { hstack } from '@/styled-system/patterns'
import type { ResultItem } from '@pandacss/types'
import { JsonViewer } from '@textea/json-viewer'
import { usePanda } from './usePanda'

export const ASTViewer = (props: { parserResult: ReturnType<typeof usePanda>['parserResult'] }) => {
  if (!props.parserResult) return null

  return (
    <Stack p="4" h="full" overflow="auto">
      {Array.from(props.parserResult.getAll()).map((result, index) => {
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
    border: '1px solid token(colors.gray.300)',
  },
  variants: {
    type: {
      object: { bg: 'gray.100' },
      cva: { bg: 'gray.300' },
      jsx: { bg: 'blue.300' },
      'jsx-factory': { bg: 'blue.100' },
      pattern: { bg: 'indigo.400', color: 'white' },
      'jsx-pattern': { bg: 'indigo.400', color: 'white' },
      recipe: { bg: 'yellow.300' },
      'jsx-recipe': { bg: 'yellow.300' },
    },
    name: {
      cva: { bg: 'teal.500', color: 'white' },
      css: { bg: 'blue.500', color: 'white' },
    },
  },
})

const ResultItemRow = (props: { result: ResultItem }) => {
  const { result } = props
  return (
    <Stack>
      <panda.div className={hstack()}>
        <span className={resultType({ type: result.type })}>{result.type}</span>{' '}
        <span className={resultType({ name: result.name as 'cva' | 'css' })}>{result.name}</span>
        <panda.span ml="auto">(l{getReportRange(result)})</panda.span>
      </panda.div>
      <JsonViewer value={unwrapArray(result.data)} />
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

function unwrapArray<T>(array: T[]): T | T[] {
  if (array.length === 1) {
    return array[0]!
  }

  return array
}
