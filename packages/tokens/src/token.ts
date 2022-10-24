import { cssVar, getNegativePath } from '@css-panda/shared'
import type { TokenCategory } from '@css-panda/types'
import { negate } from './calc'

type TokenDataOptions = {
  condition?: string
  path: string[]
  value: string
  description?: string
  negative?: boolean
  prefix?: string
}

export function createToken(data: TokenDataOptions) {
  const { condition = '', path, value, negative = false, prefix, description = '' } = data
  const [category, ...keys] = path

  const _var = cssVar(keys.join('-'), {
    prefix: [prefix, category].filter(Boolean).join('-'),
  })

  const keyPath = negative ? getNegativePath(keys) : keys
  const key = keyPath.join('.')

  return {
    semantic: !!condition,
    condition,
    category: category as TokenCategory,
    path: keyPath,
    key,
    prop: [category, key].filter(Boolean).join('.'),
    value: negative ? negate(value) : value,
    var: _var.var,
    varRef: negative ? negate(_var.ref) : _var.ref,
    negative,
    description,
  }
}

export type TokenData = ReturnType<typeof createToken>
