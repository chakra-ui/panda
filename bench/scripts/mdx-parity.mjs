// Regenerate the extraction-boundary corpus with @mdx-js/mdx 3.1.1.
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
const root = process.cwd()
const installed = (await readdir(path.join(root, 'node_modules/.pnpm'))).find((name) =>
  name.startsWith('@mdx-js+mdx@3.1.1_'),
)
if (!installed) throw new Error('Install @mdx-js/mdx 3.1.1 to regenerate these fixtures')
const { createProcessor } = await import(
  pathToFileURL(path.join(root, 'node_modules/.pnpm', installed, 'node_modules/@mdx-js/mdx/index.js'))
)
const inputPath = process.argv[2] ?? 'crates/pandacss_sfc/tests/fixtures/mdx-inputs.json'
const outputPath = process.argv[3] ?? 'crates/pandacss_sfc/tests/fixtures/mdx-parity.json'
const input = JSON.parse(await readFile(inputPath, 'utf8'))
let skipped = 0
const output = []
for (const { name, source } of input) {
  // MDX drops a leading BOM; translate its parser offsets back to the authored document.
  const bomLength = source.startsWith('\uFEFF') ? 1 : 0
  let tree
  try {
    const parseSource = source
      .slice(bomLength)
      .replace(/^(?:---\r?\n[\s\S]*?\r?\n---|\+\+\+\r?\n[\s\S]*?\r?\n\+\+\+)(?:\r?\n|$)/, (match) =>
        match.replace(/[^\r\n]/g, ' '),
      )
    tree = createProcessor().parse(parseSource)
  } catch (error) {
    if (process.argv.includes('--allow-invalid')) {
      skipped++
      continue
    }
    throw new Error(`${name}: ${error}`, { cause: error })
  }
  const byte = (offset) => Buffer.byteLength(source.slice(0, offset + bomLength))
  const elements = []
  const calls = []
  const visitJs = (node) => {
    if (!node || typeof node !== 'object') return
    if (node.type === 'CallExpression') calls.push([byte(node.start), byte(node.end)])
    for (const [key, value] of Object.entries(node)) {
      if (['loc', 'range', 'position', 'comments'].includes(key)) continue
      if (Array.isArray(value)) value.forEach(visitJs)
      else if (value && typeof value === 'object') visitJs(value)
    }
  }
  const visit = (node) => {
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      if (node.name) elements.push({ name: node.name, start: byte(node.position.start.offset) })
      for (const attr of node.attributes) visitJs(attr.data?.estree ?? attr.value?.data?.estree)
    }
    visitJs(node.data?.estree)
    node.children?.forEach(visit)
  }
  visit(tree)
  calls.sort((a, b) => a[0] - b[0] || a[1] - b[1])
  output.push({ name, source, elements, calls })
}
await writeFile(outputPath, JSON.stringify({ parser: '@mdx-js/mdx@3.1.1', cases: output }, null, 2) + '\n')
console.log(`Recorded ${output.length} cases; skipped ${skipped} invalid inputs`)
