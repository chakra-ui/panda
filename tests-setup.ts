import * as path from 'node:path'
import { Options, resolveConfig } from 'prettier'
import { Node } from 'ts-morph'
import { beforeAll, expect } from 'vitest'

let prettierConfig: Options | null
const pkgRoot = process.cwd()

beforeAll(async () => {
  prettierConfig = await resolveConfig(path.resolve(pkgRoot, '../'))
})

expect.addSnapshotSerializer({
  serialize(value) {
    return value.getKindName()
  },
  test(val) {
    return Node.isNode(val)
  },
})
