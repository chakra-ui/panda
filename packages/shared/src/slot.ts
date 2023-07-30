import { walkObject } from './walk-object'

const assign = (obj: Record<string, any>, path: string[], value: any) => {
  const last = path.pop()
  const target = path.reduce((acc, key) => {
    if (acc[key] == null) acc[key] = {}
    return acc[key]
  }, obj)
  if (last != null) target[last] = value
}

export const getSlotRecipes = (recipe: any) => {
  const parts = recipe.slots
    .map((slot: string) => [
      slot,
      // setup base recipe
      {
        // create class-base on BEM
        className: [recipe.className ?? '', slot].join('__'),
        base: {},
        variants: {},
        defaultVariants: recipe.defaultVariants ?? {},
        compoundVariants: [],
      },
    ])
    .map(([slot, cva]: [string, any]) => {
      // assign base styles
      const base = recipe.base[slot]
      if (base) cva.base = base

      // assign variants
      walkObject(recipe.variants, (variant: any, path: string[]) => assign(cva, ['variants', ...path], variant[slot]), {
        stop: (_value, path) => path.includes(slot),
      })

      // assign compound variants
      recipe.compoundVariants?.forEach((compoundVariant: any) => {
        const slotCss = compoundVariant.css[slot]
        if (!slotCss) return
        cva.compoundVariants.push({ ...compoundVariant, css: slotCss })
      })

      return [slot, cva]
    })

  return Object.fromEntries(parts)
}
