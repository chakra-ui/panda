import { expect, test } from 'bun:test'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dir, '..')
const classes = (value: string) => value.split(' ').sort()

test('bun run build.ts bundles the components with inlined classes and emits the stylesheet', () => {
  const build = Bun.spawnSync(['bun', 'run', 'build.ts'], { cwd: root })
  expect(build.exitCode).toBe(0)
  expect(existsSync(join(root, 'styled-system/css/index.js'))).toBe(true)

  const js = readFileSync(join(root, 'dist/index.js'), 'utf8')
  // Static css() objects become class strings; cva() calls compile down to string variant maps.
  expect(js).not.toContain("display: 'grid'")
  expect(js).toContain('variants: { tone: { brand: "bg_brand text_surface", plain: "bg_surface text_ink" }')
  expect(js).toContain('variants: { gap: { sm: "gap_8px", md: "gap_16px", lg: "gap_24px" } }')

  const css = readdirSync(join(root, 'dist'))
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(join(root, 'dist', file), 'utf8'))
    .join('\n')
  expect(css).toContain('--colors-brand')
  expect(css).toContain('.bg_brand')
  expect(css).toContain('.p_4px_12px')
  expect(css).toContain('.rounded_999px')
  expect(css).toContain('.gap_24px')
})

test('the built components resolve their classes at runtime', async () => {
  const ui = await import(join(root, 'dist/index.js'))

  expect(classes(ui.button())).toEqual(
    classes('d_inline-flex items_center gap_8px rounded_8px font_600 bg_brand text_surface p_8px_16px fs_16px'),
  )
  expect(classes(ui.button({ tone: 'plain', size: 'sm' }))).toEqual(
    classes('d_inline-flex items_center gap_8px rounded_8px font_600 bg_surface text_ink p_4px_12px fs_14px'),
  )
  expect(classes(ui.badge({ tone: 'muted' }))).toEqual(
    classes('d_inline-flex items_center rounded_999px p_2px_8px fs_12px font_600 bg_muted text_surface'),
  )
  expect(classes(ui.card)).toEqual(classes('d_grid gap_12px p_24px rounded_16px bg_surface text_ink'))
  expect(classes(ui.stack())).toEqual(classes('d_flex flex_column gap_16px'))
  expect(classes(ui.stack({ gap: 'lg' }))).toEqual(classes('d_flex flex_column gap_24px'))
})
