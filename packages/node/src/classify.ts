import type { ParserResultInterface, ReportInstanceItem, ReportItem } from '@pandacss/types'
import { box } from '@pandacss/extractor'
import type { PandaContext } from './create-context'
import type { ResultItem } from '@pandacss/types'

type BoxNodeMap = ReportInstanceItem['box']

const createReportMaps = () => {
  const byInstanceOfKind = new Map<'function' | 'component', Set<ReportInstanceItem['instanceId']>>()
  const byPropertyName = new Map<string, Set<ReportItem['id']>>()
  const byCategory = new Map<string, Set<ReportItem['id']>>()
  const byConditionName = new Map<string, Set<ReportItem['id']>>()
  const byShorthand = new Map<string, Set<ReportItem['id']>>()
  const byTokenName = new Map<string, Set<ReportItem['id']>>()
  const byPropertyPath = new Map<string, Set<ReportItem['id']>>()
  const fromKind = new Map<'function' | 'component', Set<ReportItem['id']>>()
  const byType = new Map<string, Set<ReportItem['id']>>()
  const byInstanceName = new Map<string, Set<ReportItem['id']>>()
  const colorsUsed = new Map<string, Set<ReportItem['id']>>()

  return {
    byInstanceOfKind,
    byPropertyName,
    byCategory,
    byConditionName,
    byShorthand,
    byTokenName,
    byPropertyPath,
    fromKind,
    byType,
    byInstanceName,
    colorsUsed,
  }
}

const colorPropNames = new Set(['background', 'outline', 'border'])

type ReportMaps = ReturnType<typeof createReportMaps>

export const classifyTokens = (ctx: PandaContext, parserResultByFilepath: Map<string, ParserResultInterface>) => {
  const byId = new Map<ReportItem['id'], ReportItem>()
  const byInstanceId = new Map<ReportInstanceItem['instanceId'], ReportInstanceItem>()

  const byFilepath = new Map<string, Set<ReportItem['id']>>()
  const byInstanceInFilepath = new Map<string, Set<ReportInstanceItem['instanceId']>>()

  const globalMaps = createReportMaps()
  const byFilePathMaps = new Map<string, ReportMaps>()

  const conditions = new Map(Object.entries(ctx.conditions.values))

  let id = 0,
    instanceId = 0

  const isKnownUtility = (reportItem: ReportItem) => {
    const { propName, type, value, from } = reportItem

    const utility = ctx.config.utilities?.[propName]
    if (utility) {
      if (!utility.shorthand) {
        return Boolean(ctx.tokens.getByName(`${utility.values}.${value}`))
      }

      return Boolean(ctx.tokens.getByName(`${utility.values}.${value}`))
    }

    if (type === 'pattern') {
      const pattern = ctx.patterns.getConfig(from.toLowerCase())
      const patternProp = pattern?.properties?.[propName]
      if (!patternProp) return false

      if (patternProp.type === 'boolean' || patternProp.type === 'number') {
        return true
      }

      if (patternProp.type === 'property' && patternProp.value) {
        return Boolean(ctx.config.utilities?.[patternProp.value])
      }

      if (patternProp.type === 'enum' && patternProp.value) {
        return Boolean(patternProp.value.includes(String(value)))
      }

      if (patternProp.type === 'token') {
        return Boolean(ctx.tokens.getByName(`${patternProp.value}.${value}`))
      }

      return false
    }

    // console.log(reportItem)
    return false
  }

  parserResultByFilepath.forEach((parserResult, filepath) => {
    if (parserResult.isEmpty()) return

    const localMaps = createReportMaps()

    const addTo = (map: Map<string, Set<any>>, key: string, value: any) => {
      const set = map.get(key) ?? new Set()
      set.add(value)
      map.set(key, set)
    }

    const processMap = (map: BoxNodeMap, current: string[], reportInstanceItem: ReportInstanceItem) => {
      const { from, type, kind } = reportInstanceItem

      map.value.forEach((attrNode, attrName) => {
        if (box.isLiteral(attrNode) || box.isEmptyInitializer(attrNode)) {
          const value = box.isLiteral(attrNode) ? (attrNode.value as string) : true
          const reportItem = {
            id: id++,
            instanceId,
            category: 'unknown',
            propName: attrName,
            from,
            type,
            kind,
            filepath,
            path: current.concat(attrName),
            value,
            box: attrNode,
            isKnown: false,
          } as ReportItem // TODO satisfies
          reportInstanceItem.contains.push(reportItem.id)

          if (conditions.has(attrName)) {
            addTo(globalMaps.byConditionName, attrName, reportItem.id)
            addTo(localMaps.byConditionName, attrName, reportItem.id)
            reportItem.propName = current[0] ?? attrName
            reportItem.isKnown = isKnownUtility(reportItem)
            reportItem.conditionName = attrName
          } else {
            if (current.length && conditions.has(current[0])) {
              reportItem.conditionName = current[0]

              // TODO: when using nested conditions
              // should we add the reportItem.id for each of them or just the first one?
              // (currently just the first one)
              addTo(globalMaps.byConditionName, current[0], reportItem.id)
              addTo(localMaps.byConditionName, current[0], reportItem.id)
            }

            const propName = ctx.utility.shorthands.get(attrName) ?? attrName
            reportItem.propName = propName

            const utility = ctx.config.utilities?.[propName]
            reportItem.isKnown = isKnownUtility(reportItem)

            const category = typeof utility?.values === 'string' ? utility?.values : 'unknown'
            reportItem.category = category

            addTo(globalMaps.byPropertyName, propName, reportItem.id)
            addTo(localMaps.byPropertyName, propName, reportItem.id)

            addTo(globalMaps.byCategory, category, reportItem.id)
            addTo(localMaps.byCategory, category, reportItem.id)

            if (propName.toLowerCase().includes('color') || colorPropNames.has(propName)) {
              addTo(globalMaps.colorsUsed, value as string, reportItem.id)
              addTo(localMaps.colorsUsed, value as string, reportItem.id)
            }

            if (ctx.utility.shorthands.has(attrName)) {
              addTo(globalMaps.byShorthand, attrName, reportItem.id)
              addTo(localMaps.byShorthand, attrName, reportItem.id)
            }
          }

          if (current.length) {
            addTo(globalMaps.byPropertyPath, reportItem.path.join('.'), reportItem.id)
            addTo(localMaps.byPropertyPath, reportItem.path.join('.'), reportItem.id)
          }

          //
          addTo(globalMaps.byTokenName, String(value), reportItem.id)
          addTo(localMaps.byTokenName, String(value), reportItem.id)

          //
          addTo(globalMaps.byType, type, reportItem.id)
          addTo(localMaps.byType, type, reportItem.id)

          //
          addTo(globalMaps.byInstanceName, from, reportItem.id)
          addTo(localMaps.byInstanceName, from, reportItem.id)

          //
          addTo(globalMaps.fromKind, kind, reportItem.id)
          addTo(localMaps.fromKind, kind, reportItem.id)

          //
          addTo(byFilepath, filepath, reportItem.id)
          byId.set(reportItem.id, reportItem)

          return
        }

        if (box.isMap(attrNode) && attrNode.value.size) {
          return processMap(attrNode, current.concat(attrName), reportInstanceItem)
        }
      })
    }

    const processResultItem = (item: ResultItem, kind: ReportItem['kind']) => {
      if (!item.box || box.isUnresolvable(item.box)) {
        // console.log('no box', item)
        return
      }

      if (!item.data) {
        // console.log('no data', item)
        return
      }

      const from = item.name!
      const type = item.type as ReportItem['type']
      const reportInstanceItem = {
        instanceId: instanceId++,
        from,
        type,
        kind,
        filepath,
        value: item.data,
        box: item.box,
        contains: [],
      } as ReportInstanceItem // TODO satisfies

      if (box.isArray(item.box)) {
        addTo(byInstanceInFilepath, filepath, reportInstanceItem.instanceId)

        return reportInstanceItem
      }

      if (box.isMap(item.box) && item.box.value.size) {
        addTo(byInstanceInFilepath, filepath, reportInstanceItem.instanceId)

        processMap(item.box, [], reportInstanceItem)
        return reportInstanceItem
      }
    }

    const processComponentResultItem = (item: ResultItem) => {
      const reportInstanceItem = processResultItem(item, 'component')
      if (!reportInstanceItem) return

      addTo(globalMaps.byInstanceOfKind, 'component', reportInstanceItem.instanceId)
      addTo(localMaps.byInstanceOfKind, 'component', reportInstanceItem.instanceId)

      byInstanceId.set(reportInstanceItem.instanceId, reportInstanceItem)
    }

    const processFunctionResultItem = (item: ResultItem) => {
      const reportInstanceItem = processResultItem(item, 'function')
      if (!reportInstanceItem) return

      addTo(globalMaps.byInstanceOfKind, 'function', reportInstanceItem.instanceId)
      addTo(localMaps.byInstanceOfKind, 'function', reportInstanceItem.instanceId)

      byInstanceId.set(reportInstanceItem.instanceId, reportInstanceItem)
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
  const filesWithMostInstance = Object.fromEntries(
    Array.from(byInstanceInFilepath.entries())
      .map(([filepath, list]) => [filepath, list.size] as const)
      .sort((a, b) => b[1] - a[1])
      .slice(0, pickCount),
  )

  const filesWithMostPropValueCombinations = Object.fromEntries(
    Array.from(byFilepath.entries())
      .map(([token, list]) => [token, list.size] as const)
      .sort((a, b) => b[1] - a[1])
      .slice(0, pickCount),
  )

  return {
    counts: {
      filesWithTokens: byFilepath.size,
      propNameUsed: globalMaps.byPropertyName.size,
      tokenUsed: globalMaps.byTokenName.size,
      shorthandUsed: globalMaps.byShorthand.size,
      propertyPathUsed: globalMaps.byPropertyPath.size,
      typeUsed: globalMaps.byType.size,
      instanceNameUsed: globalMaps.byInstanceName.size,
      kindUsed: globalMaps.fromKind.size,
      instanceOfKindUsed: globalMaps.byInstanceOfKind.size,
      colorsUsed: globalMaps.colorsUsed.size,
    },
    stats: {
      //
      filesWithMostInstance,
      filesWithMostPropValueCombinations,
      //
      mostUseds: getXMostUseds(globalMaps, 10),
    },
    details: {
      byId,
      byInstanceId,
      byFilepath,
      byInstanceInFilepath,
      globalMaps,
      byFilePathMaps,
    },
  }
}

const getXMostUseds = (globalMaps: ReportMaps, pickCount: number) => {
  return {
    propNames: getMostUsedInMap(globalMaps.byPropertyName, pickCount),
    tokens: getMostUsedInMap(globalMaps.byTokenName, pickCount),
    shorthands: getMostUsedInMap(globalMaps.byShorthand, pickCount),
    conditions: getMostUsedInMap(globalMaps.byConditionName, pickCount),
    propertyPaths: getMostUsedInMap(globalMaps.byPropertyPath, pickCount),
    categories: getMostUsedInMap(globalMaps.byCategory, pickCount),
    types: getMostUsedInMap(globalMaps.byType, pickCount),
    instanceNames: getMostUsedInMap(globalMaps.byInstanceName, pickCount),
    fromKinds: getMostUsedInMap(globalMaps.fromKind, pickCount),
    instanceOfKinds: getMostUsedInMap(globalMaps.byInstanceOfKind, pickCount),
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
