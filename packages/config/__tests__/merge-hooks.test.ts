import { describe, expect, test } from 'vitest'
import { mergeHooks } from '../src/merge-hooks'
import type { ArtifactFileId, GeneratedArtifact } from '@pandacss/types'

describe('mergeConfigs / theme', () => {
  test('should merge hooks and call sequentially async', async () => {
    const order: number[] = []
    let conf
    const hooks = mergeHooks([
      {
        name: 'panda-plugin',
        hooks: {
          'config:resolved': (args) => {
            order.push(0)
            conf = args

            // @ts-expect-error
            args.xxx = 'aaa'
          },
        },
      },
      {
        name: 'panda-plugin2',
        hooks: {
          'config:resolved': (args) => {
            order.push(1)
            conf = args

            // @ts-expect-error
            expect(args.xxx).toBe('aaa')

            // @ts-expect-error
            args.xxx = 'bbb'
          },
        },
      },
    ])

    await hooks['config:resolved']?.({ conf: {} } as any)

    expect(order).toMatchInlineSnapshot(`
      [
        0,
        1,
      ]
    `)
    // @ts-expect-error
    expect(conf.xxx).toMatchInlineSnapshot(`"bbb"`)
  })

  test('should merge hooks and call sequentially using previous result cssgen:done', async () => {
    const order: number[] = []
    let original: string
    const hooks = mergeHooks([
      {
        name: 'panda-plugin',
        hooks: {
          'cssgen:done': (args) => {
            order.push(0)

            original = args.original as string
            return '0' + args.content.replace('aaa', 'bbb')
          },
        },
      },
      {
        name: 'panda-plugin2',
        hooks: {
          'cssgen:done': (args) => {
            order.push(1)

            expect(args.original).toBe(original)
            expect(args.original).toMatchInlineSnapshot(`"aaa bbb ccc"`)
            return args.content.replace('ccc', 'xxx') + '1'
          },
        },
      },
    ])

    const result = hooks['cssgen:done']?.({ content: 'aaa bbb ccc' } as any)

    expect(order).toMatchInlineSnapshot(`
      [
        0,
        1,
      ]
    `)
    expect(result).toMatchInlineSnapshot(`"0bbb bbb xxx1"`)
  })

  test('should merge hooks and call sequentially using previous result: codegen:prepare', async () => {
    const order: number[] = []
    let original: GeneratedArtifact[]
    const hooks = mergeHooks([
      {
        name: 'panda-plugin',
        hooks: {
          'codegen:prepare': (args) => {
            order.push(0)

            original = args.original!

            return args.artifacts.map((art) => {
              return { ...art, content: (art.content || '').replace('aaa', 'xxx') }
            })
          },
        },
      },
      {
        name: 'panda-plugin2',
        hooks: {
          'codegen:prepare': (args) => {
            order.push(1)

            expect(args.original).toBe(original)
            expect(args.original).toMatchInlineSnapshot(`
              [
                {
                  "content": "aaa aaa aaa",
                  "id": "recipes.1",
                  "path": [
                    "recipes",
                    "aaa.js",
                  ],
                },
                {
                  "content": "bbb bbb bbb",
                  "id": "recipes.2",
                  "path": [
                    "recipes",
                    "bbb.js",
                  ],
                },
                {
                  "content": "ccc ccc ccc",
                  "id": "recipes.3",
                  "path": [
                    "recipes",
                    "ccc.js",
                  ],
                },
              ]
            `)
            return args.artifacts.map((art) => {
              return { ...art, content: (art.content || '').replace('bbb', 'zzz') }
            })
          },
        },
      },
    ])

    const result = await hooks['codegen:prepare']?.({
      changed: [],
      artifacts: [
        { id: 'recipes.1' as ArtifactFileId, path: ['recipes', 'aaa.js'], content: 'aaa aaa aaa' },
        { id: 'recipes.2' as ArtifactFileId, path: ['recipes', 'bbb.js'], content: 'bbb bbb bbb' },
        { id: 'recipes.3' as ArtifactFileId, path: ['recipes', 'ccc.js'], content: 'ccc ccc ccc' },
      ],
    })

    expect(order).toMatchInlineSnapshot(`
      [
        0,
        1,
      ]
    `)
    expect(result).toMatchInlineSnapshot(`
      [
        {
          "content": "xxx aaa aaa",
          "id": "recipes.1",
          "path": [
            "recipes",
            "aaa.js",
          ],
        },
        {
          "content": "zzz bbb bbb",
          "id": "recipes.2",
          "path": [
            "recipes",
            "bbb.js",
          ],
        },
        {
          "content": "ccc ccc ccc",
          "id": "recipes.3",
          "path": [
            "recipes",
            "ccc.js",
          ],
        },
      ]
    `)
  })
})
