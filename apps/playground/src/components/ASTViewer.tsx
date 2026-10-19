import { css, cva } from '@/styled-system/css'
import { Stack, panda } from '@/styled-system/jsx'
import { hstack } from '@/styled-system/patterns'
import type { ExtractedCall, ExtractedJsx } from '@pandacss/compiler-wasm/web'
import * as React from 'react'
import { usePanda } from '../hooks/usePanda'

type ResultType = 'css' | 'cva' | 'sva' | 'pattern' | 'recipe' | 'token' | 'jsx' | 'jsx-factory' | 'jsx-pattern' | 'jsx-recipe'

type Row =
  | { kind: 'call'; item: ExtractedCall }
  | { kind: 'jsx'; item: ExtractedJsx }

export const ASTViewer = React.memo(function ASTViewer(props: {
  parserResult: ReturnType<typeof usePanda>['parserResult']
}) {
  const result = props.parserResult
  if (!result) return null

  const rows: Row[] = [
    ...result.calls.map((item) => ({ kind: 'call', item }) as const),
    ...result.jsx.map((item) => ({ kind: 'jsx', item }) as const),
  ]
  if (!rows.length) return null

  return (
    <Stack py="4" h="full" overflow="auto">
      {rows.map((row, index) => (
        <ResultItemRow key={index} row={row} type={resolveType(row)} />
      ))}
    </Stack>
  )
})

// The extractor reports the call `name` (css/cva/sva) and the jsx `kind`
// (factory/pattern/recipe/component) directly — no config cross-referencing.
function resolveType(row: Row): ResultType {
  if (row.kind === 'call') {
    const { category, name } = row.item
    if (name === 'cva' || name === 'sva') return name
    if (category === 'tokens') return 'token'
    if (category === 'pattern' || category === 'recipe') return category
    return 'css'
  }
  return row.item.kind === 'component' ? 'jsx' : `jsx-${row.item.kind}`
}

const resultType = cva({
  base: { py: '1', px: '2', borderRadius: 'lg', fontWeight: 'semibold', borderWidth: '1px' },
  variants: {
    type: {
      css: { bg: { base: 'gray.100', _dark: '#FFFFFF08' }, color: { base: 'gray.700', _dark: 'white' } },
      cva: { bg: { base: 'teal.300', _dark: 'teal.600' }, color: 'white' },
      sva: { bg: { base: 'teal.400', _dark: 'teal.700' }, color: 'white' },
      pattern: { bg: { base: 'indigo.400', _dark: 'indigo.500' }, color: 'white' },
      recipe: { bg: { base: 'yellow.300', _dark: 'yellow.500' }, color: { _dark: 'black' } },
      token: { bg: { base: 'green.300', _dark: 'green.500' }, color: { _dark: 'black' } },
      jsx: { bg: { base: 'blue.300', _dark: 'blue.500' }, color: { _dark: 'white' } },
      'jsx-factory': { bg: { base: 'blue.100', _dark: 'blue.300' }, color: { _dark: 'black' } },
      'jsx-pattern': { bg: { base: 'indigo.300', _dark: 'indigo.400' }, color: 'white' },
      'jsx-recipe': { bg: { base: 'yellow.200', _dark: 'yellow.400' }, color: { _dark: 'black' } },
    },
  },
})

const ResultItemRow = (props: { row: Row; type: ResultType }) => {
  const { row, type } = props
  const { name } = row.item
  const data = row.kind === 'call' ? unwrap(row.item.data) : row.item.data

  return (
    <Stack px="6">
      <panda.div className={hstack()}>
        <span className={resultType({ type })}>{type}</span>
        <span className={css({ fontWeight: 'semibold' })}>{name}</span>
      </panda.div>
      <panda.pre
        fontSize="xs"
        fontFamily="mono"
        whiteSpace="pre-wrap"
        overflowX="auto"
        color={{ base: 'gray.700', _dark: 'gray.300' }}
      >
        {JSON.stringify(data, null, 2)}
      </panda.pre>
    </Stack>
  )
}

function unwrap(data: unknown[]): unknown {
  return data.length === 1 ? data[0] : data
}
