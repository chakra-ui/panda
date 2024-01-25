import postcss from 'postcss'

interface UseRecord {
  uses: number
  dependencies: Set<string>
  declarations: Set<postcss.Declaration>
}

const varRegex = /var\(\s*(?<name>--[^ ,);]+)/g

/**
 * Adapted from https://github.com/tomasklaen/postcss-prune-var/blob/57ad5041806b73479d0c558e0b1a918803cb7cbc/index.js
 */
export const removeUnusedCssVars = (css: string) => {
  const root = postcss.parse(css)

  const records = new Map<string, UseRecord>()

  const getRecord = (variable: string): UseRecord => {
    let record = records.get(variable)
    if (!record) {
      record = { uses: 0, dependencies: new Set(), declarations: new Set() }
      records.set(variable, record)
    }
    return record
  }

  const registerUse = (variable: string, ignoreList = new Set<string>()) => {
    const record = getRecord(variable)
    record.uses++
    ignoreList.add(variable)
    for (const dependency of record.dependencies) {
      if (!ignoreList.has(dependency)) registerUse(dependency, ignoreList)
    }
  }

  const registerDependency = (variable: string, dependency: string) => {
    const record = getRecord(variable)
    record.dependencies.add(dependency)
  }

  // Detect variable uses
  root.walkDecls((decl) => {
    const parent = decl.parent
    if (!parent) return

    if (parent.type === 'rule' && (parent as postcss.Rule).selector === ':root') {
      return
    }

    const isVar = decl.prop.startsWith('--')

    // Initiate record
    if (isVar) getRecord(decl.prop).declarations.add(decl)

    if (!decl.value.includes('var(')) return

    for (const match of decl.value.matchAll(varRegex)) {
      const variable = match.groups?.name.trim()
      if (!variable) continue

      if (isVar) {
        registerDependency(decl.prop, variable)
      } else {
        registerUse(variable)
      }
    }
  })

  //   console.log(records)
  // Remove unused variables
  for (const { uses, declarations } of records.values()) {
    if (uses === 0) {
      for (const decl of declarations) {
        // console.log(decl.parent)
        if (decl.parent?.nodes.length === 1) decl.parent?.remove()
        else decl.remove()
      }
    }
  }

  return root.toString()
}
