import { defineRecipe } from '@pandacss/dev'

// Split out of panda.config.ts on purpose — completions should work here too, not just in
// the config's own file. Try it: same as the recipe example that used to live inline.
export const buttonRecipe = defineRecipe({
  className: 'button',
  base: {
    // Try it: put your cursor on a new line here and start typing — "pa" -> padding,
    // "anim" -> animationName, "_h" -> the hover condition, "sm" -> the breakpoint.
    color: 'blue.500',
  },
  variants: {
    size: {
      sm: {
        padding: '4',
        color: 'red.500',
        // Try it: put your cursor on a new line here and start typing — a condition value
        // ({color: 're'}) is itself a style object, so it gets the same suggestions as base.
        _hover: {
          color: 'red.500',
        },
        // Try it: retype the "re" below — this is a utility's own inline conditional value
        // (base/sm/md/... map to backgroundColor's own values, not nested style objects), so
        // you should see backgroundColor's colors suggested, not more utility/condition names.
        backgroundColor: { base: 'blue.500', sm: 're' },
      },
    },
  },
})
