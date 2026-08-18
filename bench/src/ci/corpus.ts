import {
  importMap,
  SPACING_VALUES,
  SPACING_PROPERTIES,
  CONTAINERS,
  HUE_RANGE,
  GAP_MIN,
  GAP_VARIANTS,
  ICON_GAP,
  EM_STEP,
  CONTAINER_BASE_REM,
  CONTAINER_STEP_REM,
} from './constants'

export interface SourceFile {
  path: string
  source: string
}

export function extractionConfig() {
  return { cwd: '/virtual', outdir: 'styled-system', importMap, jsxFactory: 'styled', jsxFramework: 'react' }
}

export function genFile(i: number): SourceFile {
  const hue = i % HUE_RANGE
  const gap = (i % GAP_VARIANTS) + GAP_MIN
  const iconSize = gap + ICON_GAP
  return {
    path: `/virtual/comp-${i}.tsx`,
    source: `import { css, cva, sva } from '@panda/css'

export const card${i} = css({
  display: 'flex',
  alignItems: 'center',
  gap: '${gap}px',
  padding: '16px',
  color: 'hsl(${hue} 40% 20%)',
  backgroundColor: 'hsl(${hue} 40% 96%)',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 600,
  _hover: { backgroundColor: 'hsl(${hue} 40% 92%)' },
  _focus: { outline: '2px solid hsl(${hue} 60% 45%)' },
  _active: { transform: 'scale(0.99)' },
  _dark: { color: 'hsl(${hue} 40% 92%)', backgroundColor: 'hsl(${hue} 30% 12%)' },
  '& svg': { width: '${iconSize}px', height: '${iconSize}px' },
  '@media (min-width: 768px)': { padding: '24px', fontSize: '16px' },
})

export const button${i} = cva({
  base: { display: 'inline-flex', alignItems: 'center', borderRadius: '6px', fontWeight: 600 },
  variants: {
    size: {
      sm: { padding: '4px 8px', fontSize: '12px' },
      md: { padding: '8px 16px', fontSize: '14px' },
      lg: { padding: '12px 24px', fontSize: '16px' },
    },
    tone: {
      solid: { color: '#fff', backgroundColor: 'hsl(${hue} 60% 45%)' },
      ghost: { color: 'hsl(${hue} 60% 45%)', backgroundColor: 'transparent' },
      outline: { color: 'hsl(${hue} 60% 45%)', border: '1px solid hsl(${hue} 60% 45%)' },
    },
  },
  compoundVariants: [
    { size: 'lg', tone: 'solid', css: { boxShadow: '0 1px 2px hsl(${hue} 60% 30%)' } },
    { size: 'sm', tone: 'ghost', css: { opacity: 0.9 } },
  ],
  defaultVariants: { size: 'md', tone: 'solid' },
})

export const menu${i} = sva({
  slots: ['root', 'item', 'label'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '${gap}px', padding: '8px' },
    item: { display: 'flex', alignItems: 'center', padding: '6px', borderRadius: '4px', _hover: { backgroundColor: 'hsl(${hue} 40% 94%)' } },
    label: { fontSize: '12px', color: 'hsl(${hue} 20% 40%)' },
  },
  variants: {
    size: {
      sm: { item: { padding: '4px', fontSize: '12px' }, label: { fontSize: '10px' } },
      lg: { item: { padding: '10px', fontSize: '16px' }, label: { fontSize: '14px' } },
    },
  },
  defaultVariants: { size: 'sm' },
})
`,
  }
}

export function staticCssConfig() {
  const spacingKeys = Array.from({ length: SPACING_VALUES }, (_, i) => String(i))
  const spacing = Object.fromEntries(spacingKeys.map((key, i) => [key, { value: `${i * EM_STEP}em` }]))
  const names = ['sm', 'md', 'lg', 'xl']
  const containers = Object.fromEntries(
    Array.from({ length: CONTAINERS }, (_, i) => [
      names[i] ?? `c${i}`,
      `${CONTAINER_BASE_REM + i * CONTAINER_STEP_REM}rem`,
    ]),
  )
  const properties = Object.fromEntries(SPACING_PROPERTIES.map((p) => [p, spacingKeys]))
  return {
    cwd: '/virtual',
    outdir: 'styled-system',
    importMap,
    preflight: false,
    theme: { containerNames: ['pb'], containers, tokens: { spacing, sizes: spacing } },
    staticCss: { css: [{ responsive: false, conditions: ['@pb/sm', '@pb/md', '@pb/lg', '@pb/xl'], properties }] },
  }
}
