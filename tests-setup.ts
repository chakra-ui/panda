import { Node } from 'ts-morph'
import { expect } from 'vitest'

expect.addSnapshotSerializer({
  serialize(value) {
    return value.getKindName()
  },
  test(val) {
    return Node.isNode(val)
  },
})
