import { isObject, walkObject } from '@pandacss/shared'
import type { Config } from '@pandacss/types'
import type { AddError, TokensData } from '../types'
import { SEP, formatPath, getReferences, isTokenReference, isValidToken, serializeTokenValue } from './utils'
import { validateTokenReferences } from './validate-token-references'

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

  const { tokenNames, semanticTokenNames, valueAtPath, refsByPath, typeByPath } = tokens

  if (theme.tokens) {
    const tokenPaths = new Set<string>()

    walkObject(
      theme.tokens,
      (value, paths) => {
        const path = paths.join(SEP)

        tokenNames.add(path)
        tokenPaths.add(path)

        valueAtPath.set(path, value)

        if (path.includes('DEFAULT')) {
          valueAtPath.set(path.replace(SEP + 'DEFAULT', ''), value)
        }
      },
      {
        stop: isValidToken,
      },
    )

    tokenPaths.forEach((path) => {
      const itemValue = valueAtPath.get(path)
      const formattedPath = formatPath(path)
      typeByPath.set(formattedPath, 'tokens')

      if (!isValidToken(itemValue)) {
        addError('tokens', `Token must contain 'value': \`theme.tokens.${formattedPath}\``)
        return
      }

      if (path.includes(' ')) {
        addError('tokens', `Token key must not contain spaces: \`theme.tokens.${formattedPath}\``)
        return
      }

      const valueStr = serializeTokenValue(itemValue.value || itemValue)
      if (isTokenReference(valueStr)) {
        refsByPath.set(formattedPath, new Set([]))
      }

      const references = refsByPath.get(formattedPath)
      if (!references) return

      getReferences(valueStr).forEach((reference) => {
        references.add(reference)
      })
    })
  }

  if (theme.semanticTokens) {
    const tokenPaths = new Set<string>()

    walkObject(
      theme.semanticTokens,
      (value, paths) => {
        const path = paths.join(SEP)

        semanticTokenNames.add(path)
        valueAtPath.set(path, value)
        tokenPaths.add(path)

        if (path.includes('DEFAULT')) {
          valueAtPath.set(path.replace(SEP + 'DEFAULT', ''), value)
        }

        if (!isValidToken(value)) return

        walkObject(value, (itemValue, paths) => {
          const valuePath = paths.join(SEP)
          const formattedPath = formatPath(path)
          typeByPath.set(formattedPath, 'semanticTokens')
          const fullPath = formattedPath + '.' + paths.join(SEP)

          if (valuePath.includes('value' + SEP + 'value')) {
            addError('tokens', `You used \`value\` twice resulting in an invalid token \`theme.tokens.${fullPath}\``)
          }

          const valueStr = serializeTokenValue(itemValue.value || itemValue)
          if (isTokenReference(valueStr)) {
            if (!refsByPath.has(formattedPath)) {
              refsByPath.set(formattedPath, new Set())
            }

            const references = refsByPath.get(formattedPath)
            if (!references) return

            getReferences(valueStr).forEach((reference) => {
              references.add(reference)
            })
          }
        })
      },
      {
        stop: isValidToken,
      },
    )

    tokenPaths.forEach((path) => {
      const formattedPath = formatPath(path)
      const value = valueAtPath.get(path)

      if (path.includes(' ')) {
        addError('tokens', `Token key must not contain spaces: \`theme.tokens.${formattedPath}\``)
        return
      }

      if (!isObject(value) && !path.includes('value')) {
        addError('tokens', `Token must contain 'value': \`theme.semanticTokens.${formattedPath}\``)
      }
    })
  }

  validateTokenReferences({ valueAtPath, refsByPath, addError, typeByPath })
}
