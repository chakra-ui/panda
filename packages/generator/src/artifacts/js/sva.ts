import { ArtifactFile } from '../artifact-map'

export const svaJsArtifact = new ArtifactFile({
  id: 'css/sva.js',
  fileName: 'sva',
  type: 'js',
  dir: (ctx) => ctx.paths.css,
  dependencies: ['syntax'],
  imports: {
    'helpers.js': ['compact', 'getSlotRecipes', 'memo', 'splitProps'],
    'css/cva.js': ['cva'],
    'css/cx.js': ['cx'],
  },
  computed(ctx) {
    return { isTemplateLiteralSyntax: ctx.isTemplateLiteralSyntax }
  },
  code(params) {
    if (params.computed.isTemplateLiteralSyntax) return

    return `
    const slotClass = (className, slot) => className + '__' + slot

    export function sva(config) {
      const slots = Object.entries(getSlotRecipes(config)).map(([slot, slotCva]) => [slot, cva(slotCva)])
      const defaultVariants = config.defaultVariants ?? {}

      function svaFn(props) {
        const result = slots.map(([slot, cvaFn]) => [slot, cx(cvaFn(props), config.className && slotClass(config.className, slot))])
        return Object.fromEntries(result)
      }

      function raw(props) {
        const result = slots.map(([slot, cvaFn]) => [slot, cvaFn.raw(props)])
        return Object.fromEntries(result)
      }

      const variants = config.variants ?? {};
      const variantKeys = Object.keys(variants);

      function splitVariantProps(props) {
        return splitProps(props, variantKeys);
      }
      const getVariantProps = (variants) => ({ ...(defaultVariants || {}), ...compact(variants) })

      const variantMap = Object.fromEntries(
        Object.entries(variants).map(([key, value]) => [key, Object.keys(value)])
      );

      return Object.assign(memo(svaFn), {
        __cva__: false,
        raw,
        variantMap,
        variantKeys,
        splitVariantProps,
        getVariantProps,
      })
    }`
  },
})

export const svaDtsArtifact = new ArtifactFile({
  id: 'css/sva.d.ts',
  fileName: 'sva',
  type: 'dts',
  dir: (ctx) => ctx.paths.css,
  dependencies: [],
  importsType: {
    'types/recipe.d.ts': ['SlotRecipeCreatorFn'],
  },
  code() {
    return `export declare const sva: SlotRecipeCreatorFn`
  },
})
