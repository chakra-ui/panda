/* eslint-disable @typescript-eslint/naming-convention */
import { box, type BoxNode } from './type-factory'

export type BoxTraversalControl = {
  /**
   * Stops traversal.
   */
  stop(): void
  /**
   * Skips traversal of the current node's descendants.
   */
  skip(): void
  /**
   * Skips traversal of the current node, siblings, and all their descendants.
   */
  up(): void
}

/**
 *
 * @see adapted from https://github.com/dsherret/ts-morph/blob/latest/packages/ts-morph/src/compiler/ast/common/Node.ts#L692
 */

export const visitBoxNode = <T>(
  maybeBox: BoxNode,
  cbNode: (
    node: BoxNode,
    key: string | number | null,
    parent: BoxNode | null,
    traversal: BoxTraversalControl,
  ) => T | undefined,
  cbNodeArray?: (
    nodes: BoxNode[],
    key: string | number | null,
    parent: BoxNode | null,
    traversal: BoxTraversalControl,
  ) => T | undefined,
): T | undefined => {
  const stopReturnValue: any = {}
  const upReturnValue: any = {}

  // let visitedCount = 0;
  let stop = false
  let up = false
  const traversal = { stop: () => (stop = true), up: () => (up = true) }

  const nodeCallback: (node: BoxNode, key: string | number | null, parent: BoxNode | null) => T | undefined = (
    node: BoxNode,
    key: string | number | null,
    parent: BoxNode | null,
  ) => {
    // logger({ type: node.type, kind: node.getNode().getKindName() });
    if (stop) return stopReturnValue

    let skip = false
    const returnValue = cbNode(node, key, parent, Object.assign({}, traversal, { skip: () => (skip = true) }))

    if (returnValue) return returnValue
    if (stop) return stopReturnValue
    if (skip || up) return

    return forEachChildForNode(node, key, parent)
  }

  const arrayCallback:
    | ((nodes: BoxNode[], key: string | number | null, parent: BoxNode | null) => T | undefined)
    | undefined =
    cbNodeArray == null
      ? undefined
      : (nodes: BoxNode[], key: string | number | null, parent: BoxNode | null) => {
          //   logger({ list: true, stop });
          if (stop) return stopReturnValue

          let skip = false

          const returnValue = cbNodeArray(
            nodes,
            key,
            parent,
            Object.assign({}, traversal, { skip: () => (skip = true) }),
          )

          if (returnValue) return returnValue

          if (skip) return

          for (const node of nodes) {
            if (stop) return stopReturnValue
            if (up) return

            const innerReturnValue = forEachChildForNode(node, key, parent)
            if (innerReturnValue) return innerReturnValue
          }
        }

  const finalResult = forEachChildForNode(maybeBox, null, null)
  return finalResult === stopReturnValue ? undefined : finalResult

  function getResult(innerNode: BoxNode | BoxNode[], key: string | number | null, parent: BoxNode | null) {
    let returnValue: T | undefined | Array<T | undefined>
    if (Array.isArray(innerNode)) {
      returnValue = arrayCallback
        ? arrayCallback(innerNode, key, parent)
        : innerNode.map((n) => nodeCallback(n, key, parent))
    } else {
      returnValue = nodeCallback(innerNode, key, parent)
    }

    if (up) {
      up = false
      return returnValue ?? upReturnValue
    }

    return returnValue
  }

  function forEachChildForNode(node: BoxNode, key: string | number | null, parent: BoxNode | null): T | undefined {
    // visitedCount++;
    // logger({ visitedCount, type: node.type, kind: node.getNode().getKindName() });
    if (box.isMap(node)) {
      let result: T | undefined

      for (const [key, innerNode] of node.value) {
        if (stop) return stopReturnValue
        if (up) return upReturnValue

        const current = getResult(innerNode, key, node)
        if (current) result = current
      }

      return result === upReturnValue ? undefined : result
    }

    if (box.isList(node)) {
      let result: T | undefined

      for (let index = 0; index < node.value.length; index++) {
        if (stop) return stopReturnValue
        if (up) return upReturnValue

        const current = getResult(node.value[index]!, index, node)
        if (current) result = current
      }

      return result === upReturnValue ? undefined : result
    }

    if (box.isConditional(node)) {
      const result = getResult(node.whenTrue, 'whenTrue', node) || getResult(node.whenFalse, 'whenFalse', node)
      return result === upReturnValue ? undefined : result
    }

    return getResult(node, key, parent)
  }
}
