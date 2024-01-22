import { Node } from 'ts-morph'
import { expect, afterAll } from 'vitest'
import { RuleTester } from '@typescript-eslint/rule-tester'

RuleTester.afterAll = afterAll

expect.addSnapshotSerializer({
  serialize(value) {
    return value.getKindName()
  },
  test(val) {
    return Node.isNode(val)
  },
})
