import { ArtifactFile } from '../artifact'

export const cssConditionsJsArtifact = new ArtifactFile({
  id: 'css/conditions.js',
  fileName: 'conditions',
  type: 'js',
  dir: (ctx) => ctx.paths.css,
  dependencies: ['conditions', 'theme.breakpoints', 'theme.containerNames', 'theme.containerSizes'],
  imports: {
    'helpers.js': ['withoutSpace'],
  },
  computed(ctx) {
    return { keys: Object.keys(ctx.conditions.values).concat('base') }
  },
  code(params) {
    return `
    const conditionsStr = "${params.computed.keys.join(',')}"
    const conditions = new Set(conditionsStr.split(','))

    export function isCondition(value){
      return conditions.has(value) || /^@|&|&$/.test(value)
    }

    const underscoreRegex = /^_/
    const conditionsSelectorRegex = /&|@/

    export function finalizeConditions(paths){
      return paths.map((path) => {
        if (conditions.has(path)){
          return path.replace(underscoreRegex, '')
        }

        if (conditionsSelectorRegex.test(path)){
          return \`[\${withoutSpace(path.trim())}]\`
        }

        return path
      })}

      export function sortConditions(paths){
        return paths.sort((a, b) => {
          const aa = isCondition(a)
          const bb = isCondition(b)
          if (aa && !bb) return 1
          if (!aa && bb) return -1
          return 0
        })
      }
      `
  },
})

export const typesConditionsDtsArtifact = new ArtifactFile({
  id: 'types/conditions.d.ts',
  fileName: 'conditions',
  type: 'dts',
  dir: (ctx) => ctx.paths.types,
  dependencies: ['conditions', 'theme.breakpoints', 'theme.containerNames', 'theme.containerSizes'],
  imports: {
    'types/selectors.d.ts': ['AnySelector', 'Selectors'],
  },
  computed(ctx) {
    return {
      conditions: ctx.conditions,
    }
  },
  code(params) {
    const conditions = params.computed.conditions
    const keys = Object.keys(conditions.values).concat('base')

    return `
    export interface Conditions {
      ${keys
        .map(
          (key) =>
            `\t${
              key === 'base'
                ? `/** The base (=no conditions) styles to apply  */\n`
                : conditions.get(key)
                  ? `/** \`${([] as string[]).concat(conditions.get(key) ?? '').join(' ')}\` */\n`
                  : ''
            }\t${JSON.stringify(key)}: string`,
        )
        .join('\n')}
      }

      export type ConditionalValue<V> =
        | V
        | Array<V | null>
        | {
            [K in keyof Conditions]?: ConditionalValue<V>
          }

      export type Nested<P> = P & {
        [K in Selectors]?: Nested<P>
      } & {
        [K in AnySelector]?: Nested<P>
      } & {
        [K in keyof Conditions]?: Nested<P>
      }`
  },
})
