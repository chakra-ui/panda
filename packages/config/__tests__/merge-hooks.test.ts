import type { Artifact } from '@pandacss/types'
import { describe, expect, test } from 'vitest'
import { mergeHooks } from '../src/merge-config'

describe('mergeConfigs / theme', () => {
  test('should merge hooks with extend: preset.extend + config.extend', async () => {
    const order: number[] = []
    let conf
    const hooks = mergeHooks([
      {
        extend: {
          'config:resolved': (args) => {
            order.push(0)
            conf = args

            // @ts-expect-error
            args.xxx = 'aaa'
          },
        },
      },
      {
        extend: {
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

  test('should extend preset: preset + config.extend', async () => {
    const order: number[] = []
    let conf
    const hooks = mergeHooks([
      {
        'config:resolved': (args) => {
          order.push(0)
          conf = args

          // @ts-expect-error
          args.xxx = 'aaa'
        },
      },
      {
        extend: {
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

  test('config should override preset: preset + config', async () => {
    const order: number[] = []
    let conf
    const hooks = mergeHooks([
      {
        'config:resolved': (args) => {
          order.push(0)
          conf = args

          // @ts-expect-error
          args.xxx = 'aaa'
        },
      },
      {
        'config:resolved': (args) => {
          order.push(1)
          conf = args

          // @ts-expect-error
          expect(args.xxx).toMatchInlineSnapshot(`undefined`)

          // @ts-expect-error
          args.xxx = 'bbb'
        },
      },
    ])

    await hooks['config:resolved']?.({ conf: {} } as any)

    expect(order).toMatchInlineSnapshot(`
      [
        1,
      ]
    `)
    // @ts-expect-error
    expect(conf.xxx).toMatchInlineSnapshot(`"bbb"`)
  })

  test('config should overrides preset.extend: preset.extend + config', async () => {
    const order: number[] = []
    let conf
    const hooks = mergeHooks([
      {
        extend: {
          'config:resolved': (args) => {
            order.push(0)
            conf = args

            // @ts-expect-error
            args.xxx = 'aaa'
          },
        },
      },
      {
        'config:resolved': (args) => {
          order.push(1)
          conf = args

          // @ts-expect-error
          expect(args.xxx).toMatchInlineSnapshot(`undefined`)

          // @ts-expect-error
          args.xxx = 'bbb'
        },
      },
    ])

    await hooks['config:resolved']?.({ conf: {} } as any)

    expect(order).toMatchInlineSnapshot(`
      [
        1,
      ]
    `)
    // @ts-expect-error
    expect(conf.xxx).toMatchInlineSnapshot(`"bbb"`)
  })

  test('should merge hooks and call sequentially async', async () => {
    const order: number[] = []
    let conf
    const hooks = mergeHooks([
      {
        extend: {
          'config:resolved': (args) => {
            order.push(0)
            conf = args

            // @ts-expect-error
            args.xxx = 'aaa'
          },
        },
      },
      {
        extend: {
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

  test('should merge hooks and call sequentially using previous result: cssgen:done', async () => {
    const order: number[] = []
    let original: string
    const hooks = mergeHooks([
      {
        extend: {
          'cssgen:done': (args) => {
            order.push(0)

            original = args.original as string
            return '0' + args.content.replace('aaa', 'bbb')
          },
        },
      },
      {
        extend: {
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
    let original: Artifact[]
    const hooks = mergeHooks([
      {
        extend: {
          'codegen:prepare': (args) => {
            order.push(0)

            original = args.original!

            return args.artifacts.map((art) => {
              return { ...art, files: art.files.map((f) => ({ ...f, code: (f.code || '').replace('aaa', 'xxx') })) }
            })
          },
        },
      },
      {
        extend: {
          'codegen:prepare': (args) => {
            order.push(1)

            expect(args.original).toBe(original)
            expect(args.original).toMatchInlineSnapshot(`
              [
                {
                  "files": [
                    {
                      "code": "aaa aaa aaa",
                      "file": "aaa.js",
                    },
                  ],
                  "id": "1",
                },
                {
                  "files": [
                    {
                      "code": "bbb bbb bbb",
                      "file": "bbb.js",
                    },
                  ],
                  "id": "2",
                },
                {
                  "files": [
                    {
                      "code": "ccc ccc ccc",
                      "file": "ccc.js",
                    },
                  ],
                  "id": "3",
                },
              ]
            `)
            return args.artifacts.map((art) => {
              return { ...art, files: art.files.map((f) => ({ ...f, code: (f.code || '').replace('bbb', 'zzz') })) }
            })
          },
        },
      },
    ])

    const result = hooks['codegen:prepare']?.({
      changed: [],
      artifacts: [
        { id: '1', files: [{ code: 'aaa aaa aaa', file: 'aaa.js' }] },
        { id: '2', files: [{ code: 'bbb bbb bbb', file: 'bbb.js' }] },
        { id: '3', files: [{ code: 'ccc ccc ccc', file: 'ccc.js' }] },
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
          "files": [
            {
              "code": "xxx aaa aaa",
              "file": "aaa.js",
            },
          ],
          "id": "1",
        },
        {
          "files": [
            {
              "code": "zzz bbb bbb",
              "file": "bbb.js",
            },
          ],
          "id": "2",
        },
        {
          "files": [
            {
              "code": "ccc ccc ccc",
              "file": "ccc.js",
            },
          ],
          "id": "3",
        },
      ]
    `)
  })
})
