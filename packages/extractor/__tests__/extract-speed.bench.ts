import { bench } from 'vitest'
import { createProject, getTestExtract, type TestExtractOptions } from './create-project'
// @ts-ignore
import { default as BigThemeSampleInlined } from './samples/BigThemeSampleInlined?raw'

const project = createProject()
const getExtract = (code: string, options: TestExtractOptions) => getTestExtract(project, code, options)

// pnpm vitest bench extract-speed --reporter=json  --outputFile=./file.json
bench(
  'extract big theme',
  () => {
    getExtract(BigThemeSampleInlined, { functionNameList: ['defineProperties'] })
  },
  { iterations: 50 },
)
