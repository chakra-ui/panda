import { traverse } from '@pandacss/shared'
import type { Config } from '@pandacss/types'
import type { AddError, TokensData } from '../types'
import { getFinalPaths } from './get-final-paths'
import { validateTokenReferences } from './validate-token-references'
import { validateTokenPath } from './validate-token-path'

interface Options {
  config: Config
  tokens: TokensData
  addError: AddError
}

export const validateTokens = (options: Options) => {
  const {
    config: { theme },
    tokens,
    addError,
  } = options

  if (!theme) return

  const { tokenNames, semanticTokenNames, valueAtPath, refsByPath } = tokens

  if (theme.tokens) {
    traverse(theme.tokens, (node) => {
      if (node.depth >= 1) {
        tokenNames.add(node.path)
        valueAtPath.set(node.path, node.value)
      }
    })

    const finalPaths = getFinalPaths(tokenNames)

    finalPaths.forEach((path) => {
      validateTokenPath(path, valueAtPath, addError, 'primitive')

      const atPath = valueAtPath.get(path)
      if (typeof atPath === 'string' && atPath.startsWith('{')) {
        refsByPath.set(path, new Set([]))
      }
    })
  }

  if (theme.semanticTokens) {
    traverse(theme.semanticTokens, (node) => {
      if (node.depth >= 1) {
        semanticTokenNames.add(node.path)
        valueAtPath.set(node.path, node.value)

        // Keep track of all token references
        if (typeof node.value === 'string' && node.value.startsWith('{') && node.path.includes('value')) {
          const tokenPath = node.path.split('.value')[0]
          if (!refsByPath.has(tokenPath)) {
            refsByPath.set(tokenPath, new Set())
          }

          const values = refsByPath.get(tokenPath)!
          const tokenRef = node.value.slice(1, -1)
          values.add(tokenRef)
        }
      }
    })

    const finalPaths = getFinalPaths(semanticTokenNames)

    finalPaths.forEach((path) => {
      validateTokenPath(path, valueAtPath, addError, 'semantic')
    })

    validateTokenReferences(valueAtPath, refsByPath, addError)
  }
}
