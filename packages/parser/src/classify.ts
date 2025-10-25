import type { ParserOptions } from '@pandacss/core'
import { BoxNodeMap, box, type BoxNode } from '@pandacss/extractor'
import { compact, patternFns } from '@pandacss/shared'
import type {
  ClassifyReport,
  ComponentReportItem,
  CssSemanticGroup,
  ParserResultInterface,
  PropertyReportItem,
  ReportDerivedMaps,
  ResultItem,
  SlotRecipeConfig,
} from '@pandacss/types'

type ParserResultMap = Map<string, ParserResultInterface>

function addTo(map: Map<string, Set<any>>, key: string, value: any) {
  const set = map.get(key) ?? new Set()
  set.add(value)
  map.set(key, set)
}

interface ProcessPatternOpts {
  item: ComponentReportItem
  localMaps: ReportDerivedMaps
  filepath: string
  boxNode: BoxNode
  data: Record<string, any> | undefined
}

interface ProcessResultItemOpts {
  item: ResultItem
  localMaps: ReportDerivedMaps
  filepath: string
  kind: ComponentReportItem['kind']
}

interface ProcessMapOpts {
  map: BoxNodeMap
  current: string[]
  componentReportItem: ComponentReportItem
  filepath: string
  localMaps: ReportDerivedMaps
  skipRange?: boolean
}

export function classifyProject(ctx: ParserOptions, resultMap: ParserResultMap): ClassifyReport {
  const byId = new Map<PropertyReportItem['index'], PropertyReportItem>()
  const byComponentIndex = new Map<ComponentReportItem['componentIndex'], ComponentReportItem>()
  const byFilepath = new Map<string, Set<PropertyReportItem['index']>>()
  const byComponentInFilepath = new Map<string, Set<ComponentReportItem['componentIndex']>>()
  const globalMaps = createReportMaps()
  const byFilePathMaps = new Map<string, ReportDerivedMaps>()
  const conditions = new Map(Object.entries(ctx.conditions.values))

  const { groupByProp } = getPropertyGroupMap(ctx)

  let id = 0
  let componentIndex = 0

  const isKnownUtility = (reportItem: PropertyReportItem, componentReportItem: ComponentReportItem) => {
    const { propName, value, tokenType } = reportItem

    const utility = ctx.utility.config[propName]

    if (utility) {
      if (ctx.tokens.getByName(`${tokenType}.${value}`)) return true
      if (ctx.tokens.getReferences(String(value)).length > 0) return true
      if (ctx.utility.resolveColorMix(String(value)).color) return true
      return false
    }

    if (componentReportItem.reportItemType === 'pattern') {
      const pattern = ctx.patterns.getConfig(componentReportItem.componentName.toLowerCase())
      const patternProp = pattern?.properties?.[propName]
      if (!patternProp) return false

      if (patternProp.type === 'boolean' || patternProp.type === 'number') {
        return true
      }

      if (patternProp.type === 'property' && patternProp.value) {
        return Boolean(ctx.utility.config[patternProp.value])
      }

      if (patternProp.type === 'enum' && patternProp.value) {
        return Boolean(patternProp.value.includes(String(value)))
      }

      if (patternProp.type === 'token') {
        return Boolean(ctx.tokens.getByName(`${patternProp.value}.${value}`))
      }

      return false
    }

    return false
  }

  const processPattern = (opts: ProcessPatternOpts): ComponentReportItem | undefined => {
    const { boxNode, data, item, filepath, localMaps } = opts
    const name = item.componentName
    const pattern = ctx.patterns.details.find((p) => p.match.test(name) || p.baseName === name)
    if (!pattern) return
    const cssObj = pattern.config.transform?.(data || {}, patternFns) ?? {}
    const newItem: ResultItem = {
      name: 'css',
      type: 'css',
      box: box.objectToMap(compact(cssObj), boxNode.getNode(), boxNode.getStack()),
      data: [cssObj],
    }
    Object.assign(newItem, { debug: true })
    return processResultItem({ item: newItem, kind: 'function', localMaps, filepath })
  }

  const processResultItem = (opts: ProcessResultItemOpts) => {
    const { item, kind, filepath, localMaps } = opts

    if (!item.box || box.isUnresolvable(item.box)) {
      // TODO store that in the report (unresolved values)
      // console.log('no box', filepath, item.name, item.type, item.box?.getRange())
      return
    }

    if (!item.data) {
      return
    }

    const componentReportItem = {
      componentIndex: String(componentIndex++),
      componentName: item.name!,
      reportItemType: item.type!,
      kind,
      filepath,
      value: item.data,
      range: item.box.getRange(),
      contains: [],
      debug: Reflect.has(item, 'debug'),
    } satisfies ComponentReportItem

    if (item.type === 'pattern' || item.type === 'jsx-pattern') {
      return processPattern({ boxNode: item.box, data: item.data[0], item: componentReportItem, filepath, localMaps })
    }

    if (box.isArray(item.box)) {
      addTo(byComponentInFilepath, filepath, componentReportItem.componentIndex)
      return componentReportItem
    }

    if (box.isMap(item.box)) {
      addTo(byComponentInFilepath, filepath, componentReportItem.componentIndex)
      processMap({ map: item.box, current: [], componentReportItem, filepath, localMaps })
      return componentReportItem
    }

    if (item.type === 'recipe') {
      addTo(byComponentInFilepath, filepath, componentReportItem.componentIndex)
      return componentReportItem
    }
  }

  const processResultItemFn = (opts: {
    item: ResultItem
    filepath: string
    localMaps: ReportDerivedMaps
    type: 'component' | 'function'
  }) => {
    const { item, filepath, localMaps, type } = opts

    const componentReportItem = processResultItem({ item, kind: type, filepath, localMaps })
    if (!componentReportItem) return

    addTo(globalMaps.byComponentOfKind, type, componentReportItem.componentIndex)
    addTo(localMaps.byComponentOfKind, type, componentReportItem.componentIndex)
    byComponentIndex.set(componentReportItem.componentIndex, componentReportItem)
  }

  /**
   * Handles condition-specific property classification and map updates.
   */
  const handleConditionProperty = (
    propReportItem: PropertyReportItem,
    attrName: string,
    current: string[],
    componentReportItem: ComponentReportItem,
    localMaps: ReportDerivedMaps,
  ) => {
    if (conditions.has(attrName)) {
      addTo(globalMaps.byConditionName, attrName, propReportItem.index)
      addTo(localMaps.byConditionName, attrName, propReportItem.index)
      propReportItem.propName = current[0] ?? attrName
      propReportItem.isKnownValue = isKnownUtility(propReportItem, componentReportItem)
      propReportItem.conditionName = attrName
      return true
    }

    if (current.length && conditions.has(current[0])) {
      propReportItem.conditionName = current[0]

      // TODO: when using nested conditions
      // should we add the reportItem.id for each of them or just the first one?
      // (currently just the first one)
      addTo(globalMaps.byConditionName, current[0], propReportItem.index)
      addTo(localMaps.byConditionName, current[0], propReportItem.index)
    }

    return false
  }

  /**
   * Classifies a CSS property by resolving shorthands, detecting token types,
   * and updating property-specific tracking maps.
   */
  const classifyProperty = (
    propReportItem: PropertyReportItem,
    attrName: string,
    value: string | boolean,
    componentReportItem: ComponentReportItem,
    localMaps: ReportDerivedMaps,
  ) => {
    const propName = ctx.utility.resolveShorthand(attrName)
    const tokenType = ctx.utility.getTokenType(propName)

    if (tokenType) {
      propReportItem.reportItemKind = 'token'
      propReportItem.tokenType = tokenType
    }

    propReportItem.propName = propName
    propReportItem.isKnownValue = isKnownUtility(propReportItem, componentReportItem)

    addTo(globalMaps.byPropertyName, propName, propReportItem.index)
    addTo(localMaps.byPropertyName, propName, propReportItem.index)

    if (tokenType) {
      addTo(globalMaps.byTokenType, tokenType, propReportItem.index)
      addTo(localMaps.byTokenType, tokenType, propReportItem.index)
    }

    if (propName.toLowerCase().includes('color') || groupByProp.get(propName) === 'Color' || tokenType === 'colors') {
      addTo(globalMaps.colorsUsed, value as string, propReportItem.index)
      addTo(localMaps.colorsUsed, value as string, propReportItem.index)
    }

    if (ctx.utility.shorthands.has(attrName)) {
      addTo(globalMaps.byShorthand, attrName, propReportItem.index)
      addTo(localMaps.byShorthand, attrName, propReportItem.index)
    }
  }

  /**
   * Updates all tracking maps for a property report item.
   * This includes component metadata, token tracking, and filepath associations.
   */
  const updatePropertyMaps = (
    propReportItem: PropertyReportItem,
    current: string[],
    filepath: string,
    localMaps: ReportDerivedMaps,
    componentReportItem: ComponentReportItem,
  ) => {
    const { index, value, reportItemType: type } = propReportItem
    const { kind, componentName: name } = componentReportItem

    if (current.length) {
      addTo(globalMaps.byPropertyPath, propReportItem.path.join('.'), index)
      addTo(localMaps.byPropertyPath, propReportItem.path.join('.'), index)
    }

    addTo(globalMaps.byTokenName, String(value), index)
    addTo(localMaps.byTokenName, String(value), index)

    addTo(globalMaps.byType, type, index)
    addTo(localMaps.byType, type, index)

    addTo(globalMaps.byComponentName, name, index)
    addTo(localMaps.byComponentName, name, index)

    addTo(globalMaps.fromKind, kind, index)
    addTo(localMaps.fromKind, kind, index)

    addTo(byFilepath, filepath, index)
    byId.set(index, propReportItem)
  }

  const processMap = (opts: ProcessMapOpts) => {
    const { map, current, componentReportItem, filepath, localMaps, skipRange } = opts
    const { reportItemType: type, kind, componentName: name } = componentReportItem

    map.value.forEach((attrNode, attrName) => {
      if (box.isLiteral(attrNode) || box.isEmptyInitializer(attrNode)) {
        const value = box.isLiteral(attrNode) ? (attrNode.value as string) : true

        const propReportItem = {
          index: String(id++),
          componentIndex: String(componentReportItem.componentIndex),
          componentName: name,
          tokenType: undefined,
          propName: attrName,
          reportItemKind: 'utility',
          reportItemType: type,
          kind,
          filepath,
          path: current.concat(attrName),
          value,
          isKnownValue: false,
          range: skipRange ? null : map.getRange(),
        } as PropertyReportItem

        componentReportItem.contains.push(propReportItem.index)

        const isCondition = handleConditionProperty(propReportItem, attrName, current, componentReportItem, localMaps)
        if (!isCondition) {
          classifyProperty(propReportItem, attrName, value, componentReportItem, localMaps)
        }

        updatePropertyMaps(propReportItem, current, filepath, localMaps, componentReportItem)

        return
      }

      if (box.isMap(attrNode) && attrNode.value.size) {
        return processMap({
          map: attrNode,
          current: current.concat(attrName),
          componentReportItem,
          filepath,
          localMaps,
        })
      }
    })
  }

  resultMap.forEach((parserResult, filepath) => {
    if (parserResult.isEmpty()) return

    const localMaps = createReportMaps()

    const componentFn = (item: ResultItem) => {
      processResultItemFn({ item, filepath, localMaps, type: 'component' })
    }

    const functionFn = (item: ResultItem) => {
      processResultItemFn({ item, filepath, localMaps, type: 'function' })
    }

    parserResult.jsx.forEach(componentFn)
    parserResult.css.forEach(functionFn)
    parserResult.cva.forEach(functionFn)
    parserResult.pattern.forEach((itemList) => {
      itemList.forEach(functionFn)
    })
    parserResult.recipe.forEach((itemList) => {
      itemList.forEach(functionFn)
    })

    byFilePathMaps.set(filepath, localMaps)
  })

  const pickCount = 10
  const filesWithMostComponent = Object.fromEntries(
    Array.from(byComponentInFilepath.entries())
      .map(([filepath, list]) => [filepath, list.size] as const)
      .sort((a, b) => b[1] - a[1])
      .slice(0, pickCount),
  )

  // process recipes
  Object.entries(ctx.recipes.config).forEach(([key, recipe]) => {
    const localMaps = createReportMaps()

    const functionFn = (styleObject: Record<string, any> | undefined) => {
      if (!styleObject) return

      const componentReportItem: ComponentReportItem = {
        componentIndex: '0',
        componentName: `recipes.${key}.base`,
        reportItemType: 'css',
        kind: 'function',
        filepath: `theme/recipes/${key}`,
        value: styleObject,
        range: null,
        contains: [],
      }

      processMap({
        // @ts-expect-error
        map: box.objectToMap(styleObject, null, []),
        current: [],
        filepath: `@config/theme/recipes/${key}`,
        skipRange: true,
        localMaps,
        componentReportItem,
      })
    }

    const isSlotRecipe = (v: any): v is SlotRecipeConfig => ctx.recipes.isSlotRecipe(key)

    if (isSlotRecipe(recipe)) {
      Object.values(recipe.base ?? {}).forEach(functionFn)
      Object.values(recipe.variants ?? {}).forEach((variants) => {
        Object.values(variants).forEach((v) => {
          Object.values(v).forEach(functionFn)
        })
      })
      recipe.compoundVariants?.forEach((v) => {
        Object.values(v.css).forEach(functionFn)
      })
    } else {
      functionFn(recipe.base)
      Object.values(recipe.variants ?? {}).forEach((variants) => {
        Object.values(variants).forEach(functionFn)
      })
      recipe.compoundVariants?.forEach((v) => functionFn(v.css))
    }
  })

  // process global css
  Object.values(ctx.config.globalCss ?? {}).forEach((styleObject) => {
    if (!styleObject) return
    processMap({
      // @ts-expect-error
      map: box.objectToMap(styleObject, null, []),
      current: [],
      filepath: '@config/globalCss',
      skipRange: true,
      localMaps: createReportMaps(),
      componentReportItem: {
        componentIndex: '0',
        componentName: 'global',
        reportItemType: 'css',
        kind: 'function',
        filepath: 'global',
        value: styleObject,
        range: null,
        contains: [],
      },
    })
  })

  return {
    propById: byId,
    componentById: byComponentIndex,
    details: {
      counts: {
        filesWithTokens: byFilepath.size,
        propNameUsed: globalMaps.byPropertyName.size,
        tokenUsed: globalMaps.byTokenName.size,
        shorthandUsed: globalMaps.byShorthand.size,
        propertyPathUsed: globalMaps.byPropertyPath.size,
        typeUsed: globalMaps.byType.size,
        componentNameUsed: globalMaps.byComponentName.size,
        kindUsed: globalMaps.fromKind.size,
        componentOfKindUsed: globalMaps.byComponentOfKind.size,
        colorsUsed: globalMaps.colorsUsed.size,
      },
      stats: {
        filesWithMostComponent,
        mostUseds: getXMostUseds(globalMaps, 10),
      },
    },
    derived: {
      byFilepath,
      byComponentInFilepath,
      globalMaps,
      byFilePathMaps,
    },
  }
}

const getXMostUseds = (globalMaps: ReportDerivedMaps, pickCount: number) => {
  return {
    propNames: getMostUsedInMap(globalMaps.byPropertyName, pickCount),
    tokens: getMostUsedInMap(globalMaps.byTokenName, pickCount),
    shorthands: getMostUsedInMap(globalMaps.byShorthand, pickCount),
    conditions: getMostUsedInMap(globalMaps.byConditionName, pickCount),
    propertyPaths: getMostUsedInMap(globalMaps.byPropertyPath, pickCount),
    categories: getMostUsedInMap(globalMaps.byTokenType, pickCount),
    types: getMostUsedInMap(globalMaps.byType, pickCount),
    componentNames: getMostUsedInMap(globalMaps.byComponentName, pickCount),
    fromKinds: getMostUsedInMap(globalMaps.fromKind, pickCount),
    componentOfKinds: getMostUsedInMap(globalMaps.byComponentOfKind, pickCount),
    colors: getMostUsedInMap(globalMaps.colorsUsed, pickCount),
  }
}

const getMostUsedInMap = (map: Map<string, Set<any>>, pickCount: number) => {
  return Array.from(map.entries())
    .map(([key, list]) => [key, list.size] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, pickCount)
    .map(([key, count]) => ({ key, count }))
}

const defaultGroupNames: CssSemanticGroup[] = [
  'System',
  'Container',
  'Display',
  'Visibility',
  'Position',
  'Transform',
  'Flex Layout',
  'Grid Layout',
  'Layout',
  'Border',
  'Border Radius',
  'Width',
  'Height',
  'Margin',
  'Padding',
  'Color',
  'Typography',
  'Background',
  'Shadow',
  'Table',
  'List',
  'Scroll',
  'Interactivity',
  'Transition',
  'Effect',
  'Other',
  'Focus Ring',
]

function getPropertyGroupMap(ctx: ParserOptions) {
  const groups = new Map<CssSemanticGroup, Set<string>>(defaultGroupNames.map((name) => [name, new Set()]))
  const groupByProp = new Map<string, CssSemanticGroup>()

  const systemGroup = groups.get('System')!
  systemGroup.add('base')
  systemGroup.add('colorPalette')

  const otherStyleProps = groups.get('Other')!

  Object.entries(ctx.utility.config).map(([key, value]) => {
    const group = value?.group
    if (!group) {
      otherStyleProps.add(key)
      return
    }

    if (!groups.has(group)) {
      groups.set(group, new Set())
    }

    const set = groups.get(group)!

    if (value.shorthand) {
      if (Array.isArray(value.shorthand)) {
        value.shorthand.forEach((shorthand) => {
          set.add(shorthand)
          groupByProp.set(shorthand, group)
        })
      } else {
        set.add(value.shorthand)
        groupByProp.set(value.shorthand, group)
      }
    }

    set.add(key)
    groupByProp.set(key, group)
  })

  return { groups, groupByProp }
}

type PropertyIndexSet = Set<PropertyReportItem['index']>
type ComponentIndexSet = Set<ComponentReportItem['componentIndex']>

function createReportMaps() {
  return {
    byComponentOfKind: new Map<'function' | 'component', ComponentIndexSet>(),
    byPropertyName: new Map<string, PropertyIndexSet>(),
    byTokenType: new Map<string, PropertyIndexSet>(),
    byConditionName: new Map<string, PropertyIndexSet>(),
    byShorthand: new Map<string, PropertyIndexSet>(),
    byTokenName: new Map<string, PropertyIndexSet>(),
    byPropertyPath: new Map<string, PropertyIndexSet>(),
    fromKind: new Map<'function' | 'component', PropertyIndexSet>(),
    byType: new Map<string, PropertyIndexSet>(),
    byComponentName: new Map<string, PropertyIndexSet>(),
    colorsUsed: new Map<string, PropertyIndexSet>(),
  }
}
