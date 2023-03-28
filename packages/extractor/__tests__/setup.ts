import * as path from 'node:path'
import { Options, resolveConfig } from 'prettier'
import { Node } from 'ts-morph'
import { beforeAll, expect } from 'vitest'
import { maybePretty } from './maybePretty'

let prettierConfig: Options | null
const pkgRoot = process.cwd()

beforeAll(async () => {
  prettierConfig = await resolveConfig(path.resolve(pkgRoot, '../'))
})

expect.addSnapshotSerializer({
  serialize(value, config, indentation, depth, refs, printer) {
    if (depth === 0) {
      const prefix = 'export const oui = '
      const prettyOutput = maybePretty(
        prefix +
          JSON.stringify(
            value,
            (_key, value) => {
              if (value instanceof Set) {
                return Array.from(value)
              }

              if (value instanceof Map) {
                return Object.fromEntries(value)
              }

              if (Node.isNode(value)) {
                return value.getKindName()
              }

              return value
            },
            4,
          ),
        {
          ...prettierConfig,
          semi: false,
        },
      )
      return prettyOutput.slice(prefix.length)
    }

    return printer(value, config, indentation, depth, refs)
  },
  test(val) {
    return Array.isArray(val) || isObject(val)
  },
})

/** Returns true if typeof value is object && not null */
const isObject = (value: any): value is object => value !== null && typeof value === 'object'
