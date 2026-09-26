import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createNodeDriver, type NodeDriver } from '../../src'
import { createProject } from '../test-utils'

const DEFAULT_CONFIG = `export default { designSystem: '@acme/ds', include: ['**/*.tsx'] }`

const JSX_RECIPE_PRESET = `export default {
  theme: {
    recipes: {
      button: {
        jsx: ['Button'],
        base: { display: 'inline-flex' },
        variants: { size: { sm: { fontSize: '12px' } } },
      },
    },
    slotRecipes: {
      tabs: {
        jsx: ['Tabs'],
        slots: ['root'],
        variants: { size: { sm: { root: { gap: '4px' } } } },
      },
    },
  },
}`

const TREESHAKE_CONFIG = `export default {
  designSystem: '@acme/ds',
  optimize: { treeshakeDesignSystem: true },
  include: ['**/*.{ts,tsx}'],
}`

/** Realistic DS package: cva, sva, styled('div', …), and styled.a(…). */
function componentLibBuildInfo() {
  const lib = createProject()

  lib.parseFileSource(
    'badge.tsx',
    `
import { cva } from '@panda/css'

const badgeRecipe = cva({
  base: { display: 'inline-flex', fontWeight: '600', px: '2', py: '1' },
  variants: {
    tone: {
      success: { color: 'green' },
      danger: { color: 'crimson' },
    },
  },
  defaultVariants: { tone: 'success' },
})

export type BadgeProps = { tone?: 'success' | 'danger'; children: string }

export function Badge({ tone, children }: BadgeProps) {
  return <span className={badgeRecipe({ tone })}>{children}</span>
}
`,
  )

  lib.parseFileSource(
    'alert.tsx',
    `
import { sva } from '@panda/css'

const alertRecipe = sva({
  slots: ['root', 'title', 'description'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '2', padding: '12px', borderRadius: 'md' },
    title: { fontWeight: '700' },
    description: { fontSize: 'sm' },
  },
  variants: {
    status: {
      info: {
        root: { background: 'aliceblue' },
        title: { color: 'navy' },
        description: { color: 'slategray' },
      },
    },
  },
  defaultVariants: { status: 'info' },
})

export type AlertProps = { title: string; description: string }

export function Alert({ title, description }: AlertProps) {
  const styles = alertRecipe({ status: 'info' })
  return (
    <div className={styles.root}>
      <p className={styles.title}>{title}</p>
      <p className={styles.description}>{description}</p>
    </div>
  )
}
`,
  )

  lib.parseFileSource(
    'panel.tsx',
    `
import { styled } from '@panda/jsx'

export const Panel = styled('div', {
  base: {
    background: 'whitesmoke',
    borderRadius: '8px',
    padding: '16px',
  },
  variants: {
    elevated: {
      true: { boxShadow: 'lg' },
    },
  },
  defaultVariants: { elevated: true },
})
`,
  )

  lib.parseFileSource(
    'text-link.tsx',
    `
import { styled } from '@panda/jsx'

export const TextLink = styled.a({
  base: {
    color: 'dodgerblue',
    textDecoration: 'underline',
    fontWeight: '500',
  },
})
`,
  )

  return lib.buildInfo.create({ panda: '^2.0.0' })
}

function jsxRecipeLibBuildInfo() {
  const lib = createProject({
    theme: {
      recipes: {
        button: {
          jsx: ['Button'],
          base: { display: 'inline-flex' },
          variants: { size: { sm: { fontSize: '12px' } } },
        },
      },
      slotRecipes: {
        tabs: {
          jsx: ['Tabs'],
          slots: ['root'],
          variants: { size: { sm: { root: { gap: '4px' } } } },
        },
      },
    },
  })
  lib.parseFileSource(
    'button.tsx',
    "import { Button } from './ui'\nexport function ActionButton() { return <Button size='sm' /> }",
  )
  lib.parseFileSource(
    'tabs.tsx',
    "import { Tabs } from './ui'\nexport function TabBar() { return <Tabs.Root size='sm' /> }",
  )
  return lib.buildInfo.create({ panda: '^2.0.0' })
}

/** Two components in one module — importing either hydrates both. */
function sharedFileLibBuildInfo() {
  const lib = createProject()
  lib.parseFileSource(
    'ui.tsx',
    `
import { cva } from '@panda/css'

const badgeRecipe = cva({
  base: { display: 'inline-flex', color: 'crimson' },
})

const chipRecipe = cva({
  base: { display: 'inline-block', color: 'teal' },
})

export function Badge({ children }: { children: string }) {
  return <span className={badgeRecipe()}>{children}</span>
}

export function Chip({ children }: { children: string }) {
  return <span className={chipRecipe()}>{children}</span>
}
`,
  )
  lib.parseFileSource(
    'orphan.tsx',
    `
import { cva } from '@panda/css'

const orphanRecipe = cva({ base: { color: 'rebeccapurple' } })

export function Orphan() {
  return <span className={orphanRecipe()} />
}
`,
  )
  return lib.buildInfo.create({ panda: '^2.0.0' })
}

function styleLayers(driver: NodeDriver) {
  return {
    recipes: driver.getLayerCss({ layers: ['recipes'] }).css,
    utilities: driver.getLayerCss({ layers: ['utilities'] }).css,
  }
}

describe('hydrateDesignSystem (consumer)', () => {
  let cwd: string | undefined

  afterEach(() => {
    if (cwd) rmSync(cwd, { recursive: true, force: true })
    cwd = undefined
  })

  async function layersWithImport(app: string, buildInfo: unknown, preset?: string) {
    cwd = createFixture({
      config: TREESHAKE_CONFIG,
      app,
      buildInfo,
      ...(preset ? { preset } : {}),
    })
    return styleLayers(await createNodeDriver({ cwd }))
  }

  it('re-extracts manifest files from the manifest dir and warns when build info is stale', async () => {
    cwd = createFixture({
      manifest: { files: ['./button.js'] },
      buildInfo: staleBuildInfo(),
    })

    const driver = await createNodeDriver({ cwd })
    const stale = (driver.designSystemDiagnostics ?? []).find((d) => d.code === 'design_system_buildinfo_stale')

    expect({
      severity: stale?.severity,
      category: stale?.category,
      file: stale?.file?.split('/').at(-1),
      message: stale?.message,
      help: stale?.help,
    }).toMatchInlineSnapshot(`
      {
        "severity": "warning",
        "category": "designSystem",
        "file": "buildinfo.json",
        "message": ""@acme/ds" build info uses schemaVersion 999; expected 6. Re-extracted 1 source file.",
        "help": [
          "Run \`panda lib\` in "@acme/ds" to rebuild panda/buildinfo.json.",
        ],
      }
    `)
    expect(driver.cssgen().css).toContain('rebeccapurple')

    writeFileTree(cwd, {
      'node_modules/@acme/ds/dist/button.js': "import { css } from '@acme/ds/css'\ncss({ color: 'dodgerblue' })",
    })

    expect(driver.syncDesignSystemSources()).toEqual([true])
    expect(driver.cssgen().css).toContain('rebeccapurple')
    expect(driver.cssgen().css).toContain('dodgerblue')
  })

  it('throws (fail-closed) when build info is stale and the manifest has no files fallback', async () => {
    cwd = createFixture({ buildInfo: staleBuildInfo() })

    await expect(createNodeDriver({ cwd })).rejects.toMatchObject({
      diagnostics: [
        {
          code: 'design_system_buildinfo_stale',
          severity: 'error',
          message: expect.stringMatching(/uses schemaVersion 999; expected 6\. No fallback source files/),
        },
      ],
    })
  })

  it('fails closed when the manifest Panda range is incompatible even when files are present', async () => {
    cwd = createFixture({ manifest: { panda: '^999.0.0', files: ['./button.js'] } })

    await expect(createNodeDriver({ cwd })).rejects.toMatchObject({
      diagnostics: [{ code: 'design_system_peer_range_unsatisfied', severity: 'error' }],
    })
  })

  it('re-extracts when build info is structurally invalid but files are present', async () => {
    cwd = createFixture({
      manifest: { files: ['./button.js'] },
      buildInfo: { schemaVersion: 6 },
    })

    const driver = await createNodeDriver({ cwd })
    const stale = (driver.designSystemDiagnostics ?? []).find((d) => d.code === 'design_system_buildinfo_stale')
    expect(stale?.message).toMatch(/malformed or corrupt\. Re-extracted 1 source file\./)
    expect(driver.cssgen().css).toContain('rebeccapurple')
  })

  it('reports a build-info read failure separately from schema and structure failures', async () => {
    cwd = createFixture({
      manifest: { files: ['./button.js'] },
      buildInfo: '{ invalid json',
    })

    const driver = await createNodeDriver({ cwd })
    const stale = (driver.designSystemDiagnostics ?? []).find((d) => d.code === 'design_system_buildinfo_stale')
    expect(stale?.message).toMatch(/could not be read:.*Re-extracted 1 source file\./)
  })

  it('re-extracts source with consumer class-name options instead of loading incompatible build info', async () => {
    cwd = createFixture({
      config: `export default { designSystem: '@acme/ds', hash: true, include: ['**/*.tsx'] }`,
      manifest: { files: ['./button.js'] },
    })

    const driver = await createNodeDriver({ cwd })
    const diagnostic = (driver.designSystemDiagnostics ?? []).find(
      (entry) => entry.code === 'design_system_option_mismatch',
    )

    expect({
      severity: diagnostic?.severity,
      category: diagnostic?.category,
      message: diagnostic?.message,
      help: diagnostic?.help,
    }).toMatchInlineSnapshot(`
      {
        "severity": "warning",
        "category": "designSystem",
        "message": ""@acme/ds" was built with different hash. Re-extracted 1 source file with the consumer options.",
        "help": [
          "Match hash with "@acme/ds", or rebuild it with \`panda lib\`.",
        ],
      }
    `)
    expect(driver.cssgen().css).toContain('rebeccapurple')
  })

  it('fails closed on class-name option mismatch when no fallback sources are published', async () => {
    cwd = createFixture({
      config: `export default { designSystem: '@acme/ds', hash: true, include: ['**/*.tsx'] }`,
    })

    await expect(createNodeDriver({ cwd })).rejects.toMatchObject({
      diagnostics: [
        {
          code: 'design_system_option_mismatch',
          severity: 'error',
          message: expect.stringContaining('No fallback source files were available'),
        },
      ],
    })
  })

  it('keeps runtime token references from hydrated build info during token pruning', async () => {
    cwd = createFixture({
      app: 'export const App = () => null',
      manifest: { importMap: { tokens: '@acme/ds/tokens' } },
      preset: `export default {
        optimize: { removeUnusedTokens: true },
        theme: {
          tokens: {
            colors: {
              red: { value: '#f00' },
              blue: { value: '#00f' },
            },
          },
        },
      }`,
      buildInfo: {
        schemaVersion: 6,
        panda: '^2.0.0',
        configFingerprint: 'cfg1-test',
        strings: ['colors.red'],
        atoms: [],
        tokenRefs: [0],
        modules: { 'tokens.ts': { tokenRefs: [0] } },
      },
    })

    const css = (await createNodeDriver({ cwd })).cssgen().css
    expect(css).toContain('--colors-red: #f00')
    expect(css).not.toContain('--colors-blue')
  })

  it('groups token conflicts from one design system into one informational diagnostic', async () => {
    cwd = createFixture({
      config: `export default {
        designSystem: '@acme/ds',
        include: ['**/*.tsx'],
        theme: {
          tokens: {
            colors: {
              brand: { value: 'red' },
              accent: { value: 'red' },
              muted: { value: 'red' },
              surface: { value: 'red' },
            },
          },
        },
      }`,
      manifest: { files: ['./**/*.{js,mjs}'] },
      preset: `export default {
        theme: {
          tokens: {
            colors: {
              brand: { value: 'blue' },
              accent: { value: 'blue' },
              muted: { value: 'blue' },
              surface: { value: 'blue' },
            },
          },
        },
      }`,
      buildInfo: staleBuildInfo(),
    })

    const driver = await createNodeDriver({ cwd })
    const conflicts = (driver.designSystemDiagnostics ?? []).filter((d) => d.code === 'design_system_token_conflict')

    expect(conflicts.map(({ code, severity, message }) => ({ code, severity, message }))).toMatchInlineSnapshot(`
      [
        {
          "code": "design_system_token_conflict",
          "severity": "info",
          "message": "4 token paths are defined by both "@acme/ds" and this config ("colors.accent", "colors.brand", "colors.muted" and 1 more); the local values win.",
        },
      ]
    `)
  })

  describe('treeshakeDesignSystem', () => {
    it('tracks exports for cva, sva, and styled factory components', () => {
      expect(componentLibBuildInfo().exports).toMatchInlineSnapshot(`
        {
          "Alert": "alert.tsx",
          "Badge": "badge.tsx",
          "Panel": "panel.tsx",
          "TextLink": "text-link.tsx",
        }
      `)
    })

    it('hydrates a cva Badge without unused sva / styled modules', async () => {
      await expect(
        layersWithImport(
          "import { Badge } from '@acme/ds'\nexport const App = () => <Badge tone='danger'>New</Badge>",
          componentLibBuildInfo(),
        ),
      ).resolves.toMatchInlineSnapshot(`
        {
          "recipes": "",
          "utilities": "@layer utilities {
          .color_crimson {
            color: crimson;
          }
          .color_green {
            color: green;
          }
          .display_inline-flex {
            display: inline-flex;
          }
          .font-weight_600 {
            font-weight: 600;
          }
          .px_2 {
            px: 2px;
          }
          .py_1 {
            py: 1px;
          }
        }
        ",
        }
      `)
    })

    it('hydrates an sva Alert without unused cva / styled modules', async () => {
      await expect(
        layersWithImport(
          "import { Alert } from '@acme/ds'\nexport const App = () => <Alert title='Heads up' description='Details' />",
          componentLibBuildInfo(),
        ),
      ).resolves.toMatchInlineSnapshot(`
        {
          "recipes": "",
          "utilities": "@layer utilities {
          .background_aliceblue {
            background: aliceblue;
          }
          .padding_12px {
            padding: 12px;
          }
          .border-radius_md {
            border-radius: md;
          }
          .gap_2 {
            gap: 2px;
          }
          .color_navy {
            color: navy;
          }
          .color_slategray {
            color: slategray;
          }
          .display_flex {
            display: flex;
          }
          .flex-direction_column {
            flex-direction: column;
          }
          .font-size_sm {
            font-size: sm;
          }
          .font-weight_700 {
            font-weight: 700;
          }
        }
        ",
        }
      `)
    })

    it('hydrates styled("div", …) Panel without unused siblings', async () => {
      await expect(
        layersWithImport(
          "import { Panel } from '@acme/ds'\nexport const App = () => <Panel elevated>Content</Panel>",
          componentLibBuildInfo(),
        ),
      ).resolves.toMatchInlineSnapshot(`
        {
          "recipes": "",
          "utilities": "@layer utilities {
          .background_whitesmoke {
            background: whitesmoke;
          }
          .padding_16px {
            padding: 16px;
          }
          .border-radius_8px {
            border-radius: 8px;
          }
          .box-shadow_lg {
            box-shadow: lg;
          }
        }
        ",
        }
      `)
    })

    it('hydrates styled.a TextLink without unused siblings', async () => {
      await expect(
        layersWithImport(
          "import { TextLink } from '@acme/ds'\nexport const App = () => <TextLink href='/docs'>Docs</TextLink>",
          componentLibBuildInfo(),
        ),
      ).resolves.toMatchInlineSnapshot(`
        {
          "recipes": "",
          "utilities": "@layer utilities {
          .text-decoration_underline {
            text-decoration: underline;
          }
          .color_dodgerblue {
            color: dodgerblue;
          }
          .font-weight_500 {
            font-weight: 500;
          }
        }
        ",
        }
      `)
    })

    it('hydrates export-from re-exports of those components', async () => {
      await expect(layersWithImport("export { Alert as Notice } from '@acme/ds'", componentLibBuildInfo())).resolves
        .toMatchInlineSnapshot(`
        {
          "recipes": "",
          "utilities": "@layer utilities {
          .background_aliceblue {
            background: aliceblue;
          }
          .padding_12px {
            padding: 12px;
          }
          .border-radius_md {
            border-radius: md;
          }
          .gap_2 {
            gap: 2px;
          }
          .color_navy {
            color: navy;
          }
          .color_slategray {
            color: slategray;
          }
          .display_flex {
            display: flex;
          }
          .flex-direction_column {
            flex-direction: column;
          }
          .font-size_sm {
            font-size: sm;
          }
          .font-weight_700 {
            font-weight: 700;
          }
        }
        ",
        }
      `)
    })

    it('hydrates the whole module when multiple components share a file', async () => {
      const buildInfo = sharedFileLibBuildInfo()
      expect(buildInfo.exports).toMatchInlineSnapshot(`
        {
          "Badge": "ui.tsx",
          "Chip": "ui.tsx",
          "Orphan": "orphan.tsx",
        }
      `)

      // Importing Badge alone still pulls Chip (same module), but not Orphan.
      await expect(
        layersWithImport("import { Badge } from '@acme/ds'\nexport const App = () => <Badge>New</Badge>", buildInfo),
      ).resolves.toMatchInlineSnapshot(`
        {
          "recipes": "",
          "utilities": "@layer utilities {
          .color_crimson {
            color: crimson;
          }
          .color_teal {
            color: teal;
          }
          .display_inline-block {
            display: inline-block;
          }
          .display_inline-flex {
            display: inline-flex;
          }
        }
        ",
        }
      `)
    })

    it('hydrates JSX config recipes without unused slot recipes', async () => {
      const buildInfo = jsxRecipeLibBuildInfo()
      expect(buildInfo.exports).toMatchInlineSnapshot(`
        {
          "ActionButton": "button.tsx",
          "TabBar": "tabs.tsx",
        }
      `)

      await expect(
        layersWithImport(
          "import { ActionButton } from '@acme/ds'\nexport const App = ActionButton",
          buildInfo,
          JSX_RECIPE_PRESET,
        ),
      ).resolves.toMatchInlineSnapshot(`
        {
          "recipes": "@layer recipes {
          @layer base {
            .button {
              display: inline-flex;
            }
          }
          @layer variants {
            .button--size_sm {
              font-size: 12px;
            }
          }
        }
        ",
          "utilities": "",
        }
      `)
    })

    it('hydrates JSX slot recipes without unused config recipes', async () => {
      await expect(
        layersWithImport(
          "import { TabBar } from '@acme/ds'\nexport const App = TabBar",
          jsxRecipeLibBuildInfo(),
          JSX_RECIPE_PRESET,
        ),
      ).resolves.toMatchInlineSnapshot(`
        {
          "recipes": "@layer recipes.slots {
          @layer variants {
            .tabs__root--size_sm {
              gap: 4px;
            }
          }
        }
        ",
          "utilities": "",
        }
      `)
    })

    it('hydrates nothing when the app does not import the design system', async () => {
      await expect(layersWithImport('export const App = () => null', componentLibBuildInfo())).resolves
        .toMatchInlineSnapshot(`
        {
          "recipes": "",
          "utilities": "",
        }
      `)
    })

    it('hydrates every module when treeshakeDesignSystem is off', async () => {
      cwd = createFixture({
        config: `export default { designSystem: '@acme/ds', include: ['**/*.{ts,tsx}'] }`,
        app: "import { Badge } from '@acme/ds'\nexport const App = () => <Badge>New</Badge>",
        buildInfo: componentLibBuildInfo(),
      })
      await expect(createNodeDriver({ cwd }).then((d) => styleLayers(d))).resolves.toMatchInlineSnapshot(`
        {
          "recipes": "",
          "utilities": "@layer utilities {
          .background_aliceblue {
            background: aliceblue;
          }
          .background_whitesmoke {
            background: whitesmoke;
          }
          .padding_12px {
            padding: 12px;
          }
          .padding_16px {
            padding: 16px;
          }
          .border-radius_8px {
            border-radius: 8px;
          }
          .border-radius_md {
            border-radius: md;
          }
          .gap_2 {
            gap: 2px;
          }
          .text-decoration_underline {
            text-decoration: underline;
          }
          .box-shadow_lg {
            box-shadow: lg;
          }
          .color_crimson {
            color: crimson;
          }
          .color_dodgerblue {
            color: dodgerblue;
          }
          .color_green {
            color: green;
          }
          .color_navy {
            color: navy;
          }
          .color_slategray {
            color: slategray;
          }
          .display_flex {
            display: flex;
          }
          .display_inline-flex {
            display: inline-flex;
          }
          .flex-direction_column {
            flex-direction: column;
          }
          .font-size_sm {
            font-size: sm;
          }
          .font-weight_500 {
            font-weight: 500;
          }
          .font-weight_600 {
            font-weight: 600;
          }
          .font-weight_700 {
            font-weight: 700;
          }
          .px_2 {
            px: 2px;
          }
          .py_1 {
            py: 1px;
          }
        }
        ",
        }
      `)
    })

    it('hydrates every module for namespace imports', async () => {
      await expect(
        layersWithImport(
          "import * as DS from '@acme/ds'\nexport const App = () => <DS.Badge>New</DS.Badge>",
          componentLibBuildInfo(),
        ),
      ).resolves.toMatchInlineSnapshot(`
        {
          "recipes": "",
          "utilities": "@layer utilities {
          .background_aliceblue {
            background: aliceblue;
          }
          .background_whitesmoke {
            background: whitesmoke;
          }
          .padding_12px {
            padding: 12px;
          }
          .padding_16px {
            padding: 16px;
          }
          .border-radius_8px {
            border-radius: 8px;
          }
          .border-radius_md {
            border-radius: md;
          }
          .gap_2 {
            gap: 2px;
          }
          .text-decoration_underline {
            text-decoration: underline;
          }
          .box-shadow_lg {
            box-shadow: lg;
          }
          .color_crimson {
            color: crimson;
          }
          .color_dodgerblue {
            color: dodgerblue;
          }
          .color_green {
            color: green;
          }
          .color_navy {
            color: navy;
          }
          .color_slategray {
            color: slategray;
          }
          .display_flex {
            display: flex;
          }
          .display_inline-flex {
            display: inline-flex;
          }
          .flex-direction_column {
            flex-direction: column;
          }
          .font-size_sm {
            font-size: sm;
          }
          .font-weight_500 {
            font-weight: 500;
          }
          .font-weight_600 {
            font-weight: 600;
          }
          .font-weight_700 {
            font-weight: 700;
          }
          .px_2 {
            px: 2px;
          }
          .py_1 {
            py: 1px;
          }
        }
        ",
        }
      `)
    })

    it('hydrates every module for export * from', async () => {
      await expect(layersWithImport("export * from '@acme/ds'", componentLibBuildInfo())).resolves
        .toMatchInlineSnapshot(`
        {
          "recipes": "",
          "utilities": "@layer utilities {
          .background_aliceblue {
            background: aliceblue;
          }
          .background_whitesmoke {
            background: whitesmoke;
          }
          .padding_12px {
            padding: 12px;
          }
          .padding_16px {
            padding: 16px;
          }
          .border-radius_8px {
            border-radius: 8px;
          }
          .border-radius_md {
            border-radius: md;
          }
          .gap_2 {
            gap: 2px;
          }
          .text-decoration_underline {
            text-decoration: underline;
          }
          .box-shadow_lg {
            box-shadow: lg;
          }
          .color_crimson {
            color: crimson;
          }
          .color_dodgerblue {
            color: dodgerblue;
          }
          .color_green {
            color: green;
          }
          .color_navy {
            color: navy;
          }
          .color_slategray {
            color: slategray;
          }
          .display_flex {
            display: flex;
          }
          .display_inline-flex {
            display: inline-flex;
          }
          .flex-direction_column {
            flex-direction: column;
          }
          .font-size_sm {
            font-size: sm;
          }
          .font-weight_500 {
            font-weight: 500;
          }
          .font-weight_600 {
            font-weight: 600;
          }
          .font-weight_700 {
            font-weight: 700;
          }
          .px_2 {
            px: 2px;
          }
          .py_1 {
            py: 1px;
          }
        }
        ",
        }
      `)
    })

    it('re-hydrates when consumer imports change (watch sync)', async () => {
      cwd = createFixture({
        config: TREESHAKE_CONFIG,
        app: "import { Badge } from '@acme/ds'\nexport const App = () => <Badge>New</Badge>",
        buildInfo: componentLibBuildInfo(),
      })
      const driver = await createNodeDriver({ cwd })
      const appPath = join(cwd, 'App.tsx')

      expect(driver.syncDesignSystemTreeShake()).toBe(false)
      expect(styleLayers(driver)).toMatchInlineSnapshot(`
        {
          "recipes": "",
          "utilities": "@layer utilities {
          .color_crimson {
            color: crimson;
          }
          .color_green {
            color: green;
          }
          .display_inline-flex {
            display: inline-flex;
          }
          .font-weight_600 {
            font-weight: 600;
          }
          .px_2 {
            px: 2px;
          }
          .py_1 {
            py: 1px;
          }
        }
        ",
        }
      `)

      // In-memory content only (Vite HMR) — must win over the stale Badge on disk.
      const next =
        "import { Alert } from '@acme/ds'\nexport const App = () => <Alert title='Heads up' description='Details' />"
      driver.applyChange({ path: appPath, kind: 'change', content: next })

      expect(styleLayers(driver)).toMatchInlineSnapshot(`
        {
          "recipes": "",
          "utilities": "@layer utilities {
          .background_aliceblue {
            background: aliceblue;
          }
          .padding_12px {
            padding: 12px;
          }
          .border-radius_md {
            border-radius: md;
          }
          .gap_2 {
            gap: 2px;
          }
          .color_navy {
            color: navy;
          }
          .color_slategray {
            color: slategray;
          }
          .display_flex {
            display: flex;
          }
          .flex-direction_column {
            flex-direction: column;
          }
          .font-size_sm {
            font-size: sm;
          }
          .font-weight_700 {
            font-weight: 700;
          }
        }
        ",
        }
      `)
      expect(driver.syncDesignSystemTreeShake()).toBe(false)
    })

    async function swapBadgeImportForAlert() {
      cwd = createFixture({
        config: TREESHAKE_CONFIG,
        app: ["import { Badge } from '@acme/ds'", 'export const App = () => <Badge>New</Badge>'].join('\n'),
        buildInfo: componentLibBuildInfo(),
      })
      const root = cwd
      const driver = await createNodeDriver({ cwd: root })

      driver.cssgen()
      driver.applyChange({
        path: join(root, 'App.tsx'),
        kind: 'change',
        content: [
          "import { Alert } from '@acme/ds'",
          "export const App = () => <Alert title='Heads up' description='Details' />",
        ].join('\n'),
      })

      return { driver, root }
    }

    function expectSyncedToAlertImport(driver: NodeDriver) {
      expect(driver.syncDesignSystemTreeShake()).toBe(false)
      expect(driver.getLayerCss({ layers: ['utilities'] }).css).toContain('.background_aliceblue')
      expect(driver.getLayerCss({ layers: ['utilities'] }).css).not.toContain('.color_crimson')
    }

    it('syncs changed design-system imports before cssgen emits CSS', async () => {
      const { driver } = await swapBadgeImportForAlert()

      driver.cssgen()

      expectSyncedToAlertImport(driver)
    })

    it('syncs changed design-system imports before getLayerCss emits CSS', async () => {
      const { driver } = await swapBadgeImportForAlert()

      driver.getLayerCss({ layers: ['utilities'] })

      expectSyncedToAlertImport(driver)
    })

    it('syncs changed design-system imports before getKeyframeCss emits CSS', async () => {
      const { driver } = await swapBadgeImportForAlert()

      driver.getKeyframeCss()

      expectSyncedToAlertImport(driver)
    })

    it('syncs changed design-system imports before getSplitCss emits CSS', async () => {
      const { driver } = await swapBadgeImportForAlert()

      driver.getSplitCss()

      expectSyncedToAlertImport(driver)
    })

    it('syncs changed design-system imports before writeCss emits CSS', async () => {
      const { driver, root } = await swapBadgeImportForAlert()

      driver.writeCss({ outfile: join(root, 'styles.css') })

      expectSyncedToAlertImport(driver)
    })

    it('syncs changed design-system imports before writeLayerCss emits CSS', async () => {
      const { driver, root } = await swapBadgeImportForAlert()

      driver.writeLayerCss({ outfile: join(root, 'utilities.css'), layers: ['utilities'] })

      expectSyncedToAlertImport(driver)
    })

    it('syncs changed design-system imports before writeSplitCss emits CSS', async () => {
      const { driver, root } = await swapBadgeImportForAlert()

      driver.writeSplitCss({ outdir: join(root, 'split') })

      expectSyncedToAlertImport(driver)
    })

    it('does not treat styled-system subpath imports as design-system components', async () => {
      await expect(
        layersWithImport(
          "import { css } from '@acme/ds/css'\nimport { token } from '@acme/ds/tokens'\ncss({ color: 'red' })\ntoken('colors.red')",
          componentLibBuildInfo(),
        ),
      ).resolves.toMatchInlineSnapshot(`
        {
          "recipes": "",
          "utilities": "",
        }
      `)
    })

    it('hydrates every module for dynamic import()', async () => {
      await expect(layersWithImport("const ds = await import('@acme/ds')\nexport { ds }", componentLibBuildInfo()))
        .resolves.toMatchInlineSnapshot(`
        {
          "recipes": "",
          "utilities": "@layer utilities {
          .background_aliceblue {
            background: aliceblue;
          }
          .background_whitesmoke {
            background: whitesmoke;
          }
          .padding_12px {
            padding: 12px;
          }
          .padding_16px {
            padding: 16px;
          }
          .border-radius_8px {
            border-radius: 8px;
          }
          .border-radius_md {
            border-radius: md;
          }
          .gap_2 {
            gap: 2px;
          }
          .text-decoration_underline {
            text-decoration: underline;
          }
          .box-shadow_lg {
            box-shadow: lg;
          }
          .color_crimson {
            color: crimson;
          }
          .color_dodgerblue {
            color: dodgerblue;
          }
          .color_green {
            color: green;
          }
          .color_navy {
            color: navy;
          }
          .color_slategray {
            color: slategray;
          }
          .display_flex {
            display: flex;
          }
          .display_inline-flex {
            display: inline-flex;
          }
          .flex-direction_column {
            flex-direction: column;
          }
          .font-size_sm {
            font-size: sm;
          }
          .font-weight_500 {
            font-weight: 500;
          }
          .font-weight_600 {
            font-weight: 600;
          }
          .font-weight_700 {
            font-weight: 700;
          }
          .px_2 {
            px: 2px;
          }
          .py_1 {
            py: 1px;
          }
        }
        ",
        }
      `)
    })

    it('hydrates a deep subpath import via module key', async () => {
      await expect(
        layersWithImport(
          "import { Badge } from '@acme/ds/badge'\nexport const App = () => <Badge>New</Badge>",
          componentLibBuildInfo(),
        ),
      ).resolves.toMatchInlineSnapshot(`
        {
          "recipes": "",
          "utilities": "@layer utilities {
          .color_crimson {
            color: crimson;
          }
          .color_green {
            color: green;
          }
          .display_inline-flex {
            display: inline-flex;
          }
          .font-weight_600 {
            font-weight: 600;
          }
          .px_2 {
            px: 2px;
          }
          .py_1 {
            py: 1px;
          }
        }
        ",
        }
      `)
    })
  })

  describe('treeshakeDesignSystem with a stacked design system', () => {
    // App → @acme/ui → @acme/ds, where @acme/ds ships Button (color: red), Icon (width: 20px), Badge (color: blue).

    it('keeps @acme/ds Icon styles when the app uses an @acme/ui component that wraps Icon', async () => {
      cwd = createStackedFixture({
        ui: {
          'index.tsx': ["export { Icon } from '@acme/ds'", "export { CheckIcon } from './check-icon'"].join('\n'),
          'check-icon.tsx': [
            "import { Icon } from '@acme/ds'",
            "export const CheckIcon = () => <Icon name='check' />",
          ].join('\n'),
        },
        app: ["import { CheckIcon } from '@acme/ui'", 'export const App = () => <CheckIcon />'].join('\n'),
      })

      expect(styleLayers(await createNodeDriver({ cwd })).utilities).toMatchInlineSnapshot(`
        "@layer utilities {
          .width_20px {
            width: 20px;
          }
        }
        "
      `)
    })

    it('keeps @acme/ds Icon styles when the app imports Icon re-exported from @acme/ui', async () => {
      cwd = createStackedFixture({
        ui: {
          'index.tsx': ["export { Icon } from '@acme/ds'", "export { CheckIcon } from './check-icon'"].join('\n'),
          'check-icon.tsx': [
            "import { Icon } from '@acme/ds'",
            "export const CheckIcon = () => <Icon name='check' />",
          ].join('\n'),
        },
        app: ["import { Icon } from '@acme/ui'", 'export const App = () => <Icon />'].join('\n'),
      })

      expect(styleLayers(await createNodeDriver({ cwd })).utilities).toMatchInlineSnapshot(`
        "@layer utilities {
          .width_20px {
            width: 20px;
          }
        }
        "
      `)
    })

    it('keeps all of @acme/ds when @acme/ui was built without recording which @acme/ds components it uses', async () => {
      cwd = createStackedFixture({
        ui: {
          'index.tsx': ["export { Icon } from '@acme/ds'", "export { CheckIcon } from './check-icon'"].join('\n'),
          'check-icon.tsx': [
            "import { Icon } from '@acme/ds'",
            "export const CheckIcon = () => <Icon name='check' />",
          ].join('\n'),
        },
        uiTracksDependencies: false,
        app: ["import { CheckIcon } from '@acme/ui'", 'export const App = () => <CheckIcon />'].join('\n'),
      })

      expect(styleLayers(await createNodeDriver({ cwd })).utilities).toMatchInlineSnapshot(`
        "@layer utilities {
          .color_blue {
            color: blue;
          }
          .color_red {
            color: red;
          }
          .width_20px {
            width: 20px;
          }
        }
        "
      `)
    })

    it('keeps only Button styles when the app imports Button straight from @acme/ds, next to an older @acme/ui build', async () => {
      cwd = createStackedFixture({
        ui: {
          'index.tsx': ["export { Icon } from '@acme/ds'", "export { CheckIcon } from './check-icon'"].join('\n'),
          'check-icon.tsx': [
            "import { Icon } from '@acme/ds'",
            "export const CheckIcon = () => <Icon name='check' />",
          ].join('\n'),
        },
        uiTracksDependencies: false,
        app: ["import { Button } from '@acme/ds'", 'export const App = () => <Button />'].join('\n'),
      })

      expect(styleLayers(await createNodeDriver({ cwd })).utilities).toMatchInlineSnapshot(`
        "@layer utilities {
          .color_red {
            color: red;
          }
        }
        "
      `)
    })

    it('keeps Button and Icon styles when @acme/ui forwards @acme/ds with export *', async () => {
      cwd = createStackedFixture({
        ui: {
          'index.tsx': ["export * from '@acme/ds'", "export { CheckIcon } from './check-icon'"].join('\n'),
          'check-icon.tsx': [
            "import { Icon } from '@acme/ds'",
            "export const CheckIcon = () => <Icon name='check' />",
          ].join('\n'),
        },
        app: [
          "import { Button, CheckIcon } from '@acme/ui'",
          'export const App = () => <><Button /><CheckIcon /></>',
        ].join('\n'),
      })

      expect(styleLayers(await createNodeDriver({ cwd })).utilities).toMatchInlineSnapshot(`
        "@layer utilities {
          .color_red {
            color: red;
          }
          .width_20px {
            width: 20px;
          }
        }
        "
      `)
    })

    it('drops Button styles when only an unused @acme/ui Toolbar imports @acme/ds as a namespace', async () => {
      cwd = createStackedFixture({
        ui: {
          'toolbar.tsx': ["import * as DS from '@acme/ds'", 'export const Toolbar = () => <DS.Button />'].join('\n'),
          'check-icon.tsx': [
            "import { Icon } from '@acme/ds'",
            "export const CheckIcon = () => <Icon name='check' />",
          ].join('\n'),
        },
        app: ["import { CheckIcon } from '@acme/ui'", 'export const App = () => <CheckIcon />'].join('\n'),
      })

      expect(styleLayers(await createNodeDriver({ cwd })).utilities).toMatchInlineSnapshot(`
        "@layer utilities {
          .width_20px {
            width: 20px;
          }
        }
        "
      `)
    })

    it('keeps all of @acme/ds when the app uses it through a namespace @acme/ui re-exports', async () => {
      cwd = createStackedFixture({
        ui: {
          'index.tsx': ["export * as DS from '@acme/ds'", "export { CheckIcon } from './check-icon'"].join('\n'),
          'check-icon.tsx': [
            "import { Icon } from '@acme/ds'",
            "export const CheckIcon = () => <Icon name='check' />",
          ].join('\n'),
        },
        app: [
          "import { DS, CheckIcon } from '@acme/ui'",
          'export const App = () => <><DS.Button /><CheckIcon /></>',
        ].join('\n'),
      })

      expect(styleLayers(await createNodeDriver({ cwd })).utilities).toMatchInlineSnapshot(`
        "@layer utilities {
          .color_blue {
            color: blue;
          }
          .color_red {
            color: red;
          }
          .width_20px {
            width: 20px;
          }
        }
        "
      `)
    })

    it('emits no @acme/ds styles when the app does not import either design system', async () => {
      cwd = createStackedFixture({
        ui: {
          'index.tsx': ["export { Icon } from '@acme/ds'", "export { CheckIcon } from './check-icon'"].join('\n'),
          'check-icon.tsx': [
            "import { Icon } from '@acme/ds'",
            "export const CheckIcon = () => <Icon name='check' />",
          ].join('\n'),
        },
        app: 'export const App = () => null',
      })

      expect(styleLayers(await createNodeDriver({ cwd })).utilities).toMatchInlineSnapshot(`""`)
    })
  })

  it('warns on a conflict after resolving mixed token authoring forms', async () => {
    cwd = createFixture({
      config: `export default {
        designSystem: '@acme/ds',
        include: ['**/*.tsx'],
        theme: {
          extend: {
            tokens: {
              colors: {
                brand: { value: 'red' },
              },
            },
          },
        },
      }`,
      manifest: { files: ['./**/*.{js,mjs}'] },
      preset: `export default {
        theme: {
          tokens: {
            colors: {
              brand: { value: 'blue' },
            },
          },
        },
      }`,
      buildInfo: staleBuildInfo(),
    })

    const driver = await createNodeDriver({ cwd })
    const conflicts = (driver.designSystemDiagnostics ?? []).filter((d) => d.code === 'design_system_token_conflict')

    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].message).toContain('colors.brand')
  })
})

interface DesignSystemFixture {
  config?: string
  app?: string
  manifest?: Record<string, unknown>
  preset?: string
  source?: string
  buildInfo?: unknown
}

function createFixture(options: DesignSystemFixture = {}): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-hydrate-')))
  const buildInfo =
    typeof options.buildInfo === 'string' ? options.buildInfo : json(options.buildInfo ?? validBuildInfo())

  writeFileTree(root, {
    'panda.config.ts': options.config ?? DEFAULT_CONFIG,
    'App.tsx': options.app ?? "import { css } from '@panda/css'; css({ color: 'red' })",
    'node_modules/@acme/ds/package.json': json({
      name: '@acme/ds',
      version: '1.0.0',
      exports: { './panda/*': './dist/panda/*' },
    }),
    'node_modules/@acme/ds/dist/panda/lib.json': json({
      schemaVersion: 1,
      name: '@acme/ds',
      version: '1.0.0',
      panda: '^2.0.0',
      preset: './preset.mjs',
      buildInfo: './buildinfo.json',
      importMap: { css: '@acme/ds/css' },
      ...options.manifest,
    }),
    'node_modules/@acme/ds/dist/panda/preset.mjs': options.preset ?? `export default { theme: { tokens: {} } }`,
    'node_modules/@acme/ds/dist/button.js':
      options.source ?? "import { css } from '@acme/ds/css'\ncss({ color: 'rebeccapurple' })",
    'node_modules/@acme/ds/dist/panda/buildinfo.json': buildInfo,
  })

  return root
}

const ACME_DS_FILES: Record<string, string> = {
  'button.tsx': [
    "import { css } from '@panda/css'",
    "export const Button = () => <button className={css({ color: 'red' })} />",
  ].join('\n'),
  'icon.tsx': [
    "import { css } from '@panda/css'",
    "const iconClass = css({ width: '20px' })",
    'export const Icon = () => <svg className={iconClass} />',
  ].join('\n'),
  'badge.tsx': [
    "import { css } from '@panda/css'",
    "const badgeClass = css({ color: 'blue' })",
    'export const Badge = () => <div className={badgeClass} />',
  ].join('\n'),
}

function libBuildInfo(files: Record<string, string>, { dependsOnAcmeDs = false } = {}) {
  const lib = createProject()
  for (const [path, source] of Object.entries(files)) lib.parseFileSource(path, source)
  return lib.buildInfo.create({
    panda: '^2.0.0',
    ...(dependsOnAcmeDs
      ? {
          designSystemDependencies: [
            { name: '@acme/ds', packageRoots: ['@acme/ds'], excludeModules: ['@acme/ds/css'] },
          ],
        }
      : {}),
  })
}

interface StackedFixture {
  /** `@acme/ui` source files; `@acme/ui` extends `@acme/ds`. */
  ui: Record<string, string>
  /** `false` simulates an `@acme/ui` build that did not record its `@acme/ds` usage. */
  uiTracksDependencies?: boolean
  app: string
}

function createStackedFixture(options: StackedFixture): string {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'panda-ds-stacked-')))
  const lib = (name: string, buildInfo: unknown, parent?: string) => ({
    [`node_modules/${name}/package.json`]: json({
      name,
      version: '1.0.0',
      exports: { './panda/*': './dist/panda/*' },
    }),
    [`node_modules/${name}/dist/panda/lib.json`]: json({
      schemaVersion: 1,
      name,
      version: '1.0.0',
      panda: '^2.0.0',
      preset: './preset.mjs',
      buildInfo: './buildinfo.json',
      importMap: { css: `${name}/css` },
      ...(parent ? { designSystem: parent } : {}),
    }),
    [`node_modules/${name}/dist/panda/preset.mjs`]: 'export default {}',
    [`node_modules/${name}/dist/panda/buildinfo.json`]: json(buildInfo),
  })

  writeFileTree(root, {
    'panda.config.ts': `export default {
      designSystem: '@acme/ui',
      optimize: { treeshakeDesignSystem: true },
      include: ['**/*.tsx'],
    }`,
    'App.tsx': options.app,
    ...lib('@acme/ds', libBuildInfo(ACME_DS_FILES)),
    ...lib('@acme/ui', libBuildInfo(options.ui, { dependsOnAcmeDs: options.uiTracksDependencies ?? true }), '@acme/ds'),
  })

  return root
}

function validBuildInfo(): Record<string, unknown> {
  return {
    schemaVersion: 6,
    panda: '^2.0.0',
    configFingerprint: 'cfg1-test',
    strings: [],
    atoms: [],
    modules: {},
  }
}

function staleBuildInfo(): Record<string, unknown> {
  return { schemaVersion: 999, modules: {}, atoms: [] }
}

function writeFileTree(root: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    const target = join(root, path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, content)
  }
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2)
}
