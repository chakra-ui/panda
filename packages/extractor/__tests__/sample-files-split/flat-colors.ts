import type { NonUndefined } from 'pastable/typings'
import type { Keys } from 'ts-toolbelt/out/Any/Keys'
import type { KnownKeys } from 'ts-toolbelt/out/Any/KnownKeys'
import type { UnionOf } from 'ts-toolbelt/out/Object/UnionOf'
import { colors } from './color-palette'

export const flatColors = flatMapColorsWithVariants(colors)

type ChakraThemeColors = typeof colors

type PossibleThemeColorKey = SimpleColors | PossibleColorWithVariants

type AppThemeColorMap = {
  [P in keyof ChakraThemeColors[keyof ChakraThemeColors] as PossibleThemeColorKey]: string
}

type SimpleColors = NonObjectKeys<ChakraThemeColors>
type ColorsWithVariants = NonStringKeys<ChakraThemeColors>

type ColorsMapWithTheirVariants = {
  [Prop in ColorsWithVariants]: Exclude<KnownKeys<ChakraThemeColors[Prop]>, 'DEFAULT'>
}
type ColorsMapWithTheirVariantsAndDefault = {
  [Color in Keys<ColorsMapWithTheirVariants>]: `${Color}.${ColorsMapWithTheirVariants[Color]}`
}
type PossibleColorWithVariants = UnionOf<ColorsMapWithTheirVariantsAndDefault>

// Inspired by https://github.com/kesne/vanilla-tailwind/blob/main/src/theme.css.ts
function chakraColorVariantsToRecordOfAppThemeColorKeys<T extends keyof ColorsMapWithTheirVariantsAndDefault>(name: T) {
  return Object.fromEntries(
    Object.entries(colors[name]).map(([num, value]) => [num === 'DEFAULT' ? name : `${name}.${num}`, value]),
  ) as Record<T, ColorsMapWithTheirVariantsAndDefault[T]>
}

function flatMapColorsWithVariants(themeColors: ChakraThemeColors) {
  const themeMap = {} as AppThemeColorMap

  let key: keyof typeof themeColors
  for (key in themeColors) {
    if (typeof themeColors[key] === 'string') {
      themeMap[key as SimpleColors] = (themeColors[key] as string) + ' !important'
    } else {
      const colorMap = chakraColorVariantsToRecordOfAppThemeColorKeys(key as keyof ColorsMapWithTheirVariantsAndDefault)
      let colorVariant: ColorsWithVariants
      for (colorVariant in colorMap) {
        themeMap[colorVariant as PossibleColorWithVariants] = colorMap[colorVariant] + ' !important'
      }
    }
  }

  return themeMap
}

type NonObjectKeys<T extends object> = {
  [K in keyof T]-?: NonUndefined<T[K]> extends object ? never : K
}[keyof T]
type NonStringKeys<T extends object> = {
  [K in keyof T]-?: NonUndefined<T[K]> extends string ? never : K
}[keyof T]
