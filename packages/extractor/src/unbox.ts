import type { BoxNode, LiteralValue } from './type-factory'
import { visitBoxNode } from './visitBoxNode'
import { cacheMap } from './getBoxLiteralValue'

export const unbox = (rootNode: BoxNode | undefined, localCacheMap: WeakMap<BoxNode, unknown> = cacheMap) => {
  if (!rootNode) return
  if (rootNode.isObject() || rootNode.isLiteral()) return rootNode.value
  if (!rootNode.isMap() && !rootNode.isList()) return

  const reconstructed = rootNode.isMap() ? {} : []
  const pathByNode = new WeakMap<BoxNode, string[]>()
  let parent = reconstructed as any
  let prevParent = null as any

  // TODO return infos like: has circular ? has unresolvable ? has conditional ? has empty initializer ?
  visitBoxNode(rootNode, (node, key, parentNode, traversal) => {
    if (node.isConditional()) {
      traversal.skip()
      return
    }

    if (localCacheMap.has(node)) {
      if (parentNode) {
        const parentPath = pathByNode.get(parentNode) ?? []
        prevParent = parentNode
        parent = parentPath.reduce((o, i) => (o as any)[i], reconstructed)

        parent[key!] = localCacheMap.get(node)
      }

      traversal.skip()
      return
    }

    let current: LiteralValue
    if (node.isObject()) {
      current = node.value
      traversal.skip()
    } else if (node.isMap()) {
      current = {}
    } else if (node.isList()) {
      current = []
    } else if (node.isLiteral()) {
      current = node.value
    } else if (node.isEmptyInitializer()) {
      current = true
    } else if (node.isUnresolvable()) {
      current = undefined
    }

    if (parentNode && parentNode !== prevParent) {
      const parentPath = pathByNode.get(parentNode) ?? []
      prevParent = parentNode
      parent = parentPath.reduce((o, i) => (o as any)[i], reconstructed)
    }

    parent[key!] = current
    if (parentNode && !pathByNode.has(node)) {
      const parentPath = pathByNode.get(parentNode) ?? []
      pathByNode.set(node, [...parentPath, key as string])
      // console.log({ parentPath });
    }

    localCacheMap.set(node, current)
  })
  return reconstructed
}
