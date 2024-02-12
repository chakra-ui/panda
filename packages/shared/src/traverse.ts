type CallbackFn = (args: CallbackItem) => void

interface CallbackItem {
  value: any
  path: string
  paths: string[]
  depth: number
  parent: any[] | Record<string, unknown>
  key: string
}

export const isObjectOrArray = (obj: unknown) => typeof obj === 'object' && obj !== null

const defaultOptions = {
  separator: '.',
  maxDepth: Infinity,
}

interface TraverseOptions {
  separator?: string
  maxDepth?: number
  stop?: (args: CallbackItem) => boolean
}

export function traverse(obj: any, callback: CallbackFn, options: TraverseOptions = defaultOptions): void {
  const maxDepth = options.maxDepth ?? defaultOptions.maxDepth
  const separator = options.separator ?? defaultOptions.separator

  const stack: CallbackItem[] = [{ value: obj, path: '', paths: [], depth: -1, parent: null as any, key: '' }]

  while (stack.length > 0) {
    const currentItem = stack.pop()!

    // Call the callback function
    if (currentItem.parent !== null) {
      callback(currentItem)
    }

    if (options.stop?.(currentItem)) {
      continue
    }

    // If the value is an object or array and depth is within limits, push its properties to the stack
    if (isObjectOrArray(currentItem.value) && currentItem.depth < maxDepth) {
      const keys = Object.keys(currentItem.value)
      for (let i = keys.length - 1; i >= 0; i--) {
        const key = keys[i]
        const value = currentItem.value[key]

        const path = currentItem.path ? currentItem.path + separator + key : key
        const paths = currentItem.paths.concat(key)

        stack.push({
          value,
          path,
          paths,
          depth: currentItem.depth + 1,
          parent: currentItem.value,
          key,
        })
      }
    }
  }
}
