import type { ParserResult, ReportInstanceItem, ReportItem } from '@pandacss/types'
import type { PandaContext } from './create-context'
import type { ResultItem } from '@pandacss/types'

type BoxNodeMap = ReportInstanceItem['box']

const createReportMaps = () => {
  const byId = new Map<ReportItem['id'], ReportItem>()
  const byInstanceId = new Map<ReportInstanceItem['instanceId'], ReportInstanceItem>()

  const byInstanceOfKind = new Map<'function' | 'component', Set<ReportInstanceItem['instanceId']>>()
  const byPropertyName = new Map<string, Set<ReportItem['id']>>()
  const byConditionName = new Map<string, Set<ReportItem['id']>>()
  const byShorthand = new Map<string, Set<ReportItem['id']>>()
  const byTokenName = new Map<string, Set<ReportItem['id']>>()
  const byPropertyPath = new Map<string, Set<ReportItem['id']>>()
  const fromKind = new Map<'function' | 'component', Set<ReportItem['id']>>()
  const byType = new Map<string, Set<ReportItem['id']>>()
  const byInstanceName = new Map<string, Set<ReportItem['id']>>()

  return {
    byId,
    byInstanceId,
    byInstanceOfKind,
    byPropertyName,
    byConditionName,
    byShorthand,
    byTokenName,
    byPropertyPath,
    fromKind,
    byType,
    byInstanceName,
  }
}

type ReportMaps = ReturnType<typeof createReportMaps>

export const classifyTokens = (ctx: PandaContext, parserResultByFilepath: Map<string, ParserResult>) => {
  const byFilepath = new Map<string, Set<ReportItem>>()
  const byInstanceInFilepath = new Map<string, Set<ReportInstanceItem>>()

  const globalMaps = createReportMaps()
  const mapsByFilePath = new Map<string, ReportMaps>()

  const conditions = new Map(Object.entries(ctx.conditions.values))
  let id = 0,
    instanceId = 0

  parserResultByFilepath.forEach((parserResult, filepath) => {
    if (parserResult.isEmpty()) return

    const localMaps = createReportMaps()

    const addTo = (map: Map<string, Set<any>>, key: string, value: any) => {
      const set = map.get(key) ?? new Set()
      set.add(value)
      map.set(key, set)
    }

    const processMap = (
      map: BoxNodeMap,
      current: string[],
      { from, type, kind }: { from: ReportItem['from']; type: ReportItem['type']; kind: ReportItem['kind'] },
    ) => {
      map.value.forEach((attrNode, attrName) => {
        if (attrNode.isLiteral() || attrNode.isEmptyInitializer()) {
          const value = attrNode.isLiteral() ? (attrNode.value as string) : true
          const reportItem = {
            id: id++,
            from,
            type,
            kind,
            filepath,
            path: current,
            value,
            box: attrNode,
          } as ReportItem // TODO satisfies

          if (conditions.has(attrName)) {
            addTo(globalMaps.byConditionName, attrName, reportItem.id)
            addTo(localMaps.byConditionName, attrName, reportItem.id)
          } else {
            const propName = ctx.utility.shorthands.get(attrName) ?? attrName

            addTo(globalMaps.byPropertyName, propName, reportItem.id)
            addTo(localMaps.byPropertyName, propName, reportItem.id)

            if (ctx.utility.shorthands.has(attrName)) {
              addTo(globalMaps.byShorthand, attrName, reportItem.id)
              addTo(localMaps.byShorthand, attrName, reportItem.id)
            }
          }

          if (current.length) {
            addTo(globalMaps.byPropertyPath, current.concat(attrName).join('.'), reportItem.id)
            addTo(localMaps.byPropertyPath, current.concat(attrName).join('.'), reportItem.id)
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
          globalMaps.byId.set(reportItem.id, reportItem)
          localMaps.byId.set(reportItem.id, reportItem)

          return
        }

        if (attrNode.isMap() && attrNode.value.size) {
          return processMap(attrNode, current.concat(attrName), { from, type, kind })
        }
      })
    }

    const processResultItem = (item: ResultItem, kind: ReportItem['kind']) => {
      if (!item.box || item.box.isUnresolvable()) {
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
      } as ReportInstanceItem // TODO satisfies

      if (item.box.isList()) {
        addTo(byInstanceInFilepath, filepath, reportInstanceItem.instanceId)

        // console.log(item)
        return reportInstanceItem
      }

      if (item.box.isMap() && item.box.value.size) {
        addTo(byInstanceInFilepath, filepath, reportInstanceItem.instanceId)

        processMap(item.box, [], { from, type, kind })
        return reportInstanceItem
      }
    }

    const processComponentResultItem = (item: ResultItem) => {
      const reportInstanceItem = processResultItem(item, 'component')
      if (!reportInstanceItem) return

      addTo(globalMaps.byInstanceOfKind, 'component', reportInstanceItem.instanceId)
      addTo(localMaps.byInstanceOfKind, 'component', reportInstanceItem.instanceId)

      globalMaps.byInstanceId.set(reportInstanceItem.instanceId, reportInstanceItem)
      localMaps.byInstanceId.set(reportInstanceItem.instanceId, reportInstanceItem)
    }

    const processFunctionResultItem = (item: ResultItem) => {
      const reportInstanceItem = processResultItem(item, 'function')
      if (!reportInstanceItem) return

      addTo(globalMaps.byInstanceOfKind, 'function', reportInstanceItem.instanceId)
      addTo(localMaps.byInstanceOfKind, 'function', reportInstanceItem.instanceId)

      globalMaps.byInstanceId.set(reportInstanceItem.instanceId, reportInstanceItem)
      localMaps.byInstanceId.set(reportInstanceItem.instanceId, reportInstanceItem)
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

    mapsByFilePath.set(filepath, localMaps)
  })

  const pickCount = 3
  const filesWithMostInstance = Array.from(byInstanceInFilepath.entries())
    .map(([filepath, list]) => [filepath, list.size] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, pickCount)

  const filesWithMostPropValueCombinations = Array.from(byFilepath.entries())
    .map(([token, list]) => [token, list.size] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, pickCount)

  const mostUsedPropNames = Array.from(globalMaps.byPropertyName.entries())
    .map(([propName, list]) => [propName, list.size] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, pickCount)
  const mostUsedTokens = Array.from(globalMaps.byTokenName.entries())
    .map(([token, list]) => [token, list.size] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, pickCount)

  const mostUsedShorthands = Array.from(globalMaps.byShorthand.entries())
    .map(([shorthand, list]) => [shorthand, list.size] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, pickCount)

  const mostUsedPropertyPaths = Array.from(globalMaps.byPropertyPath.entries())
    .map(([propertyPath, list]) => [propertyPath, list.size] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, pickCount)

  const mostUsedTypes = Array.from(globalMaps.byType.entries())
    .map(([type, list]) => [type, list.size] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, pickCount)

  const mostUsedInstanceNames = Array.from(globalMaps.byInstanceName.entries())
    .map(([componentName, list]) => [componentName, list.size] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, pickCount)

  const mostUsedFromKinds = Array.from(globalMaps.fromKind.entries())
    .map(([kind, list]) => [kind, list.size] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, pickCount)

  const mostUsedInstanceOfKinds = Array.from(globalMaps.byInstanceOfKind.entries())
    .map(([kind, list]) => [kind, list.size] as const)
    .sort((a, b) => b[1] - a[1])
    .slice(0, pickCount)

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
    },
    stats: {
      //
      filesWithMostInstance,
      filesWithMostPropValueCombinations,
      //
      mostUsedPropNames,
      mostUsedTokens,
      mostUsedShorthands,
      mostUsedPropertyPaths,
      mostUsedTypes,
      mostUsedInstanceNames,
      mostUsedFromKinds,
      mostUsedInstanceOfKinds,
    },
    details: {
      globalMaps,
      mapsByFilePath,
      byFilepath,
      byInstanceInFilepath,
    },
  }
}
