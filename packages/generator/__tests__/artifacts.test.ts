import { createGeneratorContext } from '@pandacss/fixture'
import { describe, expect, test } from 'vitest'
import { getArtifactsMap } from '../src/artifacts/setup-artifacts'

describe('setup-artifacts', () => {
  test('getArtifactsMap', () => {
    const artifacts = getArtifactsMap(createGeneratorContext())
    expect(artifacts.filter().map((artifact) => artifact.id) as any).toMatchInlineSnapshot(`
      [
        "helpers.js",
        "package.json",
        "css/index.js",
        "css/index.d.ts",
        "css/cva.js",
        "css/cva.d.ts",
        "css/cx.js",
        "css/cx.d.ts",
        "css/sva.js",
        "css/sva.d.ts",
        "jsx/index.js",
        "jsx/index.d.ts",
        "jsx/is-valid-prop.js",
        "jsx/is-valid-prop.d.ts",
        "jsx/factory-helper.js",
        "recipes/index.js",
        "recipes/index.d.ts",
        "recipes/create-recipe.js",
        "patterns/index.js",
        "patterns/index.d.ts",
        "themes/index.js",
        "themes/index.d.ts",
        "tokens/index.js",
        "tokens/index.d.ts",
        "tokens/tokens.d.ts",
        "types/conditions.d.ts",
        "types/index.d.ts",
        "types/global.d.ts",
        "types/prop-type.d.ts",
        "types/style-props.d.ts",
        "types/csstype.d.ts",
        "types/static-css.d.ts",
        "types/recipe.d.ts",
        "types/pattern.d.ts",
        "types/parts.d.ts",
        "types/composition.d.ts",
        "types/selectors.d.ts",
        "types/system-types.d.ts",
        "recipes/text-style.js",
        "recipes/text-style.dts",
        "recipes/tooltip-style.js",
        "recipes/tooltip-style.dts",
        "recipes/card-style.js",
        "recipes/card-style.dts",
        "recipes/button-style.js",
        "recipes/button-style.dts",
        "recipes/checkbox.js",
        "recipes/checkbox.dts",
        "recipes/badge.js",
        "recipes/badge.dts",
        "patterns/box.d.ts",
        "patterns/box.js",
        "patterns/flex.d.ts",
        "patterns/flex.js",
        "patterns/stack.d.ts",
        "patterns/stack.js",
        "patterns/vstack.d.ts",
        "patterns/vstack.js",
        "patterns/hstack.d.ts",
        "patterns/hstack.js",
        "patterns/spacer.d.ts",
        "patterns/spacer.js",
        "patterns/square.d.ts",
        "patterns/square.js",
        "patterns/circle.d.ts",
        "patterns/circle.js",
        "patterns/center.d.ts",
        "patterns/center.js",
        "patterns/link-overlay.d.ts",
        "patterns/link-overlay.js",
        "patterns/aspect-ratio.d.ts",
        "patterns/aspect-ratio.js",
        "patterns/grid.d.ts",
        "patterns/grid.js",
        "patterns/grid-item.d.ts",
        "patterns/grid-item.js",
        "patterns/wrap.d.ts",
        "patterns/wrap.js",
        "patterns/container.d.ts",
        "patterns/container.js",
        "patterns/divider.d.ts",
        "patterns/divider.js",
        "patterns/float.d.ts",
        "patterns/float.js",
        "patterns/bleed.d.ts",
        "patterns/bleed.js",
        "patterns/visually-hidden.d.ts",
        "patterns/visually-hidden.js",
        "patterns/cq.d.ts",
        "patterns/cq.js",
        "jsx/box.js",
        "jsx/box.d.ts",
        "jsx/flex.js",
        "jsx/flex.d.ts",
        "jsx/stack.js",
        "jsx/stack.d.ts",
        "jsx/vstack.js",
        "jsx/vstack.d.ts",
        "jsx/hstack.js",
        "jsx/hstack.d.ts",
        "jsx/spacer.js",
        "jsx/spacer.d.ts",
        "jsx/square.js",
        "jsx/square.d.ts",
        "jsx/circle.js",
        "jsx/circle.d.ts",
        "jsx/center.js",
        "jsx/center.d.ts",
        "jsx/link-overlay.js",
        "jsx/link-overlay.d.ts",
        "jsx/aspect-ratio.js",
        "jsx/aspect-ratio.d.ts",
        "jsx/grid.js",
        "jsx/grid.d.ts",
        "jsx/grid-item.js",
        "jsx/grid-item.d.ts",
        "jsx/wrap.js",
        "jsx/wrap.d.ts",
        "jsx/container.js",
        "jsx/container.d.ts",
        "jsx/divider.js",
        "jsx/divider.d.ts",
        "jsx/float.js",
        "jsx/float.d.ts",
        "jsx/bleed.js",
        "jsx/bleed.d.ts",
        "jsx/visually-hidden.js",
        "jsx/visually-hidden.d.ts",
        "jsx/cq.js",
        "jsx/cq.d.ts",
        "jsx/factory.js",
        "jsx/factory.d.ts",
        "types/jsx.d.ts",
        "css/conditions.js",
        "css/css.js",
        "css/css.d.ts",
      ]
    `)
  })

  test('getFile - will return the artifact file matching the id', () => {
    const artifacts = getArtifactsMap(createGeneratorContext())
    expect(artifacts.getFile('css/conditions.js')).toMatchInlineSnapshot(`
      ArtifactFile {
        "code": [Function],
        "computed": [Function],
        "dependencies": [
          "conditions",
          "theme.breakpoints",
          "theme.containerNames",
          "theme.containerSizes",
        ],
        "dir": [Function],
        "fileName": "conditions",
        "id": "css/conditions.js",
        "imports": {
          "helpers.js": [
            "withoutSpace",
          ],
        },
        "importsType": undefined,
        "type": "js",
      }
    `)
  })

  test('generate - will generate artifacts matching ids + their imports', () => {
    const generator = createGeneratorContext()
    const artifacts = getArtifactsMap(generator)
    expect(artifacts.generate(generator, { ids: ['css/conditions.js'] }).contents.map((generated) => generated.path))
      .toMatchInlineSnapshot(`
        [
          [
            "styled-system",
            "css",
            "conditions.mjs",
          ],
          [
            "styled-system",
            "helpers.mjs",
          ],
        ]
      `)

    expect(
      artifacts.generate(generator, { ids: ['recipes/create-recipe.js'] }).contents.map((generated) => generated.path),
    ).toMatchInlineSnapshot(`
        [
          [
            "styled-system",
            "recipes",
            "create-recipe.mjs",
          ],
          [
            "styled-system",
            "helpers.mjs",
          ],
          [
            "styled-system",
            "css",
            "cva.mjs",
          ],
          [
            "styled-system",
            "css",
            "css.mjs",
          ],
          [
            "styled-system",
            "css",
            "conditions.mjs",
          ],
          [
            "styled-system",
            "css",
            "cx.mjs",
          ],
        ]
      `)
  })

  test('filter - will return artifacts matching ids', () => {
    const artifacts = getArtifactsMap(createGeneratorContext())
    expect(artifacts.filter(['css/conditions.js', 'helpers.js'])).toMatchInlineSnapshot(`
      [
        ArtifactFile {
          "code": [Function],
          "computed": [Function],
          "dependencies": [
            "syntax",
            "jsxFramework",
          ],
          "dir": [Function],
          "fileName": "helpers",
          "id": "helpers.js",
          "imports": undefined,
          "importsType": undefined,
          "type": "js",
        },
        ArtifactFile {
          "code": [Function],
          "computed": [Function],
          "dependencies": [
            "conditions",
            "theme.breakpoints",
            "theme.containerNames",
            "theme.containerSizes",
          ],
          "dir": [Function],
          "fileName": "conditions",
          "id": "css/conditions.js",
          "imports": {
            "helpers.js": [
              "withoutSpace",
            ],
          },
          "importsType": undefined,
          "type": "js",
        },
      ]
    `)
  })

  test('getArtifacts', () => {
    const generator = createGeneratorContext()
    const result = generator.getArtifacts()
    expect(
      result.generated.map(({ content, ...generated }) => ({
        ...generated,
        path: generated.path.join('/'),
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "id": "css/css.d.ts",
          "path": "styled-system/css/css.d.ts",
        },
        {
          "id": "types/index.d.ts",
          "path": "styled-system/types/index.d.ts",
        },
        {
          "id": "css/css.js",
          "path": "styled-system/css/css.mjs",
        },
        {
          "id": "css/conditions.js",
          "path": "styled-system/css/conditions.mjs",
        },
        {
          "id": "helpers.js",
          "path": "styled-system/helpers.mjs",
        },
        {
          "id": "types/jsx.d.ts",
          "path": "styled-system/types/jsx.d.ts",
        },
        {
          "id": "types/system-types.d.ts",
          "path": "styled-system/types/system-types.d.ts",
        },
        {
          "id": "types/recipe.d.ts",
          "path": "styled-system/types/recipe.d.ts",
        },
        {
          "id": "jsx/factory.d.ts",
          "path": "styled-system/jsx/factory.d.ts",
        },
        {
          "id": "jsx/factory.js",
          "path": "styled-system/jsx/factory.mjs",
        },
        {
          "id": "jsx/is-valid-prop.js",
          "path": "styled-system/jsx/is-valid-prop.mjs",
        },
        {
          "id": "jsx/factory-helper.js",
          "path": "styled-system/jsx/factory-helper.mjs",
        },
        {
          "id": "css/index.js",
          "path": "styled-system/css/index.mjs",
        },
        {
          "id": "jsx/cq.d.ts",
          "path": "styled-system/jsx/cq.d.ts",
        },
        {
          "id": "jsx/cq.js",
          "path": "styled-system/jsx/cq.mjs",
        },
        {
          "id": "jsx/visually-hidden.d.ts",
          "path": "styled-system/jsx/visually-hidden.d.ts",
        },
        {
          "id": "jsx/visually-hidden.js",
          "path": "styled-system/jsx/visually-hidden.mjs",
        },
        {
          "id": "jsx/bleed.d.ts",
          "path": "styled-system/jsx/bleed.d.ts",
        },
        {
          "id": "jsx/bleed.js",
          "path": "styled-system/jsx/bleed.mjs",
        },
        {
          "id": "jsx/float.d.ts",
          "path": "styled-system/jsx/float.d.ts",
        },
        {
          "id": "jsx/float.js",
          "path": "styled-system/jsx/float.mjs",
        },
        {
          "id": "jsx/divider.d.ts",
          "path": "styled-system/jsx/divider.d.ts",
        },
        {
          "id": "jsx/divider.js",
          "path": "styled-system/jsx/divider.mjs",
        },
        {
          "id": "jsx/container.d.ts",
          "path": "styled-system/jsx/container.d.ts",
        },
        {
          "id": "jsx/container.js",
          "path": "styled-system/jsx/container.mjs",
        },
        {
          "id": "jsx/wrap.d.ts",
          "path": "styled-system/jsx/wrap.d.ts",
        },
        {
          "id": "jsx/wrap.js",
          "path": "styled-system/jsx/wrap.mjs",
        },
        {
          "id": "jsx/grid-item.d.ts",
          "path": "styled-system/jsx/grid-item.d.ts",
        },
        {
          "id": "jsx/grid-item.js",
          "path": "styled-system/jsx/grid-item.mjs",
        },
        {
          "id": "jsx/grid.d.ts",
          "path": "styled-system/jsx/grid.d.ts",
        },
        {
          "id": "jsx/grid.js",
          "path": "styled-system/jsx/grid.mjs",
        },
        {
          "id": "jsx/aspect-ratio.d.ts",
          "path": "styled-system/jsx/aspect-ratio.d.ts",
        },
        {
          "id": "jsx/aspect-ratio.js",
          "path": "styled-system/jsx/aspect-ratio.mjs",
        },
        {
          "id": "jsx/link-overlay.d.ts",
          "path": "styled-system/jsx/link-overlay.d.ts",
        },
        {
          "id": "jsx/link-overlay.js",
          "path": "styled-system/jsx/link-overlay.mjs",
        },
        {
          "id": "jsx/center.d.ts",
          "path": "styled-system/jsx/center.d.ts",
        },
        {
          "id": "jsx/center.js",
          "path": "styled-system/jsx/center.mjs",
        },
        {
          "id": "jsx/circle.d.ts",
          "path": "styled-system/jsx/circle.d.ts",
        },
        {
          "id": "jsx/circle.js",
          "path": "styled-system/jsx/circle.mjs",
        },
        {
          "id": "jsx/square.d.ts",
          "path": "styled-system/jsx/square.d.ts",
        },
        {
          "id": "jsx/square.js",
          "path": "styled-system/jsx/square.mjs",
        },
        {
          "id": "jsx/spacer.d.ts",
          "path": "styled-system/jsx/spacer.d.ts",
        },
        {
          "id": "jsx/spacer.js",
          "path": "styled-system/jsx/spacer.mjs",
        },
        {
          "id": "jsx/hstack.d.ts",
          "path": "styled-system/jsx/hstack.d.ts",
        },
        {
          "id": "jsx/hstack.js",
          "path": "styled-system/jsx/hstack.mjs",
        },
        {
          "id": "jsx/vstack.d.ts",
          "path": "styled-system/jsx/vstack.d.ts",
        },
        {
          "id": "jsx/vstack.js",
          "path": "styled-system/jsx/vstack.mjs",
        },
        {
          "id": "jsx/stack.d.ts",
          "path": "styled-system/jsx/stack.d.ts",
        },
        {
          "id": "jsx/stack.js",
          "path": "styled-system/jsx/stack.mjs",
        },
        {
          "id": "jsx/flex.d.ts",
          "path": "styled-system/jsx/flex.d.ts",
        },
        {
          "id": "jsx/flex.js",
          "path": "styled-system/jsx/flex.mjs",
        },
        {
          "id": "jsx/box.d.ts",
          "path": "styled-system/jsx/box.d.ts",
        },
        {
          "id": "jsx/box.js",
          "path": "styled-system/jsx/box.mjs",
        },
        {
          "id": "patterns/cq.js",
          "path": "styled-system/patterns/cq.mjs",
        },
        {
          "id": "patterns/cq.d.ts",
          "path": "styled-system/patterns/cq.d.ts",
        },
        {
          "id": "tokens/index.d.ts",
          "path": "styled-system/tokens/index.d.ts",
        },
        {
          "id": "tokens/tokens.d.ts",
          "path": "styled-system/tokens/tokens.d.ts",
        },
        {
          "id": "types/style-props.d.ts",
          "path": "styled-system/types/style-props.d.ts",
        },
        {
          "id": "types/prop-type.d.ts",
          "path": "styled-system/types/prop-type.d.ts",
        },
        {
          "id": "types/conditions.d.ts",
          "path": "styled-system/types/conditions.d.ts",
        },
        {
          "id": "types/selectors.d.ts",
          "path": "styled-system/types/selectors.d.ts",
        },
        {
          "id": "types/csstype.d.ts",
          "path": "styled-system/types/csstype.d.ts",
        },
        {
          "id": "patterns/visually-hidden.js",
          "path": "styled-system/patterns/visually-hidden.mjs",
        },
        {
          "id": "patterns/visually-hidden.d.ts",
          "path": "styled-system/patterns/visually-hidden.d.ts",
        },
        {
          "id": "patterns/bleed.js",
          "path": "styled-system/patterns/bleed.mjs",
        },
        {
          "id": "patterns/bleed.d.ts",
          "path": "styled-system/patterns/bleed.d.ts",
        },
        {
          "id": "patterns/float.js",
          "path": "styled-system/patterns/float.mjs",
        },
        {
          "id": "patterns/float.d.ts",
          "path": "styled-system/patterns/float.d.ts",
        },
        {
          "id": "patterns/divider.js",
          "path": "styled-system/patterns/divider.mjs",
        },
        {
          "id": "patterns/divider.d.ts",
          "path": "styled-system/patterns/divider.d.ts",
        },
        {
          "id": "patterns/container.js",
          "path": "styled-system/patterns/container.mjs",
        },
        {
          "id": "patterns/container.d.ts",
          "path": "styled-system/patterns/container.d.ts",
        },
        {
          "id": "patterns/wrap.js",
          "path": "styled-system/patterns/wrap.mjs",
        },
        {
          "id": "patterns/wrap.d.ts",
          "path": "styled-system/patterns/wrap.d.ts",
        },
        {
          "id": "patterns/grid-item.js",
          "path": "styled-system/patterns/grid-item.mjs",
        },
        {
          "id": "patterns/grid-item.d.ts",
          "path": "styled-system/patterns/grid-item.d.ts",
        },
        {
          "id": "patterns/grid.js",
          "path": "styled-system/patterns/grid.mjs",
        },
        {
          "id": "patterns/grid.d.ts",
          "path": "styled-system/patterns/grid.d.ts",
        },
        {
          "id": "patterns/aspect-ratio.js",
          "path": "styled-system/patterns/aspect-ratio.mjs",
        },
        {
          "id": "patterns/aspect-ratio.d.ts",
          "path": "styled-system/patterns/aspect-ratio.d.ts",
        },
        {
          "id": "patterns/link-overlay.js",
          "path": "styled-system/patterns/link-overlay.mjs",
        },
        {
          "id": "patterns/link-overlay.d.ts",
          "path": "styled-system/patterns/link-overlay.d.ts",
        },
        {
          "id": "patterns/center.js",
          "path": "styled-system/patterns/center.mjs",
        },
        {
          "id": "patterns/center.d.ts",
          "path": "styled-system/patterns/center.d.ts",
        },
        {
          "id": "patterns/circle.js",
          "path": "styled-system/patterns/circle.mjs",
        },
        {
          "id": "patterns/circle.d.ts",
          "path": "styled-system/patterns/circle.d.ts",
        },
        {
          "id": "patterns/square.js",
          "path": "styled-system/patterns/square.mjs",
        },
        {
          "id": "patterns/square.d.ts",
          "path": "styled-system/patterns/square.d.ts",
        },
        {
          "id": "patterns/spacer.js",
          "path": "styled-system/patterns/spacer.mjs",
        },
        {
          "id": "patterns/spacer.d.ts",
          "path": "styled-system/patterns/spacer.d.ts",
        },
        {
          "id": "patterns/hstack.js",
          "path": "styled-system/patterns/hstack.mjs",
        },
        {
          "id": "patterns/hstack.d.ts",
          "path": "styled-system/patterns/hstack.d.ts",
        },
        {
          "id": "patterns/vstack.js",
          "path": "styled-system/patterns/vstack.mjs",
        },
        {
          "id": "patterns/vstack.d.ts",
          "path": "styled-system/patterns/vstack.d.ts",
        },
        {
          "id": "patterns/stack.js",
          "path": "styled-system/patterns/stack.mjs",
        },
        {
          "id": "patterns/stack.d.ts",
          "path": "styled-system/patterns/stack.d.ts",
        },
        {
          "id": "patterns/flex.js",
          "path": "styled-system/patterns/flex.mjs",
        },
        {
          "id": "patterns/flex.d.ts",
          "path": "styled-system/patterns/flex.d.ts",
        },
        {
          "id": "patterns/box.js",
          "path": "styled-system/patterns/box.mjs",
        },
        {
          "id": "patterns/box.d.ts",
          "path": "styled-system/patterns/box.d.ts",
        },
        {
          "id": "recipes/badge.dts",
          "path": "styled-system/recipes/badge.d.ts",
        },
        {
          "id": "recipes/badge.js",
          "path": "styled-system/recipes/badge.mjs",
        },
        {
          "id": "recipes/create-recipe.js",
          "path": "styled-system/recipes/create-recipe.mjs",
        },
        {
          "id": "css/cva.js",
          "path": "styled-system/css/cva.mjs",
        },
        {
          "id": "css/cx.js",
          "path": "styled-system/css/cx.mjs",
        },
        {
          "id": "recipes/checkbox.dts",
          "path": "styled-system/recipes/checkbox.d.ts",
        },
        {
          "id": "recipes/checkbox.js",
          "path": "styled-system/recipes/checkbox.mjs",
        },
        {
          "id": "recipes/button-style.dts",
          "path": "styled-system/recipes/button-style.d.ts",
        },
        {
          "id": "recipes/button-style.js",
          "path": "styled-system/recipes/button-style.mjs",
        },
        {
          "id": "recipes/card-style.dts",
          "path": "styled-system/recipes/card-style.d.ts",
        },
        {
          "id": "recipes/card-style.js",
          "path": "styled-system/recipes/card-style.mjs",
        },
        {
          "id": "recipes/tooltip-style.dts",
          "path": "styled-system/recipes/tooltip-style.d.ts",
        },
        {
          "id": "recipes/tooltip-style.js",
          "path": "styled-system/recipes/tooltip-style.mjs",
        },
        {
          "id": "recipes/text-style.dts",
          "path": "styled-system/recipes/text-style.d.ts",
        },
        {
          "id": "recipes/text-style.js",
          "path": "styled-system/recipes/text-style.mjs",
        },
        {
          "id": "types/composition.d.ts",
          "path": "styled-system/types/composition.d.ts",
        },
        {
          "id": "types/parts.d.ts",
          "path": "styled-system/types/parts.d.ts",
        },
        {
          "id": "types/pattern.d.ts",
          "path": "styled-system/types/pattern.d.ts",
        },
        {
          "id": "types/static-css.d.ts",
          "path": "styled-system/types/static-css.d.ts",
        },
        {
          "id": "types/global.d.ts",
          "path": "styled-system/types/global.d.ts",
        },
        {
          "id": "tokens/index.js",
          "path": "styled-system/tokens/index.mjs",
        },
        {
          "id": "patterns/index.d.ts",
          "path": "styled-system/patterns/index.d.ts",
        },
        {
          "id": "patterns/index.js",
          "path": "styled-system/patterns/index.mjs",
        },
        {
          "id": "recipes/index.d.ts",
          "path": "styled-system/recipes/index.d.ts",
        },
        {
          "id": "recipes/index.js",
          "path": "styled-system/recipes/index.mjs",
        },
        {
          "id": "jsx/is-valid-prop.d.ts",
          "path": "styled-system/jsx/is-valid-prop.d.ts",
        },
        {
          "id": "jsx/index.d.ts",
          "path": "styled-system/jsx/index.d.ts",
        },
        {
          "id": "jsx/index.js",
          "path": "styled-system/jsx/index.mjs",
        },
        {
          "id": "css/sva.d.ts",
          "path": "styled-system/css/sva.d.ts",
        },
        {
          "id": "css/sva.js",
          "path": "styled-system/css/sva.mjs",
        },
        {
          "id": "css/cx.d.ts",
          "path": "styled-system/css/cx.d.ts",
        },
        {
          "id": "css/cva.d.ts",
          "path": "styled-system/css/cva.d.ts",
        },
        {
          "id": "css/index.d.ts",
          "path": "styled-system/css/index.d.ts",
        },
      ]
    `)
  })

  test('getArtifacts - outExtension', () => {
    const generator = createGeneratorContext({ outExtension: 'js' })
    const artifacts = getArtifactsMap(generator)
    expect(
      artifacts
        .generate(generator, { ids: ['css/conditions.js', 'tokens/tokens.d.ts', 'package.json', 'helpers.js'] })
        .contents.map(({ content, ...generated }) => ({
          ...generated,
          path: generated.path.join('/'),
        })),
    ).toMatchInlineSnapshot(`
      [
        {
          "id": "css/conditions.js",
          "path": "styled-system/css/conditions.js",
        },
        {
          "id": "helpers.js",
          "path": "styled-system/helpers.js",
        },
        {
          "id": "tokens/tokens.d.ts",
          "path": "styled-system/tokens/tokens.d.ts",
        },
      ]
    `)
  })

  test('getArtifacts - forceConsistentTypeExtension', () => {
    const generator = createGeneratorContext({ forceConsistentTypeExtension: true })
    const artifacts = getArtifactsMap(generator)
    expect(
      artifacts
        .generate(generator, { ids: ['css/conditions.js', 'tokens/tokens.d.ts', 'package.json', 'helpers.js'] })
        .contents.map(({ content, ...generated }) => ({
          ...generated,
          path: generated.path.join('/'),
        })),
    ).toMatchInlineSnapshot(`
      [
        {
          "id": "css/conditions.js",
          "path": "styled-system/css/conditions.mjs",
        },
        {
          "id": "helpers.js",
          "path": "styled-system/helpers.mjs",
        },
        {
          "id": "tokens/tokens.d.ts",
          "path": "styled-system/tokens/tokens.d.mts",
        },
      ]
    `)
  })
})
