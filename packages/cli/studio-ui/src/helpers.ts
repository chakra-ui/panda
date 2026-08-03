import type { JSX } from 'preact'

export interface StudioToken {
  category: string
  path: string
  name: string
  value: string
  conditions?: Record<string, string>
}

export interface StudioView {
  id: string
  label: string
  group: 'tokens' | 'semantic' | 'playground'
}

export const TYPE_CATEGORIES = new Set(['fontSizes', 'fontWeights', 'fonts', 'lineHeights', 'letterSpacings'])
export const SCALE_CATEGORIES = new Set(['spacing', 'sizes', 'breakpoints'])
export const GRID_KIND: Record<string, string> = {
  radii: 'radius',
  borders: 'border',
  shadows: 'shadow',
  blurs: 'blur',
  aspectRatios: 'ratio',
  animations: 'animation',
  easings: 'easing',
  durations: 'duration',
}
export const SAMPLE = 'The quick brown fox jumps over the lazy dog'

const REM_TO_PX = 16

const MIN_BAR_PERCENT = 2
const FULL_BAR_PERCENT = 100

const SRGB_THRESHOLD = 0.03928
const SRGB_LINEAR_DIVISOR = 12.92
const SRGB_OFFSET = 0.055
const SRGB_SCALE = 1.055
const SRGB_GAMMA = 2.4
const LUMA_R = 0.2126
const LUMA_G = 0.7152
const LUMA_B = 0.0722

const CONTRAST_OFFSET = 0.05

export const familyOf = (name: string) => (name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name)
export const shadeOf = (name: string) => (name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : name)
export const byShade = (a: StudioToken, b: StudioToken) =>
  (parseFloat(shadeOf(a.name)) || 0) - (parseFloat(shadeOf(b.name)) || 0)

export function matchesTerm(token: StudioToken, term: string) {
  return `${token.name} ${token.value} ${token.category}`.toLowerCase().includes(term)
}

export function groupFamilies(items: StudioToken[]): Array<[string, StudioToken[]]> {
  const families = new Map<string, StudioToken[]>()
  for (const token of items) {
    const family = familyOf(token.name)
    if (!families.has(family)) families.set(family, [])
    families.get(family)!.push(token)
  }
  return [...families.entries()]
}

export function toPx(value: string) {
  const match = /^([\d.]+)(rem|em|px)$/.exec(value)
  return match ? (match[2] === 'px' ? parseFloat(match[1]) : parseFloat(match[1]) * REM_TO_PX) : NaN
}

function scaleWidth(px: number, min: number, max: number) {
  if (px <= 0) return 0
  if (max <= min) return FULL_BAR_PERCENT
  const ratio = (Math.log(px) - Math.log(min)) / (Math.log(max) - Math.log(min))
  return MIN_BAR_PERCENT + ratio * (FULL_BAR_PERCENT - MIN_BAR_PERCENT)
}

export function scaleRows(items: StudioToken[], sort: 'asc' | 'desc' | 'token') {
  const rows = items
    .filter((token) => !token.name.includes('breakpoint-') && !Number.isNaN(toPx(token.value)))
    .map((token) => ({ token, px: toPx(token.value) }))
  const byPx = rows.slice().sort((a, b) => a.px - b.px)
  const maxPx = byPx.length ? byPx[byPx.length - 1].px || 1 : 1
  const minPx = byPx.find((row) => row.px > 0)?.px ?? maxPx
  const ordered = sort === 'token' ? rows : sort === 'desc' ? byPx.slice().reverse() : byPx
  return ordered.map((row) => ({ ...row, width: scaleWidth(row.px, minPx, maxPx) }))
}

export function typeStyle(category: string, value: string): JSX.CSSProperties {
  switch (category) {
    case 'fontSizes':
      return { fontSize: value }
    case 'fontWeights':
      return { fontWeight: value as JSX.CSSProperties['fontWeight'], fontSize: '1.75rem' }
    case 'fonts':
      return { fontFamily: value, fontSize: '1.75rem' }
    case 'lineHeights':
      return { lineHeight: value, maxWidth: 540 }
    case 'letterSpacings':
      return { letterSpacing: value, fontSize: '1.25rem' }
    default:
      return {}
  }
}

function toRgb(value: string): [number, number, number] {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#000'
  ctx.fillStyle = value
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return [r, g, b]
}

export function luminance(value: string): number {
  const channels = toRgb(value).map((channel) => {
    const c = channel / 255
    return c <= SRGB_THRESHOLD ? c / SRGB_LINEAR_DIVISOR : Math.pow((c + SRGB_OFFSET) / SRGB_SCALE, SRGB_GAMMA)
  })
  return LUMA_R * channels[0] + LUMA_G * channels[1] + LUMA_B * channels[2]
}

export function contrastRatio(fg: string, bg: string): number {
  const a = luminance(fg)
  const b = luminance(bg)
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + CONTRAST_OFFSET) / (lo + CONTRAST_OFFSET)
}
