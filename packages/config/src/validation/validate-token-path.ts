import type { AddError } from '../types'

type TokenType = 'primitive' | 'semantic'

export const validateTokenPath = (
  path: string,
  valueAtPath: Map<string, any>,
  addError: AddError,
  tokenType: TokenType,
) => {
  if (path.endsWith('value')) {
    return
  }

  // If token contains 'value' property recursively, it's valid
  const pathParts = path.split('.')
  for (let i = 0; i < pathParts.length - 1; i++) {
    const target = pathParts.toSpliced(-i).join('.')
    const targetValue = valueAtPath.get(target)

    if (targetValue && typeof targetValue === 'object' && Object.hasOwn(targetValue, 'value')) {
      return
    }
  }

  addError('tokens', `Token must contain 'value': \`${getTokenPath(path, tokenType)}\``)
}

const tokenBasePath = {
  primitive: 'theme.tokens',
  semantic: 'theme.semanticTokens',
} satisfies Record<TokenType, string>

const getTokenPath = (path: string, tokenType: TokenType) => {
  const basePath = tokenBasePath[tokenType]
  return `${basePath}.${path}`
}
