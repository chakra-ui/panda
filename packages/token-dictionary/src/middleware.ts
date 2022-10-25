import type { TokenDictionary } from './dictionary'

export function addNegativeTokens(dictionary: TokenDictionary) {
  // add negative token to spacing tokens
  const tokens = dictionary.filter({
    extensions: { category: 'spacing' },
  })

  tokens.forEach((token) => {
    //
    const node = token.clone()
    node.setExtensions({ isNegative: true })

    modifyLast(node.path, (value) => `-${value}`)

    if (node.path) {
      node.name = node.path.join('.')
    }

    dictionary.allTokens.push(node)
  })
}

// replace last index of an array
function modifyLast<T>(value: T[] | undefined, fn: (last: T) => T) {
  if (!value) return []
  const last = value.at(-1)
  if (last != null) {
    value[value.length - 1] = fn(last)
  }
}
