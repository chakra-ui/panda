import { expect, test } from 'vitest'
import { createProject, createTransformProject } from './test-utils'

const source = `import { css } from '@panda/css';
import { Box } from '@panda/jsx';

# Badge

\`\`\`jsx
<Box color="orange" />
{css({ color: 'pink' })}
\`\`\`

<Box color="red"><span className={css({ color: 'blue' })}>solid</span></Box>
`

test('native extraction reads live MDX styles and skips code examples', () => {
  const compiler = createProject()
  const extracted = compiler.extractFileSource('badge.mdx', source)
  expect(extracted.diagnostics).toEqual([])
  expect(extracted.calls.map((call) => call.data)).toEqual([[{ kind: 'value', value: { color: 'blue' } }]])
  expect(extracted.jsx.map((jsx) => jsx.data)).toEqual([{ color: 'red' }])
})

test('MDX source rewriting stays disabled while extraction is experimental', () => {
  const compiler = createTransformProject()
  const result = compiler.transformSource({ path: 'badge.mdx', source })
  expect(result.code).toBe(source)
  expect(result.changed).toBe(false)
  expect(result.bailed).toBe(true)
})

test('native MDX handles a BOM and keeps JSX after an invalid reference definition', () => {
  const compiler = createProject()
  const extracted = compiler.extractFileSource(
    'references.mdx',
    `\uFEFFimport { css } from '@panda/css';
import { Box } from '@panda/jsx';

[text]: /asset.png <Box color="red" />

{css({ color: 'blue' })}`,
  )
  expect(extracted.diagnostics).toEqual([])
  expect(extracted.calls.map((call) => call.data)).toEqual([[{ kind: 'value', value: { color: 'blue' } }]])
  expect(extracted.jsx.map((jsx) => jsx.data)).toEqual([{ color: 'red' }])
})
