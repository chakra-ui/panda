import { expect, test } from 'vitest'
import { createUsageReport, summarizeTokenUsage } from '@pandacss/compiler-shared'
import { createPresetCompiler } from './preset-compiler'
import { createProject } from './test-utils'

test('configured and selected styles contribute requirements without changing source counts or project state', () => {
  const compiler = createPresetCompiler({
    globalCss: { body: { animation: 'globalMotion', color: 'brand' } },
    staticCss: { css: [{ properties: { animationName: ['staticMotion'] } }], recipes: { badge: [{}] } },
    theme: {
      extend: {
        tokens: {
          colors: { brand: { value: '{colors.red.500}' } },
          animations: { globalMotion: { value: 'globalFrame 1s' } },
        },
        keyframes: {
          globalFrame: { to: { opacity: 1 } },
          staticMotion: { to: { opacity: 1 } },
          recipeMotion: { to: { opacity: 1 } },
          selectedMotion: { to: { opacity: 1 } },
          unusedMotion: { to: { opacity: 1 } },
        },
        recipes: {
          badge: { className: 'badge', base: { animationName: 'recipeMotion' } },
          button: {
            className: 'button',
            variants: { size: { sm: { animationName: 'selectedMotion' }, lg: { animationName: 'unusedMotion' } } },
          },
          unused: { className: 'unused', base: { animationName: 'unusedMotion' } },
        },
      },
    },
  })
  const files = [
    { path: '/virtual/index.ts', source: `import { button } from '@panda/recipes'; button({ size: 'sm' })` },
  ]
  compiler.parseFileSource(
    '/virtual/existing.ts',
    `import { css } from '@panda/css'; css({ animationName: 'unusedMotion' })`,
  )
  const before = compiler.summary()
  const cssBefore = compiler.compile().css
  const result = compiler.inspectUsageRequirements(files)
  expect(result.diagnostics).toEqual([])
  expect(compiler.summary()).toEqual(before)
  expect(compiler.compile().css).toBe(cssBefore)
  expect(result.requirements.filter((entry) => entry.kind !== 'utility')).toMatchInlineSnapshot(`
    [
      {
        "kind": "keyframe",
        "name": "globalFrame",
        "reasons": [
          "via animations.globalMotion",
        ],
      },
      {
        "kind": "keyframe",
        "name": "recipeMotion",
        "reasons": [
          "staticCss.recipes.badge",
        ],
      },
      {
        "kind": "keyframe",
        "name": "selectedMotion",
        "reasons": [
          "recipes.button",
        ],
      },
      {
        "kind": "keyframe",
        "name": "staticMotion",
        "reasons": [
          "staticCss.css",
        ],
      },
      {
        "kind": "recipe",
        "name": "badge",
        "reasons": [
          "staticCss.recipes.badge",
        ],
      },
      {
        "kind": "token",
        "name": "animations.globalMotion",
        "reasons": [
          "globalCss",
        ],
      },
      {
        "kind": "token",
        "name": "colors.brand",
        "reasons": [
          "globalCss",
        ],
      },
      {
        "kind": "token",
        "name": "colors.red.500",
        "reasons": [
          "via colors.brand",
        ],
      },
    ]
  `)
  const inspection = compiler.inspectFiles(files)
  const source = createUsageReport(inspection, { spec: compiler.spec() })
  const report = createUsageReport(inspection, { spec: compiler.spec(), requirements: result.requirements })
  expect(report.sourceUsages).toEqual(source.sourceUsages)
  expect(report.files).toEqual(source.files)
  expect(report.usages).toEqual(source.usages)
  expect(report.views?.keyframes.unused).toContain('unusedMotion')
  expect(report.views?.keyframes.unused).not.toContain('globalFrame')
  expect(report.views?.recipes.unused).toContain('unused')
  expect(report.views?.recipes.unused).not.toContain('badge')
  expect(report.views?.tokens.unused).not.toContain('colors.brand')
  expect(summarizeTokenUsage(report).find((row) => row.type === 'colors')?.tokens).toContainEqual({
    name: 'brand',
    uses: 1,
    config: ['globalCss'],
  })
})

test.each([false, true])(
  'requirements follow default variants, slot recipes and compound selection (smart=%s)',
  (smart) => {
    const compiler = createPresetCompiler({
      optimize: { smartCompoundVariants: smart },
      theme: {
        extend: {
          keyframes: {
            defaultMotion: { to: { opacity: 1 } },
            compoundMotion: { to: { opacity: 1 } },
            slotMotion: { to: { opacity: 1 } },
          },
          recipes: {
            button: {
              className: 'button',
              defaultVariants: { size: 'sm' },
              variants: { size: { sm: { animationName: 'defaultMotion' }, lg: {} } },
              compoundVariants: [{ size: 'lg', css: { animationName: 'compoundMotion' } }],
            },
          },
          slotRecipes: {
            card: { className: 'card', slots: ['root'], base: { root: { animationName: 'slotMotion' } } },
          },
        },
      },
    })
    const files = [
      { path: '/virtual/index.ts', source: `import { button, card } from '@panda/recipes'; button({}); card({})` },
    ]
    const result = compiler.inspectUsageRequirements(files)
    const expected = smart ? ['defaultMotion', 'slotMotion'] : ['compoundMotion', 'defaultMotion', 'slotMotion']
    expect(result.requirements.filter((entry) => entry.kind === 'keyframe').map((entry) => entry.name)).toEqual(
      expected,
    )
    compiler.parseFileSource(files[0].path, files[0].source)
    const emitted = [...compiler.compile().css.matchAll(/@keyframes ([\w-]+)/g)].map((match) => match[1])
    for (const name of expected) expect(emitted).toContain(name)
  },
)

test('static patterns and utility callbacks contribute their lowered dependencies', () => {
  const compiler = createPresetCompiler({
    patterns: {
      motion: {
        properties: { name: { type: 'enum', value: ['pulse'] } },
        transform: (props) => ({ animationName: props.name }),
      },
    },
    utilities: { motion: { values: ['pulse'], transform: (value) => ({ animationName: value }) } },
    staticCss: {
      patterns: { motion: [{ properties: { name: ['pulse'] } }] },
      css: [{ properties: { motion: ['pulse'] } }],
    },
  })
  const result = compiler.inspectUsageRequirements([])
  expect(result.diagnostics).toEqual([])
  expect(result.requirements.filter((entry) => entry.kind === 'keyframe' || entry.kind === 'pattern'))
    .toMatchInlineSnapshot(`
    [
      {
        "kind": "keyframe",
        "name": "pulse",
        "reasons": [
          "staticCss.css",
          "staticCss.patterns",
        ],
      },
      {
        "kind": "pattern",
        "name": "motion",
        "reasons": [
          "staticCss.patterns.motion",
        ],
      },
    ]
  `)
})

test('tokens referenced from every kind of config style are required, unless that style is never selected', () => {
  const compiler = createPresetCompiler({
    globalCss: { body: { color: 'global', textStyle: 'lead', layerStyle: 'panel' } },
    globalVars: { '--app-shadow': '{colors.globalVar}' },
    staticCss: { css: [{ properties: { color: ['staticUtility'] } }], recipes: { badge: [{}] } },
    theme: {
      extend: {
        tokens: {
          colors: {
            global: { value: '#000' },
            globalVar: { value: '#001' },
            panel: { value: '#002' },
            keyframe: { value: '#003' },
            recipeBase: { value: '#004' },
            recipeVariant: { value: '#005' },
            recipeUnselectedVariant: { value: '#006' },
            compound: { value: '#007' },
            slot: { value: '#008' },
            staticUtility: { value: '#009' },
            staticRecipe: { value: '#010' },
            unselectedRecipe: { value: '#011' },
            base: { value: '#012' },
            orphanBase: { value: '#013' },
          },
          fontSizes: { lead: { value: '33px' } },
        },
        semanticTokens: {
          colors: {
            alias: { value: '{colors.base}' },
            orphan: { value: '{colors.orphanBase}' },
          },
        },
        textStyles: { lead: { value: { fontSize: 'lead' } } },
        layerStyles: { panel: { value: { background: 'panel' } } },
        keyframes: { flash: { to: { color: '{colors.keyframe}' } } },
        animationStyles: { entrance: { value: { animationName: 'flash' } } },
        recipes: {
          button: {
            className: 'button',
            base: { color: 'recipeBase', borderColor: 'alias' },
            variants: {
              tone: { solid: { color: 'recipeVariant' }, ghost: { color: 'recipeUnselectedVariant' } },
            },
            compoundVariants: [{ tone: 'solid', css: { outlineColor: 'compound' } }],
          },
          badge: { className: 'badge', base: { color: 'staticRecipe' } },
          unused: { className: 'unused', base: { color: 'unselectedRecipe' } },
        },
        slotRecipes: {
          card: { className: 'card', slots: ['root'], base: { root: { color: 'slot' } } },
        },
      },
    },
  })
  const files = [
    {
      path: '/virtual/index.ts',
      source: [
        `import { button, card } from '@panda/recipes'`,
        `import { css } from '@panda/css'`,
        `button({ tone: 'solid' })`,
        `card({})`,
        `css({ animationStyle: 'entrance' })`,
      ].join('\n'),
    },
  ]
  const result = compiler.inspectUsageRequirements(files)
  expect(result.diagnostics).toEqual([])
  expect(
    result.requirements
      .filter((entry) => entry.kind === 'composition' || /^(colors|fontSizes)\.[a-z]/i.test(entry.name))
      .filter((entry) => entry.kind !== 'token' || !/\.\d|\.(black|white|transparent|current)/.test(entry.name))
      .map((entry) => `${entry.kind} ${entry.name} <- ${entry.reasons.join(', ')}`),
  ).toMatchInlineSnapshot(`
    [
      "composition animationStyles.entrance <- sources",
      "composition layerStyles.panel <- globalCss",
      "composition textStyles.lead <- globalCss",
      "token colors.alias <- recipes.button",
      "token colors.base <- via colors.alias",
      "token colors.compound <- recipes.button",
      "token colors.global <- globalCss",
      "token colors.globalVar <- globalVars",
      "token colors.keyframe <- via keyframes.flash",
      "token colors.panel <- via layerStyles.panel",
      "token colors.recipeBase <- recipes.button",
      "token colors.recipeVariant <- recipes.button",
      "token colors.slot <- recipes.card",
      "token colors.staticRecipe <- staticCss.recipes.badge",
      "token colors.staticUtility <- staticCss.css",
      "token fontSizes.lead <- via textStyles.lead",
    ]
  `)

  const inspection = compiler.inspectFiles(files)
  const report = createUsageReport(inspection, { spec: compiler.spec(), requirements: result.requirements })
  const unusedColors = report.views?.tokens.unused.filter((path) => /^colors\.[a-z]+$/i.test(path))
  expect(unusedColors).toEqual(
    expect.arrayContaining([
      'colors.orphan',
      'colors.orphanBase',
      'colors.recipeUnselectedVariant',
      'colors.unselectedRecipe',
    ]),
  )
  for (const path of ['colors.global', 'colors.keyframe', 'colors.slot', 'colors.base', 'colors.staticRecipe']) {
    expect(unusedColors).not.toContain(path)
  }
  expect(report.views?.compositions.items).toEqual([
    { name: 'animationStyles.entrance', uses: 1, files: 1 },
    { name: 'layerStyles.panel', uses: 1, files: 0, config: ['globalCss'] },
    { name: 'textStyles.lead', uses: 1, files: 0, config: ['globalCss'] },
  ])
  expect(report.views?.compositions.unused).not.toContain('textStyles.lead')
  expect(report.views?.keyframes.items).toMatchInlineSnapshot(`
    [
      {
        "name": "flash",
        "uses": 1,
        "files": 0,
        "config": [
          "via animationStyles.entrance",
        ],
      },
    ]
  `)
})

test('margin and other function-valued utilities report the spacing tokens written in source', () => {
  const compiler = createPresetCompiler()
  const result = compiler.inspectFile({
    path: '/virtual/a.ts',
    source: `import { css } from '@panda/css'; css({ mt: '8', mx: '-4', pt: '6' })`,
  })
  expect(result.usages.filter((usage) => usage.kind === 'token').map((usage) => usage.name)).toEqual([
    'spacing.8',
    'spacing.4',
    'spacing.6',
  ])
})

test('a semantic token defined only for a condition is used when config references it', () => {
  const compiler = createPresetCompiler({
    globalCss: { body: { color: 'onlyDark' } },
    theme: {
      extend: {
        tokens: { colors: { night: { value: '#111' } } },
        semanticTokens: { colors: { onlyDark: { value: { _dark: '{colors.night}' } } } },
      },
    },
  })
  const result = compiler.inspectUsageRequirements([])
  const report = createUsageReport(compiler.inspectFiles([]), {
    spec: compiler.spec(),
    requirements: result.requirements,
  })
  expect(report.views?.tokens.unused).not.toContain('colors.onlyDark')
  expect(report.views?.tokens.unused).not.toContain('colors.night')
  expect(
    result.requirements
      .filter((entry) => entry.name === 'colors.onlyDark' || entry.name === 'colors.night')
      .map((entry) => `${entry.name} <- ${entry.reasons.join(', ')}`),
  ).toEqual(['colors.night <- via colors.onlyDark', 'colors.onlyDark <- globalCss'])
})

test('an app counts the styles its design system brings in through build info', () => {
  const config = {
    utilities: { animationName: { className: 'an' }, color: { className: 'c', values: 'colors' } },
    theme: {
      tokens: { colors: { brand: { value: '#f00' } } },
      keyframes: { spin: { to: { opacity: 1 } } },
    },
  }
  const designSystem = createProject(config)
  designSystem.parseFileSource(
    'button.tsx',
    "import { css } from '@panda/css'\ncss({ animationName: 'spin', color: 'brand' })",
  )
  const app = createProject(config)
  app.buildInfo.hydrate(designSystem.buildInfo.create({ panda: '^2.0.0' }), { name: '@acme/ds' })

  expect(app.inspectUsageRequirements([]).requirements).toMatchInlineSnapshot(`
    [
      {
        "kind": "keyframe",
        "name": "spin",
        "reasons": [
          "sources",
        ],
      },
      {
        "kind": "token",
        "name": "colors.brand",
        "reasons": [
          "sources",
        ],
      },
      {
        "kind": "utility",
        "name": "animationName",
        "reasons": [
          "sources",
        ],
      },
      {
        "kind": "utility",
        "name": "color",
        "reasons": [
          "sources",
        ],
      },
    ]
  `)
})

test('a colorPalette token used only from config gets a row that matches the summary', () => {
  const compiler = createPresetCompiler({ globalCss: { body: { bg: 'colorPalette.500', color: 'red.500' } } })
  const inspection = compiler.inspectFiles([])
  const report = createUsageReport(inspection, {
    spec: compiler.spec(),
    requirements: compiler.inspectUsageRequirements([]).requirements,
  })
  const colors = report.views?.tokens.categories.find((category) => category.category === 'colors')

  expect({ summary: report.summary.tokens.used, colors: colors?.top }).toMatchInlineSnapshot(`
    {
      "summary": 2,
      "colors": [
        {
          "name": "colorPalette.500",
          "uses": 1,
          "files": 0,
          "config": [
            "globalCss",
          ],
        },
        {
          "name": "red.500",
          "uses": 1,
          "files": 0,
          "config": [
            "globalCss",
          ],
        },
      ],
    }
  `)
})

const requirementLines = (requirements: Array<{ kind: string; name: string; reasons: string[] }>) =>
  requirements
    .filter((entry) => entry.kind !== 'utility')
    .map((entry) => `${entry.kind} ${entry.name} <- ${entry.reasons.join(', ')}`)

test('negative spacing tokens are never listed as unused, including fractional ones', () => {
  const compiler = createPresetCompiler()
  const report = createUsageReport(compiler.inspectFiles([]), { spec: compiler.spec(), requirements: [] })
  const negatives = report.views?.tokens.unused.filter((path) => path.startsWith('spacing.-'))

  expect(negatives).toEqual([])
  expect(report.views?.tokens.unused).toContain('spacing.1.5')
})

test('a colorPalette row does not count toward a category being used', () => {
  const compiler = createPresetCompiler({ globalCss: { body: { bg: 'colorPalette.500', color: 'red.500' } } })
  const report = createUsageReport(compiler.inspectFiles([]), {
    spec: compiler.spec(),
    requirements: compiler.inspectUsageRequirements([]).requirements,
  })
  const colors = report.views?.tokens.categories.find((category) => category.category === 'colors')

  expect({ used: colors?.used, rows: colors?.top.map((row) => row.name) }).toMatchInlineSnapshot(`
    {
      "used": 1,
      "rows": [
        "colorPalette.500",
        "red.500",
      ],
    }
  `)
})

test('styles a design system brings in are labelled as source styles in the report', () => {
  const config = {
    utilities: { color: { className: 'c', values: 'colors' } },
    theme: { tokens: { colors: { brand: { value: '#f00' } } } },
  }
  const designSystem = createProject(config)
  designSystem.parseFileSource('button.tsx', "import { css } from '@panda/css'\ncss({ color: 'brand' })")
  const app = createProject(config)
  app.buildInfo.hydrate(designSystem.buildInfo.create({ panda: '^2.0.0' }), { name: '@acme/ds' })

  const report = createUsageReport(app.inspectFiles([]), {
    spec: app.spec(),
    requirements: app.inspectUsageRequirements([]).requirements,
  })

  expect(report.views?.tokens.categories[0]?.top).toMatchInlineSnapshot(`
    [
      {
        "name": "brand",
        "uses": 1,
        "files": 0,
        "config": [
          "source styles",
        ],
      },
    ]
  `)
})

test('a design system recipe call keeps what its recipe uses', () => {
  const config = {
    utilities: { color: { className: 'c', values: 'colors' }, animationName: { className: 'an' } },
    theme: {
      tokens: { colors: { r: { value: '#f00' } } },
      keyframes: { spin: { to: { opacity: 1 } } },
      recipes: { btn: { className: 'btn', variants: { v: { x: { color: 'r', animationName: 'spin' } } } } },
    },
  }
  const designSystem = createProject(config)
  designSystem.parseFileSource('button.tsx', "import { btn } from '@panda/recipes'\nbtn({ v: 'x' })")
  const app = createProject(config)
  app.buildInfo.hydrate(designSystem.buildInfo.create({ panda: '^2.0.0' }), { name: '@acme/ds' })

  expect(requirementLines(app.inspectUsageRequirements([]).requirements)).toMatchInlineSnapshot(`
    [
      "keyframe spin <- recipes.btn",
      "token colors.r <- recipes.btn",
    ]
  `)
})

test('compositions used by recipes and staticCss are credited to those places', () => {
  const compiler = createPresetCompiler({
    staticCss: { css: [{ properties: { textStyle: ['heading.lg'] } }], recipes: { withText: [{}] } },
    theme: {
      extend: {
        tokens: { colors: { b: { value: '#00f' } } },
        textStyles: {
          lead: { value: { color: 'b' } },
          heading: { lg: { value: { fontSize: '2xl' } } },
        },
        recipes: { withText: { className: 'with-text', base: { textStyle: 'lead' } } },
      },
    },
  })

  const lines = requirementLines(compiler.inspectUsageRequirements([]).requirements)
  expect(lines.filter((line) => line.includes('textStyles') || line.includes('colors.b'))).toMatchInlineSnapshot(`
    [
      "composition textStyles.heading.lg <- staticCss.css",
      "composition textStyles.lead <- staticCss.recipes.withText",
      "token colors.b <- via textStyles.lead",
      "token fontSizes.2xl <- via textStyles.heading.lg",
    ]
  `)
})

test('an inline keyframes() call credits what its steps use to source styles', () => {
  const compiler = createPresetCompiler({ theme: { extend: { tokens: { colors: { c: { value: '#0f0' } } } } } })
  const files = [
    {
      path: '/virtual/a.ts',
      source:
        "import { css, keyframes } from '@panda/css'; css({ animationName: keyframes({ to: { color: '{colors.c}' } }) })",
    },
  ]

  expect(requirementLines(compiler.inspectUsageRequirements(files).requirements)).toMatchInlineSnapshot(`
    [
      "token colors.c <- sources",
    ]
  `)
})

test('view transition styles are credited to viewTransitions', () => {
  const compiler = createPresetCompiler({ theme: { extend: { tokens: { colors: { vt: { value: '#123' } } } } } })
  const files = [
    {
      path: '/virtual/a.ts',
      source: "import { viewTransition } from '@panda/css'; viewTransition({ old: { color: 'vt' } })",
    },
  ]

  expect(requirementLines(compiler.inspectUsageRequirements(files).requirements)).toMatchInlineSnapshot(`
    [
      "token colors.vt <- viewTransitions",
    ]
  `)
})

test('inspecting requirements leaves utility transform output unchanged', () => {
  const compiler = createPresetCompiler({
    utilities: {
      extend: {
        glow: { transform: (value: string) => ({ boxShadow: `0 0 4px ${value}` }) },
      },
    },
  })
  const files = [{ path: '/virtual/a.ts', source: "import { css } from '@panda/css'; css({ glow: 'red' })" }]
  compiler.parseFileSource(files[0]!.path, files[0]!.source)
  const before = compiler.compile().css

  compiler.inspectUsageRequirements(files)

  expect(compiler.compile().css).toBe(before)
  expect(before).toContain('box-shadow: 0 0 4px red')
})
