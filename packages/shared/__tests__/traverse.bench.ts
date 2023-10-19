import { bench, describe } from 'vitest'
import { traverse, walkObject } from '../src'

type CallbackFn = (key: string, value: any, path: string, depth: number) => void

const isObjectOrArray = (obj: unknown) => typeof obj === 'object' && obj !== null
const defaultOptions = { separator: '.', maxDepth: Infinity }

const obj = {
  base: 1,
  sm: { _hover: 2, truncate: true },
  _dark: {
    _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
    base: 3,
    md: 4,
    lg: { base: 5, _hover: 6 },
    _focus: [7, undefined, null, 8, 9],
  },
  obj: {
    base: 1,
    sm: { _hover: 2, truncate: true },
    _dark: {
      _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
      base: 3,
      md: 4,
      lg: { base: 5, _hover: 6 },
      _focus: [7, undefined, null, 8, 9],
    },
    obj: {
      base: 1,
      sm: { _hover: 2, truncate: true },
      _dark: {
        _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
        base: 3,
        md: 4,
        lg: { base: 5, _hover: 6 },
        _focus: [7, undefined, null, 8, 9],
      },
      obj: {
        base: 1,
        sm: { _hover: 2, truncate: true },
        _dark: {
          _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
          base: 3,
          md: 4,
          lg: { base: 5, _hover: 6 },
          _focus: [7, undefined, null, 8, 9],
        },
        obj: {
          base: 1,
          sm: { _hover: 2, truncate: true },
          _dark: {
            _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
            base: 3,
            md: 4,
            lg: { base: 5, _hover: 6 },
            _focus: [7, undefined, null, 8, 9],
          },
          obj: {
            base: 1,
            sm: { _hover: 2, truncate: true },
            _dark: {
              _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
              base: 3,
              md: 4,
              lg: { base: 5, _hover: 6 },
              _focus: [7, undefined, null, 8, 9],
            },
            obj: {
              base: 1,
              sm: { _hover: 2, truncate: true },
              _dark: {
                _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
                base: 3,
                md: 4,
                lg: { base: 5, _hover: 6 },
                _focus: [7, undefined, null, 8, 9],
              },
              obj: {
                base: 1,
                sm: { _hover: 2, truncate: true },
                _dark: {
                  _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
                  base: 3,
                  md: 4,
                  lg: { base: 5, _hover: 6 },
                  _focus: [7, undefined, null, 8, 9],
                },
                obj: {
                  base: 1,
                  sm: { _hover: 2, truncate: true },
                  _dark: {
                    _disabled: { _open: { base: 11, xl: { _loading: 13, base: 12 } }, base: 10 },
                    base: 3,
                    md: 4,
                    lg: { base: 5, _hover: 6 },
                    _focus: [7, undefined, null, 8, 9],
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}
const callback = () => {}

describe('traverse', () => {
  bench(
    'traverse from src',
    () => {
      traverse(obj, callback)
    },
    { iterations: 100 },
  )

  bench(
    'walkObj from src',
    () => {
      walkObject(obj, callback)
    },
    { iterations: 100 },
  )

  bench(
    'traverse with recursion',
    () => {
      traverse1(obj, callback)
    },
    { iterations: 100 },
  )

  bench(
    'traverse 2 - simple stack with while loop',
    () => {
      traverse2(obj, callback)
    },
    { iterations: 100 },
  )

  bench(
    'traverse 3 - stack + queue',
    () => {
      traverse3(obj, callback)
    },
    { iterations: 100 },
  )

  bench(
    'traverse 4 - reversed stack',
    () => {
      traverse4(obj, callback)
    },
    { iterations: 100 },
  )

  bench(
    'traverse 5',
    () => {
      traverse5(obj, callback)
    },
    { iterations: 100 },
  )
})

function traverse1(
  obj: any,
  callback: CallbackFn,
  options: { separator: string; maxDepth?: number } = defaultOptions,
  path = '',
  depth: number = 0,
): void {
  const maxDepth = options.maxDepth ?? defaultOptions.maxDepth
  const separator = options.separator ?? defaultOptions.separator

  // Check if the passed argument is an object or an array, and if the maximum depth has been reached
  if (depth > maxDepth || obj === null || typeof obj !== 'object') {
    return
  }

  const keys = Object.keys(obj)

  for (let i = 0, len = keys.length; i < len; i++) {
    const key = keys[i]
    const value = obj[key]
    const isObj = isObjectOrArray(value)
    const newPath = path ? `${path}${separator}${key}` : key

    callback(key, value, newPath, depth)

    // If the value is also an object or array, recurse into it
    if (isObj) {
      traverse1(value, callback, options, newPath, depth + 1)
    }
  }
}

function traverse2(
  obj: any,
  callback: CallbackFn,
  options: { separator: string; maxDepth?: number } = defaultOptions,
): void {
  const maxDepth = options.maxDepth ?? defaultOptions.maxDepth
  const separator = options.separator ?? defaultOptions.separator

  type StackItem = { value: any; path: string; depth: number }
  const stack: StackItem[] = [{ value: obj, path: '', depth: 0 }]

  while (stack.length > 0) {
    const { value, path, depth } = stack.pop()!

    if (depth > maxDepth || value === null || typeof value !== 'object') {
      continue
    }

    const keys = Object.keys(value)

    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i]
      const childValue = value[key]
      const isObj = isObjectOrArray(childValue)
      const newPath = path ? `${path}${separator}${key}` : key

      callback(key, childValue, newPath, depth)

      // If the childValue is also an object or array, push it to the stack
      if (isObj) {
        stack.push({ value: childValue, path: newPath, depth: depth + 1 })
      }
    }
  }
}

function traverse3(
  obj: any,
  callback: CallbackFn,
  options: { separator: string; maxDepth?: number } = defaultOptions,
): void {
  const maxDepth = options.maxDepth ?? defaultOptions.maxDepth
  const separator = options.separator ?? defaultOptions.separator

  type QueueItem = { value: any; path: string; depth: number; parent: any; key: string }
  const queue: QueueItem[] = [{ value: obj, path: '', depth: -1, parent: null, key: '' }]

  while (queue.length > 0) {
    const { value, path, depth, parent, key } = queue.shift()!

    if (depth <= maxDepth && typeof value === 'object' && value !== null) {
      const keys = Object.keys(value)
      const children: QueueItem[] = []

      for (let i = 0; i < keys.length; i++) {
        const childKey = keys[i]
        const childValue = value[childKey]
        const newPath = path ? `${path}${separator}${childKey}` : childKey
        children.push({ value: childValue, path: newPath, depth: depth + 1, parent: value, key: childKey })
      }

      // Push children to the front of the queue to maintain order
      queue.unshift(...children)
    }

    // Call the callback after processing children
    if (parent !== null) {
      callback(key, value, path, depth)
    }
  }
}

function traverse4(
  obj: any,
  callback: CallbackFn,
  options: { separator: string; maxDepth?: number } = defaultOptions,
): void {
  const maxDepth = options.maxDepth ?? defaultOptions.maxDepth
  const separator = options.separator ?? defaultOptions.separator

  type StackItem = { value: any; path: string; depth: number; parent: any; key: string }
  const stack: StackItem[] = [{ value: obj, path: '', depth: 0, parent: null, key: '' }]

  while (stack.length > 0) {
    const { value, path, depth, parent, key } = stack.pop()!

    if (parent !== null) {
      callback(key, value, path, depth)
    }

    if (depth < maxDepth && value && (value.constructor === Object || Array.isArray(value))) {
      const keys = Object.keys(value).reverse() // Reverse to maintain order since we're using a stack
      for (const childKey of keys) {
        const childValue = value[childKey]
        const newPath = path ? `${path}${separator}${childKey}` : childKey
        stack.push({ value: childValue, path: newPath, depth: depth + 1, parent: value, key: childKey })
      }
    }
  }
}

function traverse5(
  obj: any,
  callback: CallbackFn,
  options: { separator: string; maxDepth?: number } = defaultOptions,
): void {
  const maxDepth = options.maxDepth ?? defaultOptions.maxDepth
  const separator = options.separator ?? defaultOptions.separator

  type StackItem = { value: any; path: string; depth: number; parent: any; key: string }
  const stack: StackItem[] = [{ value: obj, path: '', depth: 0, parent: null, key: '' }]

  while (stack.length > 0) {
    const currentItem = stack.pop()!
    const { value, path, depth, parent, key } = currentItem

    // Call the callback function
    if (parent !== null) {
      callback(key, value, path, depth)
    }

    // If the value is an object or array and depth is within limits, push its properties to the stack
    if (depth < maxDepth && value && (value.constructor === Object || Array.isArray(value))) {
      const keys = Object.keys(value)
      for (let i = keys.length - 1; i >= 0; i--) {
        // Loop in reverse order
        const childKey = keys[i]
        if (value.hasOwnProperty(childKey)) {
          const childValue = value[childKey]
          const newPath = path ? path + separator + childKey : childKey
          stack.push({ value: childValue, path: newPath, depth: depth + 1, parent: value, key: childKey })
        }
      }
    }
  }
}
