import { SourceFile } from 'ts-morph'
import { afterEach, bench, describe } from 'vitest'
import { getBoxLiteralValue } from '../src/get-box-literal-value'
import type { ExtractedFunctionResult } from '../src/types'
import { unbox } from '../src/unbox'
import { createProject, getTestExtract, type TestExtractOptions } from './create-project'
// @ts-expect-error
import { default as BigThemeSampleInlined } from './samples/BigThemeSampleInlined?raw'

const project = createProject()
const getExtract = (code: string, options: TestExtractOptions) => getTestExtract(project, code, options)

let sourceFile: SourceFile
afterEach(() => {
  if (!sourceFile) return

  if (sourceFile.wasForgotten()) return
  project.removeSourceFile(sourceFile)
})

describe('unbox', () => {
  bench('getBoxLiteralValue', () => {
    const extracted = getExtract(BigThemeSampleInlined, { functionNameList: ['defineProperties'] })
    const defineProperties = extracted.get('defineProperties')!
    const properties = (defineProperties as ExtractedFunctionResult).queryList[0].box
    const cache = new WeakMap()
    getBoxLiteralValue(properties, cache)
  })

  bench('unbox', () => {
    const extracted = getExtract(BigThemeSampleInlined, { functionNameList: ['defineProperties'] })
    const defineProperties = extracted.get('defineProperties')!
    const properties = (defineProperties as ExtractedFunctionResult).queryList[0].box
    const cache = new WeakMap()
    unbox(properties, cache)
  })
})
