import type { CallExpression, Identifier, Node, SourceFile } from 'ts-morph'
import { Node as MorphNode, SyntaxKind } from 'ts-morph'
import { unwrapExpression } from './utils'

type ImportEntry = {
  importedName: string
  mod: string
}

interface CompiledJsxImportMap {
  named: Map<string, ImportEntry>
  default: Map<string, string>
  namespace: Map<string, string>
  bundledNamed: Map<string, ImportEntry>
  bundledNamespace: Map<string, string>
}

export interface CompiledJsxCallInfo {
  framework: 'react' | 'preact' | 'solid' | 'vue' | 'qwik'
  tagName: string
  isFactory: boolean
  propNodes: Node[]
}

export interface CompiledJsxContext {
  getCallInfo: (node: CallExpression) => CompiledJsxCallInfo | undefined
  isMergePropsCall: (node: Node) => boolean
}

const reactRuntimeMods = new Set(['react/jsx-runtime', 'react/jsx-dev-runtime'])
const preactRuntimeMods = new Set(['preact/jsx-runtime', 'preact/jsx-dev-runtime'])
const classicReactMods = new Set(['react'])
const classicPreactMods = new Set(['preact'])
const solidMods = new Set(['solid-js', 'solid-js/web'])
const vueMods = new Set(['vue'])

type ResolvedCallee = {
  mod: string
  importedName: string
}

type RuntimeProfile = {
  framework: CompiledJsxCallInfo['framework']
  matches: (resolved: ResolvedCallee) => boolean
  getPropNodes: (args: Node[]) => Node[]
}

const resolveBundledHelperImport = (name: string, node: Node | undefined): ImportEntry | undefined => {
  if (!node) return

  const text = node.getText()
  const isVueBundledCreateVNode =
    text.includes('type, props = null, children = null') &&
    ((text.includes('createBaseVNode') && text.includes('guardReactiveProps')) ||
      (text.includes('patchFlag = -2') && text.includes('__vccOpts') && text.includes('shapeFlag')))
  const isVueBundledCreateVNodeTransform =
    name.includes('createVNodeWithArgsTransform') && text.includes('...args') && text.includes('_createVNode')
  const isVueBundledMergeProps =
    text.includes('const ret = {}') &&
    text.includes('toMerge = args[i]') &&
    text.includes('ret[key] = toMerge[key]') &&
    text.includes('key !== ""')
  const isSolidBundledCreateComponent =
    name === 'createComponent' && text.includes('Comp(props || {})') && text.includes('untrack')
  const isSolidBundledMergeProps =
    name === 'mergeProps' &&
    text.includes('...sources') &&
    text.includes('resolveSource') &&
    text.includes('sources.length')
  const isPreactBundledJsxHelper =
    text.includes('type:') &&
    text.includes('props:') &&
    text.includes('__v:') &&
    text.includes('defaultProps') &&
    text.includes('.vnode')

  if (isVueBundledCreateVNode || isVueBundledCreateVNodeTransform) {
    return { importedName: 'createVNode', mod: 'vue' }
  }

  if (isVueBundledMergeProps) {
    return { importedName: 'mergeProps', mod: 'vue' }
  }

  if (isSolidBundledCreateComponent) {
    return { importedName: 'createComponent', mod: 'solid-js/web' }
  }

  if (isSolidBundledMergeProps) {
    return { importedName: 'mergeProps', mod: 'solid-js' }
  }

  if (isPreactBundledJsxHelper) {
    return { importedName: 'jsx', mod: 'preact/jsx-runtime' }
  }

  return
}

const collectImports = (sourceFile: SourceFile): CompiledJsxImportMap => {
  const named = new Map<string, ImportEntry>()
  const defaultImports = new Map<string, string>()
  const namespace = new Map<string, string>()
  const bundledNamed = new Map<string, ImportEntry>()
  const bundledNamespace = new Map<string, string>()

  const getBundledRuntimeModFromName = (name: string) => {
    const normalized = name.replace(/[^a-z]/gi, '').toLowerCase()

    if (normalized.includes('jsxdevruntime')) {
      return 'react/jsx-dev-runtime'
    }

    if (normalized.includes('jsxruntime')) {
      return 'react/jsx-runtime'
    }

    if (normalized === 'react' || normalized.endsWith('react')) {
      return 'react'
    }
  }

  const parcelRuntimeModuleIds = new Map<string, string>()

  const resolveBundledNamespaceMod = (node: Node | undefined): string | undefined => {
    if (!node) return

    const expression = unwrapExpression(node)

    if (MorphNode.isCallExpression(expression)) {
      const callee = unwrapExpression(expression.getExpression())
      if (!MorphNode.isIdentifier(callee)) return

      const calleeName = callee.getText()
      if (/requirejsxdevruntime/i.test(calleeName)) {
        return 'react/jsx-dev-runtime'
      }

      if (/requirejsxruntime/i.test(calleeName)) {
        return 'react/jsx-runtime'
      }

      if (/requirereact/i.test(calleeName)) {
        return 'react'
      }
    }

    return
  }

  sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).forEach((callExpression) => {
    const callee = unwrapExpression(callExpression.getExpression())
    if (!MorphNode.isIdentifier(callee) || callee.getText() !== 'parcelRegister') return

    const [idArg, factoryArg] = callExpression.getArguments()
    if (!MorphNode.isStringLiteral(idArg)) return
    if (!MorphNode.isArrowFunction(factoryArg) && !MorphNode.isFunctionExpression(factoryArg)) return

    const factoryText = factoryArg.getBody().getText()
    if (
      factoryText.includes('"Fragment"') &&
      factoryText.includes('"jsx"') &&
      factoryText.includes('"jsxs"') &&
      factoryText.includes('module.exports')
    ) {
      parcelRuntimeModuleIds.set(idArg.getLiteralValue(), 'react/jsx-runtime')
    }
  })

  sourceFile.getImportDeclarations().forEach((declaration) => {
    const mod = declaration.getModuleSpecifierValue()
    if (!mod) return

    const defaultImport = declaration.getDefaultImport()
    if (defaultImport) {
      defaultImports.set(defaultImport.getText(), mod)
    }

    const namespaceImport = declaration.getNamespaceImport()
    if (namespaceImport) {
      namespace.set(namespaceImport.getText(), mod)
    }

    declaration.getNamedImports().forEach((specifier) => {
      const importedName = specifier.getNameNode().getText()
      const alias = specifier.getAliasNode()?.getText() || importedName
      named.set(alias, { importedName, mod })
    })
  })

  sourceFile.getVariableDeclarations().forEach((declaration) => {
    if (!MorphNode.isIdentifier(declaration.getNameNode())) return

    const variableName = declaration.getName()
    const initializer = declaration.getInitializer()
    const bundledImport = resolveBundledHelperImport(variableName, initializer)

    if (bundledImport) {
      bundledNamed.set(variableName, bundledImport)
    }

    let mod = getBundledRuntimeModFromName(variableName) ?? resolveBundledNamespaceMod(initializer)

    if (!mod && initializer && MorphNode.isCallExpression(initializer)) {
      const callee = unwrapExpression(initializer.getExpression())
      const [firstArg] = initializer.getArguments()

      if (
        MorphNode.isIdentifier(callee) &&
        callee.getText() === 'parcelRequire' &&
        MorphNode.isStringLiteral(firstArg)
      ) {
        mod = parcelRuntimeModuleIds.get(firstArg.getLiteralValue())
      }
    }

    if (!mod && initializer && MorphNode.isObjectLiteralExpression(initializer)) {
      const propertyNames = new Set(
        initializer
          .getProperties()
          .map((property) => {
            if (MorphNode.isPropertyAssignment(property)) {
              return property.getName()
            }
          })
          .filter(Boolean) as string[],
      )

      if (propertyNames.has('jsx') && propertyNames.has('Fragment')) {
        mod = 'preact/jsx-runtime'
      }
    }

    if (!mod) return

    bundledNamespace.set(variableName, mod)
  })

  sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration).forEach((declaration) => {
    const bundledImport = resolveBundledHelperImport(declaration.getName() ?? '', declaration)
    if (!bundledImport || !declaration.getName()) return
    bundledNamed.set(declaration.getName()!, bundledImport)
  })

  const resolveBundledAliasImport = (node: Node | undefined): ImportEntry | undefined => {
    if (!node) return

    const expression = unwrapExpression(node)

    if (MorphNode.isIdentifier(expression)) {
      return bundledNamed.get(expression.getText())
    }

    if (MorphNode.isConditionalExpression(expression)) {
      return resolveBundledAliasImport(expression.getWhenTrue()) ?? resolveBundledAliasImport(expression.getWhenFalse())
    }

    if (MorphNode.isBinaryExpression(expression) && expression.getOperatorToken().getKind() === SyntaxKind.CommaToken) {
      return resolveBundledAliasImport(expression.getRight())
    }
  }

  sourceFile.getVariableDeclarations().forEach((declaration) => {
    if (!MorphNode.isIdentifier(declaration.getNameNode())) return
    if (bundledNamed.has(declaration.getName())) return

    const bundledAlias = resolveBundledAliasImport(declaration.getInitializer())
    if (!bundledAlias) return

    bundledNamed.set(declaration.getName(), bundledAlias)
  })

  return { named, default: defaultImports, namespace, bundledNamed, bundledNamespace }
}

const normalizeTagName = (text: string) => {
  const parcelVarMatch = text.match(/\$[^$]+\$var\$(.+)$/)
  if (parcelVarMatch?.[1]) {
    return parcelVarMatch[1]
  }

  return text
}

const getTagName = (node: Node | undefined) => {
  if (!node) return

  const expression = unwrapExpression(node)
  if (MorphNode.isStringLiteral(expression) || MorphNode.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.getLiteralValue()
  }

  if (
    MorphNode.isIdentifier(expression) ||
    MorphNode.isPropertyAccessExpression(expression) ||
    MorphNode.isElementAccessExpression(expression)
  ) {
    return normalizeTagName(expression.getText())
  }
}

const isQwikMod = (mod: string) => mod.includes('qwik')
const getArgsAt =
  (...indices: number[]) =>
  (args: Node[]) =>
    indices.map((index) => args[index]).filter(Boolean) as Node[]

const runtimeProfiles: RuntimeProfile[] = [
  {
    framework: 'react',
    matches: ({ mod, importedName }) => reactRuntimeMods.has(mod) && ['jsx', 'jsxs', 'jsxDEV'].includes(importedName),
    getPropNodes: getArgsAt(1),
  },
  {
    framework: 'preact',
    matches: ({ mod, importedName }) => preactRuntimeMods.has(mod) && ['jsx', 'jsxs', 'jsxDEV'].includes(importedName),
    getPropNodes: getArgsAt(1),
  },
  {
    framework: 'react',
    matches: ({ mod, importedName }) => classicReactMods.has(mod) && importedName === 'createElement',
    getPropNodes: getArgsAt(1),
  },
  {
    framework: 'preact',
    matches: ({ mod, importedName }) => classicPreactMods.has(mod) && ['createElement', 'h'].includes(importedName),
    getPropNodes: getArgsAt(1),
  },
  {
    framework: 'vue',
    matches: ({ mod, importedName }) => vueMods.has(mod) && ['createVNode', 'h'].includes(importedName),
    getPropNodes: getArgsAt(1),
  },
  {
    framework: 'solid',
    matches: ({ mod, importedName }) => solidMods.has(mod) && importedName === 'createComponent',
    getPropNodes: getArgsAt(1),
  },
  {
    framework: 'qwik',
    matches: ({ mod, importedName }) => isQwikMod(mod) && ['_jsxQ', '_jsxS'].includes(importedName),
    getPropNodes: getArgsAt(1, 2),
  },
  {
    framework: 'qwik',
    matches: ({ mod, importedName }) => isQwikMod(mod) && ['_jsxC', 'jsx', 'jsxs', 'jsxDEV'].includes(importedName),
    getPropNodes: getArgsAt(1),
  },
]

export const createCompiledJsxContext = (sourceFile: SourceFile): CompiledJsxContext => {
  const imports = collectImports(sourceFile)

  const normalizeCallee = (node: Node): Node => {
    const expression = unwrapExpression(node)

    if (MorphNode.isBinaryExpression(expression) && expression.getOperatorToken().getKind() === SyntaxKind.CommaToken) {
      return normalizeCallee(expression.getRight())
    }

    return expression
  }

  const localDefinitionCache = new Map<string, ResolvedCallee | null>()

  const resolveIdentifierDefinition = (identifier: Identifier): ResolvedCallee | undefined => {
    const name = identifier.getText()
    if (localDefinitionCache.has(name)) {
      return localDefinitionCache.get(name) ?? undefined
    }

    localDefinitionCache.set(name, null)

    const resolveLocalAlias = (aliasNode: Node | undefined): ResolvedCallee | undefined => {
      if (!aliasNode) return

      const expression = unwrapExpression(aliasNode)

      if (MorphNode.isIdentifier(expression)) {
        const imported = imports.bundledNamed.get(expression.getText())
        if (imported) {
          return { mod: imported.mod, importedName: imported.importedName }
        }

        return resolveIdentifierDefinition(expression)
      }

      if (MorphNode.isConditionalExpression(expression)) {
        return resolveLocalAlias(expression.getWhenTrue()) ?? resolveLocalAlias(expression.getWhenFalse())
      }

      if (
        MorphNode.isBinaryExpression(expression) &&
        expression.getOperatorToken().getKind() === SyntaxKind.CommaToken
      ) {
        return resolveLocalAlias(expression.getRight())
      }
    }

    for (const definition of identifier.getDefinitions()) {
      const declaration = definition.getDeclarationNode()
      if (!declaration) continue

      if (MorphNode.isFunctionDeclaration(declaration)) {
        const imported = resolveBundledHelperImport(declaration.getName() ?? name, declaration)
        if (!imported) continue

        const resolved = { mod: imported.mod, importedName: imported.importedName }
        localDefinitionCache.set(name, resolved)
        return resolved
      }

      if (MorphNode.isVariableDeclaration(declaration)) {
        const directImport = resolveBundledHelperImport(declaration.getName(), declaration.getInitializer())
        const aliasImport = directImport
          ? { mod: directImport.mod, importedName: directImport.importedName }
          : resolveLocalAlias(declaration.getInitializer())

        if (!aliasImport) continue

        localDefinitionCache.set(name, aliasImport)
        return aliasImport
      }
    }
  }

  const resolveCallee = (node: Node) => {
    const expression = normalizeCallee(node)

    if (MorphNode.isIdentifier(expression)) {
      const imported = imports.named.get(expression.getText()) ?? imports.bundledNamed.get(expression.getText())
      if (imported) {
        return { mod: imported.mod, importedName: imported.importedName }
      }

      return resolveIdentifierDefinition(expression)
    }

    if (MorphNode.isPropertyAccessExpression(expression)) {
      const target = normalizeCallee(expression.getExpression())
      if (!MorphNode.isIdentifier(target)) return

      const targetName = target.getText()
      const mod =
        imports.default.get(targetName) ?? imports.namespace.get(targetName) ?? imports.bundledNamespace.get(targetName)
      if (!mod) return

      return { mod, importedName: expression.getName() }
    }
  }

  const isMergePropsCall = (node: Node) => {
    if (!MorphNode.isCallExpression(node)) return false

    const resolved = resolveCallee(node.getExpression())
    if (!resolved) return false

    return resolved.importedName === 'mergeProps' && (solidMods.has(resolved.mod) || vueMods.has(resolved.mod))
  }

  const getCallInfo = (node: CallExpression): CompiledJsxCallInfo | undefined => {
    const resolved = resolveCallee(node.getExpression())
    if (!resolved) return

    const args = node.getArguments().map((arg) => unwrapExpression(arg))
    const tagName = getTagName(args[0])
    if (!tagName) return

    const baseInfo = {
      tagName,
      isFactory: tagName.includes('.'),
    }

    for (const profile of runtimeProfiles) {
      if (profile.matches(resolved)) {
        return { framework: profile.framework, ...baseInfo, propNodes: profile.getPropNodes(args) }
      }
    }
  }

  return {
    getCallInfo,
    isMergePropsCall,
  }
}
