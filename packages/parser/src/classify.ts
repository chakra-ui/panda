import type { ParserOptions } from '@pandacss/core'
import { BoxNodeMap, box } from '@pandacss/extractor'
import type {
  ClassifyReport,
  ComponentReportItem,
  CssSemanticGroup,
  ParserResultInterface,
  PropertyReportItem,
  ReportDerivedMaps,
  ResultItem,
} from '@pandacss/types'

type ParserResultMap = Map<string, ParserResultInterface>

export function classifyParserResult(ctx: ParserOptions, resultMap: ParserResultMap): ClassifyReport {
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
      return Boolean(ctx.tokens.getByName(`${tokenType}.${value}`))
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

  resultMap.forEach((parserResult, filepath) => {
    if (parserResult.isEmpty()) return

    const localMaps = createReportMaps()

    const addTo = (map: Map<string, Set<any>>, key: string, value: any) => {
      const set = map.get(key) ?? new Set()
      set.add(value)
      map.set(key, set)
    }

    const processMap = (map: BoxNodeMap, current: string[], componentReportItem: ComponentReportItem) => {
      const { reportItemType: type, kind } = componentReportItem
      const name = componentReportItem.componentName

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
            range: map.getRange(),
          } as PropertyReportItem

          componentReportItem.contains.push(propReportItem.index)

          if (conditions.has(attrName)) {
            addTo(globalMaps.byConditionName, attrName, propReportItem.index)
            addTo(localMaps.byConditionName, attrName, propReportItem.index)
            propReportItem.propName = current[0] ?? attrName
            propReportItem.isKnownValue = isKnownUtility(propReportItem, componentReportItem)
            propReportItem.conditionName = attrName
          } else {
            if (current.length && conditions.has(current[0])) {
              propReportItem.conditionName = current[0]

              // TODO: when using nested conditions
              // should we add the reportItem.id for each of them or just the first one?
              // (currently just the first one)
              addTo(globalMaps.byConditionName, current[0], propReportItem.index)
              addTo(localMaps.byConditionName, current[0], propReportItem.index)
            }

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

            if (
              propName.toLowerCase().includes('color') ||
              groupByProp.get(propName) === 'Color' ||
              tokenType === 'colors'
            ) {
              addTo(globalMaps.colorsUsed, value as string, propReportItem.index)
              addTo(localMaps.colorsUsed, value as string, propReportItem.index)
            }

            if (ctx.utility.shorthands.has(attrName)) {
              addTo(globalMaps.byShorthand, attrName, propReportItem.index)
              addTo(localMaps.byShorthand, attrName, propReportItem.index)
            }
          }

          if (current.length) {
            addTo(globalMaps.byPropertyPath, propReportItem.path.join('.'), propReportItem.index)
            addTo(localMaps.byPropertyPath, propReportItem.path.join('.'), propReportItem.index)
          }

          //
          addTo(globalMaps.byTokenName, String(value), propReportItem.index)
          addTo(localMaps.byTokenName, String(value), propReportItem.index)

          //
          addTo(globalMaps.byType, type, propReportItem.index)
          addTo(localMaps.byType, type, propReportItem.index)

          //
          addTo(globalMaps.byComponentName, name, propReportItem.index)
          addTo(localMaps.byComponentName, name, propReportItem.index)

          //
          addTo(globalMaps.fromKind, kind, propReportItem.index)
          addTo(localMaps.fromKind, kind, propReportItem.index)

          //
          addTo(byFilepath, filepath, propReportItem.index)
          byId.set(propReportItem.index, propReportItem)

          return
        }

        if (box.isMap(attrNode) && attrNode.value.size) {
          return processMap(attrNode, current.concat(attrName), componentReportItem)
        }
      })
    }

    const processResultItem = (item: ResultItem, kind: ComponentReportItem['kind']) => {
      if (!item.box || box.isUnresolvable(item.box)) {
        // TODO store that in the report (unresolved values)
        // console.log('no box', filepath, item.name, item.type, item.box?.getRange())
        return
      }

      if (!item.data) {
        console.log('no data', item)
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
      } satisfies ComponentReportItem

      if (box.isArray(item.box)) {
        addTo(byComponentInFilepath, filepath, componentReportItem.componentIndex)
        return componentReportItem
      }

      if (box.isMap(item.box)) {
        addTo(byComponentInFilepath, filepath, componentReportItem.componentIndex)
        processMap(item.box, [], componentReportItem)
        return componentReportItem
      }

      if (item.type === 'recipe') {
        addTo(byComponentInFilepath, filepath, componentReportItem.componentIndex)
        return componentReportItem
      }
    }

    const processComponentResultItem = (item: ResultItem) => {
      const componentReportItem = processResultItem(item, 'component')
      if (!componentReportItem) return

      addTo(globalMaps.byComponentOfKind, 'component', componentReportItem.componentIndex)
      addTo(localMaps.byComponentOfKind, 'component', componentReportItem.componentIndex)

      byComponentIndex.set(componentReportItem.componentIndex, componentReportItem)
    }

    const processFunctionResultItem = (item: ResultItem) => {
      const componentReportItem = processResultItem(item, 'function')
      if (!componentReportItem) return

      addTo(globalMaps.byComponentOfKind, 'function', componentReportItem.componentIndex)
      addTo(localMaps.byComponentOfKind, 'function', componentReportItem.componentIndex)

      byComponentIndex.set(componentReportItem.componentIndex, componentReportItem)
    }

    parserResult.jsx.forEach(processComponentResultItem)

    parserResult.css.forEach(processFunctionResultItem)
    parserResult.cva.forEach(processFunctionResultItem)

    parserResult.pattern.forEach((itemList) => {
      itemList.forEach(processFunctionResultItem)
    })
    parserResult.recipe.forEach((itemList) => {
      itemList.forEach(processFunctionResultItem)
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
