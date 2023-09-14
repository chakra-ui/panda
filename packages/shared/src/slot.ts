export const getSlotRecipes = (recipe: Record<string, any> = {}): Record<string, any> => {
  const init = (slot: string) => ({
    className: [recipe.className, slot].filter(Boolean).join('__'),
    base: recipe.base?.[slot] ?? {},
    variants: {},
    defaultVariants: recipe.defaultVariants ?? {},
    compoundVariants: recipe.compoundVariants ? getSlotCompoundVariant(recipe.compoundVariants, slot) : [],
  })

  const slots = recipe.slots ?? []
  const recipeParts = slots.map((slot: any) => [slot, init(slot)]) as [string, any][]

  for (const [variantsKey, variantsSpec] of Object.entries(recipe.variants ?? {})) {
    for (const [variantKey, variantSpec] of Object.entries(variantsSpec as Record<string, any>)) {
      recipeParts.forEach(([slot, slotRecipe]) => {
        slotRecipe.variants[variantsKey] ??= {}
        slotRecipe.variants[variantsKey][variantKey] = variantSpec[slot] ?? {}
      })
    }
  }

  return Object.fromEntries(recipeParts)
}

export const getSlotCompoundVariant = <T extends { css: any }>(compoundVariants: T[], slotName: string) =>
  compoundVariants
    .filter((compoundVariant) => compoundVariant.css[slotName])
    .map((compoundVariant) => ({ ...compoundVariant, css: compoundVariant.css[slotName] }))
