import type { AddError } from '../types'

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
      const current = stack.pop()!
      const value = valueAtPath.get(current)

      if (!value) {
        addError('tokens', `Missing token: \`${current}\` used in \`config.semanticTokens.${path}\``)
      }

      const deps = refsByPath.get(current)
      if (!deps) continue

      for (const transitiveDep of deps) {
        if (path === transitiveDep) {
          addError('tokens', `Circular token reference: \`${transitiveDep}\` -> \`${current}\` -> ... -> \`${path}\``)
          break
        }

        stack.push(transitiveDep)
      }
    }
  })
}
