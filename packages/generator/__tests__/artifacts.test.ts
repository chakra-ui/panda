import { createGeneratorContext } from '@pandacss/fixture'
import { type Artifact } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { Generator } from '../src'
import { getArtifactsMap } from '../src/artifacts/setup-artifacts'
import { ArtifactMap } from '../src/artifacts/artifact'

describe('setup-artifacts', () => {
  test('getArtifactsMap', () => {
    const artifacts = getArtifactsMap(createGeneratorContext())
    expect(artifacts.filter().map((artifact) => artifact.id) as any).toMatchInlineSnapshot(`
      [
        "helpers.js",
        "package.json",
        "css/css.js",
        "css/css.d.ts",
        "css/index.js",
        "css/index.d.ts",
        "css/cva.d.ts",
        "css/cva.js",
        "css/cx.js",
        "css/cx.d.ts",
        "css/sva.js",
        "css/sva.d.ts",
        "jsx/is-valid-prop.js",
        "jsx/is-valid-prop.d.ts",
        "jsx/factory-helpers.js",
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
        "recipes/text-style",
        "recipes/tooltip-style",
        "recipes/card-style",
        "recipes/button-style",
        "recipes/checkbox",
        "recipes/badge",
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
        "css/conditions.js",
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
        ],
        "dir": [Function],
        "fileName": "conditions",
        "id": "css/conditions.js",
        "imports": {
          "helpers.js": [
            "withoutSpace",
          ],
        },
        "type": "js",
      }
    `)
  })

  test('generate - will generate artifacts matching ids + their imports', () => {
    const generator = createGeneratorContext()
    const artifacts = getArtifactsMap(generator)
    expect(artifacts.generate(generator, ['css/conditions.js']).map((generated) => generated.path))
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

    expect(artifacts.generate(generator, ['recipes/create-recipe.js']).map((generated) => generated.path))
      .toMatchInlineSnapshot(`
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
            "cx.mjs",
          ],
          [
            "styled-system",
            "recipes",
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
          "type": "js",
        },
        ArtifactFile {
          "code": [Function],
          "computed": [Function],
          "dependencies": [
            "conditions",
          ],
          "dir": [Function],
          "fileName": "conditions",
          "id": "css/conditions.js",
          "imports": {
            "helpers.js": [
              "withoutSpace",
            ],
          },
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
          "id": "css/conditions.js",
          "path": "styled-system/css/conditions.mjs",
        },
        {
          "id": "helpers.js",
          "path": "styled-system/helpers.mjs",
        },
        {
          "id": "patterns/cq.js",
          "path": "styled-system/jsx/cq.mjs",
        },
        {
          "id": "patterns/cq.d.ts",
          "path": "styled-system/jsx/cq.d.ts",
        },
        {
          "id": "types/system-types.d.ts",
          "path": "styled-system/types/system-types.d.ts",
        },
        {
          "id": "patterns/visually-hidden.js",
          "path": "styled-system/jsx/visually-hidden.mjs",
        },
        {
          "id": "patterns/visually-hidden.d.ts",
          "path": "styled-system/jsx/visually-hidden.d.ts",
        },
        {
          "id": "patterns/bleed.js",
          "path": "styled-system/jsx/bleed.mjs",
        },
        {
          "id": "patterns/bleed.d.ts",
          "path": "styled-system/jsx/bleed.d.ts",
        },
        {
          "id": "patterns/float.js",
          "path": "styled-system/jsx/float.mjs",
        },
        {
          "id": "patterns/float.d.ts",
          "path": "styled-system/jsx/float.d.ts",
        },
        {
          "id": "patterns/divider.js",
          "path": "styled-system/jsx/divider.mjs",
        },
        {
          "id": "patterns/divider.d.ts",
          "path": "styled-system/jsx/divider.d.ts",
        },
        {
          "id": "patterns/container.js",
          "path": "styled-system/jsx/container.mjs",
        },
        {
          "id": "patterns/container.d.ts",
          "path": "styled-system/jsx/container.d.ts",
        },
        {
          "id": "patterns/wrap.js",
          "path": "styled-system/jsx/wrap.mjs",
        },
        {
          "id": "patterns/wrap.d.ts",
          "path": "styled-system/jsx/wrap.d.ts",
        },
        {
          "id": "patterns/grid-item.js",
          "path": "styled-system/jsx/grid-item.mjs",
        },
        {
          "id": "patterns/grid-item.d.ts",
          "path": "styled-system/jsx/grid-item.d.ts",
        },
        {
          "id": "patterns/grid.js",
          "path": "styled-system/jsx/grid.mjs",
        },
        {
          "id": "patterns/grid.d.ts",
          "path": "styled-system/jsx/grid.d.ts",
        },
        {
          "id": "patterns/aspect-ratio.js",
          "path": "styled-system/jsx/aspect-ratio.mjs",
        },
        {
          "id": "patterns/aspect-ratio.d.ts",
          "path": "styled-system/jsx/aspect-ratio.d.ts",
        },
        {
          "id": "patterns/link-overlay.js",
          "path": "styled-system/jsx/link-overlay.mjs",
        },
        {
          "id": "patterns/link-overlay.d.ts",
          "path": "styled-system/jsx/link-overlay.d.ts",
        },
        {
          "id": "patterns/center.js",
          "path": "styled-system/jsx/center.mjs",
        },
        {
          "id": "patterns/center.d.ts",
          "path": "styled-system/jsx/center.d.ts",
        },
        {
          "id": "patterns/circle.js",
          "path": "styled-system/jsx/circle.mjs",
        },
        {
          "id": "patterns/circle.d.ts",
          "path": "styled-system/jsx/circle.d.ts",
        },
        {
          "id": "patterns/square.js",
          "path": "styled-system/jsx/square.mjs",
        },
        {
          "id": "patterns/square.d.ts",
          "path": "styled-system/jsx/square.d.ts",
        },
        {
          "id": "patterns/spacer.js",
          "path": "styled-system/jsx/spacer.mjs",
        },
        {
          "id": "patterns/spacer.d.ts",
          "path": "styled-system/jsx/spacer.d.ts",
        },
        {
          "id": "patterns/hstack.js",
          "path": "styled-system/jsx/hstack.mjs",
        },
        {
          "id": "patterns/hstack.d.ts",
          "path": "styled-system/jsx/hstack.d.ts",
        },
        {
          "id": "patterns/vstack.js",
          "path": "styled-system/jsx/vstack.mjs",
        },
        {
          "id": "patterns/vstack.d.ts",
          "path": "styled-system/jsx/vstack.d.ts",
        },
        {
          "id": "patterns/stack.js",
          "path": "styled-system/jsx/stack.mjs",
        },
        {
          "id": "patterns/stack.d.ts",
          "path": "styled-system/jsx/stack.d.ts",
        },
        {
          "id": "patterns/flex.js",
          "path": "styled-system/jsx/flex.mjs",
        },
        {
          "id": "patterns/flex.d.ts",
          "path": "styled-system/jsx/flex.d.ts",
        },
        {
          "id": "patterns/box.js",
          "path": "styled-system/jsx/box.mjs",
        },
        {
          "id": "patterns/box.d.ts",
          "path": "styled-system/jsx/box.d.ts",
        },
        {
          "id": "recipes/badge",
          "path": "styled-system/recipes/badge.d.ts",
        },
        {
          "id": "recipes/checkbox",
          "path": "styled-system/recipes/checkbox.d.ts",
        },
        {
          "id": "recipes/button-style",
          "path": "styled-system/recipes/button-style.d.ts",
        },
        {
          "id": "recipes/card-style",
          "path": "styled-system/recipes/card-style.d.ts",
        },
        {
          "id": "recipes/tooltip-style",
          "path": "styled-system/recipes/tooltip-style.d.ts",
        },
        {
          "id": "recipes/text-style",
          "path": "styled-system/recipes/text-style.d.ts",
        },
        {
          "id": "types/selectors.d.ts",
          "path": "styled-system/types/selectors.d.ts",
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
          "id": "types/recipe.d.ts",
          "path": "styled-system/types/recipe.d.ts",
        },
        {
          "id": "types/static-css.d.ts",
          "path": "styled-system/types/static-css.d.ts",
        },
        {
          "id": "types/csstype.d.ts",
          "path": "styled-system/types/csstype.d.ts",
        },
        {
          "id": "types/style-props.d.ts",
          "path": "styled-system/types/style-props.d.ts",
        },
        {
          "id": "types/prop-type.d.ts",
          "path": "styled-system/types/prop-types.d.ts",
        },
        {
          "id": "tokens/index.d.ts",
          "path": "styled-system/tokens/token.d.ts",
        },
        {
          "id": "types/conditions.d.ts",
          "path": "styled-system/types/conditions.d.ts",
        },
        {
          "id": "types/global.d.ts",
          "path": "styled-system/types/index.d.ts",
        },
        {
          "id": "types/index.d.ts",
          "path": "styled-system/types/index.d.ts",
        },
        {
          "id": "tokens/tokens.d.ts",
          "path": "styled-system/types/token-types.d.ts",
        },
        {
          "id": "tokens/index.js",
          "path": "styled-system/tokens/token.mjs",
        },
        {
          "id": "themes/index.js",
          "path": "styled-system/themes/index.mjs",
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
          "id": "recipes/create-recipe.js",
          "path": "styled-system/recipes/create-recipe.mjs",
        },
        {
          "id": "css/cx.js",
          "path": "styled-system/css/cx.mjs",
        },
        {
          "id": "css/cva.js",
          "path": "styled-system/recipes/cva.mjs",
        },
        {
          "id": "css/css.js",
          "path": "styled-system/css/css.mjs",
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
          "id": "jsx/factory-helpers.js",
          "path": "styled-system/jsx/factory-helper.mjs",
        },
        {
          "id": "jsx/is-valid-prop.js",
          "path": "styled-system/jsx/is-valid-prop.mjs",
        },
        {
          "id": "jsx/is-valid-prop.d.ts",
          "path": "styled-system/jsx/is-valid-prop.d.ts",
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
          "path": "styled-system/recipes/cva.d.ts",
        },
        {
          "id": "css/index.d.ts",
          "path": "styled-system/css/index.d.ts",
        },
        {
          "id": "css/index.js",
          "path": "styled-system/css/index.mjs",
        },
        {
          "id": "css/css.d.ts",
          "path": "styled-system/css/css.d.ts",
        },
        {
          "id": "package.json",
          "path": "styled-system/package.json",
        },
      ]
    `)
  })

  test('getArtifacts - outExtension', () => {
    const generator = createGeneratorContext({ outExtension: 'js' })
    const artifacts = getArtifactsMap(generator)
    expect(
      artifacts
        .generate(generator, ['css/conditions.js', 'tokens/tokens.d.ts', 'package.json', 'helpers.js'])
        .map(({ content, ...generated }) => ({
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
          "path": "styled-system/types/token-types.d.ts",
        },
        {
          "id": "package.json",
          "path": "styled-system/package.json",
        },
      ]
    `)
  })

  test('getArtifacts - forceConsistentTypeExtension', () => {
    const generator = createGeneratorContext({ forceConsistentTypeExtension: true })
    const artifacts = getArtifactsMap(generator)
    expect(
      artifacts
        .generate(generator, ['css/conditions.js', 'tokens/tokens.d.ts', 'package.json', 'helpers.js'])
        .map(({ content, ...generated }) => ({
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
          "path": "styled-system/types/token-types.d.mts",
        },
        {
          "id": "package.json",
          "path": "styled-system/package.json",
        },
      ]
    `)
  })
})
