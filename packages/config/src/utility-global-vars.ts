import { createConfigError } from './error'
import { isPlainObject, type Dict } from './shared'

/**
 * Folds every utility's `globalVars` into the config-level `globalVars`, config winning, and
 * records who owns each name under `utilityGlobalVars`.
 *
 * Takes from every *defined* utility, not just used ones: the emitter prunes what the sheet
 * never references, so a reader like `filter` never has to know that `blur` writes `--blur`.
 * Ownership travels with the config because a config value that shadows a registration only
 * matters when the stylesheet actually uses that variable, which only the emitter knows.
 */
export function mergeUtilityGlobalVars(config: Dict): Dict {
  const utilities = config.utilities
  if (!isPlainObject(utilities)) return config

  const merged: Dict = {}
  const owners = new Map<string, string>()
  let found = false

  const nextUtilities: Dict = {}
  for (const [name, utility] of Object.entries(utilities)) {
    if (!isPlainObject(utility) || !isPlainObject(utility.globalVars)) {
      nextUtilities[name] = utility
      continue
    }

    found = true
    const { globalVars, ...rest } = utility as Dict
    nextUtilities[name] = rest

    for (const [key, definition] of Object.entries(globalVars as Dict)) {
      const previous = merged[key]
      if (previous !== undefined && !isSameDefinition(previous, definition)) {
        throw createConfigError(
          `The \`${owners.get(key)}\` and \`${name}\` utilities both register \`${key}\`, with different definitions.\n` +
            `A CSS variable has one registration for the whole document, so share one definition between them.`,
        )
      }
      merged[key] = definition
      owners.set(key, name)
    }
  }

  if (!found) return config

  const configVars = isPlainObject(config.globalVars) ? (config.globalVars as Dict) : {}

  return {
    ...config,
    utilities: nextUtilities,
    globalVars: { ...merged, ...configVars },
    utilityGlobalVars: Object.fromEntries(owners),
  }
}

function isSameDefinition(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (!isPlainObject(a) || !isPlainObject(b)) return false
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false
  return keys.every((key) => a[key] === b[key])
}
