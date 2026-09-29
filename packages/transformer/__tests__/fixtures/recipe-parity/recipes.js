import { cva, sva } from '@panda/css'

// A shorthand in the base and its longhand in a variant set the same property.
export const shorthand = cva({
  base: { bg: 'red', color: 'white' },
  variants: {
    tone: { blue: { backgroundColor: 'blue' }, green: { bg: 'green', color: 'black' } },
  },
})

// The same property under conditions nested in different orders.
export const conditions = cva({
  base: { color: 'red', _hover: { color: 'blue', md: { color: 'purple' } } },
  variants: {
    size: {
      sm: { fontSize: '12px', md: { _hover: { color: 'green' } } },
      lg: { fontSize: '16px', _hover: { color: 'orange' } },
    },
  },
})

// Compounds that override base and variant values, with array conditions and boolean variants.
export const compounds = cva({
  base: { padding: '2px', color: 'red' },
  variants: {
    size: { sm: { padding: '4px' }, md: { padding: '6px' }, lg: { padding: '8px' } },
    tone: { solid: { color: 'white', bg: 'blue' }, ghost: { color: 'blue' } },
    disabled: { true: { opacity: '0.5' }, false: { opacity: '1' } },
  },
  compoundVariants: [
    { size: 'sm', tone: 'ghost', css: { padding: '1px', color: 'gray' } },
    { size: ['md', 'lg'], disabled: true, css: { bg: 'gray' } },
    { tone: 'solid', css: { color: 'yellow' } },
  ],
  defaultVariants: { size: 'md', disabled: false },
})

// Important values and a variant that overrides one.
export const important = cva({
  base: { color: 'red!', margin: '2px' },
  variants: { tone: { blue: { color: 'blue' }, loud: { color: 'black!', margin: '4px!' } } },
})

export const tabs = sva({
  slots: ['root', 'trigger', 'indicator'],
  className: 'tabs',
  base: { root: { display: 'flex' }, trigger: { color: 'red', bg: 'white' } },
  variants: {
    size: { sm: { trigger: { padding: '4px' } }, lg: { trigger: { padding: '8px', backgroundColor: 'black' } } },
    fitted: { true: { root: { width: '100%' }, trigger: { flex: '1' } } },
  },
  compoundVariants: [{ size: 'lg', fitted: true, css: { trigger: { padding: '12px' }, indicator: { color: 'blue' } } }],
  defaultVariants: { size: 'sm' },
})

// Compounds compare values strictly, so a number and its string spelling select different compounds.
export const grid = cva({
  base: { display: 'grid' },
  variants: {
    cols: { 1: { padding: '1px' }, 2: { padding: '2px' } },
    dense: { true: { margin: '0' }, false: { margin: '4px' } },
  },
  compoundVariants: [
    { cols: 2, css: { color: 'red' } },
    { cols: '1', css: { color: 'blue' } },
    { dense: 'true', css: { opacity: '0.5' } },
  ],
  defaultVariants: { cols: 2 },
})
