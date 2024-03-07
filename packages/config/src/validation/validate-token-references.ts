import type { AddError } from '../types'
import { isTokenReference } from './utils'

export const validateTokenReferences = (
  valueAtPath: Map<string, any>,
  refsByPath: Map<string, Set<string>>,
  addError: AddError,
) => {
  refsByPath.forEach((refs, path) => {
    if (refs.has(path)) {
      addError('tokens', `Self token reference: \`${path}\``)
    }

    const stack = [path]

    while (stack.length > 0) {
      let currentPath = stack.pop()!
      if (currentPath.includes('/')) {
        const [tokenPath] = currentPath.split('/')
        currentPath = tokenPath
      }

      const value = valueAtPath.get(currentPath)

      if (!value) {
        addError('tokens', `Missing token: \`${currentPath}\` used in \`config.semanticTokens.${path}\``)
      }

      if (isTokenReference(value) && !refsByPath.has(value)) {
        addError('tokens', `Unknown token reference: \`${currentPath}\` used in \`${value}\``)
      }

      const deps = refsByPath.get(currentPath)
      if (!deps) continue

      for (const transitiveDep of deps) {
        if (path === transitiveDep) {
          addError(
            'tokens',
            `Circular token reference: \`${transitiveDep}\` -> \`${currentPath}\` -> ... -> \`${path}\``,
          )
          break
        }

        stack.push(transitiveDep)
      }
    }
  })
}
