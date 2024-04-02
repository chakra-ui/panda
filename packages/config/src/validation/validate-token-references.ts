import type { AddError } from '../types'
import { isTokenReference } from './utils'

interface Props {
  valueAtPath: Map<string, any>
  refsByPath: Map<string, Set<string>>
  typeByPath: Map<string, 'tokens' | 'semanticTokens'>
  addError: AddError
}

export const validateTokenReferences = (props: Props) => {
  const { valueAtPath, refsByPath, addError, typeByPath } = props

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
        const configKey = typeByPath.get(path)
        addError('tokens', `Missing token: \`${currentPath}\` used in \`theme.${configKey}.${path}\``)
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
